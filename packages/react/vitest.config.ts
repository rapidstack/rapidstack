import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    name: '@rapidstack/react',
    typecheck: {
      checker: 'tsc',
      enabled: true,
      include: ['**/*.type.test.ts'],
      tsconfig: 'tsconfig.json',
    },
  },
});
