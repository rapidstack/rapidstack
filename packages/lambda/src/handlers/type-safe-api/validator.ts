/* eslint-disable @typescript-eslint/no-explicit-any */
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import type { BaseSchema, BaseSchemaAsync, Output } from 'valibot';

import { ValiError, parse, parseAsync } from 'valibot';

import type { ICache, ILogger } from '../../index.js';

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
    // Validation would happen here and `validated` formatting would be applied
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
  // Extract details from event shape
  // TODO: in the future it would be nice to support different content types for
  // the body, but for now we will assume JSON
  const bodyString =
    event.isBase64Encoded && event.body
      ? Buffer.from(event.body, 'base64').toString()
      : event.body;

  // FIXME: need to throw a 400 here manually if the body is not valid JSON
  const body = bodyString ? JSON.parse(bodyString) : undefined;

  const headers = event.headers;

  const cookies = {} as Record<string, string>;
  if (event.cookies) {
    for (const cookie of event.cookies) {
      const [key, value] = cookie.split('=');

      // eslint-disable-next-line security/detect-object-injection
      cookies[key] = value;
    }
  }

  const qsp = event.queryStringParameters;

  // Validate each part of the schema against incoming data
  // FIXME: collect the errors for each segment and return them all at once
  const validated = {} as ValidatedSchemaOutput<ValidationSchema>;
  if (schema.body) {
    // console.log(schema.body);
    try {
      const parsedBody = schema.body.async
        ? await parseAsync(schema.body, body)
        : parse(schema.body, body);
    } catch (e) {
      console.log(resolveSchemaError(e, schema.body!));
    }

    validated.body = {} as any;
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

// const resolveSchemaError = (error: unknown, schema: ValibotSchema) => {
//   if (!(error instanceof ValiError)) return error; // idk tbd

//   // deduce the problem and whole schema
// };

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
