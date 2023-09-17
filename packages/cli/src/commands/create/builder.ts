import chalk from 'chalk';
import { Command } from 'commander';
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

  // clean args - move later
  const createIndex = process.argv.indexOf('create');
  const args = process.argv.slice(createIndex + 1);

  const templateIndex = args.indexOf('--template');
  if (templateIndex !== -1) args.splice(templateIndex, 2);

  const templateDirIndex = args.indexOf('--template-dir');
  if (templateDirIndex !== -1) args.splice(templateDirIndex, 2);
  // -------------------------

  // Subcommand
  const subcommand = new Command();
  subcommand.name('foo');
  subcommand.description('foo');
  // add 'assist' as the help keyword for the inner command
  config.parameters.forEach((param) => {
    log.msg(`adding option: --${param.name} <${param.name}>`);
    subcommand.option(
      `--${param.name} <${param.name}>`,
      param.name.split('-').join(' ')
    );
  });
  subcommand.action(async () => {
    // console.log({ args, params });
    console.log('opts', subcommand.opts());
  });
  subcommand.outputHelp();

  subcommand.parse(args, { from: 'user' });

  console.log('done');
  await rm(tempDir, { force: true, recursive: true });
}
