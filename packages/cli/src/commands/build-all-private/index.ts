import { Command } from 'commander';

export default new Command()
  .name('build-all')
  .description('[Private] - Builds all of the rapidstack packages.')
  .action(() => console.log('hello!'));
