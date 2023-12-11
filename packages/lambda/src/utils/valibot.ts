/* eslint-disable max-params */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as v from 'valibot';

export type ValibotSchema = v.BaseSchema | v.BaseSchemaAsync;

// Cast type so that type narrowing in switch will work
// TODO: some of these still need to be implemented but cover the most common
// cases for now
// prettier-ignore
type AnyValibotSchema =
  | v.AnySchema                     // done
  | v.ArraySchema<v.BaseSchema>     // done
  | v.BigintSchema                  // done
  | v.BlobSchema                    // done
  | v.BooleanSchema                 // done
  | v.DateSchema                    // done
  | v.EnumSchema<any>               // done
  | v.InstanceSchema<any>
  | v.IntersectSchema<any>
  | v.LiteralSchema<any>            // done
  | v.MapSchema<any, any>
  | v.NanSchema                     // done
  | v.NeverSchema                   // done
  | v.NonNullableSchema<any>        // done
  | v.NonNullishSchema<any>         // done
  | v.NonOptionalSchema<any>        // done
  | v.NullSchema                    // done
  | v.NullableSchema<any>           // done
  | v.NullishSchema<any>            // done
  | v.NumberSchema                  // done
  | v.ObjectSchema<any>             // done
  | v.OptionalSchema<v.BaseSchema>  // done
  | v.PicklistSchema<any>
  | v.RecordSchema<any, any>
  | v.RecursiveSchema<any>
  | v.SetSchema<any>
  | v.SpecialSchema<any>
  | v.StringSchema                  // done
  | v.SymbolSchema                  // done
  | v.TupleSchema<v.TupleItems>     // done
  | v.UndefinedSchema               // done
  | v.UnionSchema<any>
  | v.UnknownSchema                 // done
  | v.VariantSchema<any, any>
  | v.VoidSchema; //                   done

const printPrimitive = (
  path: string,
  value: string,
  nullable = false,
  optional = false
): string => {
  if (nullable && optional && value !== 'null' && value !== 'undefined') {
    return (
      (path ? `${path}?: ${value} | null` : `${value} | null | undefined`) +
      '\n'
    );
  }

  if (optional && value !== 'undefined') {
    return (path ? `${path}?: ${value}` : `${value} | undefined`) + '\n';
  }

  if (nullable && value !== 'null') {
    return (path ? `${path}: ${value} | null` : `${value} | null`) + '\n';
  }

  return (path ? `${path}: ${value}` : value) + '\n';
};

/**
 * Returns the flattened string representation of a schema
 * @param schema the schema (sync or async) to flatten
 * @param path the path to the current schema
 * @param nullable whether the current schema is nullable
 * @param optional whether the current schema is optional
 * @returns the flatten string representation of a schema with each property on
 * a new line
 */
export function getFlattenedSchemaInfo(
  schema: ValibotSchema,
  path = '',
  nullable?: boolean,
  optional?: boolean
): string {
  const interpretedSchema = schema as AnyValibotSchema;

  switch (interpretedSchema.type) {
    /**
     * Primitive cases (simple return the type)
     */
    case 'any':
    case 'bigint':
    case 'blob':
    case 'boolean':
    case 'date':
    case 'never':
    case 'null':
    case 'number':
    case 'string':
    case 'symbol':
    case 'undefined':
    case 'unknown':
    case 'void':
      return printPrimitive(path, interpretedSchema.type, nullable, optional);
    case 'nan':
      return printPrimitive(path, 'number', nullable, optional);

    /**
     * Literal (actual js primitives)
     */
    case 'literal':
      const literal = interpretedSchema.literal;
      const type = typeof literal;
      const value = `(literal ${type}: ${
        type === 'string' ? `"${literal}"` : String(literal)
      })`;
      return printPrimitive(path, value, nullable, optional);

    /**
     * Type modifiers
     */
    case 'optional':
      return getFlattenedSchemaInfo(
        interpretedSchema.wrapped,
        path,
        nullable,
        optional ?? true
      );

    case 'non_optional':
      return getFlattenedSchemaInfo(
        interpretedSchema.wrapped,
        path,
        nullable,
        optional ?? false
      );

    case 'nullable':
      return getFlattenedSchemaInfo(
        interpretedSchema.wrapped,
        path,
        nullable ?? true,
        optional
      );

    case 'non_nullable':
      return getFlattenedSchemaInfo(
        interpretedSchema.wrapped,
        path,
        nullable ?? false,
        optional
      );

    case 'nullish':
      return getFlattenedSchemaInfo(
        interpretedSchema.wrapped,
        path,
        nullable ?? true,
        optional ?? true
      );

    case 'non_nullish':
      return getFlattenedSchemaInfo(
        interpretedSchema.wrapped,
        path,
        nullable ?? false,
        optional ?? false
      );

    /**
     * Complex data types
     */
    case 'object':
      return Object.entries(interpretedSchema.entries)
        .flatMap(([key, value]) => {
          return getFlattenedSchemaInfo(
            value as v.BaseSchema,
            `${path || 'root'}${optional ? '?' : ''}.${key}`
          );
        })
        .join('');

    case 'array':
      return getFlattenedSchemaInfo(
        interpretedSchema.item,
        `${path || 'root'}[]${optional ? '?' : ''}`
      );

    case 'tuple':
      return interpretedSchema.items
        .flatMap((item, index) => {
          return getFlattenedSchemaInfo(
            item,
            `${path || 'root'}[${index}]${optional ? '?' : ''}`
          );
        })
        .join('');

    case 'enum':
      const enumString =
        'enum { ' +
        Object.entries(interpretedSchema.enum).reduce(
          (acc, [key, val], i, a) => {
            // Skip if the key is a number (reverse mapping for enums)
            if (!isNaN(parseFloat(key))) return acc;

            if (acc) acc += ', ';
            acc += `${key} = ${typeof val === 'string' ? `'${val}'` : val}`;
            if (i === a.length - 1) acc += ' ';
            return acc;
          },
          ''
        ) +
        '}';
      return printPrimitive(
        `${path || 'root'}${optional ? '?' : ''}`,
        enumString,
        nullable,
        optional
      );

    /**
     * Fallback case. Could not interpret schema.
     */
    default:
      return printPrimitive(path, 'could not interpret');
  }
}

/**
 * Returns whether a schema is a valibot object schema
 * @param schema the valibot schema (sync or async) to check
 * @returns whether the schema is a valibot object schema
 */
export function isObjectSchema(schema?: ValibotSchema): boolean {
  if (!schema) return false;
  if ((schema as AnyValibotSchema).type === 'object') return true;

  // if we have wrappers, recurse to unwrap
  // @ts-expect-error - ts can't pick this out of the union
  if ((schema as AnyValibotSchema).wrapped) {
    // @ts-expect-error - ts can't pick this out of the union
    return isObjectSchema((schema as AnyValibotSchema).wrapped);
  }

  return false;
}

/**
 * Returns the TypeScript string representation of a schema
 * @param schema the schema (sync or async) to stringify
 * @param spaces the number of spaces to indent each line
 * @returns the string representation of a schema with each property on a new
 * line
 */
// export async function getTsTypeString(
//   schema: ValibotSchema,
//   spaces = 2
// ): Promise<string> {
//   return JSON.stringify(schema, null, spaces);
// }
