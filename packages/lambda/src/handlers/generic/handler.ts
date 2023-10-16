/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Context } from 'aws-lambda';

import type { Cache, Logger } from '../../common/index.js';
import type {
  CreateFactory,
  ICreatable,
  ICreatableOptions,
} from '../../toolkit/index.js';
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

export interface IGenericHandlerOptions extends ICreatableOptions {
  /**
   * If the lambda is cold started, this function, if supplied, will be called to handle the cold start.
   * It does not interrupt the critical path of the lambda and can't be used to alter the execution.
   *
   * _Note: If the `onHotFunctionTrigger` function is supplied, this function will not be called._
   * @returns {void}
   */
  onColdStart?: <Event>(params: {
    context: Context;
    event: Event;
    logger: Logger;
  }) => Promise<void>;
  /**
   * If an error is thrown in the runnerFunction, this function, if supplied, will be called to handle the error.
   * @returns {ResultT} A response object to return to the caller.
   */
  onError?: <Event, Result>(params: {
    context: Context;
    error: Error;
    event: Event;
    logger: Logger;
  }) => Promise<Result>;
  /**
   * If the lambda is configured to be a "hot function", this routine is called to handle resources
   * that need to be kept warm.
   *
   * _Note: If this function is supplied, the `onColdStart` function will not be called._
   * @returns {void}
   */
  onHotFunctionTrigger?: <Event>(params: {
    context: Context;
    event: Event;
    logger: Logger;
  }) => Promise<void>;
  /**
   * A function to run right before the Lambda container calls SIGTERM on the node process. Can be used to safely
   * wind down any resources that need to be shut down before the process is terminated.
   * @returns {void}
   */
  onLambdaShutdown?: () => Promise<void>;
  /**
   * A function to run after the main lambda handler function is called. Receives the result of the main function
   * and can be used to transform the result before returning it to the caller or trigger an early exit by supplying
   * a function that returns a valid response.
   *
   * Anything thrown in this function will be caught and handled by the `onError` function, if supplied.
   */
  onRequestEnd?: <Event, Result>(params: {
    context: Context;
    event: Event;
    logger: Logger;
    result: Result;
  }) => Promise<(() => Result) | void>;
  /**
   * A function to run before the main lambda handler function is called. Can be used to transform and/or enrich
   * the main function's parameters by returning an object with the desired parameters, or trigger an early exit
   * by supplying a function that returns a valid response.
   *
   * Anything thrown in this function will be caught and handled by the `onError` function, if supplied.
   */
  onRequestStart?: <
    Event,
    Result,
    ExtraParams extends Record<string, any> = Record<string, any>,
  >(params: {
    context: Context;
    event: Event;
    logger: Logger;
  }) => Promise<(() => Result) | ExtraParams>;
}

/**
 *
 * @param logger the logger instance passed from the factory
 * @param cache the cache instance passed from the factory
 * @param create the factory from the toolkit
 * @param options any options for the handler to use in execution
 * @returns a runner function that wraps the lambda entry point
 */
export function GenericHandler(
  logger: Logger,
  cache: Cache,
  create: CreateFactory,
  options?: IGenericHandlerOptions
) {
  return <
    Event,
    Result,
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
      } as any);
    };
  };
}
