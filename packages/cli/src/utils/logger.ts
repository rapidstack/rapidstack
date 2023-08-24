/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from 'chalk';

export const orange = chalk.bold.ansi256(166);
export const red = chalk.bold.red;
export const magenta = chalk.bold.magenta;
export const green = chalk.green;
export const subtle = chalk.italic.gray;

export const logger = {
  debug: (...args: any): void =>
    (!!process.env.DEBUG_LOGGING &&
      console.log(magenta('[rapidstack]'), ...args)) as void,
  error: (...args: any): void =>
    console.error('\n' + red('[rapidstack]'), ...args),
  log: (...args: any): void => console.log(orange('[rapidstack]'), ...args),
};
