import type {
  CreatableFactory,
  Toolkit,
  ToolkitOptions,
} from './toolkit.types.js';

import { Cache, EnvKeys, Logger } from '../common/index.js';
import {
  getInternalEnvironmentVariable,
  isConstructable,
} from '../utils/index.js';

/**
 * Creates a new toolkit to be used throughout your serverless application.
 * @param options optional parameters for the toolkit
 * @param options.appName the name of the app. If not provided, falls back to
 * the environment variables `SST_APP` then `APP_NAME`. If neither are provided,
 * defaults to `unnamed app`.
 * @returns a toolkit that can be used to create tools
 */
export function createToolkit(options: ToolkitOptions = {}): Toolkit {
  // Used to detect if called from a cold start in handlers
  process.env[EnvKeys.COLD_START] = '1';
  const name =
    options.appName ||
    getInternalEnvironmentVariable(EnvKeys.SST_APP_NAME) ||
    getInternalEnvironmentVariable(EnvKeys.APP_NAME) ||
    'unnamed app';

  const loggerDefaults = {
    base: { '@a': name },
    level: getInternalEnvironmentVariable(EnvKeys.LOG_LEVEL),
  };

  const logger = options.logger
    ? options.logger
    : new Logger(options.loggerConfig ?? loggerDefaults);

  const cache = options.cache ? options.cache : new Cache(options.cacheConfig);

  const create: CreatableFactory = (...args) => {
    const utils = { cache, create, logger };
    const [tool, options] = args;
    if (isConstructable(tool)) return new tool(utils, options);

    return tool(utils, options);
  };

  return {
    create,
    name,
  };
}
