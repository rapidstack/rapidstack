import type {
  APIGatewayProxyResultV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { LoggerEvents } from '../../index.js';
import type {
  ApiHandlerReturn,
  HttpRoute,
  TypedApiRouteConfig,
} from './types.js';

import { HttpError } from '../../api/http-errors.js';
import {
  EnvKeys,
  HOT_FUNCTION_TRIGGER,
  HandlerExecuteError,
  Logger,
  MockLambdaRuntime,
  createToolkit,
  makeMockApiEvent,
} from '../../index.js';
import { TypeSafeApiHandler } from './handler.js';

let loggerEvents = { emit: vi.fn(), on: vi.fn() } as unknown as LoggerEvents;
let logger = new Logger({ level: 'silent' }, loggerEvents);
let toolkit = createToolkit({ appName: 'unit-tests', logger });

const routes = {
  'error': {
    get: async () => {
      throw new HttpError(400);
    },
  },
  'get': async () => ({ body: 'test' }),
  'non-http-error': {
    get: async () => {
      throw new Error('test');
    },
  },
  'test': {
    nested: {
      get: async () => 'test',
    },
  },
} as TypedApiRouteConfig;

beforeEach(() => {
  delete process.env[EnvKeys.COLD_START];
  loggerEvents = { emit: vi.fn(), on: vi.fn() } as unknown as LoggerEvents;
  logger = new Logger({ level: 'silent' }, loggerEvents);
  toolkit = createToolkit({ appName: 'unit-tests', logger });
});
describe('`TypeSafeApiHandler` tests:', () => {
  describe('base functionality/success cases:', () => {
    describe('logging:', () => {
      test('should have `trace` for execution start', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes);

        await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
          })
        );
        expect(loggerEvents.emit).toHaveBeenCalledWith(
          'log',
          'trace',
          expect.objectContaining({ msg: 'Starting request execution.' }),
          expect.any(Object)
        );
      });
      test('should have `trace` for execution end', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes);

        await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
          })
        );
        expect(loggerEvents.emit).toHaveBeenCalledWith(
          'log',
          'trace',
          expect.objectContaining({ msg: 'Finished request execution.' }),
          expect.any(Object)
        );
      });
      test('should have `summary` for a single run (success)', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes);

        await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
          })
        );
        expect(loggerEvents.emit).toHaveBeenCalledWith(
          'log',
          'summary',
          expect.objectContaining({
            conclusion: 'success',
            duration: expect.any(Number),
            gatewayLatencyDuration: expect.any(Number),
            routeHandlerDuration: expect.any(Number),
            serverPostprocessingDuration: expect.any(Number),
            serverPreprocessingDuration: expect.any(Number),
          }),
          expect.any(Object)
        );
      });
      test('should have `summary` for a single run (failure)', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes);

        await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
          })
        ).catch(() => {});
        expect(loggerEvents.emit).toHaveBeenCalledWith(
          'log',
          'summary',
          expect.objectContaining({
            conclusion: 'success',
            duration: expect.any(Number),
            gatewayLatencyDuration: expect.any(Number),
            route: expect.any(String),
            routeHandlerDuration: expect.any(Number),
            serverPostprocessingDuration: expect.any(Number),
            serverPreprocessingDuration: expect.any(Number),
          }),
          expect.objectContaining({
            '@h': expect.any(Array),
            '@r': expect.objectContaining({
              'apiId': expect.any(String),
              'apiRequestId': expect.any(String),
              'ip': expect.any(String),
              'lambdaRequestId': expect.any(String),
              'x-amzn-trace-id': expect.any(String),
              'x-request-id': expect.any(String),
            }),
          })
        );
      });
      test('should have `end` at handler completion', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes);

        await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
          })
        );
        expect(loggerEvents.emit).toHaveBeenCalledWith('end');
      });
      test('should have `end` at handler failure', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/error',
          })
        )) as APIGatewayProxyResultV2;

        expect(loggerEvents.emit).toHaveBeenCalledWith('end');
        expect(res).toEqual({
          body: expect.stringContaining('invalid'),
          headers: expect.any(Object),
          statusCode: 400,
        });
      });
    });
    describe('lifecycle hooks:', () => {
      test('route: should return result matching schema', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;
        expect(res.body).toBe('test');
      });
      test('hotFn: should be called when key is present in event', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes, {
          onHotFunctionTrigger: async () => undefined,
        });

        const res = await MockLambdaRuntime(handler, {
          [HOT_FUNCTION_TRIGGER]: 'anything',
        });
        expect(res).toBeUndefined();
      });
      test('shutdown: should register event listener if present', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);

        const spy = vi.spyOn(process, 'on');

        const handler = makeApi(routes, {
          onLambdaShutdown: async () => undefined,
        });

        await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
          })
        );

        expect(spy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      });
      test('start: should be able to return with result early', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const exeFn = vi.fn();
        const text = 'early return';
        const onRequestStart = async () => () =>
          ({ body: text, statusCode: 201 }) satisfies ApiHandlerReturn;

        const theseRoutes = routes;
        (routes as HttpRoute)['get'] = async () => {
          exeFn();
          return {
            body: 'not seen',
          };
        };

        const handler = makeApi(theseRoutes, { onRequestStart });

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.body).toBe(text);
        expect(res.statusCode).toBe(201);
        expect(exeFn).not.toHaveBeenCalled();
      });
      test('end: should be able to return with result early', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const text = 'post return';

        const exeFn = vi.fn().mockResolvedValue('not seen');
        const onRequestEnd = async () => () =>
          ({ body: text, statusCode: 202 }) satisfies ApiHandlerReturn;

        const theseRoutes = routes;
        (routes as HttpRoute)['get'] = async () => {
          exeFn();
          return {
            body: 'not seen',
          };
        };

        const handler = makeApi(theseRoutes, { onRequestEnd });

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.body).toBe(text);
        expect(res.statusCode).toBe(202);
        expect(exeFn).toHaveBeenCalled();
      });
      test('start: should be able to return void (transparent)', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const text = 'test';
        const exeFn = vi.fn();
        const onRequestStart = vi.fn().mockResolvedValue(undefined);

        const theseRoutes = routes;
        (routes as HttpRoute)['get'] = async () => {
          exeFn();
          return {
            body: text,
          };
        };

        const handler = makeApi(theseRoutes, { onRequestStart });

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.body).toBe(text);
        expect(exeFn).toHaveBeenCalled();
        expect(onRequestStart).toHaveBeenCalled();
      });
    });
    describe('api functionality:', () => {
      test('should return 404 if route not found', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/not-found',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(JSON.parse(res.body as string)).toMatchObject({
          data: {
            description: expect.stringContaining('not be found'),
            title: 'Not Found',
          },
        });
        expect(res.statusCode).toBe(404);
      });
      test('should return 404 if route contains forbidden slug', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/__proto__',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(JSON.parse(res.body as string)).toMatchObject({
          data: {
            description: expect.stringContaining('not be found'),
            title: 'Not Found',
          },
        });
        expect(res.statusCode).toBe(404);
      });
    });
  });
  describe('fail cases:', () => {
    test('should 500 on non-HTTP thrown err (no `onError`)', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const handler = makeApi(routes);

      const res = (await MockLambdaRuntime(
        handler,
        makeMockApiEvent({
          method: 'GET',
          path: '/non-http-error',
        })
      )) as APIGatewayProxyStructuredResultV2;

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body as string)).toMatchObject({
        data: {
          description: expect.stringContaining('server has encountered'),
          title: 'Internal Server Error',
        },
      });
    });
    test('should 500 if `onRequestStart` throws (no `onError`)', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const handler = makeApi(routes, {
        onRequestStart: async () => {
          throw new Error('test error');
        },
      });

      const res = (await MockLambdaRuntime(
        handler,
        makeMockApiEvent({
          method: 'GET',
          path: '/',
        })
      )) as APIGatewayProxyStructuredResultV2;

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body as string)).toMatchObject({
        data: {
          description: expect.stringContaining('server has encountered'),
          title: 'Internal Server Error',
        },
      });
    });
    test('should 500 if `onRequestEnd` throws (no `onError`)', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const handler = makeApi(routes, {
        onRequestEnd: async () => {
          throw new Error('test error');
        },
      });

      const res = (await MockLambdaRuntime(
        handler,
        makeMockApiEvent({
          method: 'GET',
          path: '/',
        })
      )) as APIGatewayProxyStructuredResultV2;

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body as string)).toMatchObject({
        data: {
          description: expect.stringContaining('server has encountered'),
          title: 'Internal Server Error',
        },
      });
    });
    test('should throw if `onHotFunctionTrigger` throws', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const handler = makeApi(routes, {
        onHotFunctionTrigger: async () => {
          throw new Error('test error');
        },
      });

      const event = { [HOT_FUNCTION_TRIGGER]: 'anything' };
      await expect(MockLambdaRuntime(handler, event)).rejects.toThrowError(
        HandlerExecuteError
      );
    });
    test('should throw if `onHotFunctionTrigger` triggered with no hook', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const handler = makeApi(routes);

      const event = { [HOT_FUNCTION_TRIGGER]: 'anything' };
      await expect(MockLambdaRuntime(handler, event)).rejects.toThrowError(
        HandlerExecuteError
      );
    });
    test('should 500 if `onError` throws', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const handler = makeApi(routes, {
        onError: async () => {
          throw new Error('test error');
        },
      });

      const res = (await MockLambdaRuntime(
        handler,
        makeMockApiEvent({
          method: 'GET',
          path: '/non-http-error',
        })
      )) as APIGatewayProxyStructuredResultV2;

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body as string)).toMatchObject({
        data: {
          description: expect.stringContaining('server has encountered'),
          title: 'Internal Server Error',
        },
      });
    });
    test('should throw if event is not a valid API event', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const handler = makeApi(routes);

      await expect(async () => MockLambdaRuntime(handler)).rejects.toThrow(
        HandlerExecuteError
      );
    });
  });
});
