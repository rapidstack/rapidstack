import { type Context } from 'aws-lambda';

import { type ICache, type ILogger } from '../../common/index.js';
import { type ICreatableConfig } from '../../toolkit/index.js';

type CommonHookUtils = {
  cache: ICache;
  context: Context;
  logger: ILogger;
};

export type CommonHookProps<Event> = {
  event: Event;
} & CommonHookUtils;

export type OnErrorHookProps<Event> = {
  error: unknown;
} & CommonHookProps<Event>;

export type OnRequestEndHookProps<Event, Return> = {
  result: Return;
} & CommonHookProps<Event>;

export interface GenericHandlerConfig extends ICreatableConfig {
  /**
   * If the lambda is cold started, this function, if supplied, will be called
   * to handle the cold start. It does not interrupt the critical path of the
   * lambda and can't be used to alter the execution.
   *
   * _Note: If the `onHotFunctionTrigger` function is supplied,
   * this function will not be called._
   * @returns {void}
   */
  onColdStart?: <Event>(params: CommonHookProps<Event>) => Promise<void>;
  /**
   * If an error is thrown in the runnerFunction, this function, if supplied,
   * will be called to handle the error.
   * @returns {ResultT} A response object to return to the caller.
   */
  onError?: <Event, Return>(params: OnErrorHookProps<Event>) => Promise<Return>;
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
  onRequestEnd?: <Event, Return>(
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
  onRequestStart?: <Event, Return, Extra>(
    params: CommonHookProps<Event>
  ) => Promise<(() => Return) | Extra>;
}

export const genericHandlerLifecycle = async <
  Event,
  Return,
  Extra extends Record<string, any> | undefined,
>({
  cache,
  context,
  event,
  functionToRun,
  logger,
  name,
  options,
}: {
  cache: ICache;
  context: Context;
  event: Event;
  functionToRun: (
    logger: ILogger,
    event: Event,
    context: Context,
    extra?: Extra
  ) => Promise<Return>;
  logger: ILogger;
  name: string;
  options?: GenericHandlerConfig;
}): Promise<Return> => {
  let result;
  try {
    // On request start
    let optionalHandlerArgsOrReturnFn: (() => Return) | Record<string, any> =
      {};
    if (options?.onRequestStart) {
      optionalHandlerArgsOrReturnFn =
        (await options.onRequestStart<Event, Return, Extra>({
          cache,
          context,
          event,
          logger: logger.child({
            hierarchicalName: `${name}:onRequestStart`,
          }),
        })) || ({} as Record<string, any>);
      if (typeof optionalHandlerArgsOrReturnFn === 'function')
        return optionalHandlerArgsOrReturnFn();
    }

    // Runner function
    result = await functionToRun(
      logger.child({
        hierarchicalName: `${name}:exeFn`,
      }),
      event,
      context,
      (optionalHandlerArgsOrReturnFn as Extra) ?? ({} as Extra)
    );

    return result;
  } finally {
    console.log(logger, name, result);
  }
};
