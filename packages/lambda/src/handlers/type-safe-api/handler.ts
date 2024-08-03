/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from 'aws-lambda';

import type {
  HttpCodes,
  TypeSafeRouteResolverEventInfo,
} from '../../api/index.js';
import type {
  CreatableUtils,
  ICreatableConfig,
  ICreatableReturn,
} from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';
import type {
  ApiHandlerReturn,
  ResponseContext,
  TypedApiRouteConfig,
  TypeSafeApiHandlerHooks,
} from './types.js';
import type { BaseApiRouteProps } from './types.js';

import {
  default5xxErrorHandler,
  makeApiGatewayResponse,
  mergeApiGatewayResponseWithContext,
} from '../../api/index.js';
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
    hooks?: Partial<TypeSafeApiHandlerHooks>
  ): LambdaEntryPoint<APIGatewayProxyEventV2, APIGatewayProxyResultV2 | void>;
}

type PrivateResponseContext = ResponseContext & {
  _conclusion: 'failure' | 'success';
  _statusCode: HttpCodes;
};

export interface TypeSafeApiHandlerConfig extends ICreatableConfig {
  devMode?: true;
  ignoredPathPrefixes?: `/${string}`[];
  name?: `${string}Handler`;
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
      ignoredPathPrefixes: config?.ignoredPathPrefixes,
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

      if (typeof result === 'function') {
        const hookResult = result();
        return mergeApiGatewayResponseWithContext(hookResult, responseContext);
      }

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
        const domain =
          event.headers['x-viewer-host'] ?? event.requestContext.domainName;
        const path =
          (event as TypeSafeRouteResolverEventInfo)._interpretedPath ??
          event.rawPath;

        summary.url = domain + path;
      }

      logger.summary(summary);
      logger.end();
    }
  };
};
