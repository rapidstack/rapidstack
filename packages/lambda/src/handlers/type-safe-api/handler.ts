import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import { performance } from 'node:perf_hooks';

import type {
  CreatableUtils,
  ICreatableConfig,
  ICreatableReturn,
} from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';

import { HttpError } from '../../api/http-errors.js';
import {
  HOT_FUNCTION_TRIGGER,
  HandlerExecuteError,
  type ILogger,
  PerformanceKeys,
} from '../../common/index.js';
import {
  getHandlerPerformance,
  resolvePossibleRequestIds,
} from '../../utils/index.js';
import { handleHotFunctionHook, handleRequestHooks } from './lifecycle.js';
import {
  type ApiHandlerReturn,
  type ApiResponse,
  type BaseApiHandlerReturn,
  type TypeSafeApiHandlerOptions,
} from './types.js';
import { type BaseApiRouteProps } from './validator.js';

interface TypeSafeApiHandlerReturn extends ICreatableReturn {
  (
    routes: {},
    options?: TypeSafeApiHandlerOptions
  ): LambdaEntryPoint<APIGatewayProxyEventV2, BaseApiHandlerReturn | void>;
}

interface TypeSafeApiHandlerConfig extends ICreatableConfig {
  basePath?: string;
  msTimeoutBudget?: number;
  name?: `${string}Handler`;
  openApiRoute?: true;
  respectMethodOverrideHeader?: true;
  routeResolver?: (
    event: APIGatewayProxyEventV2,
    routes: {}
  ) => ((params: BaseApiRouteProps) => Promise<ApiHandlerReturn>) | undefined;
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

    if (typeof event !== 'object') {
      throw new HandlerExecuteError('event must be an object');
    }

    const { onError, onHotFunctionTrigger, onRequestEnd, onRequestStart } =
      options ?? {};

    const logger = _log.child({
      '@r': resolvePossibleRequestIds(event, context),
      'hierarchicalName': name ?? 'TypeSafeApiHandler (unnamed)',
    });

    const isHotTrigger =
      // eslint-disable-next-line security/detect-object-injection
      !!(event as unknown as { [k: string]: unknown })[HOT_FUNCTION_TRIGGER];

    // outer try/catch to determine conclusion for the summary log
    try {
      if (isHotTrigger) {
        return await handleHotFunctionHook({
          cache,
          context,
          event,
          logger,
          onHotFunctionTrigger,
        });
      }

      const route = config?.routeResolver
        ? config.routeResolver(event, routes)
        : resolveRoute(event, routes);
      if (!route) throw new HttpError(404);

      return await handleRequestHooks({
        cache,
        context,
        event,
        logger,
        onError,
        onRequestEnd,
        onRequestStart,
        route,
      });
    } catch (err) {
      conclusion = 'failure';
      throw err;
    } finally {
      performance.mark(PerformanceKeys.HANDLER_END);
      const { duration } = getHandlerPerformance();
      logger.summary({ conclusion, duration });
      logger.end();
    }
  };
};

/**
 *
 * @param event
 */
function resolveRoute(
  event: APIGatewayProxyEventV2,
  routes: {}
): ((params: BaseApiRouteProps) => Promise<ApiHandlerReturn>) | undefined {
  return (routes as any)[event.version as any] as any;
}
