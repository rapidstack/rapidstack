import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { LoggerEvents } from '../../index.js';

import {
  EnvKeys,
  HOT_FUNCTION_TRIGGER,
  HandlerExecuteError,
  Logger,
  MockLambdaRuntime,
  createToolkit,
} from '../../index.js';
import { GenericHandler } from './handler.js';

let loggerEvents = { emit: vi.fn(), on: vi.fn() } as unknown as LoggerEvents;
let logger = new Logger({ level: 'silent' }, loggerEvents);
let toolkit = createToolkit({ logger });

beforeEach(() => {
  delete process.env[EnvKeys.COLD_START];
  loggerEvents = { emit: vi.fn(), on: vi.fn() } as unknown as LoggerEvents;
  logger = new Logger({ level: 'silent' }, loggerEvents);
  toolkit = createToolkit({ logger });
});
describe('`GenericHandler` tests:', () => {
  describe('base functionality/success cases:', () => {
    describe('logging:', () => {
      test('should have `trace` for execution start', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const handler = wrapper(async () => {});

        await MockLambdaRuntime(handler);
        expect(loggerEvents.emit).toHaveBeenCalledWith(
          'log',
          'trace',
          expect.objectContaining({ msg: 'Starting request execution.' }),
          expect.any(Object)
        );
      });
      test('should have `trace` for execution end', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const handler = wrapper(async () => {});

        await MockLambdaRuntime(handler);
        expect(loggerEvents.emit).toHaveBeenCalledWith(
          'log',
          'trace',
          expect.objectContaining({ msg: 'Finished request execution.' }),
          expect.any(Object)
        );
      });
      test('should have `summary` for a single run (success)', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const handler = wrapper(async () => {});

        await MockLambdaRuntime(handler);
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
        const wrapper = toolkit.create(GenericHandler);
        const handler = wrapper(async () => {
          throw new Error();
        });

        await MockLambdaRuntime(handler).catch(() => {});
        expect(loggerEvents.emit).toHaveBeenCalledWith(
          'log',
          'summary',
          expect.objectContaining({
            conclusion: 'failure',
            duration: expect.any(Number),
          }),
          expect.any(Object)
        );
      });
      test('should have `end` at handler completion', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const handler = wrapper(async () => {});

        await MockLambdaRuntime(handler);
        expect(loggerEvents.emit).toHaveBeenCalledWith('end');
      });
      test('should have `end` at handler failure', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const handler = wrapper(async () => {
          throw new Error();
        });

        await MockLambdaRuntime(handler).catch(() => {});
        expect(loggerEvents.emit).toHaveBeenCalledWith('end');
      });
    });
    describe('lifecycle hooks:', () => {
      test('exeFn: should transparently return result', async () => {
        const text = 'hello, world';
        const wrapper = toolkit.create(GenericHandler);
        const handler = wrapper(async () => text);

        const res = await MockLambdaRuntime(handler);
        expect(res).toBe(text);
      });
      test('hotFn: should be called when key is present in event', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const handler = wrapper(async () => 'not run', {
          onHotFunctionTrigger: async () => undefined,
        });

        const res = await MockLambdaRuntime(handler, {
          [HOT_FUNCTION_TRIGGER]: 'anything',
        });
        expect(res).toBeUndefined();
      });
      test('coldStart: should fire only if in a cold start', async () => {
        const wrapper = toolkit.create(GenericHandler);
        expect(process.env[EnvKeys.COLD_START]).toBeTruthy();
        const fn = vi.fn();
        const text = 'hello, world';

        const handler = wrapper(async () => text, {
          onColdStart: fn,
        });

        await expect(MockLambdaRuntime(handler)).resolves.toBe(text);
        expect(fn).toHaveBeenCalledTimes(1);

        // second run should not call the hook
        await expect(MockLambdaRuntime(handler)).resolves.toBe(text);
        expect(fn).toHaveBeenCalledTimes(1);
      });
      test('coldStart: should not fire if hotFn is present', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const onColdStart = vi.fn();
        const onHotFunctionTrigger = vi.fn();

        const handler = wrapper(async () => {}, {
          onColdStart,
          onHotFunctionTrigger,
        });

        const event = { [HOT_FUNCTION_TRIGGER]: 'anything' };
        await MockLambdaRuntime(handler, event);

        expect(onColdStart).not.toHaveBeenCalled();
        expect(onHotFunctionTrigger).toHaveBeenCalledTimes(1);
      });
      test('shutdown: should register event listener if present', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const spy = vi.spyOn(process, 'on');

        const handler = wrapper(async () => {}, {
          onLambdaShutdown: async () => undefined,
        });

        await MockLambdaRuntime(handler);
        expect(spy).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
      });
      test('start: should be able to return with result early', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const exeFn = vi.fn();
        const text = 'early return';
        const onRequestStart = async () => () => text;

        const handler = wrapper(exeFn, { onRequestStart });

        const res = await MockLambdaRuntime(handler);
        expect(res).toBe(text);
        expect(exeFn).not.toHaveBeenCalled();
      });
      test('start: should be able to enrich `exeFn` with props', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const text = 'hello, world';
        const exampleProp = { test: 'test' };

        const exeFn = vi.fn().mockResolvedValue(text);
        const onRequestStart = async () => exampleProp;

        const handler = wrapper(exeFn, { onRequestStart });

        const res = await MockLambdaRuntime(handler);
        expect(res).toBe(text);
        expect(exeFn).toHaveBeenCalledWith(
          expect.objectContaining(exampleProp)
        );
      });
      test('start: should be able to return void (transparent)', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const text = 'hello, world';

        const exeFn = vi.fn().mockResolvedValue(text);
        const onRequestStart = vi.fn().mockResolvedValue(undefined);

        const handler = wrapper(exeFn, { onRequestStart });

        const res = await MockLambdaRuntime(handler);
        expect(res).toBe(text);
        expect(exeFn).toHaveBeenCalled();
      });
      test('end: should be able to return with result early', async () => {
        const wrapper = toolkit.create(GenericHandler);
        const text = 'early return';

        const exeFn = vi.fn().mockResolvedValue('not seen');
        const onRequestEnd = async () => () => text;

        const handler = wrapper(exeFn, { onRequestEnd });

        const res = await MockLambdaRuntime(handler);
        expect(res).toBe(text);
        expect(exeFn).toHaveBeenCalled();
      });
    });
  });
  describe('fail cases:', () => {
    test('should throw if `exeFn` throws (no `onError`)', async () => {
      const wrapper = toolkit.create(GenericHandler);
      const errText = 'test error';

      const handler = wrapper(async () => {
        throw new Error(errText);
      });

      await expect(async () => MockLambdaRuntime(handler)).rejects.toThrow(
        errText
      );
    });
    test('should throw if `onRequestStart` throws (no `onError`)', async () => {
      const wrapper = toolkit.create(GenericHandler);
      const errText = 'test error';

      const handler = wrapper(async () => {}, {
        onRequestStart: async () => {
          throw new Error(errText);
        },
      });

      await expect(async () => MockLambdaRuntime(handler)).rejects.toThrow(
        errText
      );
    });
    test('should throw if `onRequestEnd` throws (no `onError`)', async () => {
      const wrapper = toolkit.create(GenericHandler);
      const errText = 'test error';

      const handler = wrapper(async () => {}, {
        onRequestEnd: async () => {
          throw new Error(errText);
        },
      });

      await expect(async () => MockLambdaRuntime(handler)).rejects.toThrow(
        errText
      );
    });
    test('should throw if `onHotFunctionTrigger` throws', async () => {
      const wrapper = toolkit.create(GenericHandler);
      const handler = wrapper(async () => 'not run', {
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
      const wrapper = toolkit.create(GenericHandler);
      const handler = wrapper(async () => 'not run');

      const event = { [HOT_FUNCTION_TRIGGER]: 'anything' };
      await expect(MockLambdaRuntime(handler, event)).rejects.toThrowError(
        HandlerExecuteError
      );
    });
    test('should throw if `onError` throws', async () => {
      const wrapper = toolkit.create(GenericHandler);
      const err1 = 'handler error';
      const err2 = 'hook error';
      const onError = async () => {
        throw new Error(err2);
      };

      const handler = wrapper(
        async () => {
          throw new Error(err1);
        },
        { onError }
      );

      await expect(async () => MockLambdaRuntime(handler)).rejects.toThrow(
        err2
      );
    });
  });
});
