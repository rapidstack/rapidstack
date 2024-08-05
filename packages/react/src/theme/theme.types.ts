import type { HexColor } from '../utils/colors.js';

export type OpacityColorVariantKeys =
  | 'o10'
  | 'o20'
  | 'o30'
  | 'o40'
  | 'o50'
  | 'o60'
  | 'o70'
  | 'o80'
  | 'o90';

export type OpacityColorVariants = {
  [key in OpacityColorVariantKeys]: HexColor;
};

export type TintShadeColorVariantKeys =
  | 50
  | 100 // (alias: lighter)
  | 150
  | 200
  | 250
  | 300 // (alias: light)
  | 350
  | 400
  | 450 // tints    ↑
  | 500 // main color (alias: main)
  | 550 // shades   ↓
  | 600
  | 650
  | 700 // (alias: dark)
  | 750
  | 800
  | 850
  | 900 // (alias: darker)
  | 950;
export type TintShadeColorVariants = {
  [key in TintShadeColorVariantKeys]: HexColor;
};

export type TintShadeAliasedColorVariantKeys =
  | 'lighter'
  | 'light'
  | 'main'
  | 'dark'
  | 'darker';

export type FullThemeColor = OpacityColorVariants & TintShadeColorVariants;

export type ColorThemeType = 'light' | 'dark';
