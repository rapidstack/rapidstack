import type { Cache, Logger } from '../common/index.js';

export interface ICreatable {}
export interface ICreatableOptions {
  cacheTtl?: false | number;
}

export type CreatableParameters<Options extends ICreatableOptions> = [
  logger: Logger,
  cache: Cache,
  create: CreateFactory,
  options?: Options,
];

export type FunctionCreatable<
  CreatableInterface extends ICreatable,
  Options extends ICreatableOptions,
> = (...args: CreatableParameters<Options>) => CreatableInterface;

export type ClassCreatable<
  CreatableInterface extends ICreatable,
  Options extends ICreatableOptions,
> = { new (...args: CreatableParameters<Options>): CreatableInterface };

export type Creatable<
  CreatableInterface extends ICreatable,
  Options extends ICreatableOptions,
> =
  | ClassCreatable<CreatableInterface, Options>
  | FunctionCreatable<CreatableInterface, Options>;

export interface CreateFactory {
  /// CASE: NO OPTIONS
  /**
   * An abstract utility factory that automatically injects core toolkit
   * elements like a logger, cache and factory into each implementing construct.
   * @param tool The handler, tool, helper, or anything else that follows the
   * interface of `Creatable`.
   * @param options Any options that the tool may require or optionally have.
   * @returns The created tool with injected logger and cache.
   */
  <I extends ICreatable>(tool: Creatable<I, ICreatableOptions>): I;
  /**
   * An abstract utility factory that automatically injects core toolkit
   * elements like a logger, cache and factory into each implementing construct.
   * @param tool The handler, tool, helper, or anything else that follows the
   * interface of `Creatable`.
   * @param options Any options that the tool may require or optionally have.
   * @returns The created tool with injected logger and cache.
   */
  <I extends ICreatable>(tool: {
    new (
      logger: Logger,
      cache: Cache,
      create: CreateFactory,
      options?: ICreatableOptions
    ): I;
  }): I;

  /// CASE: OPTIONAL OPTIONS
  /**
   * An abstract utility factory that automatically injects core toolkit
   * elements like a logger, cache and factory into each implementing construct.
   * @param tool The handler, tool, helper, or anything else that follows the
   * interface of `Creatable`.
   * @param options Any options that the tool may require or optionally have.
   * @returns The created tool with injected logger and cache.
   */
  <I extends ICreatable, O extends ICreatableOptions>(
    tool: Creatable<I, O>,
    options?: O
  ): I;
  /**
   * An abstract utility factory that automatically injects core toolkit
   * elements like a logger, cache and factory into each implementing construct.
   * @param tool The handler, tool, helper, or anything else that follows the
   * interface of `Creatable`.
   * @param options Any options that the tool may require or optionally have.
   * @returns The created tool with injected logger and cache.
   */
  <I extends ICreatable, O extends ICreatableOptions>(tool: {
    new (logger: Logger, cache: Cache, create: CreateFactory, options?: O): I;
  }): I;

  /// CASE: REQUIRED OPTIONS
  /**
   * An abstract utility factory that automatically injects core toolkit
   * elements like a logger, cache and factory into each implementing construct.
   * @param tool The handler, tool, helper, or anything else that follows the
   * interface of `Creatable`.
   * @param options Any options that the tool may require or optionally have.
   * @returns The created tool with injected logger and cache.
   */
  <I extends ICreatable, O extends ICreatableOptions>(
    // For some reason this one will not take Creatable<I, O>...
    tool: (
      logger: Logger,
      cache: Cache,
      create: CreateFactory,
      options: O
    ) => I,
    options: O
  ): I;
  /**
   * An abstract utility factory that automatically injects core toolkit
   * elements like a logger, cache and factory into each implementing construct.
   * @param tool The handler, tool, helper, or anything else that follows the
   * interface of `Creatable`.
   * @param options Any options that the tool may require or optionally have.
   * @returns The created tool with injected logger and cache.
   */
  <I extends ICreatable, O extends ICreatableOptions>(
    tool: {
      new (logger: Logger, cache: Cache, create: CreateFactory, options: O): I;
    },
    options: O
  ): I;
}

export type Toolkit = {
  cache: Cache;
  create: CreateFactory;
  logger: Logger;
  name: string;
};
