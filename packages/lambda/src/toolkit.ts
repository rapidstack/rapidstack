/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

// dummy brand types used as placeholders
type Logger = {} & { _type: 'logger' };
type Cache = {} & { _type: 'cache' };

type Factory = <C extends Creatable<T, O>, T, O extends CreatableOptions>(
  tool: C,
  options?: Parameters<C>[3]
) => T;

type StandardCreateOptions = {
  cacheTtl?: number;
};

type CreatableOptions<T extends Record<string, any> = Record<string, any>> = {
  [K in keyof T]: T[K];
} & StandardCreateOptions;

type Creatable<T, O extends CreatableOptions> = (
  logger: Logger,
  cache: Cache,
  create: Factory,
  options?: O
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
  const create: Factory = function create(tool, options?) {
    return tool(logger, cache, create, options);
  };

  return {
    create,
    name,
  };
}

// setup for example:

type IMyWidget = {
  getItem: (key: string) => Promise<any>;
  putItem: (key: string, value: any) => Promise<void>;
};

interface IMyWidgetOptions extends CreatableOptions {
  someProperty?: string;
}

// eslint-disable-next-line func-style
const MyWidget: Creatable<IMyWidget, IMyWidgetOptions> = (
  logger,
  cache,
  create,
  options
): IMyWidget => {
  const something = {} as IMyWidget;
  return something;
};

// Example usage idea:

const toolkit = createToolkit('my-app');
const d = toolkit.create(MyWidget);

/*
This looks to be closer to what is wanted if it can be assumed that options will
always be the 4th parameter (line 11). The problem here is that the return type
from the factory is unknown. Need to fix that...
*/
