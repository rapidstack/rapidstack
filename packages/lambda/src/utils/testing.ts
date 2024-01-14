/* eslint-disable security/detect-object-injection */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';

import type { HttpVerbs } from '../api/index.js';

export const MockLambdaContext = {
  awsRequestId: '7e577e57-7e57-7e57-7e57-7e577e577e57',
  callbackWaitsForEmptyEventLoop: false,
  clientContext: undefined,
  done: () => undefined,
  fail: () => undefined,
  functionName: 'mock-lambda',
  functionVersion: '$LATEST',
  getRemainingTimeInMillis: () => 10000,
  identity: undefined,
  invokedFunctionArn:
    'arn:aws:lambda:us-east-1:012345678910:function:mock-lambda',
  logGroupName: '/aws/lambda/mock-lambda',
  logStreamName: '0000/00/00/[$LATEST]83f325fb53bd4bf9bf0e8724ab0e4616',
  memoryLimitInMB: '1024',
  succeed: () => undefined,
} as Context;

export const MockLambdaDefaultEvent = {
  key1: 'value1',
  key2: 'value2',
  key3: 'value3',
} as any;

/**
 * Mocks a Lambda runtime environment and runs the handler with the provided
 * event and context.
 * @param handler the handler to test.
 * @param testEvent the event to use for the mock Lambda. Defaults to the
 * generic event that the Lambda console provides:
 * {@link MockLambdaDefaultEvent}
 * @param testContext the context to use for the mock Lambda. Defaults to a
 *  generic context: {@link MockLambdaContext}
 * @returns the result of the handler.
 */
export async function MockLambdaRuntime<T>(
  handler: (event: any, context: any) => Promise<unknown>,
  testEvent = MockLambdaDefaultEvent,
  testContext = MockLambdaContext
): Promise<T> {
  return (await handler(testEvent, testContext)) as T;
}

/**
 * Creates a mock API event for testing.
 * @param params  the parameters to use for the mock event.
 * @param params.addCloudFrontHeaders whether or not to add CloudFront headers
 * @param params.body the body of the request
 * @param params.cookies the cookies to use for the request
 * @param params.headers the headers to use for the request
 * @param params.method the HTTP method to use for the request
 * @param params.path the path to use for the request
 * @param params.queryString the query string to use for the request
 * @param params.source the source of the request. Defaults to `api-gateway`.
 * @returns a mock API event.
 * @throws if the source is not recognized.
 */
export function makeMockApiEvent(params: {
  addCloudFrontHeaders?: true;
  body?: any;
  cookies?: `${string}=${string}`[];
  headers?: Record<string, string>;
  method: HttpVerbs;
  path: `/${string}`;
  queryString?: `?${string}`;
  source?: 'api-gateway' | 'lambda-url';
}): APIGatewayProxyEventV2 {
  const now = Date.now();
  const headers = {} as Record<string, string>;
  const requestContext = {
    accountId: '123456789012',
    http: {
      method: params.method,
      path: params.path,
      protocol: 'HTTP/1.1',
      sourceIp: '10.0.0.1',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
    },
    requestId: 'O02pKigLIAMEYlw=',
    routeKey: '$default',
    stage: '$default',
    time: '23/Nov/2023:00:35:06 +0000',
    timeEpoch: now - 50,
  } as APIGatewayProxyEventV2['requestContext'];

  const body = params.body
    ? Buffer.from(JSON.stringify(params.body)).toString('base64')
    : undefined;

  // Shared headers:
  headers['content-length'] = body ? `${body.length}` : '0';
  headers['accept-encoding'] = 'gzip, deflate, br';
  headers['accept-language'] = 'en-US,en;q=0.9';
  headers['sec-ch-ua'] =
    '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"';
  headers['sec-ch-ua-mobile'] = '?0';
  headers['sec-ch-ua-platform'] = '"macOS"';
  headers['sec-fetch-dest'] = 'document';
  headers['sec-fetch-mode'] = 'navigate';
  headers['sec-fetch-site'] = 'none';
  headers['sec-fetch-user'] = '?1';
  headers['upgrade-insecure-requests'] = '1';
  headers['user-agent'] =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';
  headers['x-forwarded-for'] = '10.0.0.1';
  headers['x-forwarded-port'] = '443';
  headers['x-forwarded-proto'] = 'https';
  headers['x-amzn-trace-id'] = 'Root=1-5fbb3bdf-7e577e577e577e577e577e57';
  headers['x-request-id'] = 'this-is-a-test-request-id';
  headers['x-perf-unix'] = `${now - 100}`;
  if (params.cookies) {
    headers['cookie'] = params.cookies.join('; ');
  }

  if (params.headers) {
    for (const [key, value] of Object.entries(params.headers)) {
      headers[key] = value;
    }
  }

  switch (params.source ?? 'api-gateway') {
    case 'api-gateway':
      {
        requestContext.apiId = 'exampleapi';
        requestContext.domainPrefix = 'exampleapi';
        requestContext.domainName =
          'exampleapi.execute-api.us-east-1.amazonaws.com';
      }

      break;
    case 'lambda-url':
      {
        requestContext.accountId = 'anonymous';
        requestContext.apiId = 'nowaymgv76jxglftuaoilxmuli0vlxjp';
        requestContext.domainPrefix = 'nowaymgv76jxglftuaoilxmuli0vlxjp';
        requestContext.domainName =
          'nowaymgv76jxglftuaoilxmuli0vlxjp.execute-api.us-east-1.amazonaws.com';

        headers['x-amzn-lambda-proxying-cell'] = '0';
        headers['x-amzn-tls-version'] = 'TLSv1.2';
        headers['sec-fetch-site'] = 'none';
        headers['x-forwarded-port'] = '443';
        headers['sec-fetch-user'] = '?1';
        headers['x-amzn-lambda-proxy-auth'] = [
          'HmacSHA256',
          'SignedHeaders=x-amzn-lambda-forwarded-client-ip;x-amzn-lambda-forwarded-host;x-amzn-lambda-proxying-cell',
          'Signature=Qx2elijHLfHoWw6kkzFzYCApPe8EBpzESjLQ9bmdbag=',
        ].join();
      }

      break;
    default:
      throw new Error(`Unknown test event source: [${params.source}]`);
  }

  if (params.addCloudFrontHeaders) {
    headers['cloudfront-forwarded-proto'] = 'https';
    headers['cloudfront-is-android-viewer'] = 'false';
    headers['cloudfront-is-desktop-viewer'] = 'true';
    headers['cloudfront-is-ios-viewer'] = 'false';
    headers['cloudfront-is-mobile-viewer'] = 'false';
    headers['cloudfront-is-smarttv-viewer'] = 'false';
    headers['cloudfront-is-tablet-viewer'] = 'false';
    headers['cloudfront-viewer-address'] = '10.0.0.1:52524';
    headers['cloudfront-viewer-asn'] = '12345';
    headers['cloudfront-viewer-city'] = 'City';
    headers['cloudfront-viewer-country'] = 'US';
    headers['cloudfront-viewer-country-name'] = 'United States';
    headers['cloudfront-viewer-country-region'] = 'FL';
    headers['cloudfront-viewer-country-region-name'] = 'Florida';
    headers['cloudfront-viewer-header-count'] = '15';
    headers['cloudfront-viewer-header-order'] = [
      'host',
      'cache-control',
      'sec-ch-ua',
      'sec-ch-ua-mobile',
      'sec-ch-ua-platform',
      'dnt',
      'upgrade-insecure-requests',
      'user-agent',
      'accept',
      'sec-fetch-site',
      'sec-fetch-mode',
      'sec-fetch-user',
      'sec-fetch-dest',
      'accept-encoding',
      'accept-language',
    ].join(':');

    headers['cloudfront-viewer-http-version'] = '2.0';
    headers['cloudfront-viewer-ja3-fingerprint'] =
      '54ceca84977f3398ed42d66c907e7e85';
    headers['cloudfront-viewer-latitude'] = '0.00000';
    headers['cloudfront-viewer-longitude'] = '-0.00000';
    headers['cloudfront-viewer-metro-code'] = '000';
    headers['cloudfront-viewer-postal-code'] = '00000';
    headers['cloudfront-viewer-time-zone'] = 'America/Chicago';
    headers['cloudfront-viewer-tls'] =
      'TLSv1.3:TLS_AES_128_GCM_SHA256:sessionResumed';
    headers['user-agent'] = 'Amazon CloudFront';
    headers['if-none-match'] = '"7704e61620ba6babcb4152bcbaa88e0e"';
    headers['if-modified-since'] = 'Thu, 23 Nov 2023 03:31:26 GMT';
    headers['via'] =
      '2.0 66c8459e8a4e9c21dff96b8c94d0887c.cloudfront.net (CloudFront)';
    headers['x-amz-cf-id'] =
      '3_U7RbHGLk8X2Zvs8uJ0XiJQe9ZB3fo3BWP9KvkWsxYUD1uR-dRiMQ==';
    headers['cache-control'] = 'max-age=0';
    headers['x-forwarded-for'] = '10.0.0.1, 64.252.77.216';
  }

  return {
    body,
    cookies: params.cookies,
    headers,
    isBase64Encoded: true,
    queryStringParameters: params.queryString
      ? parseQueryStringParameters(params.queryString)
      : undefined,
    rawPath: params.path,
    rawQueryString: params.queryString || '',
    requestContext,
    routeKey: '$default',
    version: '2.0',
  };
}

/**
 * Parses a query string into an object like API Gateway does.
 * @param url the URL to parse.
 * @returns an object with the query string parameters.
 */
function parseQueryStringParameters(url: string): { [key: string]: string } {
  const queryString = url.split('?')[1];
  const params: { [key: string]: string } = {};

  if (queryString) {
    const pairs = queryString.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      const decodedKey = decodeURIComponent(key);
      const decodedValue = decodeURIComponent(value);

      if (decodedKey in params) params[decodedKey] += `,${decodedValue}`;
      else params[decodedKey] = decodedValue;
    }
  }

  return params;
}
