import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import type { ICache, ILogger } from '../../index.js';
import type { ApiHandlerReturn, TypeSafeApiHandlerOptions } from './types.js';
import type { BaseApiRouteProps } from './validator.js';

import { HttpError } from '../../api/http-errors.js';
import { COLD_START, HandlerExecuteError } from '../../index.js';

type HotFunctionHook = {
  cache: ICache;
  context: Context;
  event: unknown;
  logger: ILogger;
  onHotFunctionTrigger: TypeSafeApiHandlerOptions['onHotFunctionTrigger'];
};
export const handleHotFunctionHook = async (
  props: HotFunctionHook
): Promise<void> => {
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
    return await onHotFunctionTrigger({
      cache,
      context,
      logger: hotFunctionTriggerLogger,
    });
  } catch (err) {
    hotFunctionTriggerLogger.fatal({ err, msg: 'An error occurred' });
    throw new HandlerExecuteError(
      'An error occurred in the onHotFunctionTrigger handler.'
    );
  }
};

type RequestHooks = {
  cache: ICache;
  context: Context;
  event: APIGatewayProxyEventV2;
  logger: ILogger;
  onError: TypeSafeApiHandlerOptions['onError'];
  onRequestEnd: TypeSafeApiHandlerOptions['onRequestEnd'];
  onRequestStart: TypeSafeApiHandlerOptions['onRequestStart'];
  route: (params: BaseApiRouteProps) => Promise<ApiHandlerReturn>;
};
export const handleRequestHooks = async (
  props: RequestHooks
): Promise<ApiHandlerReturn> => {
  const {
    cache,
    context,
    event,
    logger,
    onError,
    onRequestEnd,
    onRequestStart,
    route,
  } = props;

  logger.trace({ context, event, msg: 'Starting request execution.' });

  // The following are handled by the onError handler (critical path)
  let result;
  try {
    let maybeReturnEarly: (() => ApiHandlerReturn) | void;
    const preRequestTriggerLogger = logger.child({
      hierarchicalName: 'handler-hook:onRequestStart',
    });

    if (onRequestStart) {
      maybeReturnEarly = await onRequestStart({
        cache,
        context,
        event,
        logger: preRequestTriggerLogger,
      });

      if (typeof maybeReturnEarly === 'function') {
        result = maybeReturnEarly() as ApiHandlerReturn;
        return result;
      }
    }

    result = await route({
      cache,
      context,
      event,
      logger: logger.child({
        hierarchicalName: 'exe-fn',
      }),
    });

    // On request end
    if (onRequestEnd) {
      const maybeReturnEarly = await onRequestEnd({
        cache,
        context,
        event,
        logger: logger.child({
          hierarchicalName: 'handler-hook:onRequestEnd',
        }),
        result,
      });
      if (typeof maybeReturnEarly === 'function') {
        result = maybeReturnEarly();
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

    // Standard handling of an HTTP errors when no hook is supplied
    else if (err instanceof HttpError) {
      return {
        // TODO:
        // somehow need to make this type ok with error codes while not exposing
        // them as an option for the standard handler return type
        body: {
          status: 'error',
        },
        statusCode: err.code,
      };
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
