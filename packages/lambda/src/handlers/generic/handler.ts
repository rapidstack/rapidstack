/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Context } from 'aws-lambda';

import type { ICache, ILogger } from '../../common/index.js';
import type {
  CreatableUtils,
  ICreatableConfig,
  ICreatableReturn,
} from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';

export interface GenericHandlerReturn<
  EventT,
  ReturnT,
  ExtraT extends Record<string, any> = Record<string, any>,
> extends ICreatableReturn {
  <Event, Result>(
    runner: (
      params: {
        cache: ICache;
        context: Context;
        event: EventT;
        logger: ILogger;
      } & ExtraT
    ) => Promise<ReturnT>
  ): LambdaEntryPoint<Event, ReturnT>;
}

export interface GenericHandlerConfig<EventT, ReturnT, ExtraT>
  extends ICreatableConfig {
  onRequestStart?: (props: {
    event: EventT;
    logger: ILogger;
  }) => Promise<() => any> | Promise<{} | ExtraT>;
}

/**
 * Creates a generic handler that can be used to wrap a lambda entry point.
 * @param utils the common toolkit utils passed from the factory
 * @param config optional configuration for the generic handler
 * @returns a runner function that wraps the lambda entry point
 */
export const GenericHandler = <
  EventT,
  ReturnT,
  ExtraT extends Record<string, any> = Record<string, any>,
>(
  utils: CreatableUtils,
  config?: GenericHandlerConfig<EventT, ReturnT, ExtraT>
) => {
  return (
    runner: (
      props: {
        cache: ICache;
        context: Context;
        event: Event;
        logger: ILogger;
      } & EventT
    ) => Promise<ReturnT>
  ) => {
    return async (event: Event, context: Context): Promise<ReturnT> => {
      return await runner({
        cache: utils.cache,
        context,
        event,
        logger: utils.logger,
      });
    };
  };
};
