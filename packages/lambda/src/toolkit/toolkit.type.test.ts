/* eslint-disable @typescript-eslint/no-unused-vars */

import { describe, expectTypeOf as expect, test } from 'vitest';

import type { ICache, ILogger } from '../common/index.js';
import type {
  CreatableFactory,
  ICreatableReturn,
  ICreatableConfig,
} from './toolkit.types.js';

import { createToolkit } from './toolkit.js';

describe('createToolkit type tests:', () => {
  describe('createToolkit `create` factory success cases:', () => {
    describe('functional:', () => {
      interface ITestCreatable extends ICreatableReturn {
        testFunction: () => Promise<string>;
      }
      interface ITestCreatableConfig extends ICreatableConfig {
        optionalProperty?: string;
      }
      interface ITestCreatableRequiredConfig extends ICreatableConfig {
        requiredProperty: string;
      }

      function TestCreatable(
        logger: ILogger,
        cache: ICache,
        create: CreatableFactory,
        config?: ITestCreatableConfig
      ): ITestCreatable {
        return {
          testFunction: async () => 'test',
        };
      }

      function TestCreatableRequiredProps(
        logger: ILogger,
        cache: ICache,
        create: CreatableFactory,
        config?: ITestCreatableRequiredConfig
      ): ITestCreatable {
        return {
          testFunction: async () => 'test',
        };
      }

      test('should return ICreatable', () => {
        const toolkit = createToolkit('test');
        const creatable = toolkit.create(TestCreatable);

        expect(creatable).toMatchTypeOf<ICreatableReturn>();
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
        expect(properties).toMatchTypeOf<ITestCreatableConfig>();
      });
      test('should require non-optional properties - second parameter', () => {
        const toolkit = createToolkit('test');
        const properties = { requiredProperty: 'test' };
        toolkit.create(TestCreatableRequiredProps, {
          requiredProperty: 'foo',
        });

        // isn't feasibly testable with vitest - rely on ts errors
        expect(properties).toMatchTypeOf<ITestCreatableRequiredConfig>();
      });
    });

    describe('class:', () => {
      interface ITestCreatable extends ICreatableReturn {
        testFunction: () => Promise<string>;
      }
      interface ITestCreatableConfig extends ICreatableConfig {
        optionalProperty?: string;
      }
      interface ITestCreatableRequiredConfig extends ICreatableConfig {
        requiredProperty: string;
      }

      class TestCreatable implements ITestCreatable {
        constructor(
          logger: ILogger,
          cache: ICache,
          create: CreatableFactory,
          options?: ITestCreatableConfig
        ) {}
        public async testFunction() {
          return 'test';
        }
      }

      class TestCreatableRequiredProps implements ITestCreatable {
        constructor(
          logger: ILogger,
          cache: ICache,
          create: CreatableFactory,
          options?: ITestCreatableRequiredConfig
        ) {}
        public async testFunction() {
          return 'test';
        }
      }

      test('should return ICreatable', () => {
        const toolkit = createToolkit('test');
        const creatable = toolkit.create(TestCreatable);

        expect(creatable).toMatchTypeOf<ICreatableReturn>();
      });
      test('should return interface of extended creatable', () => {
        const toolkit = createToolkit('test');
        const creatable = toolkit.create(TestCreatable);

        expect(creatable).toMatchTypeOf<ICreatableReturn>();
        expect(creatable.testFunction).toMatchTypeOf<
          ITestCreatable['testFunction']
        >();
      });
      test('should accept optional properties - second parameter', () => {
        const toolkit = createToolkit('test');
        const properties = { optionalProperty: 'test' };
        toolkit.create(TestCreatable, properties);

        // isn't feasibly testable with vitest - rely on ts errors
        expect(properties).toMatchTypeOf<ITestCreatableConfig>();
      });
      test('should require non-optional properties - second parameter', () => {
        const toolkit = createToolkit('test');
        const properties = { requiredProperty: 'test' };
        toolkit.create(TestCreatableRequiredProps, properties);

        // isn't feasibly testable with vitest - rely on ts errors
        expect(properties).toMatchTypeOf<ITestCreatableRequiredConfig>();
      });
    });
  });
});
