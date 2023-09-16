import chalk from 'chalk';
import { Command } from 'commander';

import { actionRunner, handleExit } from '../../utils/index.js';
import { action } from './action.js';

/**
 * Builds the `clean-tmp` command. To be used by the main cli to clean the
 * OS tmp directory of any lingering rapidstack directories to aid in debugging
 * features or bugs in the cli.
 * @returns The commander command.
 */
export function buildCleanTmpCommand(): Command {
  return new Command()
    .name('clean-tmp')
    .usage(JSON.stringify(process.argv))
    .description(
      `${chalk.red(
        '(internal)'
      )} removes all rapidstack content from tmp to aid in debugging the cli.`
    )
    .option('-d, --debug', 'output extra debug logging')
    .action(actionRunner(action))
    .exitOverride(handleExit);
}
