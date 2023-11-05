import { type Context } from 'aws-lambda';

export * from './generic/handler.js';

export type LambdaEntryPoint<Event, Return> = (
  event: Event,
  context: Context
) => Promise<Return>;
