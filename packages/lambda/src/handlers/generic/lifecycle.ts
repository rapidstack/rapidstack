import { type Context } from 'aws-lambda';

import { type Logger } from '../../common/index.js';
import { type ICreatableOptions } from '../../toolkit/index.js';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ExtraParams extends Record<string, any> = Record<string, any>,
  >(params: {
    context: Context;
    event: Event;
    logger: Logger;
  }) => Promise<(() => Result) | ExtraParams>;
}
