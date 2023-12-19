import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import { EnvKeys, HOT_FUNCTION_TRIGGER } from '../index.js';
import { getInternalEnvironmentVariable, isSafeKey } from './index.js';

/**
 * Creates a request context object for use in logging
 * @param event - the Lambda event
 * @param context - the Lambda context
 * @param extra - additional key-value pairs to add to the request context
 * @returns a key-value object of request context
 */
export function createRequestContext(
  event: unknown,
  context: Context,
  extra: Record<string, string> = {}
): Record<string, string> {
  const ids = {
    lambdaRequestId: context.awsRequestId,
    ...extra,
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
    let method = (event as APIGatewayProxyEventV2).requestContext.http.method;
    const methodHeader = headers['x-http-method-override'];

    if (methodHeader) {
      method += ` (with override header provided: ${methodHeader})`;
    }

    ids['method'] = method;

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
}

/**
 * Creates the current Cloudwatch log stream URL for the Lambda run
 * @param context the Lambda context
 * @returns the Cloudwatch log stream URL
 */
export function makeCloudwatchUrl(context: Context): string {
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

  const formattedLogTime = `[start]${new Date().toISOString()}`
    .replace(/\[/g, '$$255B')
    .replace(/\]/g, '$$255D')
    .replace(/:/g, '$$253A');

  // Removes the unnecessary logs for start and end (keeping REPORT)
  const filters = 'filterPattern$3D-START+-END';

  return (
    `https://${region}.console.aws.amazon.com/cloudwatch/home` +
    `?region=${region}#logsV2:log-groups/log-group/${formattedLogGroupName}` +
    `/log-events/${formattedLogStreamName}${formattedLogTime}${filters}`
  );
}

/**
 * Parses the cookies from an API Gateway event
 * @param event the API Gateway event
 * @returns the cookies as a key-value object
 */
export function parseGatewayEventCookies(
  event: APIGatewayProxyEventV2
): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!event.cookies) return cookies;

  for (const cookie of event.cookies) {
    const [key, value] = cookie.split('=');
    if (!isSafeKey(key)) continue;
    // eslint-disable-next-line security/detect-object-injection
    cookies[key] = value;
  }

  return cookies;
}

/**
 * Parses the sometimes-encoded body from an API Gateway event as a string
 * @param event the API Gateway event
 * @returns the body as a string
 */
export function parseGatewayEventBody(
  event: APIGatewayProxyEventV2
): string | undefined {
  return event.isBase64Encoded && event.body
    ? Buffer.from(event.body, 'base64').toString()
    : event.body;
}

/**
 * Parses an event to determine if the shape is a hot function trigger
 * @param event an event from Lambda
 * @returns whether or not the event is a hot function trigger (boolean)
 */
export function isHotFunctionTrigger(event: unknown): boolean {
  return (
    typeof event === 'object' &&
    // eslint-disable-next-line security/detect-object-injection
    !!(event as unknown as { [k: string]: unknown })[HOT_FUNCTION_TRIGGER]
  );
}
