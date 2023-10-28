import type { Context } from 'aws-lambda';

import { performance } from 'node:perf_hooks';

import type { ILogger } from '../../common/index.js';
import type {
  CreatableUtils,
  ICreatableConfig,
  ICreatableReturn,
} from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';

import {
  type GenericHandlerWrapperOptions,
  genericHandlerLifecycleWrapper,
} from './lifecycle.js';

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
  try {
    return (runnerFunction, options) => async (event, context) => {
      return genericHandlerLifecycleWrapper({
        context,
        event,
        fn: runnerFunction,
        name: config?.name ?? 'GenericHandler (unnamed)',
        options,
        utils,
      });
    };
  } catch (err) {
    conclusion = 'failure';
    throw err;
  } finally {
    performance.mark('handler-end');
    const res = performance.measure('handler', 'handler-start', 'handler-end');
    utils.logger.summary({
      conclusion,
      duration: res.duration,
    });
  }
};
