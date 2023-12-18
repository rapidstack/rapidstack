import type {
  ApiHandlerReturn,
  ApiSuccessResponse,
  BaseApiHandlerReturn,
} from '../index.js';

type StandardJsonResponse = {
  body: object;
  cookies?: BaseApiHandlerReturn['cookies'];
  headers?: BaseApiHandlerReturn['headers'];
  statusCode?: BaseApiHandlerReturn['statusCode'];
};

/**
 * Takes expected response body, headers, status code, and cookies and formats
 * it in a JSend-like format.
 * @param props the expected response body, headers, status code, and cookies
 * @returns a JSend formatted response
 */
export function makeStandardJsonResponse(
  props: StandardJsonResponse
): ApiHandlerReturn {
  const { body: rawBodyObj = null, ...rest } = props;

  const body = {
    data: rawBodyObj,
    status: 'success',
  } as ApiSuccessResponse;

  return {
    ...rest,
    body,
  };
}
