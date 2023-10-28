/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Context } from 'aws-lambda';

import type { ICache, ILogger } from '../../common/index.js';
import type { CreatableUtils, ICreatableConfig } from '../../toolkit/index.js';
import type { LambdaEntryPoint } from '../index.js';

import {
  type CommonHandlerOptions,
  executeCommonLambdaFlow,
} from './lifecycle.js';

type GenericHandlerT = <
  EventT,
  ResultT,
  ExtraParamsT extends {} | Record<string, any> = {},
>(
  runnerFunction: (
    params: {
      context: Context;
      event: EventT;
      logger: ILogger;
    } & ExtraParamsT
  ) => Promise<ResultT>,
  options?: CommonHandlerOptions<EventT, ResultT, ExtraParamsT>
) => LambdaEntryPoint<EventT, ResultT>;

interface GenericHandlerConfig extends ICreatableConfig {
  name?: string;
}

export const GenericHandler = (
  utils: CreatableUtils,
  config?: GenericHandlerConfig
): GenericHandlerT => {
  return (runnerFunction, options) => async (event, context) => {
    return executeCommonLambdaFlow({
      cache: utils.cache,
      context,
      event,
      // eslint-disable-next-line max-params
      functionToRun: async (logger, event, context, extra = {} as any) =>
        runnerFunction({ context, event, logger, ...extra }),
      logger: utils.logger,
      name: config?.name ?? 'GenericHandler (unnamed)',
      options,
    });
  };
};
