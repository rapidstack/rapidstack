import type { APIGatewayProxyEventV2 } from 'aws-lambda';

import { object, string } from 'valibot';
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
      'with-validator': {
        get: validate(SimpleValidator, async (params) => {
          inspected(params);
          return 'dummy-result';
        }),
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
          qsp: {
            foo: 'bar',
          },
        },
      });
    });
  });
});
