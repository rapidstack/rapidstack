/* eslint-disable no-restricted-syntax */
/* eslint-disable vitest/valid-title */
import * as v from 'valibot';
import { describe, expect, test } from 'vitest';

import { getFlattenedSchemaInfo /* getTsTypeString */ } from './valibot.js';

// Primitive schemas in the sense that they are not composed of other schemas
const primitiveSchemaMap = {
  any: v.any(),
  bigint: v.bigint(),
  blob: v.blob(),
  boolean: v.boolean(),
  date: v.date(),
  nan: v.nan(),
  never: v.never(),
  null: v.null_(),
  number: v.number(),
  string: v.string(),
  symbol: v.symbol(),
  undefined: v.undefined_(),
  unknown: v.unknown(),
  void: v.void_(),
};
const literalSchemaMap = {
  bigint: {
    schema: v.literal(BigInt(42)),
    value: BigInt(42),
  },
  boolean: {
    schema: v.literal(true),
    value: true,
  },
  number: {
    schema: v.literal(42),
    value: 42,
  },
  string: {
    schema: v.literal('hello'),
    value: 'hello',
  },
  symbol: {
    schema: v.literal(Symbol('hello')),
    value: Symbol('hello'),
  },
};

const testObjectSchema = v.object({
  ...primitiveSchemaMap,
  nested: v.object(primitiveSchemaMap),
});

const optionalPrimitiveSchemaMap = Object.entries(primitiveSchemaMap).reduce(
  (acc, [key, schema]) => {
    acc[key] = v.optional(schema);
    return acc;
  },
  {} as Record<string, v.BaseSchema>
);

enum Enum {
  TEST_KEY = 'TEST_VALUE',
}

const ObjEnum = {
  TEST_KEY: 'TEST_VALUE',
} as const;

enum Enum2 {
  TEST_NUMBER = 42,
  TEST_STRING = 'TEST_STRING',
}

const ObjEnum2 = {
  TEST_NUMBER: 42,
  TEST_STRING: 'TEST_STRING',
} as const;

describe(`\`${getFlattenedSchemaInfo.name}\`s function tests:`, () => {
  describe('schemas of primitives:', () => {
    Object.entries(primitiveSchemaMap)
      .filter(([key]) => key !== 'nan')
      .forEach(([primitive, schema]) => {
        test(`test of [${primitive}]`, async () => {
          const result = getFlattenedSchemaInfo(schema);
          expect(result).toBe(primitive + '\n');
        });
      });

    test(`test of [nan]`, async () => {
      const result = getFlattenedSchemaInfo(v.nan());
      expect(result).toBe('number\n');
    });
  });

  describe('literal schemas:', () => {
    Object.entries(literalSchemaMap).forEach(
      ([literalType, { schema, value }]) => {
        test(`test of [${literalType}]`, async () => {
          const literal = value;
          const type = typeof literal;
          const result = getFlattenedSchemaInfo(schema);

          expect(result).toBe(
            `(literal ${type}: ${
              type === 'string' ? `"${literal as string}"` : String(literal)
            })` + '\n'
          );
        });
      }
    );
  });

  describe('schema type modifiers:', () => {
    describe('optional(schema):', () => {
      Object.entries(primitiveSchemaMap)
        .filter(([key]) => key !== 'undefined' && key !== 'nan')
        .forEach(([primitive, schema]) => {
          test(`test of [${primitive}]`, async () => {
            const result = getFlattenedSchemaInfo(v.optional(schema));
            expect(result).toBe(`${primitive} | undefined\n`);
          });
        });

      test(`test of [undefined]`, async () => {
        const result = getFlattenedSchemaInfo(v.optional(v.undefined_()));
        expect(result).toBe('undefined\n');
      });

      test(`test of [nan]`, async () => {
        const result = getFlattenedSchemaInfo(v.optional(v.nan()));
        expect(result).toBe('number | undefined\n');
      });
    });
    describe('optional(nonOptional(schema)):', () => {
      Object.entries(primitiveSchemaMap)
        .filter(([key]) => key !== 'undefined' && key !== 'nan')
        .forEach(([primitive, schema]) => {
          test(`test of [${primitive}]`, async () => {
            const result = getFlattenedSchemaInfo(
              v.optional(v.nonOptional(schema))
            );
            expect(result).toBe(`${primitive} | undefined\n`);
          });
        });

      test(`test of [undefined]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.optional(v.nonOptional(v.undefined_()))
        );
        expect(result).toBe('undefined\n');
      });

      test(`test of [nan]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.optional(v.nonOptional(v.nan()))
        );
        expect(result).toBe('number | undefined\n');
      });
    });
    describe('nonOptional(optional(schema)):', () => {
      Object.entries(primitiveSchemaMap)
        .filter(([key]) => key !== 'undefined' && key !== 'nan')
        .forEach(([primitive, schema]) => {
          test(`test of [${primitive}]`, async () => {
            const result = getFlattenedSchemaInfo(
              v.nonOptional(v.optional(schema))
            );
            expect(result).toBe(`${primitive}\n`);
          });
        });

      test(`test of [undefined]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.nonOptional(v.optional(v.undefined_()))
        );
        expect(result).toBe('undefined\n');
      });

      test(`test of [nan]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.nonOptional(v.optional(v.nan()))
        );
        expect(result).toBe('number\n');
      });
    });
    describe('nullable(schema):', () => {
      Object.entries(primitiveSchemaMap)
        .filter(([key]) => key !== 'null' && key !== 'nan')
        .forEach(([primitive, schema]) => {
          test(`test of [${primitive}]`, async () => {
            const result = getFlattenedSchemaInfo(v.nullable(schema));
            expect(result).toBe(`${primitive} | null\n`);
          });
        });

      test(`test of [null]`, async () => {
        const result = getFlattenedSchemaInfo(v.nullable(v.null_()));
        expect(result).toBe('null\n');
      });

      test(`test of [nan]`, async () => {
        const result = getFlattenedSchemaInfo(v.nullable(v.nan()));
        expect(result).toBe('number | null\n');
      });
    });
    describe('nullable(nonNullable(schema)):', () => {
      Object.entries(primitiveSchemaMap)
        .filter(([key]) => key !== 'null' && key !== 'nan')
        .forEach(([primitive, schema]) => {
          test(`test of [${primitive}]`, async () => {
            const result = getFlattenedSchemaInfo(
              v.nullable(v.nonNullable(schema))
            );
            expect(result).toBe(`${primitive} | null\n`);
          });
        });

      test(`test of [null]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.nullable(v.nonNullable(v.null_()))
        );
        expect(result).toBe('null\n');
      });

      test(`test of [nan]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.nullable(v.nonNullable(v.nan()))
        );
        expect(result).toBe('number | null\n');
      });
    });
    describe('nonNullable(nullable(schema)):', () => {
      Object.entries(primitiveSchemaMap)
        .filter(([key]) => key !== 'undefined' && key !== 'nan')
        .forEach(([primitive, schema]) => {
          test(`test of [${primitive}]`, async () => {
            const result = getFlattenedSchemaInfo(
              v.nonNullable(v.nullable(schema))
            );
            expect(result).toBe(`${primitive}\n`);
          });
        });

      test(`test of [null]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.nonNullable(v.nullable(v.null_()))
        );
        expect(result).toBe('null\n');
      });

      test(`test of [nan]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.nonNullable(v.nullable(v.nan()))
        );
        expect(result).toBe('number\n');
      });
    });
    describe('nullish(schema):', () => {
      Object.entries(primitiveSchemaMap)
        .filter(
          ([key]) => key !== 'null' && key !== 'nan' && key !== 'undefined'
        )
        .forEach(([primitive, schema]) => {
          test(`test of [${primitive}]`, async () => {
            const result = getFlattenedSchemaInfo(v.nullish(schema));
            expect(result).toBe(`${primitive} | null | undefined\n`);
          });
        });

      test(`test of [null]`, async () => {
        const result = getFlattenedSchemaInfo(v.nullish(v.null_()));
        expect(result).toBe('null | undefined\n');
      });

      test(`test of [nan]`, async () => {
        const result = getFlattenedSchemaInfo(v.nullish(v.nan()));
        expect(result).toBe('number | null | undefined\n');
      });
    });
    describe('nullish(nonNullish(schema)):', () => {
      Object.entries(primitiveSchemaMap)
        .filter(
          ([key]) => key !== 'null' && key !== 'nan' && key !== 'undefined'
        )
        .forEach(([primitive, schema]) => {
          test(`test of [${primitive}]`, async () => {
            const result = getFlattenedSchemaInfo(
              v.nullish(v.nonNullish(schema))
            );
            expect(result).toBe(`${primitive} | null | undefined\n`);
          });
        });

      test(`test of [null]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.nullish(v.nonNullish(v.null_()))
        );
        expect(result).toBe('null | undefined\n');
      });

      test(`test of [undefined]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.nullish(v.nonNullish(v.undefined_()))
        );
        expect(result).toBe('undefined | null\n');
      });

      test(`test of [nan]`, async () => {
        const result = getFlattenedSchemaInfo(v.nullish(v.nonNullish(v.nan())));
        expect(result).toBe('number | null | undefined\n');
      });
    });
    describe('nonNullish(nullish(schema)):', () => {
      Object.entries(primitiveSchemaMap)
        .filter(
          ([key]) => key !== 'null' && key !== 'nan' && key !== 'undefined'
        )
        .forEach(([primitive, schema]) => {
          test(`test of [${primitive}]`, async () => {
            const result = getFlattenedSchemaInfo(
              v.nonNullish(v.nullish(schema))
            );
            expect(result).toBe(`${primitive}\n`);
          });
        });

      test(`test of [null]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.nonNullish(v.nullish(v.null_()))
        );
        expect(result).toBe('null\n');
      });

      test(`test of [undefined]`, async () => {
        const result = getFlattenedSchemaInfo(
          v.nonNullish(v.nullish(v.undefined_()))
        );
        expect(result).toBe('undefined\n');
      });

      test(`test of [nan]`, async () => {
        const result = getFlattenedSchemaInfo(v.nonNullish(v.nullish(v.nan())));
        expect(result).toBe('number\n');
      });
    });
  });

  describe('schemas of objects', () => {
    test('standard required schema', async () => {
      const result = getFlattenedSchemaInfo(testObjectSchema);
      expect(result).toBe(
        [
          'root.any: any',
          'root.bigint: bigint',
          'root.blob: blob',
          'root.boolean: boolean',
          'root.date: date',
          'root.nan: number',
          'root.never: never',
          'root.null: null',
          'root.number: number',
          'root.string: string',
          'root.symbol: symbol',
          'root.undefined: undefined',
          'root.unknown: unknown',
          'root.void: void',
          `root.nested.any: any`,
          `root.nested.bigint: bigint`,
          `root.nested.blob: blob`,
          `root.nested.boolean: boolean`,
          `root.nested.date: date`,
          `root.nested.nan: number`,
          `root.nested.never: never`,
          `root.nested.null: null`,
          `root.nested.number: number`,
          `root.nested.string: string`,
          `root.nested.symbol: symbol`,
          `root.nested.undefined: undefined`,
          `root.nested.unknown: unknown`,
          `root.nested.void: void`,
        ].join('\n') + '\n'
      );
    });
    test('optional root schema', async () => {
      const result = getFlattenedSchemaInfo(v.optional(testObjectSchema));
      expect(result).toBe(
        [
          'root?.any: any',
          'root?.bigint: bigint',
          'root?.blob: blob',
          'root?.boolean: boolean',
          'root?.date: date',
          'root?.nan: number',
          'root?.never: never',
          'root?.null: null',
          'root?.number: number',
          'root?.string: string',
          'root?.symbol: symbol',
          'root?.undefined: undefined',
          'root?.unknown: unknown',
          'root?.void: void',
          `root?.nested.any: any`,
          `root?.nested.bigint: bigint`,
          `root?.nested.blob: blob`,
          `root?.nested.boolean: boolean`,
          `root?.nested.date: date`,
          `root?.nested.nan: number`,
          `root?.nested.never: never`,
          `root?.nested.null: null`,
          `root?.nested.number: number`,
          `root?.nested.string: string`,
          `root?.nested.symbol: symbol`,
          `root?.nested.undefined: undefined`,
          `root?.nested.unknown: unknown`,
          `root?.nested.void: void`,
        ].join('\n') + '\n'
      );
    });
    test('optional nested schema', async () => {
      const result = getFlattenedSchemaInfo(
        v.object({
          ...primitiveSchemaMap,
          nested: v.optional(v.object(primitiveSchemaMap)),
        })
      );
      expect(result).toBe(
        [
          'root.any: any',
          'root.bigint: bigint',
          'root.blob: blob',
          'root.boolean: boolean',
          'root.date: date',
          'root.nan: number',
          'root.never: never',
          'root.null: null',
          'root.number: number',
          'root.string: string',
          'root.symbol: symbol',
          'root.undefined: undefined',
          'root.unknown: unknown',
          'root.void: void',
          `root.nested?.any: any`,
          `root.nested?.bigint: bigint`,
          `root.nested?.blob: blob`,
          `root.nested?.boolean: boolean`,
          `root.nested?.date: date`,
          `root.nested?.nan: number`,
          `root.nested?.never: never`,
          `root.nested?.null: null`,
          `root.nested?.number: number`,
          `root.nested?.string: string`,
          `root.nested?.symbol: symbol`,
          `root.nested?.undefined: undefined`,
          `root.nested?.unknown: unknown`,
          `root.nested?.void: void`,
        ].join('\n') + '\n'
      );
    });
    test('optional whole schema', async () => {
      const result = getFlattenedSchemaInfo(
        v.optional(
          v.object({
            ...optionalPrimitiveSchemaMap,
            nested: v.optional(v.object(optionalPrimitiveSchemaMap)),
          })
        )
      );
      expect(result).toBe(
        [
          'root?.any?: any',
          'root?.bigint?: bigint',
          'root?.blob?: blob',
          'root?.boolean?: boolean',
          'root?.date?: date',
          'root?.nan?: number',
          'root?.never?: never',
          'root?.null?: null',
          'root?.number?: number',
          'root?.string?: string',
          'root?.symbol?: symbol',
          'root?.undefined: undefined',
          'root?.unknown?: unknown',
          'root?.void?: void',
          `root?.nested?.any?: any`,
          `root?.nested?.bigint?: bigint`,
          `root?.nested?.blob?: blob`,
          `root?.nested?.boolean?: boolean`,
          `root?.nested?.date?: date`,
          `root?.nested?.nan?: number`,
          `root?.nested?.never?: never`,
          `root?.nested?.null?: null`,
          `root?.nested?.number?: number`,
          `root?.nested?.string?: string`,
          `root?.nested?.symbol?: symbol`,
          `root?.nested?.undefined: undefined`,
          `root?.nested?.unknown?: unknown`,
          `root?.nested?.void?: void`,
        ].join('\n') + '\n'
      );
    });
  });

  describe('schemas of arrays', () => {
    Object.entries(primitiveSchemaMap)
      .filter(([key]) => key !== 'nan')
      .forEach(([primitive, schema]) => {
        test(`test of [${primitive}]`, async () => {
          const result = getFlattenedSchemaInfo(v.array(schema));
          expect(result).toBe(`root[]: ${primitive}\n`);
        });
      });

    test(`test of [nan]`, async () => {
      const result = getFlattenedSchemaInfo(v.array(v.nan()));
      expect(result).toBe(`root[]: number\n`);
    });

    test('array of object schema', async () => {
      const result = getFlattenedSchemaInfo(
        v.array(v.object(primitiveSchemaMap))
      );
      expect(result).toBe(
        [
          'root[].any: any',
          'root[].bigint: bigint',
          'root[].blob: blob',
          'root[].boolean: boolean',
          'root[].date: date',
          'root[].nan: number',
          'root[].never: never',
          'root[].null: null',
          'root[].number: number',
          'root[].string: string',
          'root[].symbol: symbol',
          'root[].undefined: undefined',
          'root[].unknown: unknown',
          'root[].void: void',
        ].join('\n') + '\n'
      );
    });

    test('optional array of optional object schema', async () => {
      const result = getFlattenedSchemaInfo(
        v.optional(v.array(v.object(optionalPrimitiveSchemaMap)))
      );
      expect(result).toBe(
        [
          'root[]?.any?: any',
          'root[]?.bigint?: bigint',
          'root[]?.blob?: blob',
          'root[]?.boolean?: boolean',
          'root[]?.date?: date',
          'root[]?.nan?: number',
          'root[]?.never?: never',
          'root[]?.null?: null',
          'root[]?.number?: number',
          'root[]?.string?: string',
          'root[]?.symbol?: symbol',
          'root[]?.undefined: undefined',
          'root[]?.unknown?: unknown',
          'root[]?.void?: void',
        ].join('\n') + '\n'
      );
    });
  });

  describe('schemas of enums', () => {
    test(`test of typescript enum`, async () => {
      const result = getFlattenedSchemaInfo(v.enum_(Enum));
      expect(result).toBe(`root: enum { TEST_KEY = 'TEST_VALUE' }\n`);
    });
    test(`test of const object enum`, async () => {
      const result = getFlattenedSchemaInfo(v.enum_(ObjEnum));
      expect(result).toBe(`root: enum { TEST_KEY = 'TEST_VALUE' }\n`);
    });
    test(`test of enum array`, async () => {
      const resultE = getFlattenedSchemaInfo(v.array(v.enum_(Enum)));
      const resultO = getFlattenedSchemaInfo(v.array(v.enum_(ObjEnum)));
      expect(resultE).toBe(`root[]: enum { TEST_KEY = 'TEST_VALUE' }\n`);
      expect(resultO).toBe(`root[]: enum { TEST_KEY = 'TEST_VALUE' }\n`);
    });
    test(`test of object with value as enum`, async () => {
      const resultE = getFlattenedSchemaInfo(v.object({ foo: v.enum_(Enum) }));
      const resultO = getFlattenedSchemaInfo(
        v.object({ foo: v.enum_(ObjEnum) })
      );
      expect(resultE).toBe(`root.foo: enum { TEST_KEY = 'TEST_VALUE' }\n`);
      expect(resultO).toBe(`root.foo: enum { TEST_KEY = 'TEST_VALUE' }\n`);
    });
    test(`test of multiple property listing`, async () => {
      const resultE = getFlattenedSchemaInfo(v.enum_(Enum2));
      const resultO = getFlattenedSchemaInfo(v.enum_(ObjEnum2));
      expect(resultE).toBe(
        `root: enum { TEST_NUMBER = 42, TEST_STRING = 'TEST_STRING' }\n`
      );
      expect(resultO).toBe(
        `root: enum { TEST_NUMBER = 42, TEST_STRING = 'TEST_STRING' }\n`
      );
    });
  });

  describe('schemas of tuples', () => {
    Object.entries(primitiveSchemaMap)
      .filter(([key]) => key !== 'nan')
      .forEach(([primitive, schema]) => {
        test(`test of [${primitive}]`, async () => {
          const result = getFlattenedSchemaInfo(v.tuple([schema]));
          expect(result).toBe(`root[0]: ${primitive}\n`);
        });
      });

    test(`test of [nan]`, async () => {
      const result = getFlattenedSchemaInfo(v.tuple([v.nan()]));
      expect(result).toBe(`root[0]: number\n`);
    });

    test('tuple of object schema', async () => {
      const result = getFlattenedSchemaInfo(
        v.tuple([v.object(primitiveSchemaMap)])
      );
      expect(result).toBe(
        [
          'root[0].any: any',
          'root[0].bigint: bigint',
          'root[0].blob: blob',
          'root[0].boolean: boolean',
          'root[0].date: date',
          'root[0].nan: number',
          'root[0].never: never',
          'root[0].null: null',
          'root[0].number: number',
          'root[0].string: string',
          'root[0].symbol: symbol',
          'root[0].undefined: undefined',
          'root[0].unknown: unknown',
          'root[0].void: void',
        ].join('\n') + '\n'
      );
    });

    test('wide tuple', async () => {
      const tupleValues = Object.values(primitiveSchemaMap) as unknown as [
        v.BaseSchema,
        ...v.BaseSchema[],
      ];
      const result = getFlattenedSchemaInfo(v.tuple(tupleValues));
      expect(result).toBe(
        [
          'root[0]: any',
          'root[1]: bigint',
          'root[2]: blob',
          'root[3]: boolean',
          'root[4]: date',
          'root[5]: number',
          'root[6]: never',
          'root[7]: null',
          'root[8]: number',
          'root[9]: string',
          'root[10]: symbol',
          'root[11]: undefined',
          'root[12]: unknown',
          'root[13]: void',
        ].join('\n') + '\n'
      );
    });
  });
});

// eslint-disable-next-line vitest/no-commented-out-tests
// describe(`\`${getTsTypeString.name}\`s function tests:`, () => {
// eslint-disable-next-line vitest/no-commented-out-tests
//   test('should validate body schema passed in', async () => {
//     expect('todo').toBe('todo');
//   });
// });
