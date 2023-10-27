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

interface GenericHandlerReturn<Event, Return> extends ICreatableReturn {
  (event: Event, context: Context): Promise<Return>;
}

export const GenericHandler = <
  Event,
  Return,
  Extra extends {} | Record<string, any> = {},
>(
  utils: CreatableUtils,
  options?: GenericHandlerConfig<Event, Return, Extra>
) => {
  return (
    runnerFunction: (
      params: { context: Context; event: Event; logger: ILogger } & Extra
    ) => Promise<Return>
  ): GenericHandlerReturn<Event, Return> =>
    (async (event: Event, context: Context) => {
      return genericHandlerLifecycle({
        context,
        event,
        // eslint-disable-next-line max-params
        functionToRun: async (logger, event, context, extra = {} as any) =>
          runnerFunction({ context, event, logger, ...extra }),
        logger: utils.logger,
        name: 'GenericHandler',
        options,
      });
    }) as LambdaEntryPoint<Event, Return>;
};
