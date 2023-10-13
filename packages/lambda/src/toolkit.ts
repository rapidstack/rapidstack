/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

// dummy brand types used as placeholders
type Logger = {} & { _type: 'logger' };
type Cache = {} & { _type: 'cache' };

type Factory = <C extends Creatable<T, O>, T, O extends CreatableOptions>(
  tool: C,
  options?: O
) => T;

type CreatableOptions<T extends Record<string, any> = {}> =
  | ({
      cacheTtl?: number;
    } & { [K in keyof T]: T[K] })
  | undefined;

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
  const create: Factory = function create<
    C extends Creatable<T, O>,
    T,
    O extends CreatableOptions,
  >(tool: C, options?: O): T {
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

type IMyWidgetOptions = CreatableOptions<{
  someProperty: string;
}>;

// eslint-disable-next-line func-style
const MyWidget: Creatable<IMyWidget, IMyWidgetOptions> = (
  logger,
  cache,
  create,
  options
): IMyWidget => {
  const dynamo = {} as IMyWidget;
  return dynamo;
};

// Example usage idea:

const toolkit = createToolkit('my-app');
const d = toolkit.create(MyWidget, { someProperty: 'my-property' });

/* 
The problem with this approach is that there is no intellisense on the options.
Need to see if there is a better way to handle the creatable options so they
fit handlers and other utils the lambda package exports so all things are 
constructed in a consistent way.
*/
