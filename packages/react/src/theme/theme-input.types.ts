/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable perfectionist/sort-object-types */

import type { HexColor } from '../utils/colors.js';
import type { ColorThemeType, FullThemeColor } from './theme.types.js';

type WebFonts =
  | 'Andale Mono'
  | 'Arial'
  | 'Arial'
  | 'Baskerville'
  | 'Bradley Hand'
  | 'Brush Script MT'
  | 'Comic Sans MS'
  | 'Courier'
  | 'Georgia'
  | 'Gill Sans'
  | 'Helvetica'
  | 'Impact'
  | 'Lucida'
  | 'Luminari'
  | 'Monaco'
  | 'Palatino'
  | 'Tahoma'
  | 'Times New Roman'
  | 'Trebuchet'
  | 'Verdana';

export type FontFormat = 'truetype' | 'woff' | 'woff2';
export type FontStyle = 'italic' | 'normal' | 'oblique';
export type FontStretch =
  | 'condensed'
  | 'expanded'
  | 'extra-condensed'
  | 'extra-expanded'
  | 'normal'
  | 'semi-condensed'
  | 'semi-expanded'
  | 'ultra-condensed'
  | 'ultra-expanded';

export type FontWeight =
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | 'bold'
  | 'normal';

export type FontSource = { type: FontFormat; url: string };
export type FontVariant = {
  sources: FontSource[];
  stretch?: FontStretch;
  style?: FontStyle;
  weight?: FontWeight;
};

export type FontThemeInput = {
  [identifier: string]: {
    fallbacks: WebFonts[];
    locals: string[];
    name: string;
    variants: FontVariant[];
  };
};

export type ThemeFullColorInput = { 500: HexColor } & Partial<FullThemeColor>;
export type ThemeColorInput = HexColor | ThemeFullColorInput;

export type ColorThemeInput<
  CustomColorKeys extends string | undefined = undefined,
> = {
  // standard theme colors:
  primary: ThemeColorInput;
  secondary: ThemeColorInput;
  accent: ThemeColorInput;

  // contrasting colors:
  background: ThemeColorInput;
  text: ThemeColorInput;

  // utility theme colors:
  info: ThemeColorInput;
  success: ThemeColorInput;
  warning: ThemeColorInput;
  danger: ThemeColorInput;
  gray: ThemeColorInput;
} & (CustomColorKeys extends string
  ? { [key in CustomColorKeys]: ThemeColorInput }
  : {});

export type AppThemeInput<
  CustomColorKeys extends string | undefined = undefined,
  // CustomFontKeys extends string | undefined = undefined,
> = {
  type: ColorThemeType;
  colors: ColorThemeInput<CustomColorKeys>;
};
