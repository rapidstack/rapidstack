import { input } from '@inquirer/prompts';
import { cp, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { DEFAULT_TEMPLATE_DIR, log, RapidstackCliError } from '../../index.js';

/**
 * Creates a new rapidstack plugin. The action to be run whenever the following
 * commands are run in a user's shell:
 * @param pluginName the name of the plugin directory to be created
 * @example
 * `rapidstack create-plugin`
 * `npm init @rapidstack/plugin`
 * @throws a `RapidstackCliError` if the template directory does not exist
 */
export async function action(pluginName?: string): Promise<void> {
  log.debug(`running 'create-plugin' with pluginName: [${pluginName ?? ''}]`);

  // Look up directory for templates and ensure it exists
  const templateDir = join(DEFAULT_TEMPLATE_DIR, 'create-plugin');
  const templateDirExists = await stat(templateDir).catch(() => false);
  if (!templateDirExists) {
    throw new RapidstackCliError(
      `Template directory does not exist: [${templateDir}].`
    );
  }

  // Get or create app name:
  const name =
    pluginName ??
    (await input({
      default: 'my-plugin',
      message: 'Plugin Name',
    }));

  // Copy the package.json file to the destination (as a proof of concept)
  const templateParamsFile = join(templateDir, 'package.json');
  await cp(
    templateParamsFile,
    join(
      process.cwd(),
      `rapidstack-plugin-${name.replace(' ', '-')}`,
      'package.json'
    ),
    {
      recursive: true,
    }
  );
}
