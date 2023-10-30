import { type APIGatewayProxyEventV2, type Context } from 'aws-lambda';

import { getApiGatewayHeaderValue } from './api-gateway.js';

export const resolvePossibleRequestIds = (
  event: unknown,
  context: Context
): Record<string, string> => {
  const ids = {
    lambdaRequestId: context.awsRequestId,
  } as Record<string, string>;
  if (typeof event !== 'object') return ids;

  const requestHeaderId = getApiGatewayHeaderValue(
    event as APIGatewayProxyEventV2,
    'x-request-id'
  );
  const amznTraceId = getApiGatewayHeaderValue(
    event as APIGatewayProxyEventV2,
    'x-amzn-trace-id'
  );

  if (requestHeaderId) ids['x-request-id'] = requestHeaderId;
  if (amznTraceId) ids['x-amzn-trace-id'] = amznTraceId;

  return ids;
};
