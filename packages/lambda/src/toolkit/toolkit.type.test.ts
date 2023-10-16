/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Note: Tests here are a combination of vitest type testing and tsc type
 * checking with the `test:post` script. Though some of the tests here may look
 * pointless, they are being tested in one way or another.
 */

import { describe, expectTypeOf as expect, test } from 'vitest';

import type { Cache, Logger } from '../common/index.js';
import type {
  CreateFactory,
  ICreatable,
  ICreatableOptions,
} from './toolkit.types.js';

import { createToolkit } from './toolkit.js';

describe('createToolkit type tests:', () => {
  describe('createToolkit `create` factory success cases:', () => {
    describe('functional:', () => {
      interface ITestCreatable extends ICreatable {
        testFunction: () => Promise<string>;
      }
      interface ITestCreatableOptions extends ICreatableOptions {
        optionalProperty?: string;
      }
      interface ITestCreatableRequiredOptions extends ICreatableOptions {
        requiredProperty: string;
      }

      function TestCreatable(
        logger: Logger,
        cache: Cache,
        create: CreateFactory,
        options?: ITestCreatableOptions
      ): ITestCreatable {
        return {
          testFunction: async () => 'test',
        };
      }

      function TestCreatableRequiredProps(
        logger: Logger,
        cache: Cache,
        create: CreateFactory,
        options: ITestCreatableRequiredOptions
      ): ITestCreatable {
        return {
          testFunction: async () => 'test',
        };
      }

      test('should return ICreatable', () => {
        const toolkit = createToolkit('test');
        const creatable = toolkit.create(TestCreatable);

        expect(creatable).toMatchTypeOf<ICreatable>();
      });
      test('should return interface of extended creatable', () => {
        const toolkit = createToolkit('test');
        const creatable = toolkit.create(TestCreatable);

        expect(creatable).toMatchTypeOf<ITestCreatable>();
        expect(creatable.testFunction).toMatchTypeOf<
          ITestCreatable['testFunction']
        >();
      });
      test('should accept optional properties - second parameter', () => {
        const toolkit = createToolkit('test');
        const properties = { optionalProperty: 'test' };
        toolkit.create(TestCreatable, properties);

        // isn't feasibly testable with vitest - rely on ts errors
        expect(properties).toMatchTypeOf<ITestCreatableOptions>();
      });
      test('should require non-optional properties - second parameter', () => {
        const toolkit = createToolkit('test');
        const properties = { requiredProperty: 'test' };
        toolkit.create(TestCreatableRequiredProps, properties);

        // isn't feasibly testable with vitest - rely on ts errors
        expect(properties).toMatchTypeOf<ITestCreatableRequiredOptions>();
      });
    });

    describe('class:', () => {
      interface ITestCreatable extends ICreatable {
        testFunction: () => Promise<string>;
      }
      interface ITestCreatableOptions extends ICreatableOptions {
        optionalProperty?: string;
      }
      interface ITestCreatableRequiredOptions extends ICreatableOptions {
        requiredProperty: string;
      }

      class TestCreatable implements ITestCreatable {
        constructor(
          logger: Logger,
          cache: Cache,
          create: CreateFactory,
          options?: ITestCreatableOptions
        ) {}
        public async testFunction() {
          return 'test';
        }
      }

      class TestCreatableRequiredProps implements ITestCreatable {
        constructor(
          logger: Logger,
          cache: Cache,
          create: CreateFactory,
          options: ITestCreatableRequiredOptions
        ) {}
        public async testFunction() {
          return 'test';
        }
      }

      test('should return ICreatable', () => {
        const toolkit = createToolkit('test');
        const creatable = toolkit.create(TestCreatable);

        expect(creatable).toMatchTypeOf<ICreatable>();
      });
      test('should return interface of extended creatable', () => {
        const toolkit = createToolkit('test');
        const creatable = toolkit.create(TestCreatable);

        expect(creatable).toMatchTypeOf<ITestCreatable>();
        expect(creatable.testFunction).toMatchTypeOf<
          ITestCreatable['testFunction']
        >();
      });
      test('should accept optional properties - second parameter', () => {
        const toolkit = createToolkit('test');
        const properties = { optionalProperty: 'test' };
        toolkit.create(TestCreatable, properties);

        // isn't feasibly testable with vitest - rely on ts errors
        expect(properties).toMatchTypeOf<ITestCreatableOptions>();
      });
      test('should require non-optional properties - second parameter', () => {
        const toolkit = createToolkit('test');
        const properties = { requiredProperty: 'test' };
        toolkit.create(TestCreatableRequiredProps, properties);

        // isn't feasibly testable with vitest - rely on ts errors
        expect(properties).toMatchTypeOf<ITestCreatableRequiredOptions>();
      });
    });
  });
});
