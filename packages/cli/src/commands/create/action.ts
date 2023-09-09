import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

import {
  DEFAULT_TEMPLATE_DIR,
  RapidstackCliError,
  TEMPLATE_CONFIG_FILENAME,
  log,
} from '../../index.js';

/**
 * Creates a new rapidstack project. The action to be run whenever the following
 * commands are run in a user's shell:
 * @param templateDirectory an optional directory to look for templates in
 * @example
 * `rapidstack create`
 * `npm init @rapidstack`
 * @throws a `RapidstackCliError` if the template directory does not exist
 */
export async function action(templateDirectory?: string): Promise<void> {
  log.debug(
    `running 'create' called with templateDirectory: [${
      templateDirectory ?? ''
    }]`
  );

  // Look up directory for templates and ensure it exists
  const templateDir = templateDirectory ?? join(DEFAULT_TEMPLATE_DIR, 'create');
  const templateDirExists = await stat(templateDir).catch(() => false);
  if (!templateDirExists) {
    throw new RapidstackCliError(
      `Template directory does not exist: [${templateDir}].`
    );
  }

  // Get the rapidstack-template-params.json file from the template directory
  const templateParamsFile = join(templateDir, TEMPLATE_CONFIG_FILENAME);
  const templateParamsFileContents = await readFile(
    templateParamsFile,
    'utf-8'
  );
  const templateParams = JSON.parse(templateParamsFileContents);
  log.msg(templateParams);

  // Recursively copy all the files from the template directory to the cwd
  // if a package.json file is found, look through the devDeps and deps and see
  // if they require any specific version handling
}
