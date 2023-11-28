// process.env keys
export const EnvKeys = {
  APP_NAME: 'APP_NAME',
  AWS_REGION: 'AWS_REGION',
  COLD_START: 'RAPIDSTACK_COLD_START',
  LOG_LEVEL: 'LOG_LEVEL',
  SST_APP_NAME: 'SST_APP',
  SST_LOCAL: 'IS_LOCAL',
} as const;

// reserved lambda event keys
export const HOT_FUNCTION_TRIGGER =
  '__RAPIDSTACK_HOT_FUNCTION_TRIGGER__' as const;

/**
 * Reserved keys for lambda performance marks
 */
export const PerformanceKeys = {
  HANDLER_END: 'handler-end',
  HANDLER_START: 'handler-start',
  ROUTE_END: 'route-end',
  ROUTE_START: 'route-start',
} as const;
