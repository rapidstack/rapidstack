import type { styled, ThemeProvider, useTheme } from 'styled-components';

import type { AppThemeInput } from '../theme/theme-input.types.js';
import type { MakeThemeOutput } from '../theme/theme-output.types.js';
import type { ThemedStyledInterface } from './styled.types.js';

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
