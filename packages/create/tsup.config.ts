import { defineConfig } from 'tsup';

import { sharedTsupConfig } from '../../tsup.config.js';

export default defineConfig({
  ...sharedTsupConfig,
  dts: false,
  format: ['esm'],
});
