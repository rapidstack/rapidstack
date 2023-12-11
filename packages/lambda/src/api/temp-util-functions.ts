import {
  ApiHandlerReturn,
  ApiSuccessResponse,
  BaseApiHandlerReturn,
} from '../handlers/type-safe-api/types.js';

type StandardJsonResponse = {
  body: object;
  headers?: BaseApiHandlerReturn['headers'];
  cookies?: BaseApiHandlerReturn['cookies'];
  statusCode?: BaseApiHandlerReturn['statusCode'];
};

export function returnStandardJsonResponse(
  props: StandardJsonResponse
): ApiHandlerReturn {
  const { body: rawBodyObj = null, ...rest } = props;

  const body = {
    status: 'success',
    data: rawBodyObj,
  } as ApiSuccessResponse;

  return {
    ...rest,
    body,
  };
}
