import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda';

import type { ICache, ILogger } from '../../index.js';
import type {
  ApiHandlerReturn,
  ResponseContext,
  TypeSafeApiHandlerHooks,
  TypedApiRouteConfig,
} from './types.js';

import {
  HttpError,
  default4xxErrorHandler,
  resolveTypeSafeApiRoute,
} from '../../api/index.js';
import { PerformanceKeys, markRouteEnd, markRouteStart } from '../../index.js';

type RequestHooks = {
  onError?: TypeSafeApiHandlerHooks['onError'];
  onRequestEnd?: TypeSafeApiHandlerHooks['onRequestEnd'];
  onRequestStart?: TypeSafeApiHandlerHooks['onRequestStart'];
  utils: {
    cache: ICache;
    context: Context;
    devMode: boolean;
    event: APIGatewayProxyEventV2;
    logger: ILogger;
    responseContext: ResponseContext;
    routes: TypedApiRouteConfig;
  };
};
export const handleRequestHooks = async (
  props: RequestHooks
): Promise<(() => APIGatewayProxyResultV2) | ApiHandlerReturn> => {
  const { onError, onRequestEnd, onRequestStart, utils } = props;
  utils.logger.trace({ msg: 'Starting request execution.' });

  const routeLookup = resolveTypeSafeApiRoute(utils.event, utils.routes);

  let result: ApiHandlerReturn<unknown> = {};

  // The following are handled by the onError handler (critical path)
  try {
    let maybeReturnEarly: (() => APIGatewayProxyResultV2) | void;

    if (onRequestStart) {
      maybeReturnEarly = await onRequestStart({
        ...utils,
        logger: utils.logger.child({
          hierarchicalName: 'handler-hook:onRequestStart',
        }),
        routeLookup,
      });

      if (typeof maybeReturnEarly === 'function') return maybeReturnEarly;
    }

    if (!routeLookup.candidate) throw new HttpError(404);
    markRouteStart();

    result = await routeLookup
      .candidate({
        ...utils,
        logger: utils.logger.child({
          hierarchicalName: 'handler-hook:route',
        }),
        routeLookup,
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
