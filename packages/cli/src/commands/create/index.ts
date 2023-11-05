import chalk from 'chalk';
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

  log.debug('the cwd of invocation:');
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
      '--template-loc <path, repository>',
      `optional path to a local folder, GitHub user/repo with ${chalk.inverse(
        'github:<org>/<repo>'
      )} (with optional branch specifier @branch), or git url`
    )
    .option(
      '--template <template-name>',
      'optional name of the template to use'
    )
    .option(
      '--defaults',
      'prefer default values for applicable template value rather than prompts'
    )
    .option('-d, --debug', 'output extra debug logging')
    .allowUnknownOption()
    .action(actionRunner(cliBuilder))
    .exitOverride(handleExit);
}
