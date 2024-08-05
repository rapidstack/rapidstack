/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { styled, ThemeProvider, useTheme } from 'styled-components';

import type { AppThemeInput } from '../theme/theme-input.types.js';
import type { MakeThemeOutput } from '../theme/theme-output.types.js';

/**
 * This file is a copy of the styled-components @types/pkg file, with some
 * modifications to make it work with the desired behavior of this library.
 */

// export type ThemeForNow = {
//   color:
// }

interface ThemeProps<T> {
  theme: T;
}

type ThemedStyledProps<P, T> = P & ThemeProps<T>;

type KeyofBase = keyof any;

type Diff<T extends KeyofBase, U extends KeyofBase> = ({
  [P in U]: never;
} & { [P in T]: P })[T];

type DiffBetween<T, U> = Pick<T, Diff<keyof T, keyof U>> &
  Pick<U, Diff<keyof U, keyof T>>;

type Interpolation<P> =
  | FlattenInterpolation<P>
  | ReadonlyArray<
      FlattenInterpolation<P> | ReadonlyArray<FlattenInterpolation<P>>
    >;

type FlattenInterpolation<P> = InterpolationFunction<P> | InterpolationValue;

type InterpolationFunction<P> = (props: P) => Interpolation<P>;

type FalsyValue = false | null | undefined;

type InterpolationValue =
  | FalsyValue
  | StyledComponentClass<any, any>
  | Styles
  | number
  | string;

interface Styles {
  [ruleOrSelector: string]: Styles | number | string;
}

type ThemedOuterStyledProps<P, T> = {
  innerRef?:
    | ((instance: any) => void)
    | React.RefObject<HTMLElement | React.Component | SVGElement>
    | undefined;
  theme?: T | undefined;
} & P;

interface StyledComponentClass<P, T, O = P>
  extends React.ComponentClass<ThemedOuterStyledProps<O, T>> {
  extend: ThemedStyledFunction<P, T, O>;

  withComponent<K extends keyof React.JSX.IntrinsicElements>(
    tag: K
  ): StyledComponentClass<
    React.JSX.IntrinsicElements[K],
    T,
    O & React.JSX.IntrinsicElements[K]
  >;
  withComponent<U = {}>(
    element: React.ComponentType<U>
  ): StyledComponentClass<U, T, O & U>;
}

type Attrs<P, A extends Partial<P>, T> = {
  [K in keyof A]: ((props: ThemedStyledProps<P, T>) => A[K]) | A[K];
};

interface ThemedStyledFunction<P, T, O = P> {
  (
    strings: TemplateStringsArray,
    ...interpolations: Array<Interpolation<ThemedStyledProps<P, T>>>
  ): StyledComponentClass<P, T, O>;
  <U>(
    strings: TemplateStringsArray,
    ...interpolations: Array<Interpolation<ThemedStyledProps<P & U, T>>>
  ): StyledComponentClass<P & U, T, O & U>;
  attrs<U, A extends Partial<P & U> = {}>(
    attrs: Attrs<P & U, A, T>
  ): ThemedStyledFunction<DiffBetween<A, P & U>, T, DiffBetween<A, O & U>>;
}

export type WithOptionalTheme<P extends { theme?: T | undefined }, T> = {
  theme?: T | undefined;
} & Omit<P, 'theme'>;

export type ThemedStyledComponentFactories<T> = {
  [TTag in keyof React.JSX.IntrinsicElements]: ThemedStyledFunction<
    React.JSX.IntrinsicElements[TTag],
    T
  >;
};

export interface ThemedBaseStyledInterface<T>
  extends ThemedStyledComponentFactories<T> {
  <P, TTag extends keyof React.JSX.IntrinsicElements>(
    tag: TTag
  ): ThemedStyledFunction<P, T, P & React.JSX.IntrinsicElements[TTag]>;
  <P, O>(
    component: StyledComponentClass<P, T, O>
  ): ThemedStyledFunction<P, T, O>;
  <P extends { [prop: string]: any; theme?: T | undefined }>(
    component: React.ComponentType<P>
  ): ThemedStyledFunction<P, T, WithOptionalTheme<P, T>>;
}

type ThemedStyledInterface<T> = ThemedBaseStyledInterface<
  Extract<keyof T, string> extends never ? any : T
>;

/**
 *
 * @param styledInstance
 */
export function makeThemedStyled<T extends AppThemeInput>(
  styledInstance: typeof styled
): ThemedStyledInterface<MakeThemeOutput<T>> {
  return styledInstance as unknown as ThemedStyledInterface<MakeThemeOutput<T>>;
}

/**
 *
 * @param baseUseTheme
 */
export function makeThemedHook<T extends AppThemeInput>(
  baseUseTheme: typeof useTheme
): () => MakeThemeOutput<T> {
  return baseUseTheme as () => MakeThemeOutput<T>;
}

/**
 *
 * @param baseProvider
 */
export function makeThemedProvider<T extends AppThemeInput>(
  baseProvider: typeof ThemeProvider
): React.ComponentType<React.PropsWithChildren<{ theme: MakeThemeOutput<T> }>> {
  return baseProvider as React.ComponentType<
    React.PropsWithChildren<{ theme: MakeThemeOutput<T> }>
  >;
}
