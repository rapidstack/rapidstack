export {};

/* import type { Context } from 'aws-lambada';
import type { BaseSchema, BaseSchemaAsync, Output } from 'valibot';

import { number, object, parse, parseAsync, string } from 'valibot';

type ValibotSchema = BaseSchema | BaseSchemaAsync;

type ApiValidatorSchemas = {
  body?: ValibotSchema;
  cookies?: ValibotSchema;
  headers?: ValibotSchema;
  qsp?: ValibotSchema;
};

type APIValidatorFunction = <Return = never, Extra = object>(
  schemas: ApiValidatorSchemas,
  runner: ApiRunnerFunction<Return, Extra>
) => Promise<Return>;

type ApiRunnerFunction<Return, Extra = object> = () => Promise<Return>;

export const validator: APIValidatorFunction = async <T>(
  schemas: ApiValidatorSchemas,
  runner: ApiRunnerFunction<T>
) => {
  if (schemas.body) {
    const parsedBody = schemas.body.async
      ? await parseAsync(schemas.body, {})
      : parse(schemas.body, {});

    console.log(parsedBody);
  }

  if (schemas.cookies) {
  }

  if (schemas.headers) {
  }

  if (schemas.qsp) {
  }

  return {} as T;
};

{
  // How can I get the type inferred from the validator function?

  const testingFn = <T extends ValibotSchema>(
    schema: T,
    fn: (obj: { valid: Output<T> }) => any
  ) => {
    fn({ valid: schema.async ? parseAsync(schema, {}) : parse(schema, {}) });
  };

  const testSchema = object({
    age: number(),
    name: string(),
  });

  testingFn(testSchema, ({ valid }) => {
    valid.age;
    valid.name;
  });
}

{
  // So we will need to wrap the validator function as follows:

  const validatorStructure =
    // This is what a validator function would look like when called in a route
    (schema: ApiValidatorSchemas, runnerFn: ApiRunnerFunction<any>) => {
      // This would be coming from the "handler" and what a route needs to accept
      async (event: any, context: any) => {
        // Validation would happen here and `validated` formatting would be applied

        return await runnerFn();
      };
    };
}

{
  // All but factory wrapper structure:
  const instantiatedHandler = (routes: {}, hooks: any) => {
    // Lambda Entry Point:
    return async (event: any, context: Context) => {
      let result;
      // handle any header debug flags here
      // Handle no-catch hooks here

      try {
        // Handle catching hooks here

        // Handle route lookup here
        const route = dummyLookupRoute(event);

        if (route) result = await route(event, context);
        else throw new Error('Future HttpError');

        return result;
      } catch (e) {
        // Error hook or standard error handling
        if (hooks.onError) result = await hooks.onError(e);
        else throw new Error('Future HttpError');
      }
    };
  };

  type WrappedValidator = (event: any, context: Context) => Promise<any>;

  function dummyLookupRoute(event: any): WrappedValidator | undefined {
    return;
  }
}
 */
