import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Recursively search for the root of the repo, looking in each package.json
 * for the package name `@rapidstack/root`.
 * @param cwd The current working directory to start the search from. Defaults
 * to `process.cwd()`.
 * @returns The path to the root of the repo.
 */
export async function findRepoRoot(cwd = process.cwd()): Promise<string> {
  if (cwd === '/') throw new Error('Could not find repo root');

  const currentSearch = join(cwd, 'package.json');
  const nextSearchDir = join(cwd, '..');
  const fileContents = await readFile(currentSearch, 'utf-8').catch(() => {});

  if (!fileContents) return findRepoRoot(nextSearchDir);
  const pkg = JSON.parse(fileContents);

  if (pkg.name === '@rapidstack/root') return cwd;

  return findRepoRoot(nextSearchDir);
}
