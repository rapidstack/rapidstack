/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Context } from 'aws-lambda';

import type { ICache, ILogger } from '../../common/index.js';
import type { CreatableUtils, ICreatableReturn } from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';

import {
  type GenericHandlerConfig,
  genericHandlerLifecycle,
} from './lifecycle.js';

export interface GenericHandlerReturn extends ICreatableReturn {
  (event: any, context: Context): Promise<any>;
}

export const GenericHandler = <
  Event,
  Return,
  Extra extends Record<string, any> | object = object,
>(
  utils: CreatableUtils,
  options?: GenericHandlerConfig
) => {
  return (
    runnerFunction: (
      params: { context: Context; event: Event; logger: ILogger } & Extra
    ) => Promise<Return>
  ): GenericHandlerReturn =>
    (async (event: Event, context: Context) => {
      return genericHandlerLifecycle({
        context,
        event,
        // eslint-disable-next-line max-params
        cache: utils.cache,
        functionToRun: async (logger, event, context, extra = {} as object) =>
          runnerFunction({ context, event, logger, ...(extra = {} as any) }),
        logger: utils.logger,
        name: 'GenericHandler',
        options,
      });
    }) as LambdaEntryPoint<Event, Return>;
};
