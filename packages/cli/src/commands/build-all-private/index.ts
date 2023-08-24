import chalk from 'chalk';
import { Command } from 'commander';

export default new Command()
  .name('build-all')
  .description(
    `Builds all of the rapidstack packages. ${chalk.red('[Internal]')}`
  )
  .action(() => console.log('hello!'));
