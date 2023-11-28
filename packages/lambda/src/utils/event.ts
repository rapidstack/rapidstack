import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import { EnvKeys } from '../index.js';
import { getInternalEnvironmentVariable } from './index.js';

export const resolvePossibleRequestIds = (
  event: unknown,
  context: Context
): Record<string, string> => {
  const ids = {
    lambdaRequestId: context.awsRequestId,
  } as Record<string, string>;
  if (typeof event !== 'object') return ids;

  // API Gateway/Lambda URL request shape ID scraping
  if ((event as Record<string, unknown>).requestContext) {
    const gatewayEvent = event as APIGatewayProxyEventV2;

    if (!gatewayEvent.requestContext.domainName.endsWith('.on.aws')) {
      // If using a lambda url, disregard the apiId. Its not API Gateway.
      ids['apiId'] = gatewayEvent.requestContext.apiId;

      // For Lambda URLs, the apiRequestId is the same as the lambdaRequestId
      ids['apiRequestId'] = gatewayEvent.requestContext.requestId;
    }

    ids['ip'] = gatewayEvent.requestContext.http.sourceIp;
  }

  // Generic HTTP request ID scraping
  if (typeof (event as Record<string, unknown>).headers === 'object') {
    const headers = (event as APIGatewayProxyEventV2).headers;

    if (headers['x-request-id']) {
      ids['x-request-id'] = headers['x-request-id'];
    }

    if (headers['x-amzn-trace-id']) {
      ids['x-amzn-trace-id'] = headers['x-amzn-trace-id'];
    }

    if (headers['x-amz-cf-id']) {
      ids['x-amz-cf-id'] = headers['x-amz-cf-id'];
    }
  }

  return ids;
};

export const makeCloudwatchUrl = (context: Context): string => {
  const { logGroupName, logStreamName } = context;
  const region = getInternalEnvironmentVariable(EnvKeys.AWS_REGION);

  if (!region) return 'could not find region';

  // These replacements appear to be ascii hex equiv with a $25 prefix?
  const formattedLogGroupName = logGroupName
    .replace(/\$/g, '$$2524')
    .replace(/\[/g, '$$255B')
    .replace(/\]/g, '$$255D')
    .replace(/\//g, '$$252F');

  const formattedLogStreamName = logStreamName
    .replace(/\$/g, '$$2524')
    .replace(/\[/g, '$$255B')
    .replace(/\]/g, '$$255D')
    .replace(/\//g, '$$252F');

  return (
    `https://${region}.console.aws.amazon.com/cloudwatch/home` +
    `?region=${region}#logsV2:log-groups/log-group/${formattedLogGroupName}` +
    `/log-events/${formattedLogStreamName}`
  );
};
