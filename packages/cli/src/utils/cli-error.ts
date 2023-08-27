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
