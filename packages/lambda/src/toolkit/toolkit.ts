import type {
  CreatableFactory,
  Toolkit,
  ToolkitOptions,
} from './toolkit.types.js';

import { COLD_START, Cache, LOG_LEVEL, Logger } from '../common/index.js';
import { isConstructable } from '../utils/index.js';

/**
 * Creates a new toolkit to be used throughout your serverless application.
 * @param appName the name of the app. If not provided, falls back to the
 * environment variables `SST_APP` then `APP_NAME`. If neither are provided,
 * defaults to `unnamed app`.
 * @param options optional parameters for the toolkit
 * @returns a toolkit that can be used to create tools
 */
export function createToolkit(
  appName?: string,
  options: ToolkitOptions = {}
): Toolkit {
  // Used to detect if called from a cold start in handlers
  // eslint-disable-next-line security/detect-object-injection
  process.env[COLD_START] = '1';
  const name =
    appName || process.env.SST_APP || process.env.APP_NAME || 'unnamed app';
  const loggerDefaults = {
    base: { '@a': name },
    // eslint-disable-next-line security/detect-object-injection
    level: process.env[LOG_LEVEL],
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
