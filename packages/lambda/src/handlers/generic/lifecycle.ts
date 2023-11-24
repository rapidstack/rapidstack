/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context } from 'aws-lambda';

import {
  COLD_START,
  HandlerExecuteError,
  type ICache,
  type ILogger,
} from '../../common/index.js';
import {
  type GenericHandlerWrapperOptions,
  type HandlerParams,
} from './types.js';

export const handleShutdownHook = (
  hook: GenericHandlerWrapperOptions<Event, any, any>['onLambdaShutdown'],
  logger: ILogger
): void => {
  if (!hook) return;

  const child = logger.child({
    hierarchicalName: 'handler-hook:onLambdaShutdown',
  });
  process.on('SIGTERM', async () => {
    try {
      child.trace({ msg: 'Starting.' });
      await hook();
      child.trace({ msg: 'Finished.' });
    } catch (err) {
      child.fatal({ err, msg: 'An error occurred.' });
    }
  });
};

type HotFunctionHook<Event, Return> = {
  cache: ICache;
  context: Context;
  event: unknown;
  logger: ILogger;
  onHotFunctionTrigger: GenericHandlerWrapperOptions<
    Event,
    Return,
    any
  >['onHotFunctionTrigger'];
};
export const handleHotFunctionHook = async <Event, Return>(
  props: HotFunctionHook<Event, Return>
): Promise<Return> => {
  const { cache, context, logger, onHotFunctionTrigger } = props;
  if (!onHotFunctionTrigger) {
    const message =
      'A hot function trigger was received, but no onHotFunctionTrigger \
      handler was provided.';
    logger.fatal(message);
    throw new HandlerExecuteError(message);
  }

  // Prevent the cold start handler from running on subsequent invocations
  // eslint-disable-next-line security/detect-object-injection
  delete process.env[COLD_START];

  const hotFunctionTriggerLogger = logger.child({
    hierarchicalName: 'handler-hook:onHotFunctionTrigger',
  });
  try {
    return (await onHotFunctionTrigger({
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
};

type ColdStartHook<Event> = {
  cache: ICache;
  context: Context;
  event: Event;
  logger: ILogger;
  onColdStart: GenericHandlerWrapperOptions<Event, any, any>['onColdStart'];
};
export const handleColdStartHook = async <Event>(
  props: ColdStartHook<Event>
): Promise<void> => {
  // eslint-disable-next-line security/detect-object-injection
  if (!process.env[COLD_START]) return;

  // Prevent the cold start handler from running on subsequent invocations
  // eslint-disable-next-line security/detect-object-injection
  delete process.env[COLD_START];

  const { cache, context, event, logger, onColdStart } = props;

  const coldStartTriggerLogger = logger.child({
    hierarchicalName: 'handler-hook:onColdStart',
  });

  if (onColdStart) {
    try {
      await onColdStart({
        cache,
        context,
        event,
        logger: coldStartTriggerLogger,
      });
    } catch (error) {
      coldStartTriggerLogger.error({ error, msg: 'An error occurred' });
      // Nothing to throw here. Not the caller's concern.
    }
  }
};

type RequestHooks<Event, Return> = {
  cache: ICache;
  context: Context;
  event: Event;
  logger: ILogger;
  onError: GenericHandlerWrapperOptions<Event, Return, any>['onError'];
  onRequestEnd: GenericHandlerWrapperOptions<
    Event,
    Return,
    any
  >['onRequestEnd'];
  onRequestStart: GenericHandlerWrapperOptions<
    Event,
    Return,
    any
  >['onRequestStart'];
  runnerFunction: (params: HandlerParams<Event, any>) => Promise<Return>;
};
export const handleRequestHooks = async <Event, Return, Extra>(
  props: RequestHooks<Event, Return>
): Promise<Return> => {
  const {
    cache,
    context,
    event,
    logger,
    onError,
    onRequestEnd,
    onRequestStart,
    runnerFunction,
  } = props;

  logger.trace({ context, event, msg: 'Starting request execution.' });

  // The following are handled by the onError handler (critical path)
  let result;
  try {
    let optionalHandlerArgsOrReturnFn: (() => Return) | Record<string, any> =
      {};
    const preRequestTriggerLogger = logger.child({
      hierarchicalName: 'handler-hook:onRequestStart',
    });

    if (onRequestStart) {
      optionalHandlerArgsOrReturnFn =
        (await onRequestStart({
          cache,
          context,
          event,
          logger: preRequestTriggerLogger,
        })) || ({} as Record<string, any>);

      if (typeof optionalHandlerArgsOrReturnFn === 'function') {
        result = optionalHandlerArgsOrReturnFn() as Return;
        return result;
      }
    }

    result = await runnerFunction({
      cache,
      context,
      event,
      logger: logger.child({
        hierarchicalName: 'exe-fn',
      }),
      ...(optionalHandlerArgsOrReturnFn as Extra),
    });

    // On request end
    if (onRequestEnd) {
      const optionalReturnFnOrUndefined = (await onRequestEnd({
        cache,
        context,
        event,
        logger: logger.child({
          hierarchicalName: 'handler-hook:onRequestEnd',
        }),
        result,
      })) as (() => Return) | Return;
      if (typeof optionalReturnFnOrUndefined === 'function') {
        result = (optionalReturnFnOrUndefined as () => Return)();
      }
    }

    return result;
  } catch (err) {
    if (onError) {
      if (!(err instanceof Error)) {
        logger.warn({
          err,
          msg: 'The error caught to be processed by the handler onError hook \
          is not an instance of an Error. This is preferred for \
          troubleshooting.',
        });
      }

      result = await onError({
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
    logger.trace({ msg: 'Finished request execution.', result });
  }
};
