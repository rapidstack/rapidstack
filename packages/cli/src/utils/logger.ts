/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk';

export const log = {
  debug: (...args: any): void => {
    !!process.env.DEBUG_LOGGING &&
      console.log(chalk.bold.magenta('[rapidstack]'), ...args);
  },
  error: (...args: any): void => {
    console.error('\n' + chalk.bold.red('[rapidstack]'), ...args);
  },
  msg: (...args: any): void => {
    console.log(chalk.bold.ansi256(166)('[rapidstack]'), ...args);
  },
};
