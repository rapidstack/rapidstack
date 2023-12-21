import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // coverage: {
    //   provider: 'v8',
    //   reporter: ['text', 'json', 'html'],
    // },
    name: '@rapidstack/lambda',
    // The following is broken. Do not enable.
    // typecheck: {
    //   checker: 'tsc',
    //   enabled: true,
    //   include: ['**/*.test.ts'],
    //   tsconfig: 'tsconfig.json',
    // },
  },
});
