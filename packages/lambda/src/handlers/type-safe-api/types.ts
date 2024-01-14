/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';

import type {
  HttpCodes,
  HttpVerbs,
  TypeSafeApiRouteInfo,
} from '../../api/index.js';
import type { ICache, ILogger } from '../../index.js';
import type { TypeSafeApiRouteProps } from './validator.js';

// TODO: move
type CookiesObject = {
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

export type ResponseContext = {
  cookies: CookiesObject;
  headers: Record<Lowercase<string>, string>;
};

type CommonHookUtils = {
  cache: ICache;
  context: Context;
  logger: ILogger;
};

type CommonHookProps = {
  event: APIGatewayProxyEventV2;
  responseContext: ResponseContext;
} & CommonHookUtils;

type OnErrorHookProps = {
  error: unknown;
  event: APIGatewayProxyEventV2;
} & CommonHookProps;

type OnRequestEndHookProps = {
  result: ApiHandlerReturn;
} & CommonHookProps;

export type TypeSafeApiHandlerHooks = {
  /**
   * If an error is thrown in the runnerFunction, pre-request, or post-request
   * hooks, this function, if supplied, will be called to handle the error.
   * @param params The parameters passed to the function.
   * @param params.event The api event object passed to the lambda.
   * @param params.error The resulting error caught during lambda execution.
   * @param params.context The context object passed to the lambda.
   * @param params.logger A logger instance with request context.
   * @param params.cache The cache supplied from the toolkit.
   * @param params.responseContext The response context object - a mutable
   * object reference that can be used to set cookies and headers throughout the
   * request lifecycle.
   * @returns A valid API handler response that gracefully handles the error.
   */
  onError: (params: OnErrorHookProps) => Promise<ApiHandlerReturn>;
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
  onHotFunctionTrigger: (params: CommonHookUtils) => Promise<void>;
  /**
   * A function to run right before the Lambda container calls SIGTERM on the
   * node process. Can be used to safely wind down any resources that need to be
   * shut down before the process is terminated.
   * @returns void.
   */
  onLambdaShutdown: () => Promise<void>;
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
   * @param params.responseContext The response context object - a mutable
   * object reference that can be used to set cookies and headers throughout the
   * request lifecycle.
   * @returns The expected return type shape for the lambda.
   */
  onRequestEnd: (
    params: OnRequestEndHookProps
  ) => Promise<(() => APIGatewayProxyStructuredResultV2) | undefined>;
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
   * @param params.responseContext The response context object - a mutable
   * object reference that can be used to set cookies and headers throughout the
   * request lifecycle.
   * @returns A function that returns a valid API Gateway response object or
   * undefined.
   */
  onRequestStart: (
    params: CommonHookProps & { routeLookup: TypeSafeApiRouteInfo }
  ) => Promise<(() => APIGatewayProxyStructuredResultV2) | void>;
};

export type BaseApiHandlerReturn<Data> = {
  body?: Data;
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
  headers?: Record<Lowercase<string>, string>;
  statusCode?: HttpCodes;
};

// TODO: add more?
export type ApiHandler302Return<Data> = {
  body?: Data;
  cookies?: undefined;
  headers: {
    location: string;
  } & Record<string, string>;
  statusCode: 302;
};

export type ApiHandlerReturn<Data = any> =
  | ApiHandler302Return<Data>
  | BaseApiHandlerReturn<Data>;

export type TypedApiRouteConfig = {
  [key: string]: HttpRoute | TypedApiRouteConfig;
};

export type HttpRoute = {
  [key in Lowercase<HttpVerbs>]?: HttpRouteFunction;
};

export type BaseApiRouteProps = {
  cache: ICache;
  context: Context;
  devMode: boolean;
  event: APIGatewayProxyEventV2;
  logger: ILogger;
  responseContext: ResponseContext;
  routeLookup: TypeSafeApiRouteInfo;
};

export interface BareHttpRouteFunction<Return> {
  (p: BaseApiRouteProps): Promise<ApiHandlerReturn<Return>>;
  typed?: undefined;
}

export interface TypeSafeApiRouteFunction<Return> {
  (p: TypeSafeApiRouteProps<any>): Promise<ApiHandlerReturn<Return>>;
  pathParams?: {
    maxParams: number;
    minParams: number;
  };
  typed: true;
}

export type HttpRouteFunction<Return = any> =
  | BareHttpRouteFunction<Return>
  | TypeSafeApiRouteFunction<Return>;
