/**
 * The API response format is loosely based on the JSend specification.
 *
 * Instead of having response objects based on a discriminated union of 3
 * status values, there are 4 with this version:
 *
 * - `success`: The request was successful and the data is present
 *
 * - `error`: The request had issues server-side and could not be processed.
 *
 * - `fail`: The request had no issues server-side, but the request could not be
 *    processed due to issues. (non-400 validation issues)
 *
 * - `invalid`: The request had invalid input and info on what is invalid is
 *    provided to the client. (400 validation issues)
 *
 * As a basis for the "bad" responses, all must include a title and description.
 */

export type ApiSuccessResponse = {
  data: NonNullable<unknown> | null;
  status: 'success';
};

export type ApiFailResponse = {
  data: {
    description: string;
    title: string;
  };
  status: 'fail';
};

export type ApiInvalidResponse = {
  data: {
    description: string;
    messages: string[];
    schema: {
      body?: string[];
      cookies?: string[];
      headers?: string[];
      params?: string[];
      qsp?: string[];
    };
    title: string;
  };
  status: 'invalid';
};

export type ApiErrorResponseNoDev = {
  data: {
    description: string;
    requestId: string;
    title: string;
  };
  status: 'error';
};

export type ApiErrorResponseDev = {
  data: {
    description: string;
    requestId: string;
    title: string;
  } & DevEnabledErrorData;
  status: 'error';
};

type DevEnabledErrorData = {
  devMode: true;
  error: {
    cause?: string;
    message?: string;
    stackTrace?: string;
  };
  logs?: string;
};

export type ApiResponse =
  | ApiErrorResponseDev
  | ApiErrorResponseNoDev
  | ApiFailResponse
  | ApiInvalidResponse
  | ApiSuccessResponse;
