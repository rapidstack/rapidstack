import chalk from 'chalk';
import { Command } from 'commander';
import { glob } from 'glob';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { logger } from '../../utils/index.js';

export default new Command()
  .name('version-all')
  .description(
    `Versions all of the rapidstack npm packages. ${chalk.red('[Internal]')}`
  )
  .argument('<version>', 'The version to set for all packages.')
  .option('-d, --debug', 'output extra debug logging')
  .action(async (version: string) => {
    logger.debug(`running 'version-all' called with version: ${version}`);

    // Test the version to make sure it follows our semver scheme.
    const newVersion = version.replace('v', '');
    const semverRegex =
      /^(\d+\.\d+\.\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Fa-f]{7})?))?(?:\+[0-9A-Za-z-]+)?$/;

    if (!semverRegex.test(newVersion)) {
      logger.error('Invalid version! Please use a valid semver version.');
      process.exit(1);
    }

    const packageJsonFiles = await glob('**/package.json', {
      cwd: process.cwd(),
      ignore: 'node_modules',
    });

    packageJsonFiles.map(async (file) => {
      const filePath = join(process.cwd(), file);
      logger.debug(`found package.json at: ${filePath}`);
      const packageJson = JSON.parse(await readFile(filePath, 'utf8'));
      const oldVersion = packageJson.version;

      // Update the top level version
      logger.log(
        `{root}/${file}`,
        `modifying version: ${oldVersion} → ${newVersion}`
      );
      packageJson.version = newVersion;

      // Update any @org/* dependencies to that version
      const dependencies = packageJson.dependencies || {};
      const devDependencies = packageJson.devDependencies || {};

      const orgDeps = (
        Object.entries(dependencies) as [string, string][]
      ).filter(([name]) => name.startsWith(`@rapidstack`));

      const updatedOrgDeps = orgDeps.reduce(
        (acc, [name, version], index) => {
          acc[name] = newVersion;
          logger.log(
            orgDeps.length === index ? '├───' : '└───',
            `${name}:${version}`,
            '→',
            newVersion,
            '(dep)'
          );
          return acc;
        },
        {} as Record<string, string>
      );

      const orgDevDeps = (
        Object.entries(devDependencies) as [string, string][]
      ).filter(([name]) => name.startsWith(`@rapidstack`));

      const updatedOrgDevDeps = orgDevDeps.reduce(
        (acc, [name, version], index) => {
          acc[name] = newVersion;
          logger.log(
            orgDevDeps.length === index ? '├───' : '└───',
            `${name}:${version}`,
            '→',
            newVersion,
            '(devDep)'
          );
          return acc;
        },
        {} as Record<string, string>
      );

      if (packageJson.dependencies) {
        packageJson.dependencies = {
          ...packageJson.dependencies,
          ...updatedOrgDeps,
        };
      }

      if (packageJson.devDependencies) {
        packageJson.devDependencies = {
          ...packageJson.devDependencies,
          ...updatedOrgDevDeps,
        };
      }

      await writeFile(file, JSON.stringify(packageJson, null, 2));
    });

    await Promise.all(packageJsonFiles);
  });
