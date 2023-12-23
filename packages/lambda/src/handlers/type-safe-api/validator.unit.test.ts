import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

import {
  array,
  nonOptional,
  number,
  object,
  optional,
  string,
  tuple,
} from 'valibot';
import { describe, expect, test, vi } from 'vitest';

import type { HttpRoute, TypedApiRouteConfig } from './types.js';

import { HttpErrorExplanations } from '../../api/constants.js';
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
            return { body: true };
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
            return { body: true };
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
            return { body: true };
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
            return { body: true };
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
            return { body: true };
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
            return { body: true };
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
            return { body: true };
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
            return { body: true };
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
            return { body: true };
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
            return { body: true };
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
            return { body: true };
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
            return { body: true };
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
      test('should list missing expected values for the body', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          body: object({
            bodyKey1: string('bodyKey1 is required'),
            bodyKey2: optional(
              object({
                nestedKey1: optional(string()),
                requiredKey2: string(),
              })
            ),
            bodyKey3: tuple([string(), number()]),
            bodyKey4: nonOptional(array(object({ foo: string() }))),
          }),
        };

        const routes = {
          post: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return { body: true };
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            body: { bodyKey2: 'bar' },
            method: 'POST',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        const data = JSON.parse(res.body || '{}').data;

        expect(res.statusCode).toBe(400);
        expect(data.description).toBe(HttpErrorExplanations[400].message);
        expect(data.title).toBe(HttpErrorExplanations[400].name);
        expect(data.messages).toEqual(['bodyKey1 is required']);
        expect(data.schema).toEqual({
          body: [
            'body.bodyKey1: string',
            'body.bodyKey2?.nestedKey1?: string',
            'body.bodyKey2?.requiredKey2: string',
            'body.bodyKey3[0]: string',
            'body.bodyKey3[1]: number',
            'body.bodyKey4[].foo: string',
          ],
        });
        expect(spy).toHaveBeenCalledTimes(0);
      });
      test('should list missing expected values for the headers', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          headers: object({
            headerKey1: string('headerKey1 is required'),
            headerKey2: optional(string()),
          }),
        };

        const routes = {
          post: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return { body: true };
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'POST',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        const data = JSON.parse(res.body || '{}').data;

        expect(res.statusCode).toBe(400);
        expect(data.description).toBe(HttpErrorExplanations[400].message);
        expect(data.title).toBe(HttpErrorExplanations[400].name);
        expect(data.messages).toEqual(['headerKey1 is required']);
        expect(data.schema).toEqual({
          headers: [
            'headers.headerKey1: string',
            'headers.headerKey2?: string',
          ],
        });
        expect(spy).toHaveBeenCalledTimes(0);
      });
      test('should list missing expected values for the qsp', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          qsp: object({
            queryKey1: string('queryKey1 is required'),
            queryKey2: optional(string()),
          }),
        };

        const routes = {
          post: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return { body: true };
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'POST',
            path: '/',
            queryString: '?queryKey2=value2',
          })
        )) as APIGatewayProxyStructuredResultV2;

        const data = JSON.parse(res.body || '{}').data;

        expect(res.statusCode).toBe(400);
        expect(data.description).toBe(HttpErrorExplanations[400].message);
        expect(data.title).toBe(HttpErrorExplanations[400].name);
        expect(data.messages).toEqual(['queryKey1 is required']);
        expect(data.schema).toEqual({
          qsp: ['qsp.queryKey1: string', 'qsp.queryKey2?: string'],
        });
        expect(spy).toHaveBeenCalledTimes(0);
      });
      test('should list missing expected values for the cookies', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          cookies: object({
            cookie1: string('cookie1 is required'),
            cookie2: optional(string()),
          }),
        };

        const routes = {
          post: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return { body: true };
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            cookies: ['foo=bar'],
            method: 'POST',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        const data = JSON.parse(res.body || '{}').data;

        expect(res.statusCode).toBe(400);
        expect(data.description).toBe(HttpErrorExplanations[400].message);
        expect(data.title).toBe(HttpErrorExplanations[400].name);
        expect(data.messages).toEqual(['cookie1 is required']);
        expect(data.schema).toEqual({
          cookies: ['cookies.cookie1: string', 'cookies.cookie2?: string'],
        });
        expect(spy).toHaveBeenCalledTimes(0);
      });
      test('should list all missing expected values', async () => {
        const makeApi = toolkit.create(TypeSafeApiHandler);
        const spy = vi.fn();

        const validationSchema = {
          body: object({
            bodyKey1: string('bodyKey1 is required'),
            bodyKey2: optional(
              object({
                nestedKey1: optional(string()),
                requiredKey2: string(),
              })
            ),
            bodyKey3: tuple([string(), number()]),
            bodyKey4: nonOptional(array(object({ foo: string() }))),
          }),
          cookies: object({
            cookie1: string('cookie1 is required'),
            cookie2: optional(string()),
          }),
          headers: object({
            headerKey1: string('headerKey1 is required'),
            headerKey2: optional(string()),
          }),
          qsp: object({
            queryKey1: string('queryKey1 is required'),
            queryKey2: optional(string()),
          }),
        };

        const routes = {
          post: validate(validationSchema, async ({ validated }) => {
            spy(validated);
            return { body: true };
          }) as HttpRoute,
        } satisfies TypedApiRouteConfig;
        const handler = makeApi(routes);

        const res = (await MockLambdaRuntime(
          handler,
          makeMockApiEvent({
            method: 'POST',
            path: '/',
          })
        )) as APIGatewayProxyStructuredResultV2;

        const data = JSON.parse(res.body || '{}').data;

        expect(res.statusCode).toBe(400);
        expect(data.description).toBe(HttpErrorExplanations[400].message);
        expect(data.title).toBe(HttpErrorExplanations[400].name);
        expect(data.messages).toEqual([
          'No input was provided for body.',
          'headerKey1 is required',
          'No input was provided for cookies.',
          'cookie1 is required',
          'No input was provided for qsp.',
        ]);
        expect(data.schema).toEqual({
          body: [
            'body.bodyKey1: string',
            'body.bodyKey2?.nestedKey1?: string',
            'body.bodyKey2?.requiredKey2: string',
            'body.bodyKey3[0]: string',
            'body.bodyKey3[1]: number',
            'body.bodyKey4[].foo: string',
          ],
          cookies: ['cookies.cookie1: string', 'cookies.cookie2?: string'],
          headers: [
            'headers.headerKey1: string',
            'headers.headerKey2?: string',
          ],
          qsp: ['qsp.queryKey1: string', 'qsp.queryKey2?: string'],
        });
        expect(spy).toHaveBeenCalledTimes(0);
      });
    });
  });
  describe('fail cases:', () => {
    test('headers should throw for non-object schema', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler, {
        devMode: true,
      });
      const spy = vi.fn();

      const validationSchema = {
        headers: array(string()),
      };

      const routes = {
        post: validate(validationSchema, async ({ validated }) => {
          spy(validated);
          return { body: true };
        }) as HttpRoute,
      } satisfies TypedApiRouteConfig;
      const handler = makeApi(routes);

      const res = (await MockLambdaRuntime(
        handler,
        makeMockApiEvent({
          method: 'POST',
          path: '/',
        })
      )) as APIGatewayProxyStructuredResultV2;

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body!).data.error.message).toContain(
        'must be an object schema'
      );
      expect(spy).toHaveBeenCalledTimes(0);
    });
    test('cookies should throw for non-object schema', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler, {
        devMode: true,
      });
      const spy = vi.fn();

      const validationSchema = {
        cookies: array(string()),
      };

      const routes = {
        post: validate(validationSchema, async ({ validated }) => {
          spy(validated);
          return { body: true };
        }) as HttpRoute,
      } satisfies TypedApiRouteConfig;
      const handler = makeApi(routes);

      const res = (await MockLambdaRuntime(
        handler,
        makeMockApiEvent({
          method: 'POST',
          path: '/',
        })
      )) as APIGatewayProxyStructuredResultV2;

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body!).data.error.message).toContain(
        'must be an object schema'
      );
      expect(spy).toHaveBeenCalledTimes(0);
    });
    test('qsp should throw for non-object schema', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler, {
        devMode: true,
      });
      const spy = vi.fn();

      const validationSchema = {
        qsp: array(string()),
      };

      const routes = {
        post: validate(validationSchema, async ({ validated }) => {
          spy(validated);
          return { body: true };
        }) as HttpRoute,
      } satisfies TypedApiRouteConfig;
      const handler = makeApi(routes);

      const res = (await MockLambdaRuntime(
        handler,
        makeMockApiEvent({
          method: 'POST',
          path: '/',
        })
      )) as APIGatewayProxyStructuredResultV2;

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body!).data.error.message).toContain(
        'must be an object schema'
      );
      expect(spy).toHaveBeenCalledTimes(0);
    });
    test('pathParams should throw for non-tuple schema', async () => {
      const makeApi = toolkit.create(TypeSafeApiHandler, {
        devMode: true,
      });
      const spy = vi.fn();

      const validationSchema = {
        pathParams: array(string()),
      };

      const routes = {
        post: validate(validationSchema, async ({ validated }) => {
          spy(validated);
          return { body: true };
        }) as HttpRoute,
      } satisfies TypedApiRouteConfig;
      const handler = makeApi(routes);

      const res = (await MockLambdaRuntime(
        handler,
        makeMockApiEvent({
          method: 'POST',
          path: '/',
        })
      )) as APIGatewayProxyStructuredResultV2;

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.body!).data.error.message).toContain(
        'must be a tuple schema'
      );
      expect(spy).toHaveBeenCalledTimes(0);
    });
  });
});
