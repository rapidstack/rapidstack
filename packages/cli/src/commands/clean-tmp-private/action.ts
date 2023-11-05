import { readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
// import { join } from 'node:path';

import chalk from 'chalk';
import { join } from 'node:path';

import { RapidstackCliError, TMP_DIR_PREFIX, log } from '../../index.js';

/**
 * Clean the OS tmp directory of any lingering rapidstack directories to aid in
 * debugging features or bugs in the cli.
 * @throws a `RapidstackCliError` if an error in execution occurs.
 */
export async function action(): Promise<void> {
  log.debug(`running 'clean-tmp'`);

  const tmp = tmpdir();
  const contents = await readdir(tmp).catch(() => {
    throw new RapidstackCliError(`Could not read tmp directory [${tmp}]`);
  });

  const rapidstackContent = contents.filter((item) =>
    item.includes(TMP_DIR_PREFIX)
  );

  log.debug(`found ${rapidstackContent.length} rapidstack tmp directories.`);

  const jobs = rapidstackContent.map(async (dir) => {
    const path = join(tmp, dir);
    log.debug(`removing [${path}]`);
    return await rm(path, { force: true, recursive: true }).catch((err) => {
      throw new RapidstackCliError(
        `Could not remove tmp directory [${path}] - ` + err.toSting()
      );
    });
  });

  await Promise.all(jobs);

  log.msg(
    chalk.green(
      `Removed ${rapidstackContent.length} rapidstack tmp directories.`
    )
  );
}
