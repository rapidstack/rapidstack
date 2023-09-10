import chalk from 'chalk';
import { Command } from 'commander';

import { actionRunner, handleExit } from '../../index.js';
import { action } from './action.js';

/**
 * Builds the `build-all` command. An internal command to build all of the
 * rapidstack packages.
 * @returns The commander command.
 */
export function buildAllCommand(): Command {
  return new Command()
    .name('build-all')
    .description(
      `${chalk.red('(internal)')} builds all of the rapidstack packages.`
    )
    .option('-d, --debug', 'output extra debug logging')
    .action(actionRunner(action))
    .exitOverride(handleExit);
}
