import type { Options } from 'tsup';

import { spawn } from 'node:child_process';
import { dirname, relative } from 'node:path';

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

type EsbuildPlugin = Required<Options>['plugins'][number];

/**
 *
 * @param tsconfig
 */
export function tsPathAliasResolverPlugin(tsconfig: TsConfig): EsbuildPlugin {
  /**
   * Make a flat map of the path aliases:
   * @example
   * "@internal/testing": "./dist/internal/test.js",
   * "@internal/stories": ["./dist/internal/stories.js"],
   * "@internal/styled": ["./dist/internal/styled.js"],
   * "@unstyled": ["./dist/components/unstyled/index.js"]
   */
  const usefulPaths = Object.entries(tsconfig.compilerOptions.paths).reduce(
    (acc, [key, value]) => {
      acc[key] = (value as string[])[0]
        .replace('src', 'dist')
        .replace('.ts', '.js');
      return acc;
    },
    {} as Record<string, string>
  );

  return {
    name: 'ts-path-alias-resolver',
    renderChunk(code, chunk) {
      const currentDir = dirname(chunk.path);

      // Check if any of the paths are in the chunk
      const hasPathAlias = Object.keys(usefulPaths).some((alias) =>
        code.includes(alias.replace(/\*/g, ''))
      );

      if (!hasPathAlias) return null;
      let newCode = code;

      for (const [key, value] of Object.entries(usefulPaths)) {
        if (newCode.includes(key)) {
          const targetPath = relative(currentDir, value).replace(/\\/g, '/');

          const regex = new RegExp(
            key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
            'g'
          );
          newCode = newCode.replace(regex, targetPath);
        }
      }

      return {
        code: newCode,
      };
    },
  };
}

type TsConfig = {
  compilerOptions: {
    paths: Record<string, string[]>;
  };
};
