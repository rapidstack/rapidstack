import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import type { ICache, ILogger, RouteResolver } from '../../index.js';
import type {
  ApiFailResponse,
  ApiHandlerReturn,
  ResponseContext,
  TypeSafeApiHandlerHooks,
  TypedApiRouteConfig,
} from './types.js';

import { HttpErrorExplanations } from '../../api/constants.js';
import { HttpError, HttpValidationError } from '../../api/index.js';
import {
  HandlerExecuteError,
  PerformanceKeys,
  getFlattenedSchemaInfo,
} from '../../index.js';

type RequestHooks = {
  cache: ICache;
  context: Context;
  event: APIGatewayProxyEventV2;
  logger: ILogger;
  onError: TypeSafeApiHandlerHooks['onError'];
  onRequestEnd: TypeSafeApiHandlerHooks['onRequestEnd'];
  onRequestStart: TypeSafeApiHandlerHooks['onRequestStart'];
  responseContext: ResponseContext;
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
    responseContext,
    routeResolver,
    routes,
  } = props;

  // TODO: Need to add some redact config to the logger so auth isn't exposed
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
        responseContext,
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
        responseContext,
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
        responseContext,
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
export function defaultErrorHandler(error: unknown): ApiHandlerReturn {
  // Standard handling of an HTTP errors
  if (error instanceof HttpError && error.code < 500) {
    return default4xxErrorResponder(error);
  }

  if (error instanceof HttpError && error.code >= 500) {
    throw error;
  }

  // Standard handling of valibot errors
  if (error instanceof HttpValidationError) {
    return defaultValidationErrorResponder(error);
  }

  // Handling of bad errors (not an instance of Error)
  throw new HandlerExecuteError(
    'An error occurred attempting to execute the lambda handler: ' +
      error?.toString()
  );
}

/**
 * Provides a standard response for HTTP 4xx errors
 * @param error A HttpError instance
 * @returns The handler return object
 */
export function default4xxErrorResponder(error: HttpError): ApiHandlerReturn {
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
export function defaultValidationErrorResponder(
  error: HttpValidationError
): ApiHandlerReturn {
  let text = '';

  Object.entries(error.validationErrors).forEach(
    ([category, [err, schema, hasInput]], index) => {
      text += `The ${category} failed validation.\n`;
      const hasErrorDescriptions = err.issues.some(
        ({ message }) => message !== 'Invalid type'
      );

      if (hasErrorDescriptions || !hasInput) {
        text += 'Parser error messages: \n';
      }

      if (!hasInput) {
        text += `  - No ${category} data was provided for this request\n`;
      }

      if (hasErrorDescriptions) {
        for (const issue of err.issues) {
          if (issue.message === 'Invalid type') continue;
          text += `  - ${issue.message}\n`;
        }
      }

      text += 'Expected schema: \n' + getFlattenedSchemaInfo(schema, category);
      if (index !== Object.keys(error.validationErrors).length - 1) {
        text += '\n\n';
      }
    }
  );
  return {
    body: {
      data: {
        description: text,
        title: error.message,
      },
      status: 'fail',
    } as ApiFailResponse,
    statusCode: 400,
  } as ApiHandlerReturn;
}
