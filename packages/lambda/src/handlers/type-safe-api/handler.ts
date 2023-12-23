/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

import type { HttpCodes } from '../../api/index.js';
import type {
  CreatableUtils,
  ICreatableConfig,
  ICreatableReturn,
} from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';
import type {
  ApiHandlerReturn,
  ResponseContext,
  TypeSafeApiHandlerHooks,
  TypedApiRouteConfig,
} from './types.js';
import type { BaseApiRouteProps } from './types.js';

import { default5xxErrorHandler } from '../../api/index.js';
import { HandlerExecuteError } from '../../common/index.js';
import {
  createRequestContext,
  getApiHandlerPerformance,
  isHotFunctionTrigger,
  isInvalidApiEvent,
  markHandlerEnd,
  markHandlerStart,
} from '../../utils/index.js';
import { handleHotFunctionHook, handleShutdownHook } from '../shared/index.js';
import { handleRequestHooks } from './lifecycle.js';

export type RouteResolver = (
  event: APIGatewayProxyEventV2,
  routes: TypedApiRouteConfig
) => ((params: BaseApiRouteProps) => Promise<ApiHandlerReturn>) | undefined;

interface TypeSafeApiHandlerReturn extends ICreatableReturn {
  (
    routes: TypedApiRouteConfig,
    hooks?: TypeSafeApiHandlerHooks
  ): LambdaEntryPoint<APIGatewayProxyEventV2, APIGatewayProxyResultV2 | void>;
}

type PrivateResponseContext = ResponseContext & {
  _conclusion: 'failure' | 'success';
  _statusCode: HttpCodes;
};

export interface TypeSafeApiHandlerConfig extends ICreatableConfig {
  devMode?: true;
  name?: `${string}Handler`;

  // Other ideas
  // basePath?: string;
  // msTimeoutBudget?: number;
  // openApiRoute?: true;
  // respectMethodOverrideHeader?: true;
}

export const TypeSafeApiHandler = (
  utils: CreatableUtils,
  config?: TypeSafeApiHandlerConfig
): TypeSafeApiHandlerReturn => {
  const { cache, logger: _log } = utils;
  const { name } = config ?? {};

  return (routes, hooks) => async (event, context) => {
    markHandlerStart();
    const responseContext: PrivateResponseContext = {
      _conclusion: 'success',
      _statusCode: 200,
      cookies: {},
      headers: { 'content-type': 'application/json' },
    };

    const logger = _log.child({
      '@r': createRequestContext(event, context),
      'hierarchicalName': name ?? 'TypeSafeApiHandler (unnamed)',
    });

    const commonUtils = {
      cache,
      context,
      devMode: !!config?.devMode,
      event,
      logger,
      responseContext,
      routes,
    };

    const isHotTrigger = isHotFunctionTrigger(event);
    const isInvalidEvent = isInvalidApiEvent(event);
    handleShutdownHook(hooks?.onLambdaShutdown, logger);

    // outer try/catch to determine conclusion for the summary log
    try {
      if (isHotTrigger) {
        return await handleHotFunctionHook({
          onHotFunctionTrigger: hooks?.onHotFunctionTrigger,
          utils: commonUtils,
        });
      }

      if (isInvalidEvent) {
        throw new HandlerExecuteError('event must be a valid API event object');
      }

      const result = await handleRequestHooks({
        onError: hooks?.onError,
        onRequestEnd: hooks?.onRequestEnd,
        onRequestStart: hooks?.onRequestStart,
        utils: commonUtils,
      });

      if (typeof result === 'function') return result();

      // Format the result for Lambda's expected API response shape
      responseContext._statusCode = result.statusCode ?? 200;
      return makeApiGatewayResponse(result, responseContext);
    } catch (err) {
      responseContext._conclusion = 'failure';
      responseContext._statusCode = err?.code ?? 500;

      logger.fatal({
        err,
        msg: 'An error occurred attempting to execute the lambda handler',
      });

      // This is a non-http related event and the error needs to be made a
      // explicit "failure" in the console.
      if (isHotTrigger || isInvalidEvent) throw err;

      // If some other error is thrown, log it and return a generic 500
      const body = default5xxErrorHandler(
        err,
        config?.devMode ?? false,
        context
      );

      return makeApiGatewayResponse({ body }, responseContext);
    } finally {
      markHandlerEnd();

      const clientUnix = (event as any)?.headers?.['x-perf-unix'];
      const gatewayUnix = (event as any)?.requestContext?.timeEpoch;
      const durations = getApiHandlerPerformance(clientUnix, gatewayUnix);

      const summary = {
        conclusion: responseContext._conclusion,
        statusCode: responseContext._statusCode,
        ...durations,
      } as Parameters<typeof logger.summary>[0];

      if (!isHotTrigger && !isInvalidEvent) {
        summary.route =
          event.requestContext.domainName + event.requestContext.http.path;
      }

      logger.summary(summary);
      logger.end();
    }
  };
};

/**
 * Builds an APIGatewayProxyResultV2 from the result object and response context
 * object.
 * @param result the result object from the route handler function
 * @param responseContext the response context object that originates from the
 * handler
 * @returns an APIGatewayProxyResultV2
 */
function makeApiGatewayResponse(
  result: ApiHandlerReturn,
  responseContext: PrivateResponseContext
): APIGatewayProxyResultV2 {
  const response: APIGatewayProxyResultV2 = {
    body: JSON.stringify(result.body),
    headers: {
      ...responseContext.headers,
      ...result.headers,
    },
    statusCode: responseContext._statusCode,
  };

  response.cookies = buildCookiesFromObject({
    ...responseContext.cookies,
    ...result.cookies,
  });

  return response;
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
  if (Object.keys(cookieObject).length === 0) return undefined;

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
