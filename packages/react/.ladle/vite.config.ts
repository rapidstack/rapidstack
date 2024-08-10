import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    exclude: ['react-icons'],
  },
  resolve: {
    alias: {
      '@internal/stories': resolve(cwd(), 'src/internal/stories'),
      '@internal/styled': resolve(cwd(), 'src/internal/styled'),
      '@internal/testing': resolve(cwd(), 'src/internal/test'),
      '@unstyled': resolve(cwd(), 'src/components/unstyled/index'),
    },
  },
});
