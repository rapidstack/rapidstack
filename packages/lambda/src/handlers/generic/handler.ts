import type { Context } from 'aws-lambda';

import { performance } from 'node:perf_hooks';

import type {
  CreatableUtils,
  ICreatableConfig,
  ICreatableReturn,
} from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';

import { HOT_FUNCTION_TRIGGER, type ILogger } from '../../common/index.js';
import { resolvePossibleRequestIds } from '../../utils/index.js';
import {
  handleColdStartHook,
  handleHotFunctionHook,
  handleRequestHooks,
  handleShutdownHook,
} from './lifecycle.js';
import { type GenericHandlerWrapperOptions } from './types.js';

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
  performance.mark('handler-start');
  let conclusion = 'success' as 'failure' | 'success';

  const { cache, logger: _log } = utils;
  const { name } = config ?? {};

  return (runnerFunction, options) => async (event, context) => {
    const {
      onColdStart,
      onError,
      onHotFunctionTrigger,
      onLambdaShutdown,
      onRequestEnd,
      onRequestStart,
    } = options ?? {};

    const logger = _log.child({
      '@r': resolvePossibleRequestIds(event, context),
      'hierarchicalName': name ?? 'GenericHandler (unnamed)',
    });

    const isHotTrigger =
      typeof event === 'object' &&
      // eslint-disable-next-line security/detect-object-injection
      (event as { [k: string]: unknown })[HOT_FUNCTION_TRIGGER];

    // outer try/catch to determine conclusion for the summary log
    try {
      handleShutdownHook(onLambdaShutdown, logger);

      if (isHotTrigger) {
        return await handleHotFunctionHook({
          cache,
          context,
          event,
          hook: onHotFunctionTrigger,
          logger,
        });
      }

      await handleColdStartHook({
        cache,
        context,
        event,
        logger,
        onColdStart: onColdStart,
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
      performance.mark('handler-end');
      const { duration } = performance.measure(
        'handler',
        'handler-start',
        'handler-end'
      );
      logger.summary({ conclusion, duration });
      performance.clearMarks();
    }
  };
};
