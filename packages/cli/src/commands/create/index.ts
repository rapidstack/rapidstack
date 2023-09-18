import { Command } from 'commander';

import {
  DEBUG_FLAG_REGEX,
  actionRunner,
  handleExit,
  log,
} from '../../utils/index.js';
import { cliBuilder } from './cli-builder.js';

// If called as a subcommand from main cli, this doesn't need to be logged again
if (
  !process.env.DEBUG_LOGGING &&
  (process.argv.includes('--debug') ||
    process.argv.some((arg) => DEBUG_FLAG_REGEX.test(arg)))
) {
  process.env.DEBUG_LOGGING = '1';
  log.debug('cli arguments:');
  JSON.stringify(process.argv, null, 2)
    .split('\n')
    .forEach((str) => log.debug(str));

  log.debug('calling cwd:');
  log.debug(process.cwd());
}

/**
 * Builds the `create` command. To be used by the main cli as well as the create
 * package for npm init usage.
 * @returns The commander command.
 */
export function buildCreateCommand(): Command {
  return new Command()
    .name('create')
    .description('create a project using the template from rapidstack.')
    .option(
      '--template-dir <path>',
      'optional path to a directory containing templates'
    )
    .option(
      '--template <template-name>',
      'optional name of the template to use'
    )
    .option('-d, --debug', 'output extra debug logging')
    .allowUnknownOption()
    .action(actionRunner(cliBuilder))
    .exitOverride(handleExit);
}
