import { PropsWithChildren } from 'react';
import { AppThemeProvider, DemoAppTheme } from '../theme';
import { makeThemeOutput } from '@rapidstack/react/theme/theme-output.js';
import { createGlobalStyle } from 'styled-components';

const { theme, globalStyleString} = makeThemeOutput(DemoAppTheme);

const styleStringWrapped = `:root { ${globalStyleString} }`;
const GlobalStyle = createGlobalStyle`${styleStringWrapped}`;

export function App({ children }: PropsWithChildren) {
  return <AppThemeProvider theme={theme}>
    <GlobalStyle />
    {children}
  </AppThemeProvider>;
}
