/* eslint-disable @typescript-eslint/no-explicit-any */
import { type APIGatewayProxyEventV2, type Context } from 'aws-lambda';

import {
  HandlerExecuteError,
  type ICache,
  type ILogger,
} from '../../common/index.js';
import { type CreatableUtils, getApiGatewayHeaderValue } from '../../index.js';

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

type LifecycleWrapperParams<
  Event,
  Return,
  Extra extends Record<string, any> | undefined,
> = {
  context: Context;
  event: Event;
  fn: (params: HandlerParams<Event, Extra>) => Promise<Return>;
  name?: string;
  options?: GenericHandlerWrapperOptions<Event, Return, Extra>;
  utils: CreatableUtils;
};

type HandlerParams<Event, Extra extends Record<string, any> | undefined> = {
  cache: ICache;
  context: Context;
  event: Event;
  logger: ILogger;
} & Extra;

export const genericHandlerLifecycleWrapper = async <
  Event,
  Return,
  Extra extends Record<string, any> | undefined,
>(
  params: LifecycleWrapperParams<Event, Return, Extra>
): Promise<Return> => {
  const { context, event, fn, name, options, utils } = params;
  const { cache } = utils;
  const logger = utils.logger.child({
    '@r': resolvePossibleRequestIds(event, context),
    'hierarchicalName': name ?? 'GenericHandler (unnamed)',
  });

  /**
   * Handle the events from the optional lifecycle hooks in the following order:
   * - On lambda shutdown (register a handler for SIGTERM)
   * - Hot function trigger (not interact with the onError or onColdStart hooks)
   * - Cold start trigger (not interact with the onError hook)
   * - On request start
   * - Runner function
   * - On request end
   */
  if (options?.onLambdaShutdown) {
    const shutdownLogger = logger.child({
      hierarchicalName: 'handler-hook:onLambdaShutdown',
    });
    process.on('SIGTERM', async () => {
      try {
        await options.onLambdaShutdown?.();
      } catch (err) {
        shutdownLogger.fatal({ err, msg: 'An error occurred' });
      }
    });
  }

  if ((event as any)?.['__RAPIDSTACK_HOT_FUNCTION_TRIGGER__']) {
    if (!options?.onHotFunctionTrigger) {
      const message =
        'A hot function trigger was received, but no onHotFunctionTrigger \
        handler was provided.';
      logger.fatal(message);
      throw new HandlerExecuteError(message);
    }

    // Prevent the cold start handler from running on subsequent invocations
    delete process.env.RAPIDSTACK_COLD_START;

    const hotFunctionTriggerLogger = logger.child({
      hierarchicalName: 'handler-hook:onHotFunctionTrigger',
    });
    try {
      return (await options.onHotFunctionTrigger({
        cache,
        context,
        logger: hotFunctionTriggerLogger,
      })) as Return;
    } catch (err) {
      hotFunctionTriggerLogger.fatal({ err, msg: 'An error occurred' });
      throw new HandlerExecuteError(
        'An error occurred in the onHotFunctionTrigger handler.'
      );
    }
  }

  if (process.env.RAPIDSTACK_COLD_START) {
    // Prevent the cold start handler from running on subsequent invocations
    delete process.env.RAPIDSTACK_COLD_START;

    const coldStartTriggerLogger = logger.child({
      hierarchicalName: 'handler-hook:onHotFunctionTrigger',
    });

    if (options?.onColdStart) {
      try {
        await options.onColdStart({
          cache,
          context,
          event,
          logger: coldStartTriggerLogger,
        });
      } catch (error) {
        coldStartTriggerLogger.fatal({ error, msg: 'An error occurred' });
        // Nothing to throw here. Not the caller's concern.
      }
    }
  }

  logger.trace({ context, event, msg: 'Starting handler execution' });

  // The following are handled by the onError handler (critical path)
  let result;
  try {
    let optionalHandlerArgsOrReturnFn: (() => Return) | Record<string, any> =
      {};
    const preRequestTriggerLogger = logger.child({
      hierarchicalName: 'handler-hook:onRequestStart',
    });

    if (options?.onRequestStart) {
      optionalHandlerArgsOrReturnFn =
        (await options.onRequestStart({
          cache,
          context,
          event,
          logger: preRequestTriggerLogger,
        })) || ({} as Record<string, any>);

      if (typeof optionalHandlerArgsOrReturnFn === 'function')
        return optionalHandlerArgsOrReturnFn() as Return;
    }

    // Runner function
    result = await fn({
      cache,
      context,
      event,
      logger: logger.child({
        hierarchicalName: 'exe-fn',
      }),
      ...(optionalHandlerArgsOrReturnFn as Extra),
    });

    // On request end
    if (options?.onRequestEnd) {
      result = (await options.onRequestEnd({
        cache,
        context,
        event,
        logger: logger.child({
          hierarchicalName: 'handler-hook:onRequestEnd',
        }),
        result,
      })) as (() => Return) | Return;
      if (typeof result === 'function') return (result as () => Return)();
    }

    return result;
  } catch (err) {
    if (options?.onError) {
      if (!(err instanceof Error)) {
        logger.warn({
          err,
          msg: `The error caught to be processed by the ${name} onError hook \
          is not an instance of an Error. This is preferred for \
          troubleshooting.`,
        });
      }

      result = await options.onError({
        cache,
        context,
        error: err,
        event,
        logger: logger.child({
          hierarchicalName: 'handler-hook:onError',
        }),
      });
      return result;
    }

    // else: Standard handling of an error without an onError handler
    throw new HandlerExecuteError(
      `An error occurred attempting to execute the lambda handler: \
      ${err.toString()}`
    );
  } finally {
    logger.trace('Finished handler execution');
  }
};

// TODO: MODE
const resolvePossibleRequestIds = (event: unknown, context: Context) => {
  const ids = {
    lambdaRequestId: context.awsRequestId,
  } as Record<string, string>;
  if (typeof event !== 'object') return ids;

  const requestHeaderId = getApiGatewayHeaderValue(
    event as APIGatewayProxyEventV2,
    'x-request-id'
  );
  const amznTraceId = getApiGatewayHeaderValue(
    event as APIGatewayProxyEventV2,
    'x-amzn-trace-id'
  );

  if (requestHeaderId) ids['x-request-id'] = requestHeaderId;
  if (amznTraceId) ids['x-amzn-trace-id'] = amznTraceId;

  return ids;
};
