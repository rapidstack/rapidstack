/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Cache, Logger } from '../common/index.js';
import type {
  Creatable,
  ICreatable,
  ICreatableOptions,
  Toolkit,
  ToolkitOptions,
} from './toolkit.types.js';

import { isConstructable } from '../utils/index.js';

/**
 * Creates a new toolkit to be used throughout your serverless application.
 * @param name the name of the app
 * @param options optional parameters for the toolkit
 * @returns a toolkit that can be used to create tools
 */
export function createToolkit(name: string, options?: ToolkitOptions): Toolkit {
  const logger = (options?.logger || {}) as Logger;
  const cache = (options?.cache || {}) as Cache;

  // eslint-disable-next-line jsdoc/require-jsdoc
  function create<I extends ICreatable, O extends ICreatableOptions>(
    tool: Creatable<I, O>,
    options?: O
  ): I {
    if (isConstructable(tool)) return new tool(logger, cache, create, options);

    return tool(logger, cache, create, options);
  }

  return {
    create,
    name,
  };
}
