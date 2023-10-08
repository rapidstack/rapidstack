import chalk from 'chalk';

import { RapidstackCliError, SEMVER_REGEX, log } from '../../index.js';

/**
 * Scans the dependencies or devDependencies object from a package.json for
 * entries from the org and returns a new object with all the org dependencies
 * updated to the given version.
 * @param params the parameters object
 * @param params.dependencies the dependencies object from a package.json
 * @param params.org the org prefix to update
 * @param params.newVersion the new semver to update to
 * @param params.type whether it's a dep or devDep
 * @returns a new object with the org dependencies updated to the given version
 */
export function updateOrgPackageDependencies(params: {
  dependencies: Record<string, string>;
  newVersion: string;
  org: string;
  type: 'dependencies' | 'devDependencies';
}): Record<string, string> {
  const deps = Object.entries(params.dependencies).filter(([name]) =>
    name.startsWith(params.org)
  );

  return deps.reduce(
    (acc, [name, oldVersion], index) => {
      // the following is not a concern given the scope of this function's use
      // eslint-disable-next-line security/detect-object-injection
      acc[name] = params.newVersion;
      log.msg(
        deps.length === index ? '├───' : '└───',
        `${name}:${oldVersion}`,
        '→',
        params.newVersion,
        chalk.gray.italic(`(${params.type.substring(0, 3)})`)
      );
      return acc;
    },
    {} as Record<string, string>
  );
}

/**
 * Takes raw CLI input and returns a valid semver version or exits the process.
 * @param version the raw CLI input version
 * @returns a valid semver version
 * @throws a `RapidstackCliError` if the version is invalid
 */
export function validateVersion(version: string): string {
  const newVersion = version.replace('v', '');

  if (!SEMVER_REGEX.test(newVersion)) {
    throw new RapidstackCliError(
      'Invalid version! Please use a valid semver format:' +
        `\n\t- <semver>: 1.2.3` +
        `\n\t- v?<semver>: v1.2.3` +
        `\n\t- v?<semver>-<stage>.<7-char-sha>: v1.2.3-rc.1230def`
    );
  }

  return newVersion;
}
