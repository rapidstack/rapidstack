import { styled, ThemeProvider, useTheme } from 'styled-components';

import {
  makeThemedHook,
  makeThemedProvider,
  makeThemedStyled,
} from '../styled-utils/theme-enforcers.js';

export const _styled = makeThemedStyled(styled);
export const _useTheme = makeThemedHook(useTheme);
export const _Provider = makeThemedProvider(ThemeProvider);
