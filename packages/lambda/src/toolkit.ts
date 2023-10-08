/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

// dummy brand types used as placeholders
type Logger = {} & { _type: 'logger' };
type Cache = {} & { _type: 'cache' };

type Factory = <T>(tool: Creatable<T>) => T;

type Creatable<T> = (
  logger: Logger,
  cache: Cache,
  create: Factory,
  options?: any
) => T;
/**
 * Creates a new lambda toolkit
 * @param name the name of the application that the toolkit will bind to.
 * @returns a toolkit
 */
export function createToolkit(name: string): {
  create: Factory;
  name: string;
} {
  const logger = {} as Logger;
  const cache = {} as Cache;
  // eslint-disable-next-line func-style
  const create: Factory = function create<T>(tool: Creatable<T>): T {
    return tool(logger, cache, create);
  };

  return {
    create,
    name,
  };
}
