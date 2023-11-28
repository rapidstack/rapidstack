import { performance } from 'node:perf_hooks';

import { PerformanceKeys } from '../index.js';

type ApiPerformanceDurations = {
  clientLatencyDuration?: number; // clientSend - serverReceived
  clientPerceivedDuration?: number; // serverSend - clientSend
  duration: number; // serverSend - serverReceived
  gatewayLatencyDuration?: number; // clientSend - gatewayReceived
  routeHandlerDuration?: number; // routeEnd - routeStart
  serverPostprocessingDuration?: number; // serverSend - routeEnd
  serverPreprocessingDuration?: number; //  routeStart - serverReceived
};

// client received to be calculated in the UI
export const getApiHandlerPerformance = (
  clientUnix?: number,
  gatewayUnix?: number
): ApiPerformanceDurations => {
  const now = Date.now();
  const result = {} as ApiPerformanceDurations;
  let serverPreprocessingDuration: number | undefined;
  try {
    serverPreprocessingDuration = +performance
      .measure('', PerformanceKeys.HANDLER_START, PerformanceKeys.ROUTE_START)
      .duration.toPrecision(4);

    result.serverPreprocessingDuration = serverPreprocessingDuration;
  } catch {}

  let routeHandlerDuration: number | undefined;
  try {
    routeHandlerDuration = +performance
      .measure('', PerformanceKeys.ROUTE_START, PerformanceKeys.ROUTE_END)
      .duration.toPrecision(4);

    result.routeHandlerDuration = routeHandlerDuration;
  } catch {}

  let serverPostprocessingDuration: number | undefined;
  try {
    serverPostprocessingDuration = +performance
      .measure('', PerformanceKeys.ROUTE_END, PerformanceKeys.HANDLER_END)
      .duration.toPrecision(4);

    result.serverPostprocessingDuration = serverPostprocessingDuration;
  } catch {}

  const handlerDuration = +performance
    .measure('', PerformanceKeys.HANDLER_START, PerformanceKeys.HANDLER_END)
    .duration.toPrecision(4);
  result.duration = handlerDuration;

  performance.clearMarks();

  if (clientUnix) {
    result.clientPerceivedDuration = now - clientUnix;

    if (gatewayUnix) result.clientLatencyDuration = gatewayUnix - clientUnix;
  }

  if (handlerDuration && gatewayUnix) {
    const lambdaStartTime = now - handlerDuration;
    result.gatewayLatencyDuration = lambdaStartTime - gatewayUnix;
  }

  return result;
};

export const getHandlerPerformance = (): {
  duration: number;
} => {
  const { duration } = performance.measure(
    '',
    PerformanceKeys.HANDLER_START,
    PerformanceKeys.HANDLER_END
  );
  performance.clearMarks();

  return { duration: +duration.toPrecision(4) };
};
