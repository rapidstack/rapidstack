import type { Context } from 'aws-lambda';

import { performance } from 'node:perf_hooks';

import type {
  CreatableUtils,
  ICreatableConfig,
  ICreatableReturn,
} from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';

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
import {
  handleHotFunctionHook,
  handleRequestHooks,
  handleShutdownHook,
} from './lifecycle.js';
import { type TypeSafeApiHandlerOptions } from './types.js';

interface TypeSafeApiHandlerReturn extends ICreatableReturn {
  <Event, Return>(
    routes: {},
    options?: TypeSafeApiHandlerOptions
  ): LambdaEntryPoint<Event, Return>;
}

interface TypeSafeApiHandlerConfig extends ICreatableConfig {
  basePath?: string;
  msTimeoutBudget?: number;
  name?: `${string}Handler`;
  openApiRoute?: true;
  respectMethodOverride?: true;
  routeResolver?: () => null;
}

export const TypeSafeApiHandler = (
  utils: CreatableUtils,
  config?: TypeSafeApiHandlerConfig
): TypeSafeApiHandlerReturn => {
  const { cache, logger: _log } = utils;
  const { name } = config ?? {};

  return (runnerFunction, options) => async (event, context) => {
    performance.mark(PerformanceKeys.HANDLER_START);
    let conclusion = 'success' as 'failure' | 'success';

    if (typeof event !== 'object') {
      throw new HandlerExecuteError('event must be an object');
    }

    const {
      onError,
      onHotFunctionTrigger,
      onLambdaShutdown,
      onRequestEnd,
      onRequestStart,
    } = options ?? {};

    const logger = _log.child({
      '@r': resolvePossibleRequestIds(event, context),
      'hierarchicalName': name ?? 'TypeSafeApiHandler (unnamed)',
    });

    const isHotTrigger =
      typeof event === 'object' &&
      // eslint-disable-next-line security/detect-object-injection
      (event as { [k: string]: unknown })[HOT_FUNCTION_TRIGGER];

    // outer try/catch to determine conclusion for the summary log
    try {
      // Execution
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
