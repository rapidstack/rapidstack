import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';

import { performance } from 'node:perf_hooks';

import type {
  CreatableUtils,
  ICreatableConfig,
  ICreatableReturn,
} from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';
import type {
  ApiErrorResponseDev,
  ApiErrorResponseNoDev,
  ApiHandlerReturn,
  TypeSafeApiHandlerOptions,
  TypedApiRouteConfig,
} from './types.js';
import type { BaseApiRouteProps } from './validator.js';

import { HttpErrorExplanations } from '../../api/constants.js';
import { HttpError } from '../../api/http-errors.js';
import { resolveRoute } from '../../api/index.js';
import {
  HOT_FUNCTION_TRIGGER,
  HandlerExecuteError,
  PerformanceKeys,
} from '../../common/index.js';
import {
  getHandlerPerformance,
  resolvePossibleRequestIds,
} from '../../utils/index.js';
import { handleHotFunctionHook, handleRequestHooks } from './lifecycle.js';
import { handleShutdownHook } from '../generic/lifecycle.js';

export type RouteResolver = (
  event: APIGatewayProxyEventV2,
  routes: TypedApiRouteConfig
) => ((params: BaseApiRouteProps) => Promise<ApiHandlerReturn>) | undefined;

interface TypeSafeApiHandlerReturn extends ICreatableReturn {
  (
    routes: TypedApiRouteConfig,
    options?: TypeSafeApiHandlerOptions
  ): LambdaEntryPoint<APIGatewayProxyEventV2, APIGatewayProxyResultV2 | void>;
}

export interface TypeSafeApiHandlerConfig extends ICreatableConfig {
  basePath?: string;
  devMode?: true;
  msTimeoutBudget?: number;
  name?: `${string}Handler`;
  // openApiRoute?: true;
  respectMethodOverrideHeader?: true;
  routeResolver?: RouteResolver;
}

export const TypeSafeApiHandler = (
  utils: CreatableUtils,
  config?: TypeSafeApiHandlerConfig
): TypeSafeApiHandlerReturn => {
  const { cache, logger: _log } = utils;
  const { name } = config ?? {};

  return (routes, options) => async (event, context) => {
    performance.mark(PerformanceKeys.HANDLER_START);
    let conclusion = 'success' as 'failure' | 'success';

    const {
      onError,
      onHotFunctionTrigger,
      onRequestEnd,
      onRequestStart,
      onLambdaShutdown,
    } = options ?? {};

    const logger = _log.child({
      '@r': resolvePossibleRequestIds(event, context),
      'hierarchicalName': name ?? 'TypeSafeApiHandler (unnamed)',
    });

    const isHotTrigger =
      typeof event === 'object' &&
      // eslint-disable-next-line security/detect-object-injection
      !!(event as unknown as { [k: string]: unknown })[HOT_FUNCTION_TRIGGER];

    const isInvalidApiEvent =
      typeof event !== 'object' || !Boolean(event.requestContext);

    // outer try/catch to determine conclusion for the summary log
    try {
      handleShutdownHook(onLambdaShutdown, logger);
      if (isHotTrigger) {
        return await handleHotFunctionHook({
          cache,
          context,
          event,
          logger,
          onHotFunctionTrigger,
        });
      }

      if (isInvalidApiEvent) {
        throw new HandlerExecuteError('event must be a valid API event object');
      }

      const result = await handleRequestHooks({
        cache,
        context,
        event,
        logger,
        onError,
        onRequestEnd,
        onRequestStart,
        routeResolver: config?.routeResolver ?? resolveRoute,
        routes,
      });

      const cookies = buildCookiesFromObject(result.cookies);

      const response: APIGatewayProxyResultV2 = {
        body:
          typeof result.body === 'string'
            ? result.body
            : JSON.stringify(result.body),
        headers: {
          ...result.headers,
        },
        statusCode: result.statusCode ?? 200,
      };

      if (result.body) {
        switch (typeof result.body) {
          case 'object':
            response.headers!['content-type'] = 'application/json';
            break;
          case 'string':
            if (result.body.startsWith('<!DOCTYPE html>')) {
              response.headers!['content-type'] = 'text/html';
              break;
            }
            response.headers!['content-type'] = 'text/plain';
            break;
        }
      }

      if (cookies) response.cookies = cookies;

      // Format the result for Lambda's expected API response shape
      return response;
    } catch (err) {
      conclusion = 'failure';
      if (isHotTrigger || isInvalidApiEvent) throw err;

      // Format HTTP 5xx errors re-thrown from the route handler
      if (err instanceof HttpError && err.code.toString().startsWith('5')) {
        return makeHttpErrorResponse(err, !!config?.devMode, context);
      }

      // If some other error is thrown, log it and return a generic 500
      logger.fatal({
        err,
        msg: 'An error occurred attempting to execute the lambda handler',
      });
      return makeOtherErrorResponse(err, !!config?.devMode, context);
    } finally {
      performance.mark(PerformanceKeys.HANDLER_END);
      const { duration } = getHandlerPerformance();

      const summary = {
        conclusion,
        duration,
      } as Parameters<typeof logger.summary>[0];
      if (!isHotTrigger) {
        summary.route =
          event?.requestContext?.domainName + event?.requestContext?.http?.path;
      }
      logger.summary(summary);
      logger.end();
    }
  };
};

/**
 * Formats an error response for HTTP 5xx errors.
 * @param err the thrown error
 * @param devMode if the handler is configured to run in dev mode
 * @param context lambda context
 * @returns an APIGatewayProxyResultV2
 */
function makeHttpErrorResponse(
  err: HttpError,
  devMode: boolean,
  context: Context
): APIGatewayProxyResultV2 {
  const errOutput: ApiErrorResponseNoDev = {
    data: {
      description: HttpErrorExplanations[err.code]['message'],
      requestId: context.awsRequestId,
      title: HttpErrorExplanations[err.code]['name'],
    },
    status: 'error',
  };
  if (devMode) {
    const errOutputPtr = errOutput as unknown as ApiErrorResponseDev;
    errOutputPtr.data.devMode = true;
    errOutputPtr.data.logGroup = context.logGroupName;
    errOutputPtr.data.error.stackTrace = err.stack?.toString();
    errOutputPtr.data.error.message = err.message;
    errOutputPtr.data.error.cause = err.cause?.toString();
  }

  return {
    body: JSON.stringify(errOutput),
    headers: {
      'content-type': 'application/json',
    },
    statusCode: err.code,
  };
}

/**
 * Formats an error response for non-HTTP errors.
 * @param err the thrown error
 * @param devMode if the handler is configured to run in dev mode
 * @param context lambda context
 * @returns an APIGatewayProxyResultV2
 */
function makeOtherErrorResponse(
  err: unknown,
  devMode: boolean,
  context: Context
): APIGatewayProxyResultV2 {
  const errOutput: ApiErrorResponseNoDev = {
    data: {
      description: HttpErrorExplanations[500]['message'],
      requestId: context.awsRequestId,
      title: HttpErrorExplanations[500]['name'],
    },
    status: 'error',
  };
  if (devMode) {
    const errOutputPtr = errOutput as unknown as ApiErrorResponseDev;
    errOutputPtr.data.devMode = true;
    errOutputPtr.data.logGroup = context.logGroupName;

    if (err instanceof Error) {
      errOutputPtr.data.error.stackTrace = err.stack?.toString();
      errOutputPtr.data.error.message = err.message;
      errOutputPtr.data.error.cause = err.cause?.toString();
    } else {
      errOutputPtr.data.error.message = err?.toString();
    }
  }

  return {
    body: JSON.stringify(errOutput),
    statusCode: 500,
  };
}

// TODO: enhancement: expose handler option for encoding cookies
/**
 * Builds an array of cookie strings from an object of cookies options.
 * @param cookieObject an object of cookie options
 * @returns an array of cookie strings
 */
function buildCookiesFromObject(
  cookieObject: ApiHandlerReturn['cookies']
): string[] | undefined {
  if (!cookieObject) return undefined;

  let cookieString = '';
  const cookiesArray = [];
  for (const cookie in cookieObject) {
    // eslint-disable-next-line security/detect-object-injection
    cookieString = `${cookie}=${cookieObject[cookie].value}`;

    // eslint-disable-next-line security/detect-object-injection
    if (cookieObject[cookie].options) {
      const {
        domain,
        expiresUnix,
        httpOnly,
        maxAge,
        path,
        sameSite,
        secure,
        // eslint-disable-next-line security/detect-object-injection
      } = cookieObject[cookie].options || {};

      if (domain) cookieString += `; Domain=${domain}`;
      if (expiresUnix)
        cookieString += `; Expires=${new Date(expiresUnix).toUTCString()}`;
      if (httpOnly) cookieString += `; HttpOnly`;
      if (maxAge) cookieString += `; Max-Age=${maxAge}`;
      if (path) cookieString += `; Path=${path}`;
      if (sameSite) cookieString += `; SameSite=${sameSite}`;
      if (secure) cookieString += `; Secure`;
    }

    cookiesArray.push(cookieString);
  }

  return cookiesArray;
}
