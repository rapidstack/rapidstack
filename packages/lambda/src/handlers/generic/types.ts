/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Context } from 'aws-lambda';

import { type ICache, type ILogger } from '../../index.js';

type CommonHookUtils = {
  cache: ICache;
  context: Context;
  logger: ILogger;
};

export type CommonHookProps<Event> = {
  event: Event;
} & CommonHookUtils;

export type AmbiguousEventHookProps<Event> = {
  event: Partial<Event> | null | undefined;
} & CommonHookUtils;

export type OnErrorHookProps<Event> = {
  error: unknown;
} & CommonHookProps<Event>;

export type OnRequestEndHookProps<Event, Return> = {
  result: Return;
} & CommonHookProps<Event>;

export type GenericHandlerWrapperOptions<
  Event,
  Return,
  ExtraParams extends Record<string, any> | undefined,
> = {
  /**
   * In the case this is the first invocation since the lambda container was
   * spun up, this function, if supplied, will be called to handle the cold
   * start. It does not interrupt the critical path of the lambda and can't be
   * used to alter the execution.
   *
   * _Note: If the `onHotFunctionTrigger` function is supplied,
   * this function will not be called._
   * @returns {void}
   */
  onColdStart?: (params: AmbiguousEventHookProps<Event>) => Promise<void>;
  /**
   * If an error is thrown in the runnerFunction, this function, if supplied,
   * will be called to handle the error.
   * @returns {Return} A response object to return to the caller.
   */
  onError?: (params: OnErrorHookProps<Event>) => Promise<Return>;
  /**
   * If the lambda is configured to be a "hot function", this routine is called
   * to handle resources that need to be kept warm.
   *
   * _Note: If this function is supplied, the `onColdStart` function will not be
   * called._
   * @returns {void}
   */
  onHotFunctionTrigger?: (params: CommonHookUtils) => Promise<void>;
  /**
   * A function to run right before the Lambda container calls SIGTERM on the
   * node process. Can be used to safely wind down any resources that need to be
   * shut down before the process is terminated.
   * @returns {void}
   */
  onLambdaShutdown?: () => Promise<void>;
  /**
   * A function to run after the main lambda handler function is called.
   * Receives the result of the main function and can be used to transform the
   * result before returning it to the caller or trigger an early exit by
   * supplying a function that returns a valid response.
   *
   * Anything thrown in this function will be caught and handled by the
   * `onError` function, if supplied.
   */
  onRequestEnd?: (
    params: OnRequestEndHookProps<Event, Return>
  ) => Promise<(() => Return) | void>;
  /**
   * A function to run before the main lambda handler function is called. Can be
   * used to transform and/or enrich the main function's parameters by returning
   * an object with the desired parameters, or trigger an early exit by
   * supplying a function that returns a valid response.
   *
   * Anything thrown in this function will be caught and handled by the
   * `onError` function, if supplied.
   */
  onRequestStart?: (
    params: AmbiguousEventHookProps<Event>
  ) => Promise<(() => Return) | ExtraParams>;
};

export type HandlerParams<
  Event,
  Extra extends Record<string, any> | undefined,
> = {
  cache: ICache;
  context: Context;
  event: Event;
  logger: ILogger;
} & Extra;
