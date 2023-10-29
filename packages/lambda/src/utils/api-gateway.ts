import { type APIGatewayProxyEventV2 } from 'aws-lambda';

export const getApiGatewayHeaderValue = (
  event: APIGatewayProxyEventV2,
  header: string
): string | undefined => {
  const headers = event.headers;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!headers) return undefined;

  const caseInsensitiveHeader = Object.keys(headers).find(
    (key) => key.toLowerCase() === header.toLowerCase()
  );

  if (!caseInsensitiveHeader) return undefined;

  // eslint-disable-next-line security/detect-object-injection
  return headers[caseInsensitiveHeader];
};
