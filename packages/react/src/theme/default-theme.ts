import type { AppThemeInput } from './theme-input.types.js';

export const DefaultAppLightTheme: AppThemeInput = {
  colors: {
    accent: '#ff00ff', // TODO
    background: '#ffffff',
    danger: '#d32f2f',
    gray: '#888888',
    info: '#00e5ff',
    primary: '#1976d2',
    secondary: '#ba68c8',
    success: '#2e7d32',
    text: '#000000',
    warning: '#ed6c02',
  },
  type: 'light',
};

export const DefaultAppDarkTheme: AppThemeInput = {
  colors: {
    accent: '#ff00ff', // TODO
    background: '#222222',
    danger: '#d32f2f',
    gray: '#888888',
    info: '#00e5ff',
    primary: '#1976d2',
    secondary: '#ba68c8',
    success: '#2e7d32',
    text: '#eeeeee',
    warning: '#ed6c02',
  },
  type: 'dark',
};
