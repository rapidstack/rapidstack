/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Context } from 'aws-lambda';

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
        if (issue.message === 'Invalid type') continue;
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
