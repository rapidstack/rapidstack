import chalk from 'chalk';
import { join } from 'node:path';
import ora from 'ora';

import { ORG_NAME, ORG_PACKAGES, log, shell } from '../../index.js';
import { findRepoRoot } from './tasks.js';

/**
 * The action to be run when the `build-all` command is called. Builds all
 * packages in the monorepo.
 */
export async function action(): Promise<void> {
  const repoRoot = await findRepoRoot();

  for (const pkg of ORG_PACKAGES) {
    const packagePath = join(repoRoot, 'packages', pkg);
    const spinner = ora().start();
    spinner.prefixText = `${chalk.bold.ansi256(166)(
      `[${ORG_NAME}]`
    )} Building ${pkg}`;

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
}
