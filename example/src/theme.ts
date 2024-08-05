import { AppThemeInput } from '@rapidstack/react/theme/theme-input.types.d.ts';
import { makeThemedHook, makeThemedProvider, makeThemedStyled } from '@rapidstack/react/styled-utils';
import { styled, ThemeProvider, useTheme} from 'styled-components';

type CustomColorKeys = 'tertiary' | 'quaternary';
type DemoAppInputTheme = AppThemeInput<CustomColorKeys>;

export const DemoAppTheme: DemoAppInputTheme = {
  type: 'light',
  colors: {
    primary: '#814b38',
    secondary: '#ffffff',
    accent: '#000000',
    background: '#f3f3f3',
    text: '#333333',
    info: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    gray: '#6c757d',
    tertiary: '#6c757d',
    quaternary: '#495057',
  }
}

export const appStyled = makeThemedStyled<DemoAppInputTheme>(styled);
export const useAppTheme = makeThemedHook<DemoAppInputTheme>(useTheme);
export const AppThemeProvider = makeThemedProvider<DemoAppInputTheme>(ThemeProvider);