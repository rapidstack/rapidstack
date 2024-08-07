import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';

import type {
  ICache,
  ILogger,
  TypeSafeRouteResolverEventInfo,
} from '../../index.js';
import type {
  ApiHandlerReturn,
  ResponseContext,
  TypedApiRouteConfig,
  TypeSafeApiHandlerHooks,
} from './types.js';

import {
  default4xxErrorHandler,
  HttpError,
  resolveTypeSafeApiRoute,
} from '../../api/index.js';
import { markRouteEnd, markRouteStart, PerformanceKeys } from '../../index.js';

type RequestHooksProps = {
  onError?: TypeSafeApiHandlerHooks['onError'];
  onRequestEnd?: TypeSafeApiHandlerHooks['onRequestEnd'];
  onRequestStart?: TypeSafeApiHandlerHooks['onRequestStart'];
  utils: {
    cache: ICache;
    context: Context;
    devMode: boolean;
    event: APIGatewayProxyEventV2;
    ignoredPathPrefixes?: string[];
    logger: ILogger;
    responseContext: ResponseContext;
    routes: TypedApiRouteConfig;
  };
};
export const handleRequestHooks = async (
  props: RequestHooksProps
): Promise<(() => APIGatewayProxyStructuredResultV2) | ApiHandlerReturn> => {
  const { onError, onRequestEnd, onRequestStart, utils } = props;
  utils.logger.trace({ msg: 'Starting request execution.' });

  if (utils.ignoredPathPrefixes) {
    let _interpretedPath = utils.event.rawPath;

    for (const prefix of utils.ignoredPathPrefixes) {
      if (_interpretedPath.startsWith(prefix)) {
        _interpretedPath = _interpretedPath.replace(prefix, '');
        utils.logger.debug({ msg: 'Removed ignored path prefix.', prefix });
        break; // only remove the first prefix matched
      }
    }

    (utils.event as TypeSafeRouteResolverEventInfo)._interpretedPath =
      _interpretedPath;
  }

  const routeInfo = resolveTypeSafeApiRoute(utils.event, utils.routes);

  let result: ApiHandlerReturn<unknown> = {};

  // The following are handled by the onError handler (critical path)
  try {
    let maybeReturnEarly: (() => APIGatewayProxyStructuredResultV2) | void;

    if (onRequestStart) {
      maybeReturnEarly = await onRequestStart({
        ...utils,
        logger: utils.logger.child({
          hierarchicalName: 'handler-hook:onRequestStart',
        }),
        routeInfo,
      });

      if (typeof maybeReturnEarly === 'function') return maybeReturnEarly;
    }

    if (!routeInfo.matched) throw new HttpError(404);
    markRouteStart();

    result = await routeInfo
      .matched({
        ...utils,
        logger: utils.logger.child({
          hierarchicalName: 'handler-hook:route',
        }),
        routeInfo,
      })
      .catch((err) => {
        performance.mark(PerformanceKeys.ROUTE_END);
        throw err;
      });

    result.body = {
      data: result.body,
      status: 'success',
    };

    markRouteEnd();

    // On request end
    if (onRequestEnd) {
      const maybeReturnEarly = await onRequestEnd({
        ...utils,
        logger: utils.logger.child({
          hierarchicalName: 'handler-hook:onRequestEnd',
        }),
        result,
      });

      if (typeof maybeReturnEarly === 'function') return maybeReturnEarly;
    }

    return result;
  } catch (err) {
    if (onError) {
      if (!(err instanceof Error)) {
        utils.logger.warn({
          err,
          msg: 'The error caught to be processed by the handler onError hook is not an instance of an Error. This is preferred for troubleshooting.',
        });
      }

      result = await onError({
        ...utils,
        error: err,
        logger: utils.logger.child({
          hierarchicalName: 'handler-hook:onError',
        }),
      });
      return result;
    }

    // Handle 4xx HttpErrors and validations
    result = default4xxErrorHandler(err);

    return result;
  } finally {
    utils.logger.trace({ msg: 'Finished request execution.', result });
  }
};
