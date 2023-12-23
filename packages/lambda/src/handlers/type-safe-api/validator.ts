/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import type { Output } from 'valibot';

import { ValiError, parse, parseAsync } from 'valibot';

import type {
  ICache,
  ILogger,
  TypeSafeApiRouteInfo,
  ValibotSchema,
} from '../../index.js';
import type {
  ApiHandlerReturn,
  BaseApiRouteProps,
  ResponseContext,
  TypeSafeApiRouteFunction,
} from './types.js';

import { HttpValidationError } from '../../api/index.js';
import {
  getTupleInfo,
  isOptionalWrappedTuple,
  isSchema,
  parseGatewayEventBody,
  parseGatewayEventCookies,
} from '../../index.js';

type HttpCallValidationSchema<
  Body extends ValibotSchema | never = never,
  QSPs extends ValibotSchema | never = never,
  Headers extends ValibotSchema | never = never,
  Cookies extends ValibotSchema | never = never,
  PathParams extends ValibotSchema | never = never,
> = {
  body?: Body;
  cookies?: Cookies;
  headers?: Headers;
  pathParams?: PathParams;
  qsp?: QSPs;
};

export type HttpRunnerFunction<
  Validated extends HttpCallValidationSchema<any, any, any, any, any>,
  Return,
> = (props: {
  cache: ICache;
  context: Context;
  event: APIGatewayProxyEventV2;
  logger: ILogger;
  responseContext: ResponseContext;
  routeLookup: TypeSafeApiRouteInfo;
  validated: ValidatedSchemaOutput<Validated>;
}) => Promise<ApiHandlerReturn<Return>>;

type PossibleValidatedSchemaOutput<
  Schema extends HttpCallValidationSchema<any, any, any, any, any>,
> = {
  body: Schema['body'] extends ValibotSchema ? Output<Schema['body']> : never;
  cookies: Schema['cookies'] extends ValibotSchema
    ? Output<Schema['cookies']>
    : never;
  headers: Schema['headers'] extends ValibotSchema
    ? Output<Schema['headers']>
    : never;
  pathParams: Schema['pathParams'] extends ValibotSchema
    ? Output<Schema['pathParams']>
    : never;
  qsp: Schema['qsp'] extends ValibotSchema ? Output<Schema['qsp']> : never;
};

export type ValidatedSchemaOutput<
  Schema extends HttpCallValidationSchema<any, any, any, any, any>,
> = FilterOutNeverValues<PossibleValidatedSchemaOutput<Schema>>;

type GetNonNeverKeys<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends never ? never : K;
}[keyof T];

type FilterOutNeverValues<T extends Record<string, unknown>> = {
  [K in GetNonNeverKeys<T>]: T[K];
};

export type TypeSafeApiRouteProps<
  Schema extends HttpCallValidationSchema<any, any, any, any, any>,
> = BaseApiRouteProps & { _schema?: Schema };

export type HttpRouteValidator = <
  ValidationSchema extends HttpCallValidationSchema<
    Body,
    QSPs,
    Headers,
    Cookies,
    PathParams
  >,
  Return,
  Body extends ValibotSchema | never,
  QSPs extends ValibotSchema | never,
  Headers extends ValibotSchema | never,
  Cookies extends ValibotSchema | never,
  PathParams extends ValibotSchema | never,
>(
  schema: ValidationSchema,
  runnerFunction: HttpRunnerFunction<ValidationSchema, Return>
) => (props: TypeSafeApiRouteProps<ValidationSchema>) => Promise<{
  body: string;
  headers: Record<string, string>;
  statusCode: number;
}>;

/**
 * Validate a HTTP request route against a set of schema validations
 * @param schemas the collection of schemas to validate against
 * @param runnerFunction the handler function to run if the schemas are valid
 * @returns a function that can be used as a lambda handler
 */
export function validate<
  ValidationSchema extends HttpCallValidationSchema<
    Body,
    QSPs,
    Headers,
    Cookies,
    PathParams
  >,
  Return,
  Body extends ValibotSchema | never,
  QSPs extends ValibotSchema | never,
  Headers extends ValibotSchema | never,
  Cookies extends ValibotSchema | never,
  PathParams extends ValibotSchema | never,
>(
  schemas: ValidationSchema,
  runnerFunction: HttpRunnerFunction<ValidationSchema, Return>
): TypeSafeApiRouteFunction<Return> {
  const v: TypeSafeApiRouteFunction<Return> = async (
    props: TypeSafeApiRouteProps<ValidationSchema>
  ): Promise<ApiHandlerReturn<Return>> => {
    const validated = await validateSchema(schemas as object, props.event);

    return await runnerFunction({ ...props, validated });
  };

  // Pass some information back upstream with static properties on the function
  v.typed = !!schemas.pathParams as true;
  v.pathParams = getTupleInfo(schemas.pathParams);
  return v;
}

const validateSchema = async <
  ValidationSchema extends HttpCallValidationSchema<
    Body,
    QSPs,
    Headers,
    Cookies,
    PathParams
  >,
  Body extends ValibotSchema | never = never,
  QSPs extends ValibotSchema | never = never,
  Headers extends ValibotSchema | never = never,
  Cookies extends ValibotSchema | never = never,
  PathParams extends ValibotSchema | never = never,
>(
  schema: ValidationSchema,
  event: APIGatewayProxyEventV2
): Promise<ValidatedSchemaOutput<ValidationSchema>> => {
  // Validate that the schemas that are passed in are valid:
  // - body can be any schema
  // - cookies, headers, and qsp must be an object schema
  // TODO: this can possibly be built into the type later on?
  if (
    (schema.cookies && !isSchema(schema.cookies, 'object')) ||
    (schema.headers && !isSchema(schema.headers, 'object')) ||
    (schema.qsp && !isSchema(schema.qsp, 'object')) ||
    (schema.pathParams && !isSchema(schema.pathParams, 'tuple'))
  ) {
    throw new Error(
      `For handler [${event.requestContext.http.method} ${event.rawPath}], ` +
        'cookies, headers, and qsp must be an object schema ' +
        'and pathParams must be a tuple schema.'
    );
  }

  const bodyString = parseGatewayEventBody(event);
  const headers = event.headers;
  const cookies = parseGatewayEventCookies(event);
  const qsp = event.queryStringParameters;

  // This info appended from the route resolver, if path params matched
  const pathParams = (event as Record<string, any>)['_interpretedPathParams'];

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
    const parsed = await parseWithSchema(schema.body, body);
    if (parsed !== undefined) validated.body = parsed;
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.body = [e, schema.body!, !!bodyString];
  }

  try {
    const parsed = await parseWithSchema(schema.headers, headers);
    if (parsed !== undefined) validated.headers = parsed;
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.headers = [e, schema.headers!, !!Object.keys(headers).length];
  }

  try {
    const parsed = await parseWithSchema(schema.cookies, cookies);
    if (parsed !== undefined) validated.cookies = parsed;
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.cookies = [e, schema.cookies!, !!Object.keys(cookies).length];
  }

  try {
    const parsed = await parseWithSchema(schema.qsp, qsp);
    if (parsed !== undefined) validated.qsp = parsed;
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.qsp = [e, schema.qsp!, qsp !== undefined];
  }

  try {
    const parsed = await parseWithSchema(schema.pathParams, pathParams);

    // Remove any trailing undefined values from the path params
    // Corresponds to the hack in the route resolver to satisfy valibot's parse
    while (parsed?.length && parsed[parsed.length - 1] === undefined) {
      parsed.pop();
    }

    if (parsed !== undefined) validated.pathParams = parsed;
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.pathParams = [
      e,
      schema.pathParams!,
      !!Object.keys(pathParams).length,
    ];
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

  // a special exception for handling an optional tuple (valibot limitation):
  // if the data is undefined and the schema is an optional wrapped tuple
  // return an empty array
  if (isOptionalWrappedTuple(schema) && (data as unknown[])[0] === undefined) {
    return undefined;
  }

  if (schema.async) return await parseAsync(schema, data);
  return parse(schema, data);
}
