import type { Context } from 'aws-lambda';

import type { ILogger } from '../../common/index.js';
import type {
  CreatableUtils,
  ICreatableConfig,
  ICreatableReturn,
} from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';
import type { GenericHandlerWrapperOptions } from './types.js';

import {
  createRequestContext,
  getHandlerPerformance,
  isHotFunctionTrigger,
  markHandlerEnd,
  markHandlerStart,
} from '../../utils/index.js';
import {
  handleColdStartHook,
  handleHotFunctionHook,
  handleShutdownHook,
} from '../shared/index.js';
import { handleRequestHooks } from './lifecycle.js';

interface GenericHandlerReturn extends ICreatableReturn {
  <Event, Return, Extra extends Record<string, unknown> | object = object>(
    runnerFunction: (
      params: {
        context: Context;
        event: Event;
        logger: ILogger;
      } & Extra
    ) => Promise<Return>,
    options?: GenericHandlerWrapperOptions<Event, Return, Extra>
  ): LambdaEntryPoint<Event, Return>;
}

interface GenericHandlerConfig extends ICreatableConfig {
  name?: `${string}Handler`;
}

export const GenericHandler = (
  utils: CreatableUtils,
  config?: GenericHandlerConfig
): GenericHandlerReturn => {
  const { cache, logger: _log } = utils;
  const { name } = config ?? {};

  return (runnerFunction, options) => async (event, context) => {
    markHandlerStart();
    let conclusion = 'success' as 'failure' | 'success';

    const {
      onColdStart,
      onError,
      onHotFunctionTrigger,
      onLambdaShutdown,
      onRequestEnd,
      onRequestStart,
    } = options ?? {};

    const logger = _log.child({
      '@r': createRequestContext(event, context),
      'hierarchicalName': name ?? 'GenericHandler (unnamed)',
    });

    const isHotTrigger = isHotFunctionTrigger(event);
    const commonUtils = {
      cache,
      context,
      event,
      logger,
    };

    // outer try/catch to determine conclusion for the summary log
    try {
      handleShutdownHook(onLambdaShutdown, logger);

      if (isHotTrigger) {
        return (await handleHotFunctionHook({
          onHotFunctionTrigger,
          utils: commonUtils,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        })) as any;
      }

      await handleColdStartHook({
        cache,
        context,
        event,
        logger,
        onColdStart,
      });

      return await handleRequestHooks({
        cache,
        context,
        event,
        logger,
        onError,
        onRequestEnd,
        onRequestStart,
        runnerFunction,
      });
    } catch (err) {
      conclusion = 'failure';
      throw err;
    } finally {
      markHandlerEnd();
      const { duration } = getHandlerPerformance();
      logger.summary({ conclusion, duration });
      logger.end();
    }
  };
};
