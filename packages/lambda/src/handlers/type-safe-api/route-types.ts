import { type Output, object, optional, string } from 'valibot';

import { type HttpVerbs } from '../../api/index.js';
import { type TypeSafeApiRouteProps, validate } from './validator.js';

export type TypedApiRouteConfig = {
  [key: string]: HttpRoute | TypedApiRouteConfig;
};

type HttpRoute = {
  [key in Lowercase<HttpVerbs>]?: (
    p: TypeSafeApiRouteProps<any>
  ) => Promise<any>;
};

const test1 = {
  api: {
    business: {
      // clients: {
      //   get: async ({ logger }) => {
      //     logger.info('hello');
      //     return 'hello';
      //   },
      // },
      products: {
        get: validate(
          {
            body: object({ foo: optional(string()) }),
          },
          async () => true
        ),
        post: validate(
          {
            body: object({ foo: string() }),
          },
          async () => 'hello'
        ),
      },
    },
  },
} satisfies TypedApiRouteConfig;

type _Prefix<K, Root extends boolean = true> = K extends string
  ? `${Root extends true ? '' : '/'}${K}`
  : never;

type ObjectKeyPaths<
  T extends object,
  Root extends boolean = true,
  _KOT extends keyof T = keyof T,
> = _KOT extends unknown
  ?
      | _Prefix<_KOT, Root>
      | (T[_KOT] extends object
          ? `${_Prefix<_KOT, Root> extends string
              ? _Prefix<_KOT, Root>
              : ''}${ObjectKeyPaths<T[_KOT], false>}`
          : never)
  : never;

type tt1 = ObjectKeyPaths<typeof test1>;

type LookupFlattenedObject<
  T extends object,
  K extends string,
> = K extends `${infer Key}/${infer Rest}` // If K extends "key/rest"
  ? Key extends keyof T // Check if key is a key of object T
    ? T[Key] extends object // If so, check if the value is an object
      ? LookupFlattenedObject<T[Key], Rest> // If so, lookup the flattened object of that value
      : never // If no flattened object, return never
    : never // If key is not an object, return never
  : K extends keyof T // if key is not a key of object T, check K as a key of T
  ? T[K] // type key of T as K ---- type: {"a": typeof K}
  : never; // Otherwise return never --- type: never

type tt2 = LookupFlattenedObject<typeof test1, 'api/v1'>; // { get: () => Promise<string>; }

// Create a type to return a map of the valid paths leading to HTTPVerbs and their functions
type HTTPRouteMap<T extends object> = {
  [key in ObjectKeyPaths<T> as string extends any
    ? LookupFlattenedObject<T, key> extends HttpRoute
      ? key
      : never
    : never]: {
    [newKey in keyof LookupFlattenedObject<
      T,
      key
    > as newKey extends Lowercase<HttpVerbs>
      ? newKey
      : never]: LookupFlattenedObject<T, key>[newKey];
  };
};

type test5 = HTTPRouteMap<typeof test1>; // { "a/b/c": { get: () => Promise<string>; }; }
type test55 = ReturnType<
  HTTPRouteMap<typeof test1>['api/business/products']['get']
>;

type Override<A, B> = Omit<A, keyof B> & {
  [K in keyof B as B[K] extends never ? never : K]: B[K];
};

type test6 = Output<
  Parameters<
    Override<test5, test5>['api/business/products']['get']
  >[0]['_schema']['body']
>;
