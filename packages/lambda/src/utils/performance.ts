import { performance } from 'node:perf_hooks';

import { PerformanceKeys } from '../index.js';

export const getHandlerPerformance = (): {
  duration: number;
  roundedDuration: number;
} => {
  const { duration } = performance.measure(
    'handler',
    PerformanceKeys.HANDLER_START,
    PerformanceKeys.HANDLER_END
  );
  performance.clearMarks(PerformanceKeys.HANDLER_START);
  performance.clearMarks(PerformanceKeys.HANDLER_END);

  return { duration, roundedDuration: Math.round(duration) };
};
