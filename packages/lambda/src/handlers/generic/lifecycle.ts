/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Context } from 'aws-lambda';

import { type ICache, type ILogger } from '../../common/index.js';

export type CommonHandlerOptions<
  EventT,
  ResultT,
  ExtraParamsT extends Record<string, any> | undefined,
> = {
  /**
   * A function to run before the main lambda handler function is called. Can be used to transform and/or enrich
   * the main function's parameters by returning an object with the desired parameters, or trigger an early exit
   * by supplying a function that returns a valid response.
   *
   * Anything thrown in this function will be caught and handled by the `onError` function, if supplied.
   */
  onRequestStart?: (params: {
    cache: ICache;
    context: Context;
    event: Partial<EventT> | null | undefined;
    logger: ILogger;
  }) => Promise<(() => ResultT) | ExtraParamsT>;
};

export const executeCommonLambdaFlow = async <
  EventT,
  ResultT,
  ExtraParamsT extends Record<string, any> | undefined,
>({
  cache,
  context,
  event,
  functionToRun,
  logger,
  name,
  options,
}: {
  cache: ICache;
  context: Context;
  event: EventT;
  functionToRun: (
    logger: ILogger,
    event: EventT,
    context: Context,
    extra?: ExtraParamsT
  ) => Promise<ResultT>;
  logger: ILogger;
  name: string;
  options?: CommonHandlerOptions<EventT, ResultT, ExtraParamsT>;
}): Promise<ResultT> => {
  let result;
  try {
    // On request start
    let optionalHandlerArgsOrReturnFn: (() => ResultT) | Record<string, any> =
      {};
    if (options?.onRequestStart) {
      optionalHandlerArgsOrReturnFn =
        (await options.onRequestStart({
          cache,
          context,
          event,
          logger: logger.child({
            hierarchicalName: `${name}.onRequestStart`,
            requestId: context.awsRequestId,
          }),
        })) || ({} as Record<string, any>);
      if (typeof optionalHandlerArgsOrReturnFn === 'function')
        return optionalHandlerArgsOrReturnFn();
    }

    // Runner function
    result = await functionToRun(
      logger.child({
        hierarchicalName: `${name} Runner Function`,
        requestId: context.awsRequestId,
      }),
      event,
      context,
      (optionalHandlerArgsOrReturnFn as ExtraParamsT) ?? ({} as ExtraParamsT)
    );

    return result;
  } finally {
    logger.summary({ msg: 'done', name, result });
  }
};
