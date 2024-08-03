import { input } from '@inquirer/prompts';
import { cp, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { DEFAULT_TEMPLATE_DIR, log, RapidstackCliError } from '../../index.js';

/**
 * Creates a new rapidstack project. The action to be run whenever the following
 * commands are run in a user's shell:
 * @param appName the name of the application directory to be created
 * @example
 * `rapidstack create`
 * `npm init @rapidstack`
 * @throws a `RapidstackCliError` if the template directory does not exist
 */
export async function action(appName?: string): Promise<void> {
  log.debug(`running 'create' with appName: [${appName ?? ''}]`);

  // Look up directory for templates and ensure it exists
  const templateDir = join(DEFAULT_TEMPLATE_DIR, 'create');
  const templateDirExists = await stat(templateDir).catch(() => false);
  if (!templateDirExists) {
    throw new RapidstackCliError(
      `Template directory does not exist: [${templateDir}].`
    );
  }

  // Get or create app name:
  const name =
    appName ??
    (await input({
      default: 'my-rapidstack-app',
      message: 'Project Name',
    }));

  // Copy the package.json file to the destination (as a proof of concept)
  const templateParamsFile = join(templateDir, 'package.json');
  await cp(templateParamsFile, join(process.cwd(), name, 'package.json'), {
    recursive: true,
  });
}
