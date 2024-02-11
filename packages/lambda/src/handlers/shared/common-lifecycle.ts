import type { Context } from 'aws-lambda';

import type { ICache, ILogger } from '../../common/index.js';

import { EnvKeys, HandlerExecuteError } from '../../common/index.js';
import { getInternalEnvironmentVariable } from '../../index.js';

type CommonHookUtils = {
  cache: ICache;
  context: Context;
  logger: ILogger;
};

type AmbiguousEventHookProps<Event> = {
  event: Partial<Event> | null | undefined;
} & CommonHookUtils;

type HotFunctionHook = {
  onHotFunctionTrigger?: (params: CommonHookUtils) => Promise<void>;
  utils: {
    cache: ICache;
    context: Context;
    event: unknown;
    logger: ILogger;
  };
};
export const handleHotFunctionHook = async (
  props: HotFunctionHook
): Promise<void> => {
  const { onHotFunctionTrigger, utils } = props;
  const { cache, context } = utils;

  if (!onHotFunctionTrigger) {
    const message =
      'A hot function trigger was received, but no onHotFunctionTrigger handler was provided.';
    utils.logger.fatal(message);
    throw new HandlerExecuteError(message);
  }

  // Prevent the cold start handler from running on subsequent invocations
  delete process.env[EnvKeys.COLD_START];

  const logger = utils.logger.child({
    hierarchicalName: 'handler-hook:onHotFunctionTrigger',
  });
  try {
    return await onHotFunctionTrigger({ cache, context, logger });
  } catch (err) {
    logger.fatal({ err, msg: 'An error occurred' });
    throw new HandlerExecuteError(
      'An error occurred in the onHotFunctionTrigger handler.'
    );
  }
};

export const handleShutdownHook = (
  hook: (() => Promise<void>) | undefined,
  logger: ILogger
): void => {
  if (!hook) return;

  if (getInternalEnvironmentVariable(EnvKeys.SHUTDOWN_REGISTERED)) return;

  const child = logger.child({
    hierarchicalName: 'handler-hook:onLambdaShutdown',
  });
  process.on('SIGTERM', async () => {
    try {
      child.trace({ msg: 'Starting.' });
      await hook();
    } catch (err) {
      child.fatal({ err, msg: 'An error occurred in the SIGTERM handler.' });
    } finally {
      child.trace({ msg: 'Finished.' });
    }
  });
  process.env[EnvKeys.SHUTDOWN_REGISTERED] = 'true';
};

type ColdStartHook<Event> = {
  cache: ICache;
  context: Context;
  event: Event;
  logger: ILogger;
  onColdStart?: (params: AmbiguousEventHookProps<Event>) => Promise<void>;
};
export const handleColdStartHook = async <Event>(
  props: ColdStartHook<Event>
): Promise<void> => {
  if (!process.env[EnvKeys.COLD_START]) return;

  // Prevent the cold start handler from running on subsequent invocations
  delete process.env[EnvKeys.COLD_START];

  const { cache, context, event, logger, onColdStart } = props;

  const coldStartTriggerLogger = logger.child({
    hierarchicalName: 'handler-hook:onColdStart',
  });

  if (onColdStart) {
    try {
      await onColdStart({
        cache,
        context,
        event,
        logger: coldStartTriggerLogger,
      });
    } catch (error) {
      coldStartTriggerLogger.error({ error, msg: 'An error occurred' });
      // Nothing to throw here. Not the caller's concern.
    }
  }
};
