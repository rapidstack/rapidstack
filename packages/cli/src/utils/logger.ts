/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk';

import { ORG_NAME } from './constants.js';

export const log = {
  debug: (...args: any): void => {
    !!process.env.DEBUG_LOGGING &&
      console.log(chalk.bold.magenta(`[${ORG_NAME}]`), ...args);
  },
  error: (...args: any): void => {
    console.error(chalk.bold.red(`[${ORG_NAME}]`), ...args);
  },
  msg: (...args: any): void => {
    console.log(chalk.bold.ansi256(166)(`[${ORG_NAME}]`), ...args);
  },
};
