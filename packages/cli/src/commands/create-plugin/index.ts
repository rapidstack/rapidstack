import { Command } from 'commander';

import {
  DEBUG_FLAG_REGEX,
  actionRunner,
  handleExit,
  log,
} from '../../utils/index.js';
import { action } from './action.js';

// If called as a subcommand from main cli, this doesn't need to be logged again
if (
  !process.env.DEBUG_LOGGING &&
  (process.argv.includes('--debug') ||
    process.argv.some((arg) => DEBUG_FLAG_REGEX.test(arg)))
) {
  process.env.DEBUG_LOGGING = '1';
  log.debug('cli arguments:');
  JSON.stringify(process.argv, null, 2).split('\n').forEach(log.debug);

  log.debug('calling cwd:');
  log.debug(process.cwd());
}

/**
 * Builds the `create-plugin` command. To be used by the main cli as well as the
 * create-plugin package for npm init usage.
 * @returns The commander command.
 */
export function buildCreatePluginCommand(): Command {
  return new Command()
    .name('create-plugin')
    .usage(JSON.stringify(process.argv))
    .description('create a plugin using the template from rapidstack.')
    .argument('[plugin-name]', 'Name of the plugin')
    .option('-d, --debug', 'output extra debug logging')
    .action(actionRunner(action))
    .exitOverride(handleExit);
}
