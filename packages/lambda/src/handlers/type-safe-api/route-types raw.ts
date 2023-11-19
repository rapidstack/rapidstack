const obj = {
  a: {
    b: {
      c: {
        d: {
          patch: async () => 'hello' as const,
        },
        get: async () => 'hello' as const,
        post: async () => 'hello' as const,
      },
      get: async () => 'hello' as const,
    },
  },
};

type strObj = {
  [key: string]:
    | {
        [key: string]:
          | {
              [key: string]:
                | {
                    [key: string]: string;
                  }
                | string;
            }
          | string;
      }
    | string;
};
// create a type that can flatten the object into a single level separated by /
// example: { a: { b: { c: { d: "hello" } } } } => { "a/b/c/d": "hello" }
// type flattenObj<T extends strObj> = {
//   [key in keyof T]: T[key] extends string ? key : never;
// }[keyof strObj];

// type test = flattenObj<typeof obj>; // "a/b/c/d"

// Take 2
type HTTPVerbs = 'delete' | 'get' | 'patch' | 'post' | 'put';
type AF = (...args: any[]) => Promise<any>;
type HTTPRoute = { [key in HTTPVerbs]?: AF };

// Idea 1, but we don't ever want to evaluate the function on its own
// type Flatten2<T extends Record<string, any> | AF> = T extends AF ? 'function' : T extends Record<string, any> ? 'object' : never;

type Flatten2<T extends AF | Record<string, AF | any>> = T extends HTTPRoute
  ? 'HTTP Route'
  : T extends Record<string, any>
  ? 'key: object'
  : never;

type test2 = Flatten2<typeof obj.a.b>; // "object"

type _Prefix<K, Root extends boolean = true> = K extends number
  ? `/${K}` | `/[${K}]` | `[${K}]`
  : K extends string
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

type test3 = ObjectKeyPaths<typeof obj>;

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

type test4 = LookupFlattenedObject<typeof obj, 'a/b/c'>; // { get: () => Promise<string>; }
type test41 = LookupFlattenedObject<typeof obj, 'a'>; // { get: () => Promise<string>; }

// Create a type to return a map of the valid paths leading to HTTPVerbs and their functions
type HTTPRouteMap<T extends object> = {
  [key in ObjectKeyPaths<T> as string extends any
    ? LookupFlattenedObject<T, key> extends HTTPRoute
      ? key
      : never
    : never]: {
    [newKey in keyof LookupFlattenedObject<T, key> as newKey extends HTTPVerbs
      ? newKey
      : never]: LookupFlattenedObject<T, key>[newKey];
  };
};

type test5 = HTTPRouteMap<typeof obj>; // { "a/b/c": { get: () => Promise<string>; }; }

type Override<A, B> = Omit<A, keyof B> & {
  [K in keyof B as B[K] extends never ? never : K]: B[K];
};

type test6 = Override<test5, test5>;
