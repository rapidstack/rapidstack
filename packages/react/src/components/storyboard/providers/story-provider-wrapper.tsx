/* eslint-disable @typescript-eslint/no-explicit-any */
import { _Provider } from '@internal/styled';
import { type PropsWithChildren, useMemo } from 'react';
import { createGlobalStyle } from 'styled-components';

import type { ColorThemeType } from '../../../theme/theme.types.js';
import type { AppThemeInput } from '../../../theme/theme-input.types.js';

import { makeThemeOutput } from '../../../theme/theme-output.js';

type ThemeProviderProps = {
  customTheme: AppThemeInput<any>;
  mode?: ColorThemeType;
};

const ThemeVariables = createGlobalStyle<{
  variables: string;
}>`${({ variables }) => variables}`;

/**
 *
 * @param props
 */
export function StoryThemeProvider(
  props: PropsWithChildren<ThemeProviderProps>
) {
  const { globalStyleString, theme } = useMemo(
    () => makeThemeOutput(props.customTheme),
    [props.customTheme]
  );

  return (
    <>
      <_Provider theme={theme}>
        <ThemeVariables variables={globalStyleString} />
        {props.children}
      </_Provider>
    </>
  );
}
