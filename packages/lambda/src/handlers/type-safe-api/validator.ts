/* eslint-disable @typescript-eslint/no-explicit-any */
import { type APIGatewayProxyEventV2, type Context } from 'aws-lambda';
import {
  type BaseSchema,
  type BaseSchemaAsync,
  type Output,
  object,
  parse,
  parseAsync,
  string,
} from 'valibot';

import { type ICache, type ILogger } from '../../index.js';

type ValibotSchema = BaseSchema | BaseSchemaAsync;

type HttpCallValidationSchema<
  Body extends ValibotSchema | undefined = undefined,
  QSPs extends ValibotSchema | undefined = undefined,
  Headers extends ValibotSchema | undefined = undefined,
  Cookies extends ValibotSchema | undefined = undefined,
> = {
  body?: Body;
  cookies?: Cookies;
  headers?: Headers;
  qsp?: QSPs;
};

export type HttpRunnerFunction<
  Validated extends HttpCallValidationSchema<any, any, any, any>,
  Return,
> = (props: {
  cache: ICache;
  context: Context;
  logger: ILogger;
  validated: ValidatedSchemaOutput<Validated>;
}) => Promise<Return>;

export type ValidatedSchemaOutput<
  Schema extends HttpCallValidationSchema<any, any, any, any>,
> = {
  body: Schema['body'] extends ValibotSchema
    ? Output<Schema['body']>
    : undefined;
  cookies: Schema['cookies'] extends ValibotSchema
    ? Output<Schema['cookies']>
    : undefined;
  headers: Schema['headers'] extends ValibotSchema
    ? Output<Schema['headers']>
    : undefined;
  qsp: Schema['qsp'] extends ValibotSchema ? Output<Schema['qsp']> : undefined;
};

export type TypeSafeApiRouteProps<
  Schema extends HttpCallValidationSchema<any, any, any, any>,
> = {
  cache: ICache;
  context: Context;
  event: APIGatewayProxyEventV2;
  logger: ILogger;
} & {
  _schema: Schema;
};

// This isn't needed?
// export type HttpRouteValidator = <
//   ValidationSchema extends HttpCallValidationSchema<
//     Body,
//     QSPs,
//     Headers,
//     Cookies
//   >,
//   Body extends ValibotSchema | undefined,
//   QSPs extends ValibotSchema | undefined = undefined,
//   Headers extends ValibotSchema | undefined = undefined,
//   Cookies extends ValibotSchema | undefined = undefined,
// >(
//   schema: ValidationSchema,
//   runnerFunction: HttpRunnerFunction<ValidationSchema>
// ) => (props: TypeSafeApiRouteProps) => Promise<{
//   body: string;
//   headers: Record<string, string>;
//   statusCode: number;
// }>;

export const validate = <
  ValidationSchema extends HttpCallValidationSchema<
    Body,
    QSPs,
    Headers,
    Cookies
  >,
  Return,
  Body extends ValibotSchema | undefined,
  QSPs extends ValibotSchema | undefined = undefined,
  Headers extends ValibotSchema | undefined = undefined,
  Cookies extends ValibotSchema | undefined = undefined,
>(
  schema: ValidationSchema,
  runnerFunction: HttpRunnerFunction<ValidationSchema, Return>
) => {
  return async ({
    cache,
    context,
    event,
    logger,
  }: TypeSafeApiRouteProps<ValidationSchema>): Promise<Return> => {
    // Validation would happen here and `validated` formatting would be applied
    const validated = await validateSchema(schema as object, event);

    return await runnerFunction({
      cache,
      context,
      logger,
      validated,
    });
  };
};

const validateSchema = async <
  ValidationSchema extends HttpCallValidationSchema<
    Body,
    QSPs,
    Headers,
    Cookies
  >,
  Body extends ValibotSchema | undefined = undefined,
  QSPs extends ValibotSchema | undefined = undefined,
  Headers extends ValibotSchema | undefined = undefined,
  Cookies extends ValibotSchema | undefined = undefined,
>(
  schema: ValidationSchema,
  event: APIGatewayProxyEventV2
): Promise<ValidatedSchemaOutput<ValidationSchema>> => {
  // Extract details from event shape
  const body =
    event.isBase64Encoded && event.body
      ? Buffer.from(event.body, 'base64')
      : event.body;

  const headers = event.headers;

  const cookies = event.cookies;

  const qsp = event.queryStringParameters;

  // Validate each part of the schema against incoming data
  const validated = {} as ValidatedSchemaOutput<ValidationSchema>;
  if (schema.body) {
    const parsedBody = schema.body.async
      ? await parseAsync(schema.body, body)
      : parse(schema.body, body);

    validated.body = parsedBody;
  }

  if (schema.cookies) {
    const parsedCookies = schema.cookies.async
      ? await parseAsync(schema.cookies, cookies)
      : parse(schema.cookies, cookies);

    validated.cookies = parsedCookies;
  }

  if (schema.headers) {
    const parsedHeaders = schema.headers.async
      ? await parseAsync(schema.headers, headers)
      : parse(schema.headers, headers);

    validated.headers = parsedHeaders;
  }

  if (schema.qsp) {
    const parsedQsp = schema.qsp.async
      ? await parseAsync(schema.qsp, qsp)
      : parse(schema.qsp, qsp);

    validated.qsp = parsedQsp;
  }

  return validated;
};

const test = validate(
  {
    body: object({
      foo: string(),
    }),
  },
  async ({ logger, validated }) => {
    logger.info('validated foo: ' + validated.body.foo);
    return validated.body.foo;
  }
);

type tt = Output<Parameters<typeof test>[0]['_schema']['body']>;
