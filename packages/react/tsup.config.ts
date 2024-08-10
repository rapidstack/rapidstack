import { defineConfig } from 'tsup';

import {
  sharedTsupConfig,
  tsPathAliasResolverPlugin,
} from '../../tsup.config.js';
import tsconfig from './tsconfig.build.json';

export default defineConfig({
  ...sharedTsupConfig,
  format: ['esm'],
  minify: true,
  minifySyntax: true,
  minifyWhitespace: true,
  plugins: [tsPathAliasResolverPlugin(tsconfig)],
});
