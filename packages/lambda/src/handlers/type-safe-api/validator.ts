/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import type { Output } from 'valibot';

import { ValiError, parse, parseAsync } from 'valibot';

import type { ICache, ILogger, ValibotSchema } from '../../index.js';

import { HttpValidationError } from '../../api/index.js';
import {
  isObjectSchema,
  parseGatewayEventBody,
  parseGatewayEventCookies,
} from '../../index.js';

type HttpCallValidationSchema<
  Body extends ValibotSchema | never = never,
  QSPs extends ValibotSchema | never = never,
  Headers extends ValibotSchema | never = never,
  Cookies extends ValibotSchema | never = never,
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
  rawEvent: APIGatewayProxyEventV2;
  validated: ValidatedSchemaOutput<Validated>;
}) => Promise<Return>;

type PossibleValidatedSchemaOutput<
  Schema extends HttpCallValidationSchema<any, any, any, any>,
> = {
  body: Schema['body'] extends ValibotSchema ? Output<Schema['body']> : never;
  cookies: Schema['cookies'] extends ValibotSchema
    ? Output<Schema['cookies']>
    : never;
  headers: Schema['headers'] extends ValibotSchema
    ? Output<Schema['headers']>
    : never;
  qsp: Schema['qsp'] extends ValibotSchema ? Output<Schema['qsp']> : never;
};

export type ValidatedSchemaOutput<
  Schema extends HttpCallValidationSchema<any, any, any, any>,
> = FilterOutNeverValues<PossibleValidatedSchemaOutput<Schema>>;

type GetNonNeverKeys<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends never ? never : K;
}[keyof T];

type FilterOutNeverValues<T extends Record<string, unknown>> = {
  [K in GetNonNeverKeys<T>]: T[K];
};

export type BaseApiRouteProps = {
  cache: ICache;
  context: Context;
  event: APIGatewayProxyEventV2;
  logger: ILogger;
};

export type TypeSafeApiRouteProps<
  Schema extends HttpCallValidationSchema<any, any, any, any>,
> = BaseApiRouteProps & { _schema: Schema };

export type HttpRouteValidator = <
  ValidationSchema extends HttpCallValidationSchema<
    Body,
    QSPs,
    Headers,
    Cookies
  >,
  Return,
  Body extends ValibotSchema | never,
  QSPs extends ValibotSchema | never,
  Headers extends ValibotSchema | never,
  Cookies extends ValibotSchema | never,
>(
  schema: ValidationSchema,
  runnerFunction: HttpRunnerFunction<ValidationSchema, Return>
) => (props: TypeSafeApiRouteProps<ValidationSchema>) => Promise<{
  body: string;
  headers: Record<string, string>;
  statusCode: number;
}>;

export const validate = <
  ValidationSchema extends HttpCallValidationSchema<
    Body,
    QSPs,
    Headers,
    Cookies
  >,
  Return,
  Body extends ValibotSchema | never,
  QSPs extends ValibotSchema | never,
  Headers extends ValibotSchema | never,
  Cookies extends ValibotSchema | never,
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
    const validated = await validateSchema(schema as object, event);

    return await runnerFunction({
      cache,
      context,
      logger,
      rawEvent: event,
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
  Body extends ValibotSchema | never = never,
  QSPs extends ValibotSchema | never = never,
  Headers extends ValibotSchema | never = never,
  Cookies extends ValibotSchema | never = never,
>(
  schema: ValidationSchema,
  event: APIGatewayProxyEventV2
): Promise<ValidatedSchemaOutput<ValidationSchema>> => {
  // Validate that the schemas that are passed in are valid:
  // - body can be any schema
  // - cookies, headers, and qsp must be an object schema
  // TODO: this can possibly be built into the type later on?
  if (
    (schema.cookies && !isObjectSchema(schema.cookies)) ||
    (schema.headers && !isObjectSchema(schema.headers)) ||
    (schema.qsp && !isObjectSchema(schema.qsp))
  ) {
    throw new Error(
      `For handler [${event.requestContext.http.method} ${event.rawPath}], ` +
        'all schemas except `body` must be object schemas'
    );
  }

  const bodyString = parseGatewayEventBody(event);
  const headers = event.headers;
  const cookies = parseGatewayEventCookies(event);
  const qsp = event.queryStringParameters;

  let body: object | string | undefined;
  try {
    body = bodyString ? JSON.parse(bodyString) : undefined;
  } catch {
    body = bodyString;
  }

  // Validate each part of the schema against incoming data
  const validated = {} as PossibleValidatedSchemaOutput<ValidationSchema>;
  const errors = {} as ConstructorParameters<typeof HttpValidationError>[0];

  try {
    validated.body = await parseWithSchema(schema.body, body);
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.body = [e, schema.body!, !!bodyString];
  }

  try {
    validated.headers = await parseWithSchema(schema.headers, headers);
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.headers = [e, schema.headers!, !!Object.keys(headers).length];
  }

  try {
    validated.cookies = await parseWithSchema(schema.cookies, cookies);
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.cookies = [e, schema.cookies!, !!Object.keys(cookies).length];
  }

  try {
    validated.qsp = await parseWithSchema(schema.qsp, qsp);
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.qsp = [e, schema.qsp!, qsp !== undefined];
  }

  if (Object.keys(errors).length) {
    throw new HttpValidationError(errors);
  }

  return validated;
};

/**
 * Parse a schema with data, returning the output or throwing an error
 * @param schema a valibot schema
 * @param data the data to parse from the user
 * @returns the output of the schema
 */
async function parseWithSchema<T extends ValibotSchema>(
  schema?: T,
  data?: unknown
): Promise<Output<ValibotSchema> | undefined> {
  if (!schema) return;

  if (schema.async) return await parseAsync(schema, data);
  return parse(schema, data);
}
