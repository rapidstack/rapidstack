import chalk from 'chalk';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import { PROJECT_TEMPLATE_DIR, log } from '../../index.js';
import { listPrompt } from '../../template-builder/prompts.js';
import {
  createProjectStagingDirectory,
  getTemplateConfig,
  getTemplateManifest,
} from './tasks.js';

/**
 * Creates a new rapidstack project. The action to be run whenever the following
 * commands are run in a user's shell:
 * @param options the options for the create command
 * @param options.templateDir location of the template directory to be used. Defaults to
 * the internal create templates.
 * @param options.template name of the template to use.
 * @example
 * `rapidstack create`
 * `npm init @rapidstack`
 * @throws a `RapidstackCliError` if the template directory does not exist
 */
export async function actionBuilder(
  options: { template?: string; templateDir?: string } = {}
): Promise<void> {
  const templateDir = options.templateDir || PROJECT_TEMPLATE_DIR;
  const template = options.template;
  log.debug(
    `running 'create' with template Directory: ` +
      `[${templateDir}] and template: [${
        template || chalk.gray.italic('undefined')
      }]`
  );

  const manifest = await getTemplateManifest(templateDir);
  const tempDir = await createProjectStagingDirectory();

  const manifestKeys = Object.keys(manifest);
  if (template && !manifestKeys.includes(template)) {
    throw new Error(
      `Project template [${template}] not found.` +
        `Valid templates: ${manifestKeys.join()}`
    );
  }

  // for manifests with only one template, default to only key
  let projectConfig = manifest[template || manifestKeys[0]].config;
  if (manifestKeys.length > 1 && !template) {
    const choice = await listPrompt(manifestKeys, manifestKeys[0]);
    projectConfig = manifest[choice].config;
  }

  const configPath = join(templateDir, projectConfig);
  const config = await getTemplateConfig(configPath, tempDir);

  // TODO: configure subcommand to handle config file parameters
  await (config as any).parameters[0].prompt('foo');

  await rm(tempDir, { force: true, recursive: true });
}
