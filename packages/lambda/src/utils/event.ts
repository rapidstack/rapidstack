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
  const cfId = getApiGatewayHeaderValue(
    event as APIGatewayProxyEventV2,
    'x-amz-cf-id'
  );

  if (requestHeaderId) ids['x-request-id'] = requestHeaderId;
  if (amznTraceId) ids['x-amzn-trace-id'] = amznTraceId;
  if (cfId) ids['x-amz-cf-id'] = cfId;

  return ids;
};
