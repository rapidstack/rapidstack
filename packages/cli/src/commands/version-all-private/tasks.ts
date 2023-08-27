import { log, orgName, semverRegex } from '../../index.js';

/**
 * Scans the dependencies or devDependencies object from a package.json for
 * entries from the org and returns a new object with all the org dependencies
 * updated to the given version.
 * @param dependencies the dependencies object from a package.json
 * @param newVersion the new semver to update to
 * @param type whether it's a dep or devDep
 * @returns a new object with the org dependencies updated to the given version
 */
export function updateOrgPackageDependencies(
  dependencies: Record<string, string>,
  newVersion: string,
  type: 'dep' | 'devDep'
): Record<string, string> {
  const deps = Object.entries(dependencies).filter(([name]) =>
    name.startsWith(orgName)
  );

  return deps.reduce(
    (acc, [name, oldVersion], index) => {
      acc[name] = newVersion;
      log.msg(
        deps.length === index ? '├───' : '└───',
        `${name}:${oldVersion}`,
        '→',
        newVersion,
        `(${type})`
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
 */
export function resolveVersion(version: string): string {
  const newVersion = version.replace('v', '');

  if (!semverRegex.test(newVersion)) {
    log.error('Invalid version! Please use a valid semver version.');
    process.exit(1);
  }

  return newVersion;
}
