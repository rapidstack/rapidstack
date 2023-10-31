/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { type Context } from 'aws-lambda';

export const MockLambdaContext: Context = {
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
};

export const MockLambdaDefaultEvent = {
  key1: 'value1',
  key2: 'value2',
  key3: 'value3',
} as any;

export const MockLambdaRuntime = async (
  handler: (event: any, context: any) => Promise<unknown>,
  testEvent = MockLambdaDefaultEvent,
  testContext = MockLambdaContext
) => {
  return await handler(testEvent, testContext);
};
