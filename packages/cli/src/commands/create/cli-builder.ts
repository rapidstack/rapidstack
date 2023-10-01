import chalk from 'chalk';
import { Command } from 'commander';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

import {
  PROJECT_TEMPLATE_DIR,
  RapidstackCliError,
  actionRunner,
  log,
} from '../../index.js';
import { listPrompt } from '../../template-builder/prompts.js';
import { action } from './action.js';
import {
  cleanCliArgs,
  createProjectStagingDirectory,
  getTemplateConfig,
  getTemplateManifest,
} from './tasks.js';

/**
 * Creates a new rapidstack project. The action to be run whenever the following
 * commands are run in a user's shell:
 * @param options the options for the create command
 * @param options.templateDir location of the template directory to be used.
 * Defaults to the internal create templates.
 * @param options.template name of the template to use.
 * @param options.defaults
 * @throws a `RapidstackCliError` if the template directory does not exist
 */
export async function cliBuilder(
  options: { defaults?: boolean; template?: string; templateDir?: string } = {}
): Promise<void> {
  const templateDir = options.templateDir || PROJECT_TEMPLATE_DIR;
  const template = options.template;
  const useDefaults = options.defaults;
  log.debug(
    `running 'create' with template Directory: ` +
      `[${templateDir}] and template: [${
        template || chalk.gray.italic('undefined')
      }]. The user is ${useDefaults ? '' : 'not '}preferring defaults.`
  );

  const { manifest, name, version } = await getTemplateManifest(templateDir);

  if (version !== '1.0.0') {
    throw new RapidstackCliError(
      `Invalid template version in manifest. Found: [${version}].`
    );
  }

  const tempDir = await createProjectStagingDirectory();

  const manifestKeys = Object.keys(manifest);
  if (template && !manifestKeys.includes(template)) {
    throw new Error(
      `Project template [${template}] not found.` +
        `Valid templates: ${manifestKeys.join()}`
    );
  }

  // for manifests with only one template, default to only key
  let chosenTemplate = template || manifestKeys[0];
  let projectConfig = manifest[chosenTemplate].config;
  if (manifestKeys.length > 1 && !template) {
    chosenTemplate = await listPrompt(manifestKeys, manifestKeys[0]);
    projectConfig = manifest[chosenTemplate].config;
  }

  const configPath = join(templateDir, projectConfig);
  const config = await getTemplateConfig(configPath, tempDir);

  // create a subcommand to run the template generator under so all possible
  // options are available as stdin flags rather than requiring prompts
  const subcommand = new Command();
  subcommand
    .name(`rapidstack create --template ${chosenTemplate}`)
    .description(`${name} \u2192 ${chosenTemplate}`) // (unicode arrow: →)
    .helpOption('--assist', 'display help for this particular template');

  config.parameters.forEach((param) => {
    // boolean options shouldn't have a corresponding parameter
    if (param.booleanFlag) {
      log.debug(`adding boolean option: --${param.name}`);
      subcommand.option(`--${param.name}`);
      return;
    }

    log.debug(`adding string option: --${param.name} [${param.name}]`);
    subcommand.option(
      `--${param.name} [${param.name}]`,
      param.name.split('-').join(' ')
    );
  });
  subcommand.action(
    actionRunner(async () => await action(subcommand, config, useDefaults))
  );

  const args = cleanCliArgs(process.argv);
  subcommand.parse(args, { from: 'user' });

  log.msg('done');
  await rm(tempDir, { force: true, recursive: true });
}
