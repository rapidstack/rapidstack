import { createToolkit } from '../../toolkit/index.js';
import { GenericHandler } from './handler.js';

// Proof of concept usage... This is not working. Will probably have to make the 
// lifecycle functions a second parameter of runnerFn rather than use the 
// ICreatableOptions interface. The inferred generics aren't working and when 
// there is a type error, the error message is not helpful at all:

/* 
No overload matches this call.
  Overload 1 of 6, '(tool: Creatable<(<Event, Result, Extra extends Record<string, any> = Record<string, any>>(runner: (props: { Logger: Logger; cache: Cache; context: Context; event: Event; } & Extra) => Promise<...>) => (event: Event, context: Context) => Promise<...>), IGenericHandlerOptions>, options?: IGenericHandlerOptions | undefined): <Event, Result, Extra extends Record<...> = Record<...>>(runner: (props: { ...; } & Extra) => Promise<...>) => (event: Event, context: Context) => Promise<...>', gave the following error.
    Type 'boolean' has no properties in common with type 'IGenericHandlerOptions'.
  Overload 2 of 6, '(tool: (logger: Logger, cache: Cache, create: CreateFactory, options: ICreatableOptions) => <Event, Result, Extra extends Record<string, any> = Record<...>>(runner: (props: { ...; } & Extra) => Promise<...>) => (event: Event, context: Context) => Promise<...>, options: ICreatableOptions): <Event, Result, Extra extends Record<...> = Record<...>>(runner: (props: { ...; } & Extra) => Promise<...>) => (event: Event, context: Context) => Promise<...>', gave the following error.
    Type 'boolean' has no properties in common with type 'ICreatableOptions'.
  Overload 3 of 6, '(tool: new (logger: Logger, cache: Cache, create: CreateFactory, options: ICreatableOptions) => ICreatable, options: ICreatableOptions): ICreatable', gave the following error.
    Argument of type '(logger: Logger, cache: Cache, create: CreateFactory, options?: IGenericHandlerOptions | undefined) => <Event, Result, Extra extends Record<string, any> = Record<...>>(runner: (props: { ...; } & Extra) => Promise<...>) => (event: Event, context: Context) => Promise<...>' is not assignable to parameter of type 'new (logger: Logger, cache: Cache, create: CreateFactory, options: ICreatableOptions) => ICreatable'.
      Type '(logger: Logger, cache: Cache, create: CreateFactory, options?: IGenericHandlerOptions | undefined) => <Event, Result, Extra extends Record<string, any> = Record<...>>(runner: (props: { ...; } & Extra) => Promise<...>) => (event: Event, context: Context) => Promise<...>' provides no match for the signature 'new (logger: Logger, cache: Cache, create: CreateFactory, options: ICreatableOptions): ICreatable'.ts(2769)
Operator '>' cannot be applied to types '{ onRequestEnd: ({ logger }: { logger: any; }) => Promise<void>; onRequestStart<LambdaEvent, ExtraParam>(): Promise<void>; }' and '{ logger: any; event: Event | undefined; }'.ts(2365)
Operator '>' cannot be applied to types '{ onRequestEnd: {}; onRequestStart<LambdaEvent, ExtraParam>(): Promise<void>; }' and '{ logger: any; event: Event | undefined; }'.ts(2365)
*/
type LambdaEvent = { hello: string; world: string };
type ExtraParam = { extraThing: string };
const toolkit = createToolkit('test');

const runnerFn = toolkit.create(GenericHandler, {
  onRequestEnd: async ({ logger }) => {
    logger.log(`execution ended at [${Date.now()}]`);
  },
  async onRequestStart<LambdaEvent, ExtraParam, {extraThing: string}>({ logger, event }) => {
    logger.log(`execution started at [${Date.now()}]`);
    return { extraThing: 'hello' } as ExtraParam;
  },
});

export const handler = runnerFn<LambdaEvent, string, ExtraParam>(
  async ({ event, extraThing }) => {
    return event.hello;
  }
);
