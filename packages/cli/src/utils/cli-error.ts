/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { type CommanderError } from 'commander';

import { log } from './logger.js';

/**
 * Gracefully handles errors from Commander with the supplied logger.
 * @param error Commander error to handle
 */
export function handleExit(error: CommanderError): void {
  /**
   * If the user calls the CLI with no opts/args, it will by default exit(1)
   * and exec tools like pnpm report a error with:
   *
   *  `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL  Command "rapidstack" not found`
   *
   * even though for this application it should be a valid call to see the usage
   * and help text.
   */
  if (error.message === '(outputHelp)') {
    process.exit(0);
  }

  error.message.split('\n').forEach(log.error);
  process.exit(1);
}

/**
 * Handles errors thrown from a commander action function in a standard way.
 * @param error An error thrown from a commander action function
 */
function actionErrorHandler(error: unknown) {
  if (error instanceof RapidstackCliError) {
    error.message.split('\n').forEach(log.error);
    process.exit(1);
  }

  if (error instanceof Error) {
    log.error('An unexpected error occurred:', error.message);
    log.error('Use the -d or --debug flag to see more details.');

    log.debug('Full error details:');
    JSON.stringify(error, null, 2).split('\n').forEach(log.debug);
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
