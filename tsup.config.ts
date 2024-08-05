import type { Options } from 'tsup';

import { spawn } from 'node:child_process';

export const sharedTsupConfig = {
  bundle: false,
  clean: true,
  entry: ['src/**/*.{ts,tsx}', '!src/**/*.test.*', '!dist/**/*'],
  format: ['esm', 'cjs'],
  onSuccess: async () => {
    return new Promise((resolve, reject) => {
      const ps = spawn(
        'tsc --emitDeclarationOnly --declaration -p tsconfig.build.json',
        {
          shell: true,
          stdio: 'inherit',
        }
      );
      ps.on('error', (err) => reject(err));
      ps.on('close', (code) =>
        code === 0
          ? resolve()
          : reject(
              new Error(`Code [${code}] returned from tsup onSuccess hook.`)
            )
      );
    });
  },
  outDir: 'dist',
  shims: true,
  sourcemap: true,
  tsconfig: 'tsconfig.build.json',
} satisfies Options;
