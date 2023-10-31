/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ICache, ILogger } from '../common/index.js';

export interface ICreatableReturn {}
export interface ICreatableConfig {
  cacheTtl?: false | number;
}

export type CreatableUtils = {
  cache: ICache;
  create: CreatableFactory;
  logger: ILogger;
};

export type CreatableParameters<
  Config extends ICreatableConfig = ICreatableConfig,
> = [utils: CreatableUtils, config?: Config];

export type ClassCreatable<
  Config extends ICreatableConfig,
  Return extends ICreatableReturn,
> = { new (...args: CreatableParameters<Config>): Return };

export type FunctionCreatable<
  Config extends ICreatableConfig,
  Return extends ICreatableReturn,
> = (...args: CreatableParameters<Config>) => Return;

export type Creatable<
  Config extends ICreatableConfig,
  Return extends ICreatableReturn,
> = ClassCreatable<Config, Return> | FunctionCreatable<Config, Return>;

export type InferConfig<C extends Creatable<any, any>> = C extends Creatable<
  infer Config,
  any
>
  ? Config
  : never;

export type FactoryParams<
  Config extends ICreatableConfig,
  Return extends ICreatableReturn,
> = Partial<InferConfig<Creatable<Config, Return>>> extends InferConfig<
  Creatable<Config, Return>
>
  ? [
      tool: Creatable<Config, Return>,
      options?: InferConfig<Creatable<Config, Return>>,
    ]
  : [
      tool: Creatable<Config, Return>,
      options: InferConfig<Creatable<Config, Return>>,
    ];

export type CreatableFactory = <
  Config extends ICreatableConfig,
  Return extends ICreatableReturn,
>(
  ...params: FactoryParams<Config, Return>
) => Return;

export type Toolkit = {
  create: CreatableFactory;
  name: string;
};

export type ToolkitOptions = {
  additionalLoggerEntries?: Record<string, unknown>;
  cache?: ICache;
  defaultCacheTtl?: number;
  logLevel?:
    | 'debug'
    | 'error'
    | 'fatal'
    | 'info'
    | 'silent'
    | 'summary'
    | 'trace'
    | 'warn';
  logger?: ILogger;
};
