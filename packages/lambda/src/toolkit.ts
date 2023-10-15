// dummy brand types used as placeholders
type Logger = {} & { _type: 'logger' };
type Cache = {} & { _type: 'cache' };
declare type OptionsIndex = 3;

type IsConstructable<T> = T extends new (...args: any[]) => any ? 'yes' : 'no';

// ---------------------------
// Relevant TypeScript Implementation
// ---------------------------

type Factory = <
  C extends Creatable<T, O>,
  T extends ICreatable,
  O extends ICreatableOptions,
>(
  tool: C,
  options?: C extends new (...args: any[]) => any
    ? ConstructorParameters<C>[OptionsIndex]
    : C extends (
        logger: Logger,
        cache: Cache,
        create: Factory,
        options?: O
      ) => T
    ? Parameters<C>[OptionsIndex]
    : never
) => T;

interface ICreatable {}
interface ICreatableOptions {
  cacheTtl?: number;
}

type Creatable<T, O extends ICreatableOptions> =
  | ((logger: Logger, cache: Cache, create: Factory, options?: O) => T)
  | {
      new (logger: Logger, cache: Cache, create: Factory, options?: O): T;
    };

/**
 *
 * @param name
 */
export function createToolkit(name: string) {
  const logger = {} as Logger;
  const cache = {} as Cache;

  function create<T extends ICreatable>(
    tool: Creatable<T, ICreatableOptions>
  ): T;
  function create<T extends ICreatable>(
    tool: Creatable<T, ICreatableOptions>
  ): T;
  function create<T extends ICreatable, O extends ICreatableOptions>(
    tool: Creatable<T, O>,
    options: O
  ): T;
  /**
   *
   * @param tool
   * @param options
   */
  function create<T extends ICreatable, O extends ICreatableOptions>(
    tool: Creatable<T, O>,
    options?: O
  ): T {
    if (isConstructible(tool)) {
      return new (tool as {
        new (logger: Logger, cache: Cache, create: Factory, options?: O): T;
      })(logger, cache, create, options);
    }

    return (
      tool as (logger: Logger, cache: Cache, create: Factory, options?: O) => T
    )(logger, cache, create, options);
  }

  return {
    create,
    name,
  };
}

// ---------------------------
// Example Setup Code
// ---------------------------

interface IMyWidget extends ICreatable {
  getItem: (key: string) => Promise<any>;
  putItem: (key: string, value: any) => Promise<void>;
}

interface IMyOptionalWidgetOptions extends ICreatableOptions {
  someProperty?: string;
}
interface IMyRequiredWidgetOptions extends ICreatableOptions {
  myProp?: string;
  someProperty: string;
}

const MyWidgetWithOptionalOptions: Creatable<
  IMyWidget,
  IMyOptionalWidgetOptions
> = (logger, cache, create, options): IMyWidget => {
  const widget = {} as IMyWidget; // dummy impl
  return widget;
};

const MyWidgetWithRequiredOptions: Creatable<
  IMyWidget,
  IMyRequiredWidgetOptions
> = (logger, cache, create, options): IMyWidget => {
  const widget = {} as IMyWidget; // dummy impl
  return widget;
};

// --- for not attempted class version yet:

// interface IClassCreatable {
//   new: (logger: Logger, cache: Cache, create: Factory, options: IMyClassWidgetOptions)
// }

interface IMyClassWidget extends ICreatable {
  deleteSomething: (key: string) => Promise<any>;
  setSomething: (key: string, value: any) => Promise<any>;
}

interface IMyClassWidgetOptions extends ICreatableOptions {
  someOtherProperty: string;
}

class MyClassWidget
  implements Creatable<IMyClassWidget, IMyClassWidgetOptions>
{
  constructor(
    logger: Logger,
    cache: Cache,
    create: Factory,
    options: IMyClassWidgetOptions
  ) {}

  public async deleteSomething(key: string) {}
  public async setSomething(key: string, value: any) {}
}

// ---------------------------
// Test Cases
// ---------------------------

const toolkit = createToolkit('my-app');
const MyWidget = MyWidgetWithOptionalOptions;
const test1 = toolkit.create(MyWidget, { someProperty: 'my-property' }); // should return type IMyWidget
//    ^?

// 1. the output of factory must reflect the interface of the MyWidget: PASS

// -------------------------------------------------------------------------------------------

const test2 = toolkit.create(MyWidgetWithOptionalOptions, {}); // should not error
const test21 = toolkit.create(MyWidgetWithRequiredOptions); // should error

// 2. the factory must be conscious of the properties (if required) to create: PASS

// -------------------------------------------------------------------------------------------

const test3 = toolkit.create(MyWidgetWithOptionalOptions); // should not error
const test31 = toolkit.create(MyWidgetWithRequiredOptions); // should error

// 3. the factory must complain if there is a required property for the second parameter and it isn't supplied: PASS

// -------------------------------------------------------------------------------------------

type t = IsConstructable<typeof MyWidget>;
//   ^?

const test4 = toolkit.create(MyClassWidget);

// 4. support classes and factory function/closures that return methods/properties: FAIL (have not tried yet; not implemented)

// -------------------------------------------------------------------------------------------

/* 
Now 1, 2, and 3 are working. Just need to get this working with classes.
*/
