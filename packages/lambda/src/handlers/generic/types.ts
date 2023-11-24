/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context } from 'aws-lambda';

import type { ICache, ILogger } from '../../index.js';

type CommonHookUtils = {
  cache: ICache;
  context: Context;
  logger: ILogger;
};

type CommonHookProps<Event> = {
  event: Event;
} & CommonHookUtils;

type AmbiguousEventHookProps<Event> = {
  event: Partial<Event> | null | undefined;
} & CommonHookUtils;

type OnErrorHookProps<Event> = {
  error: unknown;
} & CommonHookProps<Event>;

type OnRequestEndHookProps<Event, Return> = {
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
   * @param params The parameters passed to the function.
   * @param params.event The ambiguous event object passed to the lambda.
   * @param params.context The context object passed to the lambda.
   * @param params.logger A logger instance with request context.
   * @param params.cache The cache supplied from the toolkit.
   * @returns void
   */
  onColdStart?: (params: AmbiguousEventHookProps<Event>) => Promise<void>;
  /**
   * If an error is thrown in the runnerFunction, pre-request, or post-request
   * hooks, this function, if supplied, will be called to handle the error.
   * @param params The parameters passed to the function.
   * @param params.event The event object passed to the lambda.
   * @param params.error The resulting error caught during lambda execution.
   * @param params.context The context object passed to the lambda.
   * @param params.logger A logger instance with request context.
   * @param params.cache The cache supplied from the toolkit.
   * @returns The expected return type shape for the lambda.
   */
  onError?: (params: OnErrorHookProps<Event>) => Promise<Return>;
  /**
   * If the lambda is configured to be a "hot function", this routine is called
   * to handle resources that need to be kept warm.
   *
   * _Note: If this function is supplied, the `onColdStart` function will not be
   * called._
   * @param params The parameters passed to the function.
   * @param params.context The context object passed to the lambda.
   * @param params.logger A logger instance with request context.
   * @param params.cache The cache supplied from the toolkit.
   * @returns void.
   */
  onHotFunctionTrigger?: (params: CommonHookUtils) => Promise<void>;
  /**
   * A function to run right before the Lambda container calls SIGTERM on the
   * node process. Can be used to safely wind down any resources that need to be
   * shut down before the process is terminated.
   * @returns void.
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
   * @param params The parameters passed to the function.
   * @param params.context The context object passed to the lambda.
   * @param params.logger A logger instance with request context.
   * @param params.cache The cache supplied from the toolkit.
   * @param params.result The result of the main lambda handler function.
   * @param params.event The event object passed to the lambda.
   * @returns The expected return type shape for the lambda.
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
   * @param params The parameters passed to the function.
   * @param params.context The context object passed to the lambda.
   * @param params.logger A logger instance with request context.
   * @param params.cache The cache supplied from the toolkit.
   * @param params.event The ambiguous event object passed to the lambda.
   * @returns The expected return type shape for the lambda.
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
