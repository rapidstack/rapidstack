import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import type { ICache, ILogger, RouteResolver } from '../../index.js';
import type {
  ApiFailResponse,
  ApiHandlerReturn,
  TypeSafeApiHandlerOptions,
  TypedApiRouteConfig,
} from './types.js';

import { HttpErrorExplanations } from '../../api/constants.js';
import { HttpError, HttpValidationError } from '../../api/http-errors.js';
import {
  EnvKeys,
  HandlerExecuteError,
  PerformanceKeys,
  getFlattenedSchemaInfo,
} from '../../index.js';

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
      'A hot function trigger was received, but no onHotFunctionTrigger handler was provided.';
    logger.fatal(message);
    throw new HandlerExecuteError(message);
  }

  // Prevent the cold start handler from running on subsequent invocations
  delete process.env[EnvKeys.COLD_START];

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
  routeResolver: RouteResolver;
  routes: TypedApiRouteConfig;
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
    routeResolver,
    routes,
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

    // Resolve the route and execute it
    const route = routeResolver(event, routes);

    if (!route) throw new HttpError(404);

    performance.mark(PerformanceKeys.ROUTE_START);
    result = await route({
      cache,
      context,
      event,
      logger: logger.child({
        hierarchicalName: 'exe-fn',
      }),
    }).catch((err) => {
      performance.mark(PerformanceKeys.ROUTE_END);
      throw err;
    });
    performance.mark(PerformanceKeys.ROUTE_END);

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

    result = defaultErrorHandler(err);
    return result;
  } finally {
    logger.trace({ msg: 'Finished request execution.', result });
  }
};

/**
 * Handles non-http errors
 * @param error The error to handle
 * @returns The handler return object
 * @throws {HandlerExecuteError} If the error is not an instance of Error
 */
function defaultErrorHandler(error: unknown): ApiHandlerReturn {
  // Standard handling of an HTTP errors
  if (error instanceof HttpError && error.code < 500) {
    return default4xxErrorResponder(error);
  }

  // Standard handling of valibot errors
  if (error instanceof HttpValidationError) {
    return defaultValidationErrorResponder(error);
  }

  // Handling of bad errors (not an instance of Error)
  throw new HandlerExecuteError(
    'An error occurred attempting to execute the lambda handler:' +
      error?.toString()
  );
}

/**
 * Provides a standard response for HTTP 4xx errors
 * @param error A HttpError instance
 * @returns The handler return object
 */
function default4xxErrorResponder(error: HttpError): ApiHandlerReturn {
  return {
    body: {
      data: {
        description: HttpErrorExplanations[error.code].message,
        title: HttpErrorExplanations[error.code].name,
      },
      status: 'fail',
    },
    statusCode: error.code,
  };
}

/**
 * Handles a valibot validation error
 * @param error A HttpValidationError instance
 * @returns The handler return object
 */
function defaultValidationErrorResponder(
  error: HttpValidationError
): ApiHandlerReturn {
  let description = '';

  Object.entries(error.validationErrors).forEach(
    ([category, [err, schema, hasInput]], index) => {
      description += `The ${category} failed validation.\n`;
      const hasErrorDescriptions = err.issues.some(
        ({ message }) => message !== 'Invalid type'
      );

      if (hasErrorDescriptions || !hasInput) {
        description += 'Parser error messages: \n';
      }

      if (!hasInput) {
        description += `  - No ${category} data was provided for this request\n`;
      }

      if (hasErrorDescriptions) {
        for (const issue of err.issues) {
          if (issue.message === 'Invalid type') continue;
          description += `  - ${issue.message}\n`;
        }
      }

      description +=
        'Expected schema: \n' + getFlattenedSchemaInfo(schema, category);
      if (index !== Object.keys(error.validationErrors).length - 1) {
        description += '\n\n';
      }
    }
  );
  return {
    body: {
      data: {
        description,
        title: error.message,
      },
      status: 'fail',
    } as ApiFailResponse,
    statusCode: 400,
  } as ApiHandlerReturn;
}
