# Type-safe API Handler Spec

## End Goal

Existing solutions for a end-to-end type-safe API like tRPC work well, but don't
take advantage of the full set of features from HTTP and follow conventional
RESTful apis with verbs and whatnot. I would like to have the same sort of
functionality, but be broader with what routes and verbs can be used to call the API. Ideally this would function like the following:

```ts
// api-handler.ts
import {
  type MakeApiTypes,
  TypedApiHandler,
  type TypedApiHookConfig,
  type TypedApiRouteConfig,
} from '@rapidstack/lambda';

import { appToolkit } from '../common.js';
// Example API handlers:
import { CartHandler } from './routes/cart.js';
import { ClientHandler } from './routes/client.js';
import { CouponHandler } from './routes/coupon.js';
import { ProductHandler } from './routes/product.js';
import { SupplierHandler } from './routes/supplier.js';
import { WebStoreHandler } from './routes/web-store.js';

// Instantiate handler wrapper. Available options include:
// - name of handler (logging)
// - timeout budget (for inefficiency reporting hook below)
// - base path? -- not sure how I would tie this in with the inferred ts
// - OpenAPI spec route. Would generate a webpage with the API spec and download
//   of the typescript type and postman/openAPI yaml
// - disable debug-lever headers (explained further below)
// - disable JSON body coercion (probably not going with this since type
//   handling gets way too complicated
// - enable method override header (is this a bad practice though? see: OWASP
//   reports)
// - route resolving strategy function - can be custom implementation passed in
const makeRestApi = appToolkit.create(TypedApiHandler);

const routes = {
  // Example simple routes that probably have a few HTTP verbs implemented
  // with expected object shapes: `VERB {domain}/{route}`
  'clients': ClientHandler,
  'products': ProductHandler,
  'suppliers': SupplierHandler,

  // Example of nested routes for `VERB {domain}/web-store/{route}`
  'web-store': {
    cart: CartHandler,
    redeem: CouponHandler,

    // magic key to interpret `VERB {domain}/web-store` as a valid route handler
    __index__: WebStoreHandler,
  },
} satisfies TypedApiRouteConfig;

// Current hook ideas
const hooks = {
  onApproachingTimeout: async () => {
    /* If on a timeout budget, could be used to short-circuit execution and 
    return an error message to the user without resulting in a 5xx. Could also
    log out the I/O to have dev team investigate expensive calls */
  },
  onError: async () => {
    /* Can be used to catch any error in execution and figure out what to say to
    the user and what alerting needs to be sent back to api developers */
  },
  onHotFunctionTrigger: async () => {
    /* Functions same as generic handler */
  },
  onRequestEnd: async () => {
    /* Any sort of post-request work to be done before sending the result back
    to the user */
  },
  onRequestStart: async () => {
    /* Pre-screening requests before type validations
    could be used for custom auth validations if not using api gateway that are
    cached with the built-in caching mechanism */
  },
  // debating having an onColdStart, but that could seriously impact API
  // performance depending on what tasks a dev puts in there. HotFunctions would
  // function the same.
} satisfies TypedApiHookConfig;

// Actual lambda entry point to point SST to:
export const handler = makeRestApi(routes, hooks);

// The type-safe version of the api that can be used for react-query, rtk-query,
// etc... and imported to your front-end project. There would also be a CLI
// command that could be pointed at the file that has this 'MakeApiTypes'
// wrapper in it
export type TypedApi = MakeApiTypes<typeof routes>;
```

For the imported handlers, they would be wrapped in a function to take care of
all the type validations for you. This would be handled by a library such as zod
or valibot. Probably the latter due to the tree-shakable nature of it.
This would look something like the following:

```ts
// routes/products.ts

import { type RouteValidator, ValidateRoute } from '@rapidstack/lambda';
import {
  maxValue,
  minValue,
  notValue,
  number,
  object,
  partial,
  string,
  uuid,
} from 'valibot';

/**
 * Allows lookup of products optionally with the following query string params:
 * - name (fuzzy search),
 * - ids (multi-value QSP of uuids),
 * - min-price: number > 0
 * - max-price: number > 0
 *
 * With return settings:
 * - limit: number 1-100
 * - page: number > 1
 * - sort: 'name-asc' | 'name-desc' | 'price-asc' | price-desc'
 */
const getValidator = {
  qsp: partial(
    object({
      'id': array(string(uuid())),
      'limit': number([minValue(1), maxValue(100)]),
      'max-price': number([notValue(0), minValue(0)]),
      'min-price': number([notValue(0), minValue(0)]),
      'name': string([(input) => input.toLowerCase()]),
      'page': number([minValue(2)]),
      'sort': string([
        value('name-asc'),
        value('name-desc'),
        value('price-asc'),
        value('price-desc'),
      ]),
    })
  ),
} satisfies RouteValidator;

/**
 * Example of a validator that requires a specific body shape, specific headers,
 * and cookies
 */
const postValidator = {
  body: object({
    name: string(),
    price: number([notValue(0), minValue(0)]),
  }),
  cookies: {
    'my-required-cookie': string(),
  },
  headers: {
    'my-required-header': string(),
  },
} satisfies RouteValidator;

export const ProductHandler = {
  get: ValidateRoute<Product[]>(getValidator, async ({ logger, validated }) => {
    logger.info({
      event: validated,
      msg: 'processing get request',
    });
    // some db operation
    return result as Product[];
  }),
  post: ValidateRoute<Product>(postValidator, async ({ logger, validated }) => {
    logger.info({
      event: validated,
      msg: 'processing post request',
    });
    // some db operation
    return result as Product;
  }),
};
```

This would make the event type-safe with the inner handler function's
`validated` property. The raw event would still be available. The ones that do
not pass the validation would automatically return http 4xx responses telling
users what is wrong with the request. This could be manipulated further with the
`onError` hook.

Maybe there could be a return validator to ensure the returned shape matches?
Probably overkill?

The handler itself would provide some extra functionality to pass along to the
event and return based upon some headers passed in:

```json
{
  /**
   * Would attach value to all logs for request run, returning the cloudwatch
   * log group name in the header `x-request-log-group` for easier
   * troubleshooting from the client-side.
   */
  "x-request-id": "some-value",
  /**
   * Would attach value to all logs for request run, returning nothing extra.
   */
  "x-trace-id": "some-value",
  /**
   * Would set the log level to debug for this request, returning the cloudwatch
   * log group name in the header `x-request-log-group` for easier
   * troubleshooting from the client-side.
   */
  "x-debug-logs": "true",
  /**
   * Would skip the cache for this run. Probably would need to set a max?
   */
  "x-debug-no-cache": "any-value or debug password of sorts",
  /**
   * Would return unix ts metrics for when the call was received and completed
   * so the following times could be analyzed:
   * - sent: unix from the http header
   * - received: Date.now() when the handler received the message
   * - finished: Date.now() when the handler sent the message back out
   *
   * These times would be returned to the api caller, and if they capture a
   * fulfilled timestamp, they could analyze the latency of the outgoing
   * connection, server execution time, and latency of delivery.
   * Return header: `x-debug-perf-metric-result`
   */
  "x-debug-perf-metrics": "client's unit epoch"
}
```

## Assumptions

- You are either looking to host this via lambda URL or API Gateway. Interop
  should be easy.
- You are not defining api routes from API Gateway and are just using the proxy.
- You must be using JSON for populated body messages. Don't have a good method
  to support making this type safe and support multiple content-types

## Not yet considered

- API versioning: most advanced APIs use headers to route to specific versions.
  How could this be handled?
  - Can we have something built in so the version slug (alternate route) is not
    explicitly defined in the routes obj?
- Typescript max nesting of generics = 50 issue.
- Untyped routes? Allow them or no?
- Interop with a different type validator?
