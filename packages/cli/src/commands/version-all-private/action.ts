/* eslint-disable security/detect-object-injection */

import { glob } from 'glob';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { log, ORG_NAME } from '../../index.js';
import { updateOrgPackageDependencies, validateVersion } from './tasks.js';

/**
 * The action to be run when the `version-all` command is called.
 * @param version The version to set for all packages.
 */
export async function action(version: string): Promise<void> {
  log.debug(`running 'version-all' called with version: [${version}]`);

  const newVersion = validateVersion(version);

  const packageJsonFiles = await glob('**/package.json', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/templates/**', '**/test/assets/**'],
  });

  const fileUpdates = packageJsonFiles.map(async (file) => {
    const filePath = join(process.cwd(), file);
    log.debug(`found package.json at: ${filePath}`);

    const packageJson = JSON.parse(await readFile(filePath, 'utf8'));
    const oldVersion = packageJson.version;

    // Update the top level version for the package.json
    log.msg(
      `{root}/${file}`,
      `modifying version: ${oldVersion} → ${newVersion}`
    );
    packageJson.version = newVersion;

    ['dependencies', 'devDependencies'].forEach((depType) => {
      if (packageJson[depType]) {
        const updatedDeps = updateOrgPackageDependencies({
          dependencies: packageJson[depType],
          newVersion,
          org: `@${ORG_NAME}`,
          type: depType as 'dependencies' | 'devDependencies',
        });
        packageJson[depType] = {
          ...packageJson[depType],
          ...updatedDeps,
        };
      }
    });

    await writeFile(file, JSON.stringify(packageJson, null, 2));
  });

  await Promise.all(fileUpdates);
}
