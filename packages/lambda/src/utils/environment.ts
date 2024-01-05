import type { EnvKeys } from '../index.js';

/**
 * Retrieves an environment variable from the process environment.
 * @param name The name of the environment variable to retrieve.
 * @returns The value of the env variable, or `undefined` if it is not set.
 */
export function getInternalEnvironmentVariable(
  name: (typeof EnvKeys)[keyof typeof EnvKeys]
): string | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return process.env[name];
}
