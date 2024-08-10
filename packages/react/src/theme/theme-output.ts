import type {
  AppThemeInput,
  CustomUtilityFunctionInput,
  ExpectedUtilityFunctionKeys,
} from './theme-input.types.js';
import type { CSSVariable, MakeThemeOutput } from './theme-output.types.js';

import { computeFullThemeColor } from '../utils/colors.js';

/**
 *
 * @param themeInput
 */
export function makeThemeOutput<
  T extends AppThemeInput<string | undefined, any>,
>(themeInput: T): { globalStyleString: string; theme: MakeThemeOutput<T> } {
  /**
   * Within this function there were a few times where I didn't want to do the
   * bracket indexing type gymnastics, as it gets pretty ugly and hard to read:
   *
   * themeOutput.color[colorKey as keyof T['colors]][key as keyof T['color...]]
   *
   * In its place, I put ts-expect-error
   */

  const { colors } = themeInput;
  let globalStyleString = ':root { ';
  const themeOutput: MakeThemeOutput<T> = {
    _computed: {
      color: {} as MakeThemeOutput<T>['_computed']['color'],
    },
    color: {} as MakeThemeOutput<T>['color'],
    utils: {} as MakeThemeOutput<T>['utils'],
  };

  for (const colorKey in colors) {
    const color = colors[colorKey as keyof typeof colors];
    const computed = themeOutput._computed.color;

    computed[colorKey as keyof T['colors']] = computeFullThemeColor(color);

    // @ts-expect-error - see above
    themeOutput.color[colorKey] = {} as MakeThemeOutput<T>['color'];
    for (const key in computed[colorKey as keyof T['colors']]) {
      const cssVariable = `--rs-${colorKey}-${key}`;
      // @ts-expect-error - see above
      themeOutput.color[colorKey][key] = `var(${cssVariable})` as CSSVariable;

      globalStyleString += `${cssVariable}: ${
        computed[colorKey as keyof T['colors']][key]
      }; `;
    }

    // @ts-expect-error - see above
    themeOutput.color[colorKey]['lighter'] = themeOutput.color[colorKey][100];
    // @ts-expect-error - see above
    themeOutput.color[colorKey]['light'] = themeOutput.color[colorKey][300];
    // @ts-expect-error - see above
    themeOutput.color[colorKey]['main'] = themeOutput.color[colorKey][500];
    // @ts-expect-error - see above
    themeOutput.color[colorKey]['dark'] = themeOutput.color[colorKey][700];
    // @ts-expect-error - see above
    themeOutput.color[colorKey]['darker'] = themeOutput.color[colorKey][900];
  }

  globalStyleString += '}';

  const utilKeys = themeInput.utils
    ? Object.keys(themeInput.utils)
    : ['computeActiveColor', 'computeContrastText', 'computeHoverColor'];

  // util functions
  for (const key of utilKeys) {
    // @ts-expect-error - see above
    themeOutput.utils[key] = makeThemeUtilFunction(
      // @ts-expect-error - see above
      themeInput.utils ? themeInput.utils[key] : defaultUtilFunctions[key],
      themeOutput
    );
  }

  return { globalStyleString, theme: themeOutput };
}

const defaultUtilFunctions: Record<
  ExpectedUtilityFunctionKeys,
  CustomUtilityFunctionInput<any>
> = {
  computeActiveColor: () => `filter: brightness(1.15)`,
  computeContrastText: (colorVariable, themeOutput) => {
    // color variable is in format var(--rs-colorKey-500)
    // extract the colorKey and value after
    const [, , , colorKey, dirtyShade] = colorVariable.split('-');
    const shade = dirtyShade.replace(')', '');

    if (+shade <= 250) {
      return themeOutput.color[colorKey as any][700];
    }

    return themeOutput.color.gray[50];
  },
  computeHoverColor: () => `filter: brightness(1.15)`,
};

/**
 *
 * @param fn
 * @param themeOutput
 */
function makeThemeUtilFunction<T extends AppThemeInput<string, any>>(
  fn: CustomUtilityFunctionInput<T>,
  themeOutput: MakeThemeOutput<T>
) {
  return (colorVariable: CSSVariable) => fn(colorVariable, themeOutput);
}
