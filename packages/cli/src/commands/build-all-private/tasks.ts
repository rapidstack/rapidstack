import chalk from 'chalk';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import ora from 'ora';

import { ORG_NAME, log, shell } from '../../index.js';

/**
 * Recursively search for the root of the repo, looking in each package.json
 * for the package name `@rapidstack/root`.
 * @param cwd The current working directory to start the search from. Defaults
 * to `process.cwd()`.
 * @returns The path to the root of the repo.
 * @throws If the root of the repo could not be found.
 */
export async function findRepoRoot(cwd = process.cwd()): Promise<string> {
  if (cwd === '/') throw new Error('Could not find repo root');

  const currentSearch = join(cwd, 'package.json');
  const nextSearchDir = join(cwd, '..');
  const fileContents = await readFile(currentSearch, 'utf-8').catch(() => {});

  if (!fileContents) return findRepoRoot(nextSearchDir);
  const pkg = JSON.parse(fileContents);

  if (pkg.name === `@${ORG_NAME}/root`) return cwd;

  return findRepoRoot(nextSearchDir);
}

/**
 * Build a package in the monorepo while displaying a progress spinner.
 * @param repoRoot The path to the root of the monorepo
 * @param pkg The name of the package to build
 */
export async function buildPackage(
  repoRoot: string,
  pkg: string
): Promise<void> {
  const packagePath = join(repoRoot, 'packages', pkg);
  const spinner = ora().start();
  spinner.prefixText = `${chalk.bold.ansi256(166)(`[${ORG_NAME}]`)}`;
  spinner.suffixText = `Building ${chalk.cyan(`@${ORG_NAME}/${pkg}`)}`;

  spinner.start();
  await shell({
    cmd: `pnpm build`,
    dir: packagePath,
  }).catch((err) => {
    log.error(`Error building ${pkg}`);
    throw err;
  });
  spinner.succeed();
}
