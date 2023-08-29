import chalk from 'chalk';
import { Command } from 'commander';

import { handleExit } from '../../index.js';

/**
 * Builds the `build-all` command. An internal command to build all of the
 * rapidstack packages.
 * @returns The commander command.
 */
export function buildAllCommand(): Command {
  return new Command()
    .name('build-all')
    .description(
      `builds all of the rapidstack packages. ${chalk.red('[Internal]')}`
    )
    .option('-d, --debug', 'output extra debug logging')
    .action(() => console.log('Unimplemented!'))
    .exitOverride(handleExit);
}
