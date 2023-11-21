import { type Context } from 'aws-lambda';

import {
  COLD_START,
  HandlerExecuteError,
  type ICache,
  type ILogger,
} from '../../index.js';
import { type GenericHandlerWrapperOptions } from '../generic/types.js';

type HotFunctionHook<Event, Return> = {
  cache: ICache;
  context: Context;
  event: unknown;
  logger: ILogger;
  onHotFunctionTrigger: GenericHandlerWrapperOptions<
    Event,
    Return,
    never
  >['onHotFunctionTrigger'];
};
export const handleHotFunctionHook = async <Event, Return>(
  props: HotFunctionHook<Event, Return>
): Promise<Return> => {
  const { cache, context, logger, onHotFunctionTrigger } = props;
  if (!onHotFunctionTrigger) {
    const message =
      'A hot function trigger was received, but no onHotFunctionTrigger \
      handler was provided.';
    logger.fatal(message);
    throw new HandlerExecuteError(message);
  }

  // Prevent the cold start handler from running on subsequent invocations
  // eslint-disable-next-line security/detect-object-injection
  delete process.env[COLD_START];

  const hotFunctionTriggerLogger = logger.child({
    hierarchicalName: 'handler-hook:onHotFunctionTrigger',
  });
  try {
    return (await onHotFunctionTrigger({
      cache,
      context,
      logger: hotFunctionTriggerLogger,
    })) as Return;
  } catch (err) {
    hotFunctionTriggerLogger.fatal({ err, msg: 'An error occurred' });
    throw new HandlerExecuteError(
      'An error occurred in the onHotFunctionTrigger handler.'
    );
  }
};
