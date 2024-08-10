/* eslint-disable perfectionist/sort-object-types */

import type {
  FullThemeColor,
  OpacityColorVariantKeys,
  TintShadeAliasedColorVariantKeys,
  TintShadeColorVariantKeys,
} from './theme.types.js';
import type {
  AppThemeInput,
  ExpectedUtilityFunctionKeys,
} from './theme-input.types.js';

export type CSSVariable = `--rs-${string}`;

type FullComputedThemeColor = {
  [key in OpacityColorVariantKeys]: CSSVariable;
} & {
  [key in TintShadeAliasedColorVariantKeys]: CSSVariable;
} & { [key in TintShadeColorVariantKeys]: CSSVariable };

export type MakeThemeOutput<T extends AppThemeInput<string, any>> = {
  color: {
    [key in keyof T['colors']]: FullComputedThemeColor;
  };
  _computed: {
    color: {
      [key in keyof T['colors']]: FullThemeColor;
    };
  };
  utils: {
    [key in ExpectedUtilityFunctionKeys]: (
      colorVariable: CSSVariable
    ) => string;
  } & {
    [key in keyof T['utils']]: (colorVariable: CSSVariable) => string;
  };
};
