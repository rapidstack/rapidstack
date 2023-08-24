import { Command } from 'commander';

if (process.argv.includes('--debug') || process.argv.includes('-d'))
  process.env.DEBUG_LOGGING = 'true';

export default new Command()
  .name('create')
  .usage(JSON.stringify(process.argv))
  .description(
    'Command to create a project using the template from rapidstack.'
  )
  .option('--append, -a', 'Sets the CLI to append for the current project.')
  .action(() => console.log('hello!'));
