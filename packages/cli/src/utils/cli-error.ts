/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { type CommanderError } from 'commander';

import { log } from './logger.js';

/**
 * Gracefully handles errors from Commander with the supplied logger.
 * @param error Commander error to handle
 */
export function handleExit(error: CommanderError): void {
  // If a user calls the CLI with no opts/args, it will by default exit(1) and
  // exec tools like pnpm report a error with:
  //   ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "rapidstack" not found
  // even though that is a valid call to
  // see the usage info.
  if (error.message === '(outputHelp)') {
    process.exit(0);
  }

  log.error(error.message);
  process.exit(1);
}

/**
 * Handles errors thrown from a commander action function in a standard way.
 * @param error An error thrown from a commander action function
 */
function actionErrorHandler(error: unknown) {
  if (error instanceof RapidstackCliError) {
    log.error(error.message);
    process.exit(1);
  }

  if (error instanceof Error) {
    log.error('An unexpected error occurred:', error.message);
    log.error('Use the -d or --debug flag to see more details.');

    log.debug('Full error details:', error);
    process.exit(1);
  }

  log.error('An unexpected error occurred:', error);
}

/**
 * Wrapper function for the commander action function that will catch any
 * errors, log them to the console, and exit(1)
 * @param fn The action function to run
 * @returns Promise<void>
 */
export function actionRunner(fn: (...args: any[]) => Promise<any>) {
  return (...args: any[]) => fn(...args).catch(actionErrorHandler);
}

/**
 * An error to throw when the CLI encounters an error that should be handled
 * gracefully.
 * @param message The error message
 * @returns RapidstackCliError
 */
export class RapidstackCliError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RapidstackCliError';
  }
}
