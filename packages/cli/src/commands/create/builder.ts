import { stat } from 'node:fs/promises';

import { PROJECT_TEMPLATE_DIR, RapidstackCliError, log } from '../../index.js';

/**
 * Creates a new rapidstack project. The action to be run whenever the following
 * commands are run in a user's shell:
 * @param templateDir location of the template directory to be used. Defaults to
 * the internal create templates.
 * @example
 * `rapidstack create`
 * `npm init @rapidstack`
 * @throws a `RapidstackCliError` if the template directory does not exist
 */
export async function actionBuilder(
  templateDir = PROJECT_TEMPLATE_DIR
): Promise<void> {
  log.debug(`running 'create' with template Directory: [${templateDir}]`);

  if (!(await stat(templateDir).catch(() => false))) {
    throw new RapidstackCliError(
      `Template directory [${templateDir}] not found.`
    );
  }
}
