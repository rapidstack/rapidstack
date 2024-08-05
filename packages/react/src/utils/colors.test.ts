import { describe, expect, test } from 'vitest';

import type { FullThemeColor } from '../theme/theme.types.js';

import {
  computeFullThemeColor,
  convertHexToRgb,
  convertLrgbToOklab,
  convertLrgbToRgb,
  convertOklabToRgb,
  convertRgbToHex,
  convertRgbToLrgb,
  convertRgbToOklab,
  getContrastRatio,
  type HexColor,
  interpolateColors,
  type LabColor,
  type RGBColor,
} from './colors.js';

// test data from independent calculations as well as from:
// https://colorkit.co/color-shades-generator/814b38/
// https://colorkit.co/contrast-checker/814b38-ffffff/
// https://colorkit.co/contrast-checker/814b38-000000/
// https://colorkit.co/contrast-checker/ffffff-000000/

const testColor1Hex = '#814b38' as HexColor;
const testColor2Hex = '#ffffff' as HexColor;
const testColor3Hex = '#000000' as HexColor;

const testColor1Rgb = [129, 75, 56] as RGBColor;
const testColor2Rgb = [255, 255, 255] as RGBColor;
const testColor3Rgb = [0, 0, 0] as RGBColor;

const testColor1Lrgb = [
  0.21952619972926923, 0.07036009569659588, 0.03954623527673283,
] as RGBColor;
const testColor2Lrgb = [1, 1, 1] as RGBColor;
const testColor3Lrgb = [0, 0, 0] as RGBColor;

const testColor1Oklab = [
  0.4717657080644588, 0.060848951091069414, 0.05115921231397208,
] as LabColor;
const testColor2Oklab = [
  0.9999999934735462, 8.095285553011422e-11, 3.727390762708893e-8,
] as LabColor;
const testColor3Oklab = [0, 0, 0] as LabColor;

const interpolate1To2For11 = [
  '#814b38',
  '#8e5c4a',
  '#9b6d5d',
  '#a77e70',
  '#b49083',
  '#c1a297',
  '#cdb4ab',
  '#dac6c0',
  '#e6d9d4',
  '#f3ecea',
  '#ffffff',
] as HexColor[];
const interpolate1To3For11 = [
  '#814b38',
  '#6f402f',
  '#5e3527',
  '#4e2b1f',
  '#3e2117',
  '#2e170f',
  '#1f0e08',
  '#120604',
  '#060201',
  '#010000',
  '#000000',
] as HexColor[];
const interpolate2To3For11 = [
  '#ffffff',
  '#dedede',
  '#bebebe',
  '#9e9e9e',
  '#808080',
  '#636363',
  '#484848',
  '#2e2e2e',
  '#161616',
  '#030303',
  '#000000',
] as HexColor[];

const contrast1To2 = '7.01';
const contrast2To3 = '21.0';
const contrast1To3 = '3.00';

// full expansion of testColor1 as a theme color:
const testColorTheme1 = {
  50: '#f3ecea',
  100: '#e6d9d4',
  150: '#dac6c0',
  200: '#cdb4ab',
  250: '#c1a297',
  300: '#b49083',
  350: '#a77e70',
  400: '#9b6d5d',
  450: '#8e5c4a',
  500: '#814b38',
  550: '#6f402f',
  600: '#5e3527',
  650: '#4e2b1f',
  700: '#3e2117',
  750: '#2e170f',
  800: '#1f0e08',
  850: '#120604',
  900: '#060201',
  950: '#010000',
  o10: '#814b381a',
  o20: '#814b3833',
  o30: '#814b384d',
  o40: '#814b3866',
  o50: '#814b3880',
  o60: '#814b3899',
  o70: '#814b38b3',
  o80: '#814b38cc',
  o90: '#814b38e6',
} satisfies FullThemeColor;

// this tests some out of bounds color data that happens in oklab -> lrgb -> rgb
const testColorTheme2 = {
  50: '#e9f3ff',
  100: '#d3e7ff',
  150: '#bddaff',
  200: '#a7ceff',
  250: '#92c1ff',
  300: '#7bb4ff',
  350: '#65a6ff',
  400: '#4d98ff',
  450: '#318aff',
  500: '#007bff',
  550: '#006ade',
  600: '#005abe',
  650: '#004a9e',
  700: '#003a80',
  750: '#002c63',
  800: '#001e48',
  850: '#00102e',
  900: '#000516',
  950: '#000103',
  o10: '#007bff1a',
  o20: '#007bff33',
  o30: '#007bff4d',
  o40: '#007bff66',
  o50: '#007bff80',
  o60: '#007bff99',
  o70: '#007bffb3',
  o80: '#007bffcc',
  o90: '#007bffe6',
} satisfies FullThemeColor;

const testColorTheme3 = {
  50: '#fff9ed',
  100: '#fff4db',
  150: '#ffeec9',
  200: '#ffe8b6',
  250: '#ffe2a3',
  300: '#ffdb8f',
  350: '#ffd579',
  400: '#ffce61',
  450: '#ffc843',
  500: '#ffc107',
  550: '#dea705',
  600: '#be8f04',
  650: '#9e7702',
  700: '#805f02',
  750: '#634901',
  800: '#483400',
  850: '#2e2000',
  900: '#160e00',
  950: '#030200',
  o10: '#ffc1071a',
  o20: '#ffc10733',
  o30: '#ffc1074d',
  o40: '#ffc10766',
  o50: '#ffc10780',
  o60: '#ffc10799',
  o70: '#ffc107b3',
  o80: '#ffc107cc',
  o90: '#ffc107e6',
} satisfies FullThemeColor;

describe(`color utility functions:`, () => {
  describe(`\`${convertHexToRgb.name}\` function tests:`, () => {
    test(`should convert hex → rgb for [${testColor1Hex}]`, () => {
      expect(convertHexToRgb(testColor1Hex)).toEqual(testColor1Rgb);
    });
    test(`should convert hex → rgb for [${testColor2Hex}]`, () => {
      expect(convertHexToRgb(testColor2Hex)).toEqual(testColor2Rgb);
    });
    test(`should convert hex → rgb for [${testColor3Hex}]`, () => {
      expect(convertHexToRgb(testColor3Hex)).toEqual(testColor3Rgb);
    });
  });
  describe(`\`${convertRgbToHex.name}\` function tests:`, () => {
    test(`should convert rgb → hex for [${testColor1Rgb}]`, () => {
      expect(convertRgbToHex(testColor1Rgb)).toEqual(testColor1Hex);
    });
    test(`should convert rgb → hex for [${testColor2Rgb}]`, () => {
      expect(convertRgbToHex(testColor2Rgb)).toEqual(testColor2Hex);
    });
    test(`should convert rgb → hex for [${testColor3Rgb}]`, () => {
      expect(convertRgbToHex(testColor3Rgb)).toEqual(testColor3Hex);
    });
  });
  describe(`\`${convertRgbToLrgb.name}\` function tests:`, () => {
    test(`should convert rgb → lrgb for [${testColor1Rgb}]`, () => {
      expect(convertRgbToLrgb(testColor1Rgb)).toEqual(testColor1Lrgb);
    });
    test(`should convert rgb → lrgb for [${testColor2Rgb}]`, () => {
      expect(convertRgbToLrgb(testColor2Rgb)).toEqual(testColor2Lrgb);
    });
    test(`should convert rgb → lrgb for [${testColor3Rgb}]`, () => {
      expect(convertRgbToLrgb(testColor3Rgb)).toEqual(testColor3Lrgb);
    });
  });
  describe(`\`${convertLrgbToRgb.name}\` function tests:`, () => {
    test(`should convert lrgb → rgb for [${testColor1Lrgb}]`, () => {
      expect(convertLrgbToRgb(testColor1Lrgb).map(Math.round)).toEqual(
        testColor1Rgb
      );
    });
    test(`should convert lrgb → rgb for [${testColor2Lrgb}]`, () => {
      expect(convertLrgbToRgb(testColor2Lrgb).map(Math.round)).toEqual(
        testColor2Rgb
      );
    });
    test(`should convert lrgb → rgb for [${testColor3Lrgb}]`, () => {
      expect(convertLrgbToRgb(testColor3Lrgb).map(Math.round)).toEqual(
        testColor3Rgb
      );
    });
  });
  describe(`\`${convertRgbToOklab.name}\` function tests:`, () => {
    test(`should convert rgb → oklab for [${testColor1Rgb}]`, () => {
      expect(convertRgbToOklab(testColor1Rgb)).toEqual(testColor1Oklab);
    });
    test(`should convert rgb → oklab for [${testColor2Rgb}]`, () => {
      expect(convertRgbToOklab(testColor2Rgb)).toEqual(testColor2Oklab);
    });
    test(`should convert rgb → oklab for [${testColor3Rgb}]`, () => {
      expect(convertRgbToOklab(testColor3Rgb)).toEqual(testColor3Oklab);
    });
  });
  describe(`\`${convertOklabToRgb.name}\` function tests:`, () => {
    test(`should convert oklab → rgb for [${testColor1Oklab}]`, () => {
      expect(convertOklabToRgb(testColor1Oklab).map(Math.round)).toEqual(
        testColor1Rgb
      );
    });
    test(`should convert oklab → rgb for [${testColor2Oklab}]`, () => {
      expect(convertOklabToRgb(testColor2Oklab).map(Math.round)).toEqual(
        testColor2Rgb
      );
    });
    test(`should convert oklab → rgb for [${testColor3Oklab}]`, () => {
      expect(convertOklabToRgb(testColor3Oklab).map(Math.round)).toEqual(
        testColor3Rgb
      );
    });
  });
  describe(`\`${getContrastRatio.name}\` function tests:`, () => {
    test(`should get contrast ratio for [${testColor1Hex}] & [${testColor2Hex}]`, () => {
      expect(
        getContrastRatio(testColor1Hex, testColor2Hex).toPrecision(3)
      ).toBe(contrast1To2);
    });
    test(`should get contrast ratio for [${testColor2Hex}] & [${testColor3Hex}]`, () => {
      expect(
        getContrastRatio(testColor2Hex, testColor3Hex).toPrecision(3)
      ).toBe(contrast2To3);
    });
    test(`should get contrast ratio for [${testColor1Hex}] & [${testColor3Hex}]`, () => {
      expect(
        getContrastRatio(testColor1Hex, testColor3Hex).toPrecision(3)
      ).toBe(contrast1To3);
    });
  });
  describe(`\`${convertLrgbToOklab.name}\` function tests:`, () => {
    test(`should convert lrgb → oklab for [${testColor1Lrgb}]`, () => {
      expect(convertLrgbToOklab(testColor1Lrgb)).toEqual(testColor1Oklab);
    });
    test(`should convert lrgb → oklab for [${testColor2Lrgb}]`, () => {
      expect(convertLrgbToOklab(testColor2Lrgb)).toEqual(testColor2Oklab);
    });
    test(`should convert lrgb → oklab for [${testColor3Lrgb}]`, () => {
      expect(convertLrgbToOklab(testColor3Lrgb)).toEqual(testColor3Oklab);
    });
  });
  describe(`\`${interpolateColors.name}\` function tests:`, () => {
    test(`should interpolate [${testColor1Hex}] & [${testColor2Hex}] 11x`, () => {
      expect(interpolateColors(testColor1Hex, testColor2Hex, 11)).toEqual(
        interpolate1To2For11
      );
    });
    test(`should interpolate [${testColor1Hex}] & [${testColor3Hex}] 11x`, () => {
      expect(interpolateColors(testColor1Hex, testColor3Hex, 11)).toEqual(
        interpolate1To3For11
      );
    });
    test(`should interpolate [${testColor2Hex}] & [${testColor3Hex}] 11x`, () => {
      expect(interpolateColors(testColor2Hex, testColor3Hex, 11)).toEqual(
        interpolate2To3For11
      );
    });
  });
  describe(`\`${computeFullThemeColor.name}\` function tests:`, () => {
    test(`should compute full theme color for [${testColorTheme1[500]}]`, () => {
      expect(computeFullThemeColor(testColorTheme1[500])).toEqual(
        testColorTheme1
      );
    });
    test(`should compute full theme color for [${testColorTheme2[500]}]`, () => {
      expect(computeFullThemeColor(testColorTheme2[500])).toEqual(
        testColorTheme2
      );
    });
    test(`should compute full theme color for [${testColorTheme3[500]}]`, () => {
      expect(computeFullThemeColor(testColorTheme3[500])).toEqual(
        testColorTheme3
      );
    });
  });
});
