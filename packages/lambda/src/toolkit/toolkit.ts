/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Cache, Logger } from '../common/index.js';
import type {
  Creatable,
  ICreatable,
  ICreatableOptions,
  Toolkit,
} from './toolkit.types.js';

/**
 * Creates a new toolkit to be used throughout your serverless application.
 * @param name the name of the app
 * @returns the tools that can be utilized:
 * ```txt
 *   • name: the name of your app
 *   • logger: a json logger
 *   • cache: in-memory cache
 *   • create: abstract utility factory
 * ```
 */
export function createToolkit(name: string): Toolkit {
  const logger = {} as Logger;
  const cache = {} as Cache;

  // eslint-disable-next-line jsdoc/require-jsdoc
  function create<I extends ICreatable, O extends ICreatableOptions>(
    tool: Creatable<I, O>,
    options?: O
  ): I {
    if (isConstructable(tool)) {
      return new tool(logger, cache, create, options);
    }

    return tool(logger, cache, create, options);
  }

  return {
    cache,
    create,
    logger,
    name,
  };
}

/**
 * Attempts to determine if a passed function is one that can be invoked with
 * the `new` keyword.
 * @param fn The function to test.
 * @returns The resulting boolean test.
 */
function isConstructable(
  fn?: Creatable<ICreatable, any>
): fn is { new (...args: any[]): any } {
  return !!fn && !!fn.prototype && !!fn.prototype.constructor;
}
