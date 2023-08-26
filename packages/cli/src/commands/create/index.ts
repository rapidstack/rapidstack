import { Command } from 'commander';

import { logger } from '../../utils/index.js';

// If called as a subcommand from main cli, this doesn't need to be logged again
if (
  !process.env.DEBUG_LOGGING &&
  (process.argv.includes('--debug') ||
    process.argv.some((arg) => /^-([a-ce-z]*d[a-ce-z]*)$/i.test(arg)))
) {
  process.env.DEBUG_LOGGING = '1';
  logger.debug('cli arguments: ', process.argv);
}

export default new Command()
  .name('create')
  .usage(JSON.stringify(process.argv))
  .description('Create a project using the template from rapidstack.')
  .option('--append, -a', 'Sets the CLI to append for the current project.')
  .option('-d, --debug', 'output extra debug logging')
  .action(() => console.log('hello!'));
