import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

import {
  array,
  literal,
  nonOptional,
  number,
  object,
  optional,
  string,
  tuple,
  union,
  value,
  variant,
} from 'valibot';
import { describe, expect, test, vi } from 'vitest';

import type {
  ApiHandlerReturn,
  HttpRoute,
  TypedApiRouteConfig,
} from './types.js';

import { HttpError } from '../../api/http-errors.js';
import {
  Logger,
  MockLambdaRuntime,
  createToolkit,
  makeMockApiEvent,
} from '../../index.js';
import { TypeSafeApiHandler } from './handler.js';
import { validate } from './validator.js';

const toolkit = createToolkit({ logger: new Logger({ level: 'silent' }) });

describe('`TypeSafeApiHandler`s validator function tests:', () => {
  describe('base functionality expected use cases:', () => {
    describe('isolated schema validations:', () => {
      test('should validate body schema passed in', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          body: object({
            bodyKey1: string(),
          }),
        };

        const routes = {
          post: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            body: { bodyKey1: 'value1' },
            method: 'POST',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({ body: { bodyKey1: 'value1' } });
      });
      test('should validate header schema passed in', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          headers: object({
            'x-header-test': string(),
          }),
        };

        const routes = {
          get: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            headers: {
              'x-header-test': 'value1',
            },
            method: 'GET',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({
          headers: { 'x-header-test': 'value1' },
        });
      });
      test('should validate qsp schema passed in', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          qsp: object({
            key1: string(),
          }),
        };

        const routes = {
          get: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
            queryString: '?key1=value1',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({
          qsp: { key1: 'value1' },
        });
      });
      test('should validate cookie schema passed in', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          cookies: object({
            key1: string(),
          }),
        };

        const routes = {
          get: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            cookies: ['key1=value1'],
            method: 'GET',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({
          cookies: { key1: 'value1' },
        });
      });
    });
    describe('`validated` object entry cherry-picking w/o 400 error:', () => {
      test('should filter from body schema', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          body: object({
            bodyKey1: string(),
          }),
        };

        const routes = {
          post: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            body: {
              bodyKey1: 'value1',
              bodyKey2: 'value2',
              bodyKey3: 'value3',
            },
            method: 'POST',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({ body: { bodyKey1: 'value1' } });
      });
      test('should filter from header schema', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          headers: object({
            'x-header-test': string(),
          }),
        };

        const routes = {
          get: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            headers: {
              'x-header-test': 'value1',
              'x-header-test2': 'value2',
              'x-header-test3': 'value3',
            },
            method: 'GET',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({
          headers: { 'x-header-test': 'value1' },
        });
      });
      test('should filter from qsp schema', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          qsp: object({
            key1: string(),
          }),
        };

        const routes = {
          get: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
            queryString: '?key1=value1&key2=value2&key3=value3',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({
          qsp: { key1: 'value1' },
        });
      });
      test('should filter from cookie schema', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          cookies: object({
            key1: string(),
          }),
        };

        const routes = {
          get: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            cookies: ['key1=value1', 'key2=value2', 'key3=value3'],
            method: 'GET',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({
          cookies: { key1: 'value1' },
        });
      });
    });
    describe('behavior for required/optional parameters:', () => {
      test('should function for body schema', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          body: object({
            bodyKey1: string(),
            bodyKey2: optional(string()),
            bodyKey4: optional(string()),
          }),
        };

        const routes = {
          post: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            body: {
              bodyKey1: 'value1',
              bodyKey2: 'value2',
              bodyKey3: 'value3',
            },
            method: 'POST',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({
          body: { bodyKey1: 'value1', bodyKey2: 'value2' },
        });
      });
      test('should filter from header schema', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          headers: object({
            'x-header-test': string(),
            'x-header-test2': optional(string()),
            'x-header-test4': optional(string()),
          }),
        };

        const routes = {
          get: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            headers: {
              'x-header-test': 'value1',
              'x-header-test2': 'value2',
              'x-header-test3': 'value3',
            },
            method: 'GET',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({
          headers: { 'x-header-test': 'value1', 'x-header-test2': 'value2' },
        });
      });
      test('should filter from qsp schema', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          qsp: object({
            key1: string(),
            key2: optional(string()),
            key4: optional(string()),
          }),
        };

        const routes = {
          get: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'GET',
            path: '/',
            queryString: '?key1=value1&key2=value2&key3=value3',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({
          qsp: { key1: 'value1', key2: 'value2' },
        });
      });
      test('should filter from cookie schema', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          cookies: object({
            key1: string(),
            key2: optional(string()),
            key4: optional(string()),
          }),
        };

        const routes = {
          get: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            cookies: ['key1=value1', 'key2=value2', 'key3=value3'],
            method: 'GET',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(200);
        expect(spy).toBeCalledWith({
          cookies: { key1: 'value1', key2: 'value2' },
        });
      });
    });
    describe('behavior for schema failures (HTTP 400):', () => {
      test.only('should list missing expected values for the body', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          body: object({
            bodyKey1: string('needed1!'),
            bodyKey2: optional(
              object({
                nestedKey1: optional(string()),
                requiredKey2: string('needed2!'),
              })
            ),
            bodyKey3: tuple([string('needed3!'), number('needed4!')]),
            bodyKey4: nonOptional(array(object({ foo: string() }))),
            bodyKey5: union([string('needed5!'), number('needed6!')]),
            bodyKey6: variant('foo', [
              object({ bar: string(), foo: literal('bar') }),
              object({ bar: number(), foo: literal('baz') }),
            ]),
          }),
        };

        const routes = {
          post: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return true;
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            // body: {},
            method: 'POST',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.body!)).toEqual({
          message: 'Missing required bodyKey1',
          status: 'fail',
          statusCode: 400,
        });
        expect(spy).toHaveBeenCalledTimes(0);
      });
      // test('should filter from header schema', async () => {
      //   const makeApi = toolkit.create(TypeSafeApiHandler);
      //   const spy = vi.fn();

      //   const validationSchema = {
      //     headers: object({
      //       'x-header-test': string(),
      //       'x-header-test2': optional(string()),
      //       'x-header-test4': optional(string()),
      //     }),
      //   };

      //   const routes = {
      //     get: validate(validationSchema, async ({ validated }) => {
      //       spy(validated);
      //       return true;
      //     }) as HttpRoute,
      //   } satisfies TypedApiRouteConfig;
      //   const handler = makeApi(routes);

      //   const res = (await MockLambdaRuntime(
      //     handler,
      //     makeMockApiEvent({
      //       headers: {
      //         'x-header-test': 'value1',
      //         'x-header-test2': 'value2',
      //         'x-header-test3': 'value3',
      //       },
      //       method: 'GET',
      //       path: '/',
      //     })
      //   )) as APIGatewayProxyStructuredResultV2;

      //   expect(res.statusCode).toBe(200);
      //   expect(spy).toBeCalledWith({
      //     headers: { 'x-header-test': 'value1', 'x-header-test2': 'value2' },
      //   });
      // });
      // test('should filter from qsp schema', async () => {
      //   const makeApi = toolkit.create(TypeSafeApiHandler);
      //   const spy = vi.fn();

      //   const validationSchema = {
      //     qsp: object({
      //       key1: string(),
      //       key2: optional(string()),
      //       key4: optional(string()),
      //     }),
      //   };

      //   const routes = {
      //     get: validate(validationSchema, async ({ validated }) => {
      //       spy(validated);
      //       return true;
      //     }) as HttpRoute,
      //   } satisfies TypedApiRouteConfig;
      //   const handler = makeApi(routes);

      //   const res = (await MockLambdaRuntime(
      //     handler,
      //     makeMockApiEvent({
      //       method: 'GET',
      //       path: '/',
      //       queryString: '?key1=value1&key2=value2&key3=value3',
      //     })
      //   )) as APIGatewayProxyStructuredResultV2;

      //   expect(res.statusCode).toBe(200);
      //   expect(spy).toBeCalledWith({
      //     qsp: { key1: 'value1', key2: 'value2' },
      //   });
      // });
      // test('should filter from cookie schema', async () => {
      //   const makeApi = toolkit.create(TypeSafeApiHandler);
      //   const spy = vi.fn();

      //   const validationSchema = {
      //     cookies: object({
      //       key1: string(),
      //       key2: optional(string()),
      //       key4: optional(string()),
      //     }),
      //   };

      //   const routes = {
      //     get: validate(validationSchema, async ({ validated }) => {
      //       spy(validated);
      //       return true;
      //     }) as HttpRoute,
      //   } satisfies TypedApiRouteConfig;
      //   const handler = makeApi(routes);

      //   const res = (await MockLambdaRuntime(
      //     handler,
      //     makeMockApiEvent({
      //       cookies: ['key1=value1', 'key2=value2', 'key3=value3'],
      //       method: 'GET',
      //       path: '/',
      //     })
      //   )) as APIGatewayProxyStructuredResultV2;

      //   expect(res.statusCode).toBe(200);
      //   expect(spy).toBeCalledWith({
      //     cookies: { key1: 'value1', key2: 'value2' },
      //   });
      // });
    });
  });
  // describe('fail cases:', () => {});
});
