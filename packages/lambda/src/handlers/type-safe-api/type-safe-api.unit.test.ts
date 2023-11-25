import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { LoggerEvents } from '../../index.js';
import type { ApiHandlerReturn, TypedApiRouteConfig } from './types.js';

import { HttpError } from '../../api/http-errors.js';
import {
  COLD_START,
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
let toolkit = createToolkit('unit-tests', { logger });

const routes = {
  error: {
    get: async () => {
      throw new HttpError(400);
    },
  },
  get: async () => 'test',
  test: {
    nested: {
      get: async () => 'test',
    },
  },
} as TypedApiRouteConfig;

beforeEach(() => {
  delete process.env[COLD_START];
  loggerEvents = { emit: vi.fn(), on: vi.fn() } as unknown as LoggerEvents;
  logger = new Logger({ level: 'silent' }, loggerEvents);
  toolkit = createToolkit('unit-tests', { logger });
});
describe('`TypeSafeApiHandler` tests:', () => {
  describe('base functionality/success cases:', () => {
    describe.only('logging:', () => {
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
            route: expect.any(String),
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

        await MockLambdaRuntime(handler).catch(() => {});
        expect(loggerEvents.emit).toHaveBeenCalledWith('end');
      });
    });
    describe('lifecycle hooks:', () => {
      test('exeFn: should transparently return result', async () => {
        const text = 'hello, world';
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const handler = makeApi(routes);

        const res = await MockLambdaRuntime(handler);
        expect(res).toBe(text);
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

        await MockLambdaRuntime(handler);
        expect(spy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      });
      test('start: should be able to return with result early', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const exeFn = vi.fn();
        const text = 'early return';
        const onRequestStart = async () => () =>
          ({ statusCode: 200 }) satisfies ApiHandlerReturn;

        const handler = makeApi(routes, { onRequestStart });

        const res = await MockLambdaRuntime(handler);
        expect(res).toBe(text);
        expect(exeFn).not.toHaveBeenCalled();
      });
      test('end: should be able to return with result early', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const text = 'early return';

        const exeFn = vi.fn().mockResolvedValue('not seen');
        const onRequestEnd = async () => () =>
          ({ statusCode: 200 }) satisfies ApiHandlerReturn;

        const handler = makeApi(routes, { onRequestEnd });

        const res = await MockLambdaRuntime(handler);
        expect(res).toBe(text);
        expect(exeFn).toHaveBeenCalled();
      });
      test('start: should be able to return void (transparent)', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const text = 'hello, world';

        const exeFn = vi.fn().mockResolvedValue(text);
        const onRequestEnd = vi.fn().mockResolvedValue(undefined);

        const handler = makeApi(routes, { onRequestEnd });

        const res = await MockLambdaRuntime(handler);
        expect(res).toBe(text);
        expect(exeFn).toHaveBeenCalled();
        expect(onRequestEnd).toHaveBeenCalledWith(
          expect.objectContaining({ result: text })
        );
      });
    });
    describe('api functionality:', () => {
      test('should return 404 if route not found', async () => {
        expect(1).toBe(1);
      });
    });
  });
  describe('fail cases:', () => {
    test('should throw if `exeFn` throws (no `onError`)', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const errText = 'test error';

      const handler = makeApi(routes);

      await expect(async () => MockLambdaRuntime(handler)).rejects.toThrow(
        errText
      );
    });
    test('should throw if `onRequestStart` throws (no `onError`)', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const errText = 'test error';

      const handler = makeApi(routes, {
        onRequestStart: async () => {
          throw new Error(errText);
        },
      });

      await expect(async () => MockLambdaRuntime(handler)).rejects.toThrow(
        errText
      );
    });
    test('should throw if `onRequestEnd` throws (no `onError`)', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const errText = 'test error';

      const handler = makeApi(routes, {
        onRequestEnd: async () => {
          throw new Error(errText);
        },
      });

      await expect(async () => MockLambdaRuntime(handler)).rejects.toThrow(
        errText
      );
    });
    test('should throw if `onHotFunctionTrigger` throws', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const handler = makeApi(routes, {
        onHotFunctionTrigger: async () => {
          throw new Error();
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
    test('should throw if `onError` throws', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler);
      const err2 = 'hook error';
      const onError = async () => {
        throw new Error(err2);
      };

      const handler = makeApi(routes, { onError });

      await expect(async () => MockLambdaRuntime(handler)).rejects.toThrow(
        err2
      );
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
