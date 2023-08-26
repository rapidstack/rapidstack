import { glob } from 'glob';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { logger } from '../../index.js';
import { resolveVersion, updateOrgPackageDependencies } from './tasks.js';

/**
 * Desc
 * @param version verstr
 */
export const action = async (version: string): Promise<void> => {
  logger.debug(`running 'version-all' called with version: ${version}`);

  const newVersion = resolveVersion(version);

  const packageJsonFiles = await glob('**/package.json', {
    cwd: process.cwd(),
    ignore: 'node_modules',
  });

  packageJsonFiles.map(async (file) => {
    const filePath = join(process.cwd(), file);
    logger.debug(`found package.json at: ${filePath}`);

    const packageJson = JSON.parse(await readFile(filePath, 'utf8'));
    const oldVersion = packageJson.version;

    // Update the top level version for the package.json
    logger.log(
      `{root}/${file}`,
      `modifying version: ${oldVersion} → ${newVersion}`
    );
    packageJson.version = newVersion;

    // Update any @org/* dependencies/devDependencies to that version
    if (packageJson.dependencies) {
      const updatedOrgDeps = updateOrgPackageDependencies(
        packageJson.dependencies,
        newVersion,
        'dep'
      );
      packageJson.dependencies = {
        ...packageJson.dependencies,
        ...updatedOrgDeps,
      };
    }

    if (packageJson.devDependencies) {
      const updatedOrgDevDeps = updateOrgPackageDependencies(
        packageJson.devDependencies,
        newVersion,
        'dep'
      );
      packageJson.devDependencies = {
        ...packageJson.devDependencies,
        ...updatedOrgDevDeps,
      };
    }

    await writeFile(file, JSON.stringify(packageJson, null, 2));
  });

  await Promise.all(packageJsonFiles);
};
