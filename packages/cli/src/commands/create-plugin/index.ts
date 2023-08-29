import { Command } from 'commander';

import { debugFlagRegex, handleExit, log } from '../../utils/index.js';

// If called as a subcommand from main cli, this doesn't need to be logged again
if (
  !process.env.DEBUG_LOGGING &&
  (process.argv.includes('--debug') ||
    process.argv.some((arg) => debugFlagRegex.test(arg)))
) {
  process.env.DEBUG_LOGGING = '1';
  log.debug('cli arguments: ', JSON.stringify(process.argv));
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
    .option('-d, --debug', 'output extra debug logging')
    .action(() => console.log('Unimplemented!'))
    .exitOverride(handleExit);
}
