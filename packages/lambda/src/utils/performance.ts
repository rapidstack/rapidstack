import { performance } from 'node:perf_hooks';

import { PerformanceKeys } from '../index.js';

type ApiPerformanceDurations = {
  clientLatencyDuration?: number; // serverReceived - clientSend
  clientPerceivedDuration?: number; // serverSend - clientSend
  duration: number; // serverSend - serverReceived
  gatewayLatencyDuration?: number; // serverReceived - gatewayReceived
  routeHandlerDuration?: number; // routeEnd - routeStart
  serverPostprocessingDuration?: number; // serverSend - routeEnd
  serverPreprocessingDuration?: number; //  routeStart - serverReceived
};

/**
 * Calculates the duration (in ms) of the various segments of a HTTP request
 * for better visibility of the overall performance of the request. Here is a
 * breakdown of the segments and what they represent:
 *
 * - `clientLatencyDuration`: Measures the duration between the client sending a
 * request and the Lambda beginning to process receiving the request. This value
 * is not reported if the function is not called with the `clientUnix`
 * parameter. (Requires the client to send a unix timestamp in the request;
 * i.e.: a header value)
 *
 * - `clientPerceivedDuration`: Measures the duration between the client sending
 * a request and the Lambda sending a response. This value is not reported if
 * the function is not called with the `clientUnix` parameter. (Requires the
 * client to send a unix timestamp in the request; i.e.: a header value)
 *
 * - `duration`: Measures the duration between the Lambda beginning to process
 * receiving the request and the Lambda sending a response. At a bare minimum,
 * this value should exist for every request.
 *
 * - `gatewayLatencyDuration`: Measures the duration between the gateway
 * receiving the request and the Lambda beginning to process receiving the
 * request. This value is not reported if the function is not called with the
 * `gatewayUnix` parameter. (Requires the gateway to send a unix timestamp in
 * the request; API Gateway does this with the `timeEpoch` property on the
 * `requestContext` object)
 *
 * - `routeHandlerDuration`: Measures the duration between the Lambda beginning
 * to process a route and the Lambda finishing processing the route. This value
 * does not include any processing time for the lifecycle hooks.
 *
 * - `serverPostprocessingDuration`: Measures the duration between the Lambda
 * finishing processing a route and the Lambda sending a response. This value
 * captures the duration of any post-processing that occurs after the route with
 * the lifecycle hooks.
 *
 * - `serverPreprocessingDuration`: Measures the duration between the Lambda
 * beginning the handler function and the Lambda beginning to process a route.
 * This value captures the duration of any pre-processing that occurs before the
 * route with the lifecycle hooks.
 *
 *
 * **Note: Durations here are approximations and are not exact. Because this
 * is calculated during the runtime of a lambda execution, the duration will not
 * match the billed duration and typically will be slightly higher by 1-3ms.
 * There is also a mix of high-precision timers and UNIX timestamps, which can
 * cause discrepancies.**
 * @param clientUnix The unix timestamp of when the client sent the request.
 * @param gatewayUnix The unix timestamp of when the gateway received the
 * request.
 * @returns an object containing all eligible performance durations
 */
export function getApiHandlerPerformance(
  clientUnix?: number,
  gatewayUnix?: number
): ApiPerformanceDurations {
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

  const lambdaStartTime = now - handlerDuration;

  performance.clearMarks();

  if (clientUnix) {
    result.clientLatencyDuration = +(lambdaStartTime - clientUnix).toPrecision(
      4
    );

    if (gatewayUnix) result.clientPerceivedDuration = now - clientUnix;
  }

  if (gatewayUnix) {
    result.gatewayLatencyDuration = +(
      lambdaStartTime - gatewayUnix
    ).toPrecision(4);
  }

  return result;
}

/**
 * Calculates the duration (in ms) of the main handler function
 *
 ***Note: Durations here are approximations and are not exact. Because this
 *is calculated during the runtime of a lambda execution, the duration will not
 *match the billed duration and typically will be slightly higher by 1-3ms.
 *There is also a mix of high-precision timers and UNIX timestamps, which can
 *cause discrepancies.**
 * @returns an object containing the performance duration
 */
export function getHandlerPerformance(): {
  duration: number;
} {
  const { duration } = performance.measure(
    '',
    PerformanceKeys.HANDLER_START,
    PerformanceKeys.HANDLER_END
  );
  performance.clearMarks();

  return { duration: +duration.toPrecision(4) };
}

/**
 * Marks the start of a handler execution in the performance timeline.
 */
export function markHandlerStart(): void {
  performance.mark(PerformanceKeys.HANDLER_START);
}

/**
 * Marks the end of a handler execution in the performance timeline.
 */
export function markHandlerEnd(): void {
  performance.mark(PerformanceKeys.HANDLER_END);
}

/**
 * Marks the start of a route execution in the performance timeline.
 */
export function markRouteStart(): void {
  performance.mark(PerformanceKeys.ROUTE_START);
}

/**
 * Marks the end of a route execution in the performance timeline.
 */
export function markRouteEnd(): void {
  performance.mark(PerformanceKeys.ROUTE_END);
}
