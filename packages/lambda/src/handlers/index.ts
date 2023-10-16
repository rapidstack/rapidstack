import { type Context } from 'aws-lambda';

export * from './generic/handler.js';

export type LambdaEntryPoint<Event, Result> = (
  event: Event,
  context: Context
) => Promise<Result>;
