import { Command } from 'commander';

export default new Command()
  .name('create')
  .description('Builds a plugin for the rapidstack ecosystem.')
  .option('--append, -a', 'Sets the CLI to append for the current project.')
  .action(() => console.log('hello!'));
