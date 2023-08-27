/**
 * Determines if the CLI npm package is running in the context of the rapidstack
 * monorepo (local) or if it was installed by a user from the registry.
 * @returns True if running in the context of the rapidstack monorepo.
 */
export async function isLocal(): Promise<boolean> {
  let res = false;
  /*
   * The following file will be excluded from the npm package via the 
   * package.json ignoreFiles field. If this file exists, we know we are running
   * in the context of the rapidstack monorepo.

   * This method is used as an alternative dynamically importing certain CLI
   * commands based upon the context of where it was being run from, as the top-
   * level await created a circular dependency soft-lock resulting in 
   * process.exit(13)
   * 
   * See: https://github.com/nodejs/node/issues/44601
   */
  await import('../local.js')
    .then(() => (res = true))
    .catch(() => (res = false));
  return res;
}
