import chalk from 'chalk';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import ora from 'ora';

import { ORG_NAME, RapidstackCliError, log, shell } from '../../index.js';

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
  const fileContents = await readFile(currentSearch, 'utf-8').catch(() => null);

  if (!fileContents) return findRepoRoot(nextSearchDir);
  const pkg = JSON.parse(fileContents);

  if (pkg.name === `@${ORG_NAME}/root`) return cwd;

  return findRepoRoot(nextSearchDir);
}

/**
 * Build a package in the monorepo while displaying a progress spinner.
 * @param repoRoot The path to the root of the monorepo
 * @param pkg The name of the package to build
 * @throws a `RapidstackCliError` If the package fails to build or outputs to
 * stderr.
 */
export async function buildPackage(
  repoRoot: string,
  pkg: string
): Promise<void> {
  const packagePath = join(repoRoot, 'packages', pkg);
  const spinner = ora(`Building ${chalk.cyan(`@${ORG_NAME}/${pkg}`)}`).start();
  spinner.prefixText = `${chalk.bold.ansi256(166)(`[${ORG_NAME}]`)}`;
  spinner.start();

  const { stderr } = await shell({
    cmd: `pnpm build`,
    dir: packagePath,
  }).catch((err) => {
    spinner.fail(`Error building package [${pkg}]`);
    if (err instanceof Error) {
      const { stderr, stdout } = JSON.parse(err.message);
      stdout.split('\n').forEach((msg: string) => log.error(msg));
      stderr && stderr.split('\n').forEach((msg: string) => log.error(msg));
      throw new RapidstackCliError(`Error building package [${pkg}]`);
    }

    log.error(err);
    throw new RapidstackCliError(`Error building package [${pkg}]`);
  });

  if (stderr) {
    spinner.fail(`Error building package [${pkg}]`);
    stderr.split('\n').forEach((msg: string) => log.error(msg));
    throw new RapidstackCliError(`Error building package [${pkg}]`);
  }

  spinner.succeed();
}
