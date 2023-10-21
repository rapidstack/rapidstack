/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Context } from 'aws-lambda';

import type { Cache, Logger } from '../../common/index.js';
import type { ICreatable } from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';

export interface IGenericHandler extends ICreatable {
  <Event, Result>(
    runner: (params: {
      Logger: Logger;
      cache: Cache;
      context: Context;
      event: Event;
    }) => Promise<Result>
  ): LambdaEntryPoint<Event, Result>;
}

/**
 *
 * @param logger the logger instance passed from the factory
 * @param cache the cache instance passed from the factory
 * @returns a runner function that wraps the lambda entry point
 */
export function GenericHandler(logger: Logger, cache: Cache) {
  return <
    Event,
    Result,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Extra extends Record<string, any> = Record<string, any>,
  >(
    runner: (
      props: {
        Logger: Logger;
        cache: Cache;
        context: Context;
        event: Event;
      } & Extra
    ) => Promise<Result>
  ) => {
    return async (event: Event, context: Context): Promise<Result> => {
      return await runner({
        Logger: logger,
        cache,
        context,
        event,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    };
  };
}
