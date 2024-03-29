# Type-safe API Handler

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Basic Usage](#basic-usage)
  - [Validating Requests](#validating-requests)
  - [Responses](#responses)
  - [Sending HTTP Errors](#sending-http-errors)
- [Lifecycle Hooks](#lifecycle-hooks)
  - [Hook List](#hook-list)
  - [Ideas/Concepts for Use](#ideasconcepts-for-use)
- [Additional Features](#additional-features)
  - [Logging](#logging)
  - [Development Mode](#development-mode)
  - [Ignored Path Prefixes](#ignored-path-prefixes)
- [Future Features](#future-features)
  - [Enhancements](#enhancements)
  - [Standard Middleware Functions](#standard-middleware-functions)

## Overview

The Type-safe API handler offers a practical solution for maintaining Lambda-based APIs in TypeScript. It leverages a validation library called valibot to parse incoming HTTP requests against predefined schemas, ensuring data integrity and minimizing the risk of errors.

This API handler follows a straightforward approach, allowing developers to define routes and their corresponding handlers with ease. Middleware functions can be seamlessly integrated to handle common concerns like auth, CORS, rate limiting, and more!

All of this ties into the Rapidstack toolkit to handle consistent logging and caching.

## Setup

To start, install the lambda package:

```sh
pnpm add @rapidstack/lambda
# or
npm i @rapidstack/lambda
```

Define an app-level toolkit for your project:

```ts
import { createToolkit } from '@rapidstack/lambda';

const toolkit = createToolkit({ app: 'My-App' });
```

Create the API handler using the factory:

```ts
import { TypeSafeApiHandler } from '@rapidstack/lambda';

const createHandler = toolkit.create(TypeSafeApiHandler);
```

This returned function will create the Lambda handler. Just supply your routes list:

```ts
const routes = {
  hello: {
    // get: /* GET request handler for {domain}/hello */
  },
  nested: {
    hello: {
      // get: /* GET request handler for {domain}/nested/hello */
    },
  },
};

export const handler = createHandler(routes);
```

Now we're ready to go over the basic usage of the API handler.

## Basic Usage

### Validating Requests

The `validate` function allows you to supply valibot schemas to parse and then infer the typescript output. The available validators are:

- `qsp`: to parse query string parameters
- `body`: to parse the request body
- `pathParams`: to parse path parameters
- `headers`: to parse request headers
- `cookies`: to parse request cookies

Each of these validators must be a valibot object schema, as that is the format
that is supplied to the underlying `validate` function. It also simplifies the inferred output for the `validated` object in your route handler.

Here is an example of a simple validator that requires a query string parameter for the `GET /hello` route. If the `name` parameter is not present, the request will be rejected with a 400 Bad Request error automatically and will include helpful error details.

```ts
import type { TypedApiValidationSchema } from '@rapidstack/lambda';

import { validate } from '@rapidstack/lambda';
import { object, string } from 'valibot';

const HelloValidator: TypedApiValidationSchema = {
  qsp: object({
    name: string(
      'The query string parameter `name` is required for this request!'
    ),
  }),
};

const routes = {
  hello: {
    get: validate(HelloValidator, async ({ validated }) => {
      return {
        body: {
          response: `Hello, ${validated.qsp.name}!`,
        },
        statusCode: 200,
      };
    }),
  },
};
```

### Responses

Now that we have a handler defined, let's go over the standard response shapes generated by the API. The shape of the response for the handler is loosely based on the JSend specification, where the response is an object with a `status` key and a `data` key. All body data will automatically get wrapped in this data key. The `status` key can be one of the following:

- `success`: The request was successful - (1xx, 2xx, 3xx).
- `invalid`: The request failed specially due to a validation failure - (400).
- `fail`: The request failed due to a client error - (other 4xx).
- `error`: The request failed due to a server error - (5xx).

Using the above example, the response for the `GET /hello` route will look like this:

```json
// success: {domain}/hello?name=Jake
{
  "data": {
    "response": "Hello, Jake!"
  },
  "status": "success"
}
```

```json
// invalid: {domain}/hello?bad=key
{
  "data": {
    "description": "The server could not understand the request due to invalid syntax.",
    "messages": [
      "The query string parameter `name` is required for this request!"
    ],
    "schema": {
      "qsp": ["qsp.name: string"]
    },
    "title": "Bad Request"
  },
  "status": "invalid"
}
```

And let's say we had that endpoint fail with a 403 for all users that aren't "Bob":

```json
// fail: {domain}/hello?name=Jake
{
  "data": {
    "description": "The request or action is prohibited or you do not have necessary permissions with your current credentials.",
    "title": "Forbidden"
  },
  "status": "fail"
}
```

In the case of a server error occurring, either through throwing a 5xx `HttpError` or a different uncaught error type, the response would reflect the appropriate status:

```json
// error: {domain}/example-errors/500
{
    "data": {
        "description": "The server has encountered a situation it does not know how to handle.",
        "requestId": "4e081b96-cc1b-4933-a34a-b1623bad52db",
        "title": "Internal Server Error"
    },
    "status": "error"
}

```

### Sending HTTP Errors

To send an HTTP error, you can throw an instance of the `HttpError` class. This will automatically generate the appropriate response for the error code you supply. This works for all 4xx and 5xx error codes.

```ts
import { HttpError } from '@rapidstack/lambda';

const routes = {
  hello: {
    get: validate(HelloValidator, async ({ validated }) => {
      if (validated.qsp.name !== 'Bob') throw new HttpError(403);

      return {
        body: {
          response: `Hello, ${validated.qsp.name}!`,
        },
        statusCode: 200,
      };
    }),
  },
};
```

## Lifecycle Hooks

Along with the route object, an options object can also be provided to the create handler function:

```ts
import { TypeSafeApiHandler } from '@rapidstack/lambda';

const createHandler = toolkit.create(TypeSafeApiHandler);

const routes = {
  /* your routes here */
};
const hooks = {
  // onRequestStart: /* a lifecycle hook */
};

export const handler = createHandler(routes, hooks);
```

These hooks allow you to tap into specific points in the request lifecycle to perform additional actions.

### Hook List

The lifecycle of a request with lifecycle hooks is as follows:

```txt
REQUEST START
  |
  |-> hook: onHotFunctionTrigger -> terminate
  |
  |-> find route
  |
  |->|
     |-> hook: onRequestStart
     |
     |-> validate incoming request against route schema
     |
     |-> run route handler function
     |
     |-> hook: onRequestEnd
     |
     |-> hook: onError (catches error for the indented)
  |<-|
  |
  |-> format response
  |
REQUEST END

```

- `onHotFunctionTrigger`: Runs when an event matches the Rapidstack hot function trigger (coming soon).
  - Arguments: `context`, `cache`, `logger`
- `onRequestStart`: Runs before the main route handler function. This is a good place to do things like logging the request, or checking for rate limits. If returning void, the request will continue on. If returning a function, the lifecycle will immediately terminate and the response of the function will be sent back to the client.
  - Arguments: `event`, `context`, `cache`, `logger`, `responseContext`, `routeInfo`
- `onRequestEnd`: Runs after the main route handler function. This is a good place to do things like logging the response, or setting headers. If returning void, the request will continue on. If returning a function, the lifecycle will immediately terminate and the response of this function will be sent back to the client. The response of the route handler function will be ignored.
  - Arguments: `event`, `context`, `cache`, `logger`, `responseContext`, `routeInfo`, `result`
- `onError`: Runs when an error is thrown in the `onRequestStart` hook, main route handler function, or `onRequestEnd` hook. This is a good place to log the error, or to format the error response. If returning void, the error will be sent back to the client. If returning a function, the lifecycle will immediately terminate and the response of this function will be sent back to the client. Re-throwing non-`HttpError` errors will result in a 500 error response and the lambda will report it as a failed lambda execution.
  - Arguments: `event`, `context`, `cache`, `logger`, `responseContext`, `routeInfo`, `error`
- `onLambdaShutdown`: Runs when the Lambda is shutting down. This is a good place to do things like clean up resources or connections.
  - Arguments: none.

Referenced function argument descriptions:

- `event`: The AWS Lambda event object.
- `context`: The AWS Lambda context object.
- `cache`: The common in-memory cache from the toolkit.
- `logger`: The common JSON logger from the toolkit.
- `responseContext`: A shared object to set accumulated headers or cookies between hooks.
- `routeInfo`: Info on the matched route, all routes that can be called, and neighboring verbs for this route.
- `result`: The response object from the route handler function.

### Ideas/Concepts for Use

```ts
const hooks = {
  onRequestStart: async (params) => {
    params.logger.info({ msg: 'request info', event: params.event });

    // Send cors for all responses
    await corsMiddleware(params, ['https://example.com']);

    // The following can throw be processed in parallel
    await Promise.all([
      rateLimiterMiddleware(params),
      authorizerMiddleware(params),
    ]);
  },
  onRequestEnd: async (params) => {
    // coming soon: A standard way to audit a REST API to ensure it is following
    // best practices
    if (process.env.DEVELOPMENT) {
      const { lintApiCall } = await import('@rapidstack/lambda/api-linter');
      await lintApiCall(params);
    }

    // Set a header for all responses
    params.responseContext.headers['x-xss-protection'] = '0';
  },
  onError: async ({ error, ...params }) => {
    params.logger.error({ msg: 'error info', error });

    if (error instanceof HttpError) {
      if (error.code === 404) {
        return {
          body: 'whoops!',
          statusCode: 404,
        };
      }
    }

    if (error instanceof AuthError) {
      // Note: HttpError is handled by an internal system to format it into
      // a response, so that error can be thrown within this hook without
      // worry. Just know that it will not get handled by any logic in this
      // hook.

      // don't throw auth error info, be purposefully vague
      throw new HttpError(401);
    }

    // if error isn't handled in here, it will result in a failed lambda
    // execution
  },
};
```

## Additional Features

### Logging

A Pino logger is integrated into the handler and is available in all lifecycle functions and the main route handler. Internally it offers a few standard logs for each request, outside of a few trace logs marking beginning and end of a request, there is a `summary` log to capture the gist of a request. This summary log level sits right above the `info` level, so for cases where you want to see all requests, but not all the details, you can set your log level to `summary` and still see the summary logs. The logs themselves look like this:

```json
{
    "@l": "summary",
    "@t": 1707616738922,
    "@h": [
        "toolkit:root",
        "TypeSafeApiHandler (unnamed)"
    ],
    "@a": "app-name",
    "@r": {
        "lambdaRequestId": "b806ce96-46a3-45ec-bf73-583a0f1ea837",
        "apiId": "scs3di1hl",
        "apiRequestId": "S8t7Yhx3oAMEabQ=",
        "route": "api/v1/hello",
        "ip": "xx.xx.xx.xx",
        "method": "GET",
        "x-amzn-trace-id": "Root=1-65c829e2-5e25f0a97573c696267793db",
        "x-amz-cf-id": "SCKbD3TaiZBscS3dI1hloMj6Cr7W75daSVZdtrekYsh7qa6A6elv8A=="
    },
    "@s": {
        "conclusion": "success",
        "statusCode": 200,
        "serverPreprocessingDuration": 15.83,
        "routeHandlerDuration": 1.745,
        "serverPostprocessingDuration": 0.4158,
        "duration": 17.99,
        "gatewayLatencyDuration": 705,
        "url": "example.com/v1/hello"
    }
}
```

Note that all standard keys in the logs begin with the `@` sigil. This serves as an identifier between the standard log properties and properties you may log out yourself. Here is a breakdown of the log properties:

- `@l`: The log level. This can be `trace`, `debug`, `info`, `summary`, `warn`, `error`, or `fatal`.
- `@t`: UNIX timestamp of log event.
- `@h`: Where in a hierarchy this log event was broadcast from. Useful for debugging and can serve as a pseudo-stack that gets pushed to when a child logger is created.
- `@a`: The application name. This is either set in the toolkit or is pulled from the env and is used to identify the application in the logs.
- `@r`: The request context. This field will get populated with common tracing IDs from your event to aid in tracing requests that flow to your other services. Possible fields include:
  - `lambdaRequestId`: The AWS Lambda request ID.
  - `apiId`: The API Gateway ID*.
  - `apiRequestId`: The API Gateway request ID*.
  - `route`: The route that was hit.
  - `ip`: The IP of the requester.
  - `method`: The HTTP method of the request (with optional overrides applied with `x-http-method-override`).
  - `x-amzn-trace-id`: The AWS trace ID.
  - `x-request-id`: An optional source request ID passed from the client.
  - `x-amz-cf-id`: An optional CloudFront request ID passed from the client, if running behind CloudFront.
- `@s`: The run summary:
  - `conclusion`: The conclusion of the request. This is always `success` if the handler was able to fulfill a request, no matter the status code. If an uncaught error occurs, this will be `error`. In such cases, status 500 will be sent back to the client.
  - `statusCode`: The status code of the response.
  - `url`: The interpreted URL of the request. Factoring in any path prefixes to ignore.
  - `duration`: The duration from request received to response sent. Typically varies from the reported billed duration by an additional 1-3ms. (Standard property between all handler shape summary logs)
  - API segment durations, provided to help identify sources of latency in your API. The key names are explained below.

*Note: The `apiId` and `apiRequestId` exist for Lambda URLs as well, but are omitted as they aren't tied to any visible AWS infrastructure to trace back to.

#### Summary Duration Breakdown

A request lifecycle is broken down into these segments:

1. Client sends request to server
2. Gateway receives request from client
3. Lambda receives request from gateway
4. Handler processes route lookup and `onRequestStart` hook
5. Handler processes route handler function
6. Handler processes `onRequestEnd` and `onError` hooks
7. Lambda sends response back to gateway
8. Gateway sends response back to client
9. Client receives response from server

These segments are named in the logs as follows and are reported in milliseconds:

- `clientLatencyDuration`*: The time difference between the client sending the request (from its provided `x-debug-unix` header) to when the lambda started processing the it. (Time difference between #1 - #3).
- `gatewayLatencyDuration`: The time difference between API Gateway receiving the event (from its provided UNIX timestamp) to when the lambda started processing. (Time difference between #2 - #3)
- `serverPreprocessingDuration`: The duration from when the lambda starts processing to when the route handler function is called. (Time encompassing #4)
- `routeHandlerDuration`*: The duration from when the route handler function is called to when it returns. (Time encompassing #5)
- `serverPostprocessingDuration`: The duration from when the route handler function returns to when the lambda starts sending the response. (Time encompassing #6)
- `duration`: Total Lambda duration. (Time between #3 - #7)
- `clientPerceivedDuration`*: The duration from the `x-debug-unix` to when the lambda sends back a response. (Time between #1 - #7)

*Note: The `clientLatencyDuration` and `clientPerceivedDuration` are only available if the `x-debug-unix` header is present in the client request.

### Development Mode

While developing and testing API handlers, it can be useful to get immediate feedback on what server error occurred rather than having the API handler swallow the underlying issue to return a 5xx. To get the underlying error information, you can set a flag when creating the handler to enable "development mode" to alter the response of the `error` shape:

```ts
import { TypeSafeApiHandler } from '@rapidstack/lambda';

import { toolkit } from './toolkit.js';

const createHandler = toolkit.create(TypeSafeApiHandler, {
  devMode: true,
});

const routes = {
  errors: {
    500: async () => {
      throw new HttpError(500);
    },
  }
};

export const handler = createHandler(routes);
```

Now error responses received by the client will look like the following:

```json
{
    "data": {
        "description": "The server has encountered a situation it does not know how to handle.",
        "requestId": "1951aa3b-51f3-444f-a8a8-ee402eaa1eb1",
        "title": "Internal Server Error",
        "devMode": true,
        "error": {
            "message": "The server has encountered a situation it does not know how to handle.",
            "stackTrace": "HTTPError: The server has encountered a situation it does not know how to handle.\n    at Object.get [as matched] (file:///var/task/backend/src/entry-points/api.mjs:117:3470985)\n    at handleRequestHooks (file:///var/task/backend/src/entry-points/api.mjs:103:3197)\n    at async Runtime.handler (file:///var/task/backend/src/entry-points/api.mjs:103:4512)"
        },
        "logs": "https://us-east-1.console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252Fnonprod-rapid-examples-app-stack-api-fn/log-events/2024$252F02$252F16$252F$255B$2524LATEST$255Db0e7784f0875418faffc66800e071d2c$3Fstart$3D2024-02-16T16$253A02$253A20.297Z$26filterPattern$3D-START+-END"
    },
    "status": "error"
}
```

With this response, you get detailed info on the error, the stacktrace to aid in debugging, and a deep link to the CloudWatch logs of that execution.

**Note**: It is recommended to only use this in development and testing environments, as it can expose sensitive information about your application to the client.

### Ignored Path Prefixes

When using your API in conjunction with a CDN like CloudFront, you may have a path prefix that is not part of your API. This can be a problem when routing the URL of the request, as access through the CDN will include the path prefix, but a dedicated API URL may not. To ignore this prefix, you can set the `ignoredPathPrefixes` option when creating the handler:

```ts
import { TypeSafeApiHandler } from '@rapidstack/lambda';

import { toolkit } from './toolkit.js';

const createHandler = toolkit.create(TypeSafeApiHandler, {
  ignoredPathPrefixes: ['/api'],
});
```

Now, when a request comes in with a path prefix of `/api`, it will be stripped from the URL before the route is matched. This allows you to use the same handler for both the CDN and the dedicated API URL:

```ts
const routes = {
  hello: {
    get: async () => { // GET on /hello and /api/hello will match this route
      return {
        body: {
          response: 'Hello, world!',
        },
        statusCode: 200,
      };
    },
  },
};

export const handler = createHandler(routes);
```

Only the first matched ignore prefix will be removed from the URL. If you have multiple prefixes to ignore, you can do some advanced handling in the `onRequestStart` hook.

## Future Features

The base of the handler is complete and modifications will be smaller enhancements and a standard set of middleware functions to tie in with hooks.

### Enhancements

- The validator function would validate auth details if there are requirements for scope, user, etc.
- Custom cookie encodings
- Customize internal logs with redaction, etc.
- Being able to pass in certain headers to cause debug actions (advanced logging, skipping internal cache, etc.)
- A tRPC-like method for getting TypeScript definitions for the API using inferred types from the valibot schemas and handler returns:

  ```ts
  import type { MakeTypedApi } from '@rapidstack/lambda';

  const routes = { /* your route definitions */ };
  export type TypedApi = MakeTypedApi<typeof routes>;
  //              ^ import into your frontend folder
  ```

### Standard Middleware Functions

- OpenAPI route
  - Would be added to the `onRequestStart` hook to intercept a set route, i.e.: `{base-url}/open-api` and return a webpage to:
    - View and try API routes
    - Download TypeScript types for each endpoint
    - Download a postman collection of the API
- CORS
  - (this is handled with API Gateway, but can be configured for lambda urls)
- Rate Limiting
  - Would have a corresponding cloud construct to spin up a dynamo table and permissions for the lambda to access it
- Auth handlers for Cognito, JWT, IAM, etc.
- "API Linting" to ensure the API is following best practices. Violations would be sent to a SNS topic for further processing.
