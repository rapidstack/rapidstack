/* eslint-disable perfectionist/sort-object-types */

import type {
  FullThemeColor,
  OpacityColorVariantKeys,
  TintShadeAliasedColorVariantKeys,
  TintShadeColorVariantKeys,
} from './theme.types.js';
import type { AppThemeInput } from './theme-input.types.js';

export type CSSVariable = `--rs-${string}`;

type FullComputedThemeColor = {
  [key in OpacityColorVariantKeys]: CSSVariable;
} & {
  [key in TintShadeAliasedColorVariantKeys]: CSSVariable;
} & { [key in TintShadeColorVariantKeys]: CSSVariable };

export type MakeThemeOutput<T extends AppThemeInput> = {
  color: {
    [key in keyof T['colors']]: FullComputedThemeColor;
  };
  // where theme values translate to css variables, _computed holds the real
  // string values
  _computed: {
    color: {
      [key in keyof T['colors']]: FullThemeColor;
    };
  };
};
