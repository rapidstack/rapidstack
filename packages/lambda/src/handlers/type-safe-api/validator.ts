/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import type { BaseSchema, BaseSchemaAsync, Output } from 'valibot';

import { ValiError, parse, parseAsync } from 'valibot';

import type { ICache, ILogger } from '../../index.js';

import {
  isObjectSchema,
  parseGatewayEventBody,
  parseGatewayEventCookies,
} from '../../index.js';

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
  rawEvent: APIGatewayProxyEventV2;
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
  Body extends ValibotSchema | undefined,
  QSPs extends ValibotSchema | undefined = undefined,
  Headers extends ValibotSchema | undefined = undefined,
  Cookies extends ValibotSchema | undefined = undefined,
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
  Body extends ValibotSchema | undefined,
  QSPs extends ValibotSchema | undefined,
  Headers extends ValibotSchema | undefined,
  Cookies extends ValibotSchema | undefined,
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
  Body extends ValibotSchema | undefined = undefined,
  QSPs extends ValibotSchema | undefined = undefined,
  Headers extends ValibotSchema | undefined = undefined,
  Cookies extends ValibotSchema | undefined = undefined,
>(
  schema: ValidationSchema,
  event: APIGatewayProxyEventV2
): Promise<ValidatedSchemaOutput<ValidationSchema>> => {
  // Validate that the schemas that are passed in are valid:
  // - body can be any schema
  // - cookies, headers, and qsp must be an object schema
  // this can possibly be built into the type later on?
  if (
    !isObjectSchema(schema.cookies) ||
    !isObjectSchema(schema.headers) ||
    !isObjectSchema(schema.qsp)
  ) {
    throw new Error('cookies, headers, and qsp must be an object schemas');
  }

  const bodyString = parseGatewayEventBody(event);
  const headers = event.headers;
  const cookies = parseGatewayEventCookies(event);
  const qsp = event.queryStringParameters;

  let body: object | string | undefined;
  try {
    bodyString ? JSON.parse(bodyString) : undefined;
  } catch {}

  // Validate each part of the schema against incoming data
  const validated = {} as ValidatedSchemaOutput<ValidationSchema>;
  const errors: [Error, ValibotSchema][] = [];

  try {
    validated.body = await parseWithSchema(schema.body, body);
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.push([e, schema.body!]);
  }

  try {
    validated.headers = await parseWithSchema(schema.headers, headers);
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.push([e, schema.headers!]);
  }

  try {
    validated.cookies = await parseWithSchema(schema.cookies, cookies);
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.push([e, schema.cookies!]);
  }

  try {
    validated.qsp = await parseWithSchema(schema.qsp, qsp);
  } catch (e) {
    if (!(e instanceof ValiError)) throw e;
    errors.push([e, schema.qsp!]);
  }

  if (errors.length) {
    throw new Error(errors.join(', '));
  }

  return validated;
};

/**
 *
 * @param schema
 * @param data
 */
async function parseWithSchema<T extends ValibotSchema>(
  schema?: T,
  data?: unknown
): Promise<Output<ValibotSchema> | undefined> {
  if (!data || !schema) return;

  if (schema.async) return await parseAsync(schema, data);
  return parse(schema, data);
}

const resolveSchemaError = (error: unknown, schema: ValibotSchema) => {
  if (!(error instanceof ValiError)) {
    // Handle non-validation errors in some way. Perhaps rethrowing them.
    throw error;
  }

  console.log('schema', JSON.stringify(schema, null, 2));

  const selected = schema;

  // need to recursively go through the schema entries:
  // while (selected.entries!) {
  // console.log(schema.entries);
  //   selected = selected.entries[]
  // }
};
// const resolveSchemaError = (error: unknown, schema: BaseSchema) => {
//   if (!(error instanceof ValiError)) {
//     // Handle non-validation errors in some way. Perhaps rethrowing them.
//     throw error;
//   }

//   // Initialize an errors object that will hold user-friendly error messages
//   const errors: Record<string, string> = {};

//   // Iterate over all issues to build a meaningful error object
//   error.issues.forEach((issue) => {
//     let errorMsg = issue.message;
//     // Issue could be related to a specific path in the schema
//     // If the path is available, we use it to show a precise error location
//     const path = issue.path?.join('.') || '';

//     if (path) {
//       errorMsg += ` at ${path}`;
//     }

//     if (!errors[issue.validation]) {
//       errors[issue.validation] = errorMsg;
//     }
//   });

//   // Now let’s gather the expected schema structure for the missing parts
//   const gatherSchemaInfo = (
//     schema: BaseSchema,
//     pathPrefix: string = ''
//   ): Record<string, string> => {
//     const schemaInfo: Record<string, string> = {};
//     // @ts-ignore
//     if (schema.type === 'object' && schema.entries) {
//       // @ts-ignore
//       Object.entries(schema.entries).forEach(([key, entrySchema]) => {
//         const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key;
//         // @ts-ignore
//         schemaInfo[fullPath] = `Expected type ${entrySchema.type}`;
//         // @ts-ignore
//         if (entrySchema.type === 'object') {
//           // @ts-ignore
//           Object.assign(schemaInfo, gatherSchemaInfo(entrySchema, fullPath));
//         }
//       });
//     }

//     // You can extend this function to handle other schema types like arrays, etc.
//     return schemaInfo;
//   };

//   const expectedSchemaStructure = gatherSchemaInfo(schema);

//   // Merge the validation issues with the expected schema structure
//   const validationResult = {
//     errors,
//     expectedSchema: expectedSchemaStructure,
//   };

//   return validationResult;
// };

// const test = validate(
//   {
//     body: object({
//       bar: number(),
//       foo: string(),
//     }),
//     headers: object({
//       'x-foo': string(),
//     }),
//   },
//   async ({ logger, validated }) => {
//     logger.info('validated foo: ' + validated.body.foo);
//     logger.info('validated bar: ' + validated.body.bar);
//     return validated.body.foo;
//   }
// );

// type tt = Output<Parameters<typeof test>[0]['_schema']['body']>;
// //    ^?
