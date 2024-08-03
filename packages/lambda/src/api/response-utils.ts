/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';

import type { HttpCodes, ResponseContext } from '../index.js';
import type {
  ApiErrorResponseDev,
  ApiErrorResponseNoDev,
  ApiFailResponse,
  ApiInvalidResponse,
} from './types/response.js';

import {
  type ApiHandlerReturn,
  EnvKeys,
  getFlattenedSchemaInfo,
  getInternalEnvironmentVariable,
  makeCloudwatchUrl,
} from '../index.js';
import { HttpErrorExplanations } from './constants.js';
import { HttpError, HttpValidationError } from './http-errors.js';

/**
 * Builds an APIGatewayProxyStructuredResultV2 from the result object and
 * response context object.
 * @param result the result object from the route handler function
 * @param responseContext the response context object that originates from the
 * handler
 * @returns an APIGatewayProxyStructuredResultV2
 */
export function makeApiGatewayResponse(
  result: ApiHandlerReturn,
  responseContext: ResponseContext & {
    _conclusion: 'failure' | 'success';
    _statusCode: HttpCodes;
  }
): APIGatewayProxyStructuredResultV2 {
  const response: APIGatewayProxyStructuredResultV2 = {
    body: JSON.stringify(result.body),
  };

  const mergedResponse = mergeApiGatewayResponseWithContext(
    response,
    responseContext
  );

  return mergedResponse;
}

/**
 * Merges a response object and a response context object into a single response
 * @param response an APIGatewayProxyStructuredResultV2 object to merge
 * @param responseContext a response context object to merge
 * @returns an APIGatewayProxyStructuredResultV2
 */
export function mergeApiGatewayResponseWithContext(
  response: APIGatewayProxyStructuredResultV2,
  responseContext: ResponseContext & {
    _conclusion: 'failure' | 'success';
    _statusCode: HttpCodes;
  }
): APIGatewayProxyStructuredResultV2 {
  const mergedResponse = Object.assign(
    {
      statusCode: responseContext._statusCode,
    },
    response
  );

  const mergedHeaders = {
    ...responseContext.headers,
    ...response.headers,
  };
  if (Object.keys(mergedHeaders).length > 0) {
    mergedResponse.headers = mergedHeaders;
  }

  const mergedCookies = [
    ...(response.cookies ?? []),
    ...(buildCookiesFromObject(responseContext.cookies) ?? []),
  ];

  if (mergedCookies.length > 0) {
    mergedResponse.cookies = mergedCookies;
  }

  return mergedResponse;
}

/**
 * Builds an array of cookie strings from an object of cookies options.
 * @param cookieObject an object of cookie options
 * @returns an array of cookie strings
 */
export function buildCookiesFromObject(
  cookieObject: ApiHandlerReturn['cookies']
): string[] | undefined {
  if (!cookieObject) return undefined;
  if (Object.keys(cookieObject).length === 0) return undefined;

  let cookieString = '';
  const cookiesArray = [];
  for (const cookie in cookieObject) {
    // eslint-disable-next-line security/detect-object-injection
    cookieString = `${cookie}=${cookieObject[cookie].value}`;

    // eslint-disable-next-line security/detect-object-injection
    if (cookieObject[cookie].options) {
      const {
        domain,
        expiresUnix,
        httpOnly,
        maxAge,
        path,
        sameSite,
        secure,
        // eslint-disable-next-line security/detect-object-injection
      } = cookieObject[cookie].options;

      if (domain) cookieString += `; Domain=${domain}`;
      if (expiresUnix)
        cookieString += `; Expires=${new Date(expiresUnix).toUTCString()}`;
      if (httpOnly) cookieString += `; HttpOnly`;
      if (maxAge) cookieString += `; Max-Age=${maxAge}`;
      if (path) cookieString += `; Path=${path}`;
      if (sameSite) cookieString += `; SameSite=${sameSite}`;
      if (secure) cookieString += `; Secure`;
    }

    cookiesArray.push(cookieString);
  }

  return cookiesArray;
}

/**
 * Formats a validation or other 4xx error response to the standard shape.
 * Rethrowing all errors that aren't eligible for the criteria.
 * @param error the thrown error to try and handle
 * @returns an object with the formatted body and status code of the API
 * response
 * @throws an error if the error is not an HttpError(4xx) or HttpValidationError
 */
export function default4xxErrorHandler(error: unknown): ApiHandlerReturn {
  if (error instanceof HttpError && error.code < 500) {
    const data = make4xxFailBody(error);
    return {
      body: data,
      statusCode: error.code,
    };
  }

  if (error instanceof HttpValidationError) {
    const data = makeValidationIssueBody(error);
    return {
      body: data,
      statusCode: 400,
    };
  }

  throw error;
}

/**
 * Formats an error response for HTTP 5xx errors.
 * @param err the thrown error
 * @param devMode if the handler is configured to run in dev mode
 * @param context lambda context
 * @returns an APIGatewayProxyResultV2
 */
export function default5xxErrorHandler(
  err: unknown,
  devMode: boolean,
  context: Context
): ApiErrorResponseDev | ApiErrorResponseNoDev {
  // Default to 500 code
  const errOutput: ApiErrorResponseNoDev = {
    data: {
      description: HttpErrorExplanations[500]['message'],
      requestId: context.awsRequestId,
      title: HttpErrorExplanations[500]['name'],
    },
    status: 'error',
  };

  if (err instanceof HttpError) {
    errOutput.data.description = HttpErrorExplanations[err.code]['message'];
    errOutput.data.title = HttpErrorExplanations[err.code]['name'];
  }

  if (devMode) {
    const errOutputPtr = errOutput as unknown as ApiErrorResponseDev;

    errOutputPtr.data.devMode = true;
    errOutputPtr.data.error = {
      message: (err as any)?.message,
      stackTrace: (err as any)?.stack?.toString(),
    };

    if (err instanceof Error && err.cause) {
      errOutputPtr.data.error.cause =
        err.cause instanceof Error ? err.cause.message : err.cause.toString();
    }

    // If sst is running locally, logs will be available in the terminal
    if (!getInternalEnvironmentVariable(EnvKeys.SST_LOCAL)) {
      errOutputPtr.data.logs = makeCloudwatchUrl(context);
    }
  }

  return errOutput;
}

/**
 * Formats a 4xx error response to the standard shape.
 * @param error the error to format
 * @returns an object with the formatted body and status code of the API
 * response
 */
export function make4xxFailBody(error: HttpError): ApiFailResponse {
  return {
    data: {
      description: HttpErrorExplanations[error.code].message,
      title: HttpErrorExplanations[error.code].name,
    },
    status: 'fail',
  };
}

/**
 * Formats a validation error response to the standard shape.
 * @param error the HttpValidationError to format
 * @returns an object with the formatted body and status code of the API
 * response
 */
export function makeValidationIssueBody(
  error: HttpValidationError
): ApiInvalidResponse {
  const messages: string[] = [];
  const schemas: Record<string, string[]> = {};

  Object.entries(error.validationErrors).forEach(
    ([category, [err, schema, hasInput]]) => {
      if (!hasInput) messages.push(`No input was provided for ${category}.`);

      for (const issue of err.issues) {
        if (issue.message.startsWith('Invalid type')) continue;
        messages.push(issue.message);
      }

      const schemaLines = getFlattenedSchemaInfo(schema, category)
        .split('\n')
        .filter((str) => str.length);

      // eslint-disable-next-line security/detect-object-injection
      schemas[category] = schemaLines;
    }
  );

  return {
    data: {
      description: HttpErrorExplanations[400].message,
      messages,
      schema: schemas,
      title: HttpErrorExplanations[400].name,
    },
    status: 'invalid',
  };
}
