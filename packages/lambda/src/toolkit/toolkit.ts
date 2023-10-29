import type {
  CreatableFactory,
  Toolkit,
  ToolkitOptions,
} from './toolkit.types.js';

import { Cache, type ICache, type ILogger, Logger } from '../common/index.js';
import { isConstructable } from '../utils/index.js';

/**
 * Creates a new toolkit to be used throughout your serverless application.
 * @param name the name of the app
 * @param options optional parameters for the toolkit
 * @returns a toolkit that can be used to create tools
 */
export function createToolkit(name: string, options?: ToolkitOptions): Toolkit {
  // Used to detect if called from a cold start in handlers
  process.env.RAPIDSTACK_COLD_START = '1';

  const logger = (options?.logger || new Logger()) as ILogger;
  const cache = (options?.cache || new Cache()) as ICache;

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
