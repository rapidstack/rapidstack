import chalk from 'chalk';
import { Command } from 'commander';

import { actionRunner, handleExit } from '../../index.js';
import { action } from './action.js';

/**
 * Builds the `version-all` command. An internal command to version all of the
 * rapidstack package's package.json files.
 * @returns The commander command.
 */
export function buildVersionCommand(): Command {
  return new Command()
    .name('version-all')
    .description(
      `versions all of the rapidstack packages. ${chalk.red('[Internal]')}`
    )
    .argument('<version>', 'The version to set for all packages.')
    .option('-d, --debug', 'output extra debug logging')
    .action(actionRunner(action))
    .exitOverride(handleExit);
}
