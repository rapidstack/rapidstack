import type {
  FullThemeColor,
  OpacityColorVariantKeys,
  TintShadeColorVariantKeys,
} from '../theme/theme.types.js';
import type {
  ThemeColorInput,
  ThemeFullColorInput,
} from '../theme/theme-input.types.js';

export type HexColor = `#${Lowercase<string>}`;
export type RGBColor = [r: number, g: number, b: number] & { _type?: 'rgb' };
export type LabColor = [l: number, a: number, b: number] & { _type?: 'lab' };

const eightBitTenths = ['1a', '33', '4d', '66', '80', '99', 'b3', 'cc', 'e6'];
const white = '#ffffff' as HexColor;
const black = '#000000' as HexColor;

/**
 *
 * @param rgb
 */
export function calculateLuminance(rgb: RGBColor): number {
  const [rc, gc, bc] = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return rc * 0.2126 + gc * 0.7152 + bc * 0.0722;
}

/**
 *
 * @param hex
 */
export function convertHexToRgb(hex: HexColor): RGBColor {
  let mutHex = hex.slice(1) as string;
  if (mutHex.length === 3) {
    mutHex = mutHex
      .split('')
      .map((val) => val + val)
      .join('');
  }

  const rgb = mutHex.match(/.{2}/g)!;
  return [parseInt(rgb[0], 16), parseInt(rgb[1], 16), parseInt(rgb[2], 16)];
}

/**
 *
 * @param rgb
 */
export function convertRgbToHex(rgb: RGBColor): HexColor {
  const [r, g, b] = rgb.map(Math.round);

  const hex = (r << 16) | (g << 8) | b;
  let str = '000000' + hex.toString(16);
  str = str.substring(str.length - 6);
  return ('#' + str) as HexColor;
}

/**
 *
 * @param color1
 * @param color2
 */
export function getContrastRatio(color1: HexColor, color2: HexColor): number {
  const rgb1 = convertHexToRgb(color1);
  const rgb2 = convertHexToRgb(color2);

  const color1Luminance = calculateLuminance(rgb1);
  const color2Luminance = calculateLuminance(rgb2);

  return (
    1 /
    (color1Luminance > color2Luminance
      ? (color2Luminance + 0.05) / (color1Luminance + 0.05)
      : (color1Luminance + 0.05) / (color2Luminance + 0.05))
  );
}

/**
 *
 * @param component
 */
function convertRgbComponentToLrgb(component: number): number {
  const abs = Math.abs(component / 255);
  if (abs < 0.04045) return component / 3294.6; // (255 * 12.92)

  return (Math.sign(component) || 1) * Math.pow((abs + 0.055) / 1.055, 2.4);
}

/**
 *
 * @param component
 */
function convertLrgbComponentToRgb(component: number): number {
  const abs = Math.abs(component);
  let val: number;
  if (abs > 0.0031308) {
    val =
      (Math.sign(component) || 1) *
      (1.055 * Math.pow(abs, 1 / 2.4) - 0.055) *
      255;
  } else {
    val = component * 12.92 * 255;
  }

  // for values > 255, return 255; for values < 0, return 0
  return Math.min(255, Math.max(0, val));
}

/**
 *
 * @param rgb
 */
export function convertRgbToLrgb(rgb: RGBColor): RGBColor {
  const [r, g, b] = rgb;
  return [
    convertRgbComponentToLrgb(r),
    convertRgbComponentToLrgb(g),
    convertRgbComponentToLrgb(b),
  ];
}

/**
 *
 * @param lrgb
 */
export function convertLrgbToRgb(lrgb: RGBColor): RGBColor {
  const [r, g, b] = lrgb;
  return [
    convertLrgbComponentToRgb(r),
    convertLrgbComponentToRgb(g),
    convertLrgbComponentToRgb(b),
  ];
}

/**
 *
 * @param lrgb
 */
export function convertLrgbToOklab(lrgb: RGBColor): LabColor {
  const [r = 0, g = 0, b = 0] = lrgb;

  const L = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const M = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const S = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return [
    0.2104542553 * L + 0.793617785 * M - 0.0040720468 * S,
    1.9779984951 * L - 2.428592205 * M + 0.4505937099 * S,
    0.0259040371 * L + 0.7827717662 * M - 0.808675766 * S,
  ];
}

/**
 *
 * @param oklab
 */
export function convertOklabToRgb(oklab: LabColor): RGBColor {
  const [L, a, b] = oklab;
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);

  return convertLrgbToRgb([
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]);
}

/**
 *
 * @param rgb
 */
export function convertRgbToOklab(rgb: RGBColor): LabColor {
  return convertLrgbToOklab(convertRgbToLrgb(rgb));
}

/**
 *
 * @param color1
 * @param color2
 * @param f
 */
function computeInterpolationStep(
  color1: RGBColor,
  color2: RGBColor,
  f: number
): LabColor {
  const okColor1 = convertRgbToOklab(color1);
  const okColor2 = convertRgbToOklab(color2);
  return [
    okColor1[0] + f * (okColor2[0] - okColor1[0]),
    okColor1[1] + f * (okColor2[1] - okColor1[1]),
    okColor1[2] + f * (okColor2[2] - okColor1[2]),
  ];
}

/**
 *
 * @param color1
 * @param color2
 * @param steps
 */
export function interpolateColors(
  color1: HexColor,
  color2: HexColor,
  steps: number
): HexColor[] {
  const colors = [] as HexColor[];
  const rgb1 = convertHexToRgb(color1);
  const rgb2 = convertHexToRgb(color2);
  for (let i = 0; i < steps; i++) {
    const f = i / (steps - 1);
    const color = computeInterpolationStep(rgb1, rgb2, f);
    const rgb = convertOklabToRgb(color);
    const hex = convertRgbToHex(rgb);
    colors.push(hex);
  }

  return colors;
}

/**
 *
 * @param color
 */
export function computeFullThemeColor(color: ThemeColorInput): FullThemeColor {
  const themeColor = (
    typeof color === 'object' ? { ...color } : { 500: color }
  ) as ThemeFullColorInput;

  // if data is already supplied, skip the computation for all the colors
  const suppliedTints =
    themeColor[50] &&
    themeColor[100] &&
    themeColor[150] &&
    themeColor[200] &&
    themeColor[250] &&
    themeColor[300] &&
    themeColor[350] &&
    themeColor[400] &&
    themeColor[450];

  const suppliedShades =
    themeColor[550] &&
    themeColor[600] &&
    themeColor[650] &&
    themeColor[700] &&
    themeColor[750] &&
    themeColor[800] &&
    themeColor[850] &&
    themeColor[900] &&
    themeColor[950];

  const suppliedOpacities =
    themeColor.o10 &&
    themeColor.o20 &&
    themeColor.o30 &&
    themeColor.o40 &&
    themeColor.o50 &&
    themeColor.o60 &&
    themeColor.o70 &&
    themeColor.o80 &&
    themeColor.o90;

  if (suppliedTints && suppliedShades && suppliedOpacities) {
    return themeColor as FullThemeColor;
  }

  const tints = suppliedTints
    ? []
    : interpolateColors(white, themeColor[500], 11).slice(1, 10);
  const shades = suppliedShades
    ? []
    : interpolateColors(themeColor[500], black, 11).slice(1, 10);

  // add all 28 (9 + 1 + 9 + 9) tint, shade, and opacity variants to object
  for (let i = 1; i < 29; i++) {
    // add the tint variants (1-9; 50-450)
    if (i < 10 && !suppliedTints) {
      const key = (i * 50) as TintShadeColorVariantKeys;
      themeColor[key] ??= tints[i - 1];
      continue;
    }

    // base color (500; already added in themeColor)
    if (i === 10) continue;

    // add the shade variants (11-20; 550-950)
    if (i < 20 && !suppliedShades) {
      const key = (i * 50) as TintShadeColorVariantKeys;
      themeColor[key] ??= shades[i - 11];
      continue;
    }

    // add the opacity variants (21-29; o10-o90)
    if (suppliedOpacities) break;
    const key = `o${(i - 19) * 10}` as OpacityColorVariantKeys;
    themeColor[key] ??= (themeColor[500] + eightBitTenths[i - 20]) as HexColor;
  }

  return themeColor as FullThemeColor;
}
