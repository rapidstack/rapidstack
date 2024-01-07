/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context } from 'aws-lambda';

import type { ICache, ILogger } from '../../index.js';
import type { GenericHandlerWrapperOptions, HandlerParams } from './types.js';

import { HandlerExecuteError } from '../../index.js';

type RequestHooks<Event, Return> = {
  cache: ICache;
  context: Context;
  event: Event;
  logger: ILogger;
  onError?: GenericHandlerWrapperOptions<Event, Return, any>['onError'];
  onRequestEnd?: GenericHandlerWrapperOptions<
    Event,
    Return,
    any
  >['onRequestEnd'];
  onRequestStart?: GenericHandlerWrapperOptions<
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
          msg: 'The error caught to be processed by the handler onError hook is not an instance of an Error. This is preferred for troubleshooting.',
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
      `An error occurred attempting to execute the lambda handler: ${err.toString()}`
    );
  } finally {
    logger.trace({ msg: 'Finished request execution.', result });
  }
};
