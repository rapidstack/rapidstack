// process.env keys
export const COLD_START = 'RAPIDSTACK_COLD_START' as const;
export const LOG_LEVEL = 'LOG_LEVEL' as const;
export const APP_NAME = 'SST_APP' as const;

// reserved lambda event keys
export const HOT_FUNCTION_TRIGGER =
  '__RAPIDSTACK_HOT_FUNCTION_TRIGGER__' as const;

/**
 * Reserved keys for lambda performance marks
 */
export const PerformanceKeys = {
  HANDLER_END: 'handler-end',
  HANDLER_START: 'handler-start',
} as const;
