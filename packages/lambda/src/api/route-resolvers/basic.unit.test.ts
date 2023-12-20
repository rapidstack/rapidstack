import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { object, optional, string, tuple } from 'valibot';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type {
  HttpRouteFunction,
  TypedApiRouteConfig,
} from '../../handlers/type-safe-api/types.js';
import type { ICache, ILogger } from '../../index.js';

import { MockLambdaContext, makeMockApiEvent, validate } from '../../index.js';
import { resolveRoute } from './basic.js';

type Params = Parameters<HttpRouteFunction>[0];
const SimpleValidator = {
  qsp: object({
    foo: string(),
  }),
};

let routes: TypedApiRouteConfig;
let inspected: ReturnType<typeof vi.fn>;
const fakeCallerProps = (event: APIGatewayProxyEventV2) => ({
  cache: 'cache' as unknown as ICache,
  context: MockLambdaContext,
  event,
  logger: 'logger' as unknown as ILogger,
});
const baseCallParams = {
  method: 'GET',
  queryString: '?foo=bar',
} as const;

beforeEach(() => {
  inspected = vi.fn();
  routes = {
    'no-validator': {
      get: async (params: Params) => {
        inspected(params);
        return 'dummy-result';
      },
    },
    'with-path-params': {
      'no-validator': {
        get: async (params: Params) => {
          inspected(params);
          return 'dummy-result';
        },
      },
      'with-validator-all-required': {
        get: validate(
          {
            ...SimpleValidator,
            pathParams: tuple([string(), string(), string()]),
          },
          async (params) => {
            inspected(params);
            return 'dummy-result';
          }
        ),
      },
      'with-validator-one-required': {
        get: validate(
          {
            ...SimpleValidator,
            pathParams: tuple([
              string(),
              optional(string()),
              optional(string()),
            ]),
          },
          async (params) => {
            inspected(params);
            return 'dummy-result';
          }
        ),
      },
      'with-validator-optional-wrapped': {
        get: validate(
          {
            ...SimpleValidator,
            pathParams: optional(tuple([string()])),
          },
          async (params) => {
            inspected(params);
            return 'dummy-result';
          }
        ),
      },
    },
    'with-validator': {
      get: validate(SimpleValidator, async (params) => {
        inspected(params);
        return 'dummy-result';
      }),
    },
  } as TypedApiRouteConfig;
});

describe('type safe HTTP route resolver function tests:', () => {
  describe('routing function lookup expected use cases:', () => {
    test('should resolve with undefined for unknown route', async () => {
      const event = makeMockApiEvent({
        ...baseCallParams,
        path: '/',
      });

      const route = resolveRoute(event, routes);
      expect(route).toBeUndefined();
    });
    test('should resolve with route function for known route', async () => {
      const event = makeMockApiEvent({
        ...baseCallParams,
        path: '/no-validator',
      });

      const route = resolveRoute(event, routes);
      expect(route).toBeDefined();
    });
  });
  describe('routing function passed expected parameters:', () => {
    test('should pass expected parameters to function', async () => {
      const event = makeMockApiEvent({
        ...baseCallParams,
        path: '/no-validator',
      });
      const expectedProps = fakeCallerProps(event);

      const route = resolveRoute(event, routes)!;
      expect(route).toBeDefined();

      await route(expectedProps);
      expect(inspected).toHaveBeenCalledWith(expectedProps);
    });
    test('should pass expected parameters to validator wrapper', async () => {
      const event = makeMockApiEvent({
        ...baseCallParams,
        path: '/with-validator',
      });
      const expectedProps = fakeCallerProps(event);

      const route = resolveRoute(event, routes)!;
      expect(route).toBeDefined();

      await route(expectedProps);
      expect(inspected).toHaveBeenCalledWith({
        ...expectedProps,
        validated: {
          qsp: { foo: 'bar' },
        },
      });
    });
  });
  describe('routing function behavior with path parameters:', () => {
    test('should not find a valid route', async () => {
      const event = makeMockApiEvent({
        ...baseCallParams,
        path: '/with-path-params/no-validator/123/comments/456',
      });

      const route = resolveRoute(event, routes)!;
      expect(route).toBeUndefined();
    });
    test('should pass expected parameters to validator', async () => {
      const event = makeMockApiEvent({
        ...baseCallParams,
        path: '/with-path-params/with-validator-all-required/123/comments/456',
      });
      const expectedProps = fakeCallerProps(event);

      const route = resolveRoute(event, routes)!;
      expect(route).toBeDefined();

      await route(expectedProps);
      expect(inspected).toHaveBeenCalledWith({
        ...expectedProps,
        validated: {
          pathParams: ['123', 'comments', '456'],
          qsp: { foo: 'bar' },
        },
      });
    });
    test('should pass partial parameters to validator', async () => {
      const event = makeMockApiEvent({
        ...baseCallParams,
        path: '/with-path-params/with-validator-one-required/123',
      });
      const expectedProps = fakeCallerProps(event);

      const route = resolveRoute(event, routes)!;
      expect(route).toBeDefined();

      await route(expectedProps);
      expect(inspected).toHaveBeenCalledWith({
        ...expectedProps,
        validated: {
          pathParams: ['123'],
          qsp: { foo: 'bar' },
        },
      });
    });
    test('should pass optional parameters to validator', async () => {
      const event1 = makeMockApiEvent({
        ...baseCallParams,
        path: '/with-path-params/with-validator-optional-wrapped/123',
      });
      const expectedProps1 = fakeCallerProps(event1);

      const route1 = resolveRoute(event1, routes)!;
      expect(route1).toBeDefined();

      await route1(expectedProps1);
      expect(inspected).toHaveBeenCalledWith({
        ...expectedProps1,
        validated: {
          pathParams: ['123'],
          qsp: { foo: 'bar' },
        },
      });

      const event2 = makeMockApiEvent({
        ...baseCallParams,
        path: '/with-path-params/with-validator-optional-wrapped',
      });
      const expectedProps2 = fakeCallerProps(event2);

      const route2 = resolveRoute(event2, routes)!;
      expect(route2).toBeDefined();

      await route2(expectedProps2);
      expect(inspected).toHaveBeenCalledWith({
        ...expectedProps2,
        validated: {
          qsp: { foo: 'bar' },
        },
      });
    });
  });
});
