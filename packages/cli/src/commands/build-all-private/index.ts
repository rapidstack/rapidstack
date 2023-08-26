import chalk from 'chalk';
import { Command } from 'commander';

export default new Command()
  .name('build-all')
  .description(
    `Builds all of the rapidstack packages. ${chalk.red('[Internal]')}`
  )
  .option('-d, --debug', 'output extra debug logging')
  .action(() => console.log('hello!'));
