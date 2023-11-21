/* eslint-disable @typescript-eslint/no-explicit-any */
import { type APIGatewayProxyEventV2, type Context } from 'aws-lambda';

import { type HttpNonErrorCodes } from '../../api/index.js';
import { type ICache, type ILogger } from '../../index.js';

type CommonHookUtils = {
  cache: ICache;
  context: Context;
  logger: ILogger;
};

type CommonHookProps = {
  event: APIGatewayProxyEventV2;
} & CommonHookUtils;

type OnErrorHookProps = {
  error: unknown;
} & CommonHookProps;

type OnRequestEndHookProps = {
  result: ApiHandlerReturn;
} & CommonHookProps;

export type TypeSafeApiHandlerOptions = {
  /**
   * If an error is thrown in the runnerFunction, pre-request, or post-request
   * hooks, this function, if supplied, will be called to handle the error.
   * @param params The parameters passed to the function.
   * @param params.event The api event object passed to the lambda.
   * @param params.error The resulting error caught during lambda execution.
   * @param params.context The context object passed to the lambda.
   * @param params.logger A logger instance with request context.
   * @param params.cache The cache supplied from the toolkit.
   * @returns A valid API handler response that gracefully handles the error.
   */
  onError?: (params: OnErrorHookProps) => Promise<ApiHandlerReturn>;
  /**
   * If the lambda is configured to be a "hot function", this routine is called
   * to handle resources that need to be kept warm.
   *
   * _Note: If this function is supplied, the `onColdStart` function will not be
   * called._
   * @param params The parameters passed to the function.
   * @param params.context The context object passed to the lambda.
   * @param params.logger A logger instance with request context.
   * @param params.cache The cache supplied from the toolkit.
   * @returns void.
   */
  onHotFunctionTrigger?: (params: CommonHookUtils) => Promise<void>;
  /**
   * A function to run right before the Lambda container calls SIGTERM on the
   * node process. Can be used to safely wind down any resources that need to be
   * shut down before the process is terminated.
   * @returns void.
   */
  onLambdaShutdown?: () => Promise<void>;
  /**
   * A function to run after the main lambda handler function is called.
   * Receives the result of the main function and can be used to transform the
   * result before returning it to the caller or trigger an early exit by
   * supplying a function that returns a valid response.
   *
   * Anything thrown in this function will be caught and handled by the
   * `onError` function, if supplied.
   * @param params The parameters passed to the function.
   * @param params.context The context object passed to the lambda.
   * @param params.logger A logger instance with request context.
   * @param params.cache The cache supplied from the toolkit.
   * @param params.result The result of the main lambda handler function.
   * @param params.event The event object passed to the lambda.
   * @returns The expected return type shape for the lambda.
   */
  onRequestEnd?: (
    params: OnRequestEndHookProps
  ) => Promise<(() => ApiHandlerReturn) | void>;
  /**
   * A function to run before the main lambda handler function is called. Can be
   * used to transform and/or enrich the main function's parameters by returning
   * an object with the desired parameters, or trigger an early exit by
   * supplying a function that returns a valid response.
   *
   * Anything thrown in this function will be caught and handled by the
   * `onError` function, if supplied.
   * @param params The parameters passed to the function.
   * @param params.context The context object passed to the lambda.
   * @param params.logger A logger instance with request context.
   * @param params.cache The cache supplied from the toolkit.
   * @param params.event The api event object passed to the lambda.
   * @returns The expected return type shape for the lambda.
   */
  onRequestStart?: (
    params: CommonHookProps
  ) => Promise<(() => ApiHandlerReturn) | void>;
};

type BaseApiHandlerReturn = {
  body?: any;
  cookies?: {
    [key: string]: {
      options?: {
        domain?: string;
        expiresUnix?: number;
        httpOnly?: boolean;
        maxAge?: number;
        path?: string;
        sameSite?: 'lax' | 'none' | 'strict';
        secure?: boolean;
      };
      value: string;
    };
  };
  headers?: Record<string, string>;
  statusCode: HttpNonErrorCodes;
};

// TODO: add more?
type ApiHandler302Return = {
  body?: any;
  cookies?: undefined;
  headers: {
    location: string;
  } & Record<string, string>;
  statusCode: 302;
};

type ApiHandlerReturn = ApiHandler302Return | BaseApiHandlerReturn;

// My take on JSend:
type ApiSuccessResponse = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  data: {} | null;
  status: 'success';
};

type ApiFailResponse = {
  data: {
    description: string;
    title: string;
  };
  status: 'fail';
};

type ApiErrorResponse = {
  data: {
    description: string;
    requestId: string;
    title: string;
  } & (DevDisabledErrorData | DevEnabledErrorData);
  status: 'error';
};

type DevEnabledErrorData = {
  devMode: true;
  logGroup?: string;
  stackTrace?: string;
};

type DevDisabledErrorData = {
  devMode: false;
};

export type ApiResponse =
  | ApiErrorResponse
  | ApiFailResponse
  | ApiSuccessResponse;
