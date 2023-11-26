import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  Logger as BaseLogger,
  type CreatableParameters,
  EnvKeys,
  type ICache,
  type ICreatableConfig,
  type LoggerEvents,
} from '../index.js';
import { createToolkit } from './toolkit.js';

// dummy logger and util for toolkit usage:
let loggerEvents = { emit: vi.fn(), on: vi.fn() } as unknown as LoggerEvents;
class Logger extends BaseLogger {
  constructor(events: LoggerEvents) {
    super({ base: {}, level: 'silent' }, events);
  }
}

interface UtilConfig extends ICreatableConfig {}
const Util = (...args: CreatableParameters<UtilConfig>) => {
  const [{ cache, logger }] = args;
  return {
    callCache: () => cache.getItem('foo'),
    callLogger: () => logger.info('called logger'),
  };
};

beforeEach(() => {
  delete process.env[EnvKeys.APP_NAME];
  delete process.env[EnvKeys.SST_APP_NAME];
  delete process.env[EnvKeys.COLD_START];
  loggerEvents = { emit: vi.fn(), on: vi.fn() } as unknown as LoggerEvents;
});
describe('`createToolkit` tests:', () => {
  describe('base functionality', () => {
    test('should return the name of the application', () => {
      // fallback 3: unnamed app
      const t1 = createToolkit();
      expect(t1.name).toBe('unnamed app');

      // fallback 2: APP_NAME env var
      process.env.APP_NAME = 'app-name-env';
      const t2 = createToolkit();
      expect(t2.name).toBe(process.env.APP_NAME);

      // fallback 1: SST_APP env var
      process.env.SST_APP = 'sst-app-env';
      const t3 = createToolkit();
      expect(t3.name).toBe(process.env.SST_APP);

      // explicit name
      const t4 = createToolkit('explicit-name');
      expect(t4.name).toBe('explicit-name');
    });
    test('should return an abstract `create` factory', () => {
      const t = createToolkit();
      expect(t.create).toBeDefined();
      expect(typeof t.create).toBe('function');
    });
    test('should set the "cold start" env flag', () => {
      createToolkit();

      expect(process.env[EnvKeys.COLD_START]).toBeTruthy();
    });
  });
  describe('toolkit options', () => {
    test('should use provided logger, if provided', () => {
      const toolkit = createToolkit('name', {
        logger: new Logger(loggerEvents),
      });

      const util = toolkit.create(Util);
      util.callLogger();

      expect(loggerEvents.emit).toHaveBeenCalledWith(
        'log',
        'info',
        'called logger',
        expect.any(Object)
      );
    });
    test('should use provided cache, if provided', () => {
      const cache = { getItem: vi.fn() } as unknown as ICache;
      const toolkit = createToolkit('name', { cache });

      const util = toolkit.create(Util);
      util.callCache();

      expect(cache.getItem).toHaveBeenCalled();
    });
  });
});
