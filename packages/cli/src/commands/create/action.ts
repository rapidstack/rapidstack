import { type Command } from 'commander';

import { RapidstackCliError, log } from '../../index.js';
import { type TemplateConfig } from './tasks.js';

/**
 * Creates a new rapidstack project. The action to be run whenever the following
 * commands are run in a user's shell:
 * @param command the commander command
 * @param config the rapidstack template config
 * @param useDefaults whether or not the user is preferring defaults
 * @throws {RapidstackCliError} if the target directory is not empty
 */
export async function action(
  command: Command,
  config: TemplateConfig,
  useDefaults?: boolean
): Promise<void> {
  logDebugInfo(command, config, useDefaults);

  // Make sure all of the parameters are defined and that no prompting is needed
  // Make sure the target directory is valid and doesn't already contain a node
  // project

  // check if the target directory is empty

  // create the temp directory

  // check if all parameters are defined

  // separate parameters into groups: token-replacer, fs-action
  const tokenReplacerParams = [];
  const fsActionParams = [];
  for (const param of config.parameters) {
    switch (param.type) {
      case 'token-replacer':
        tokenReplacerParams.push(param);
        break;
      case 'fs-action':
        fsActionParams.push(param);
        break;
      default:
        throw new RapidstackCliError(
          `Unknown parameter type in parameter config: ${param.type}`
        );
    }
  }

  // Run the cp + token replacement actions (all in parallel):
  // - Loop through every file in the template directory
  //   - If the file ends in .template, remove that suffix
  //   - If the file is a package.json, run the package.json job for deps
  //   - Apply any token replacements to the file
  //   - Copy the file to the temp directory

  // Run the fs actions sequentially

  // Copy the final project to the target directory
}

/**
 * Logs the debug info for the inner create command action.
 * @param command the commander command
 * @param config the rapidstack template config
 * @param useDefaults whether or not the user is preferring defaults
 */
function logDebugInfo(
  command: Command,
  config: TemplateConfig,
  useDefaults?: boolean
) {
  log.debug('running inner create with command options:');
  JSON.stringify(command.opts(), null, 2)
    .split('\n')
    .forEach((line) => {
      log.debug(line);
    });

  log.debug(
    `and with relevant template config options ${
      useDefaults ? '(preferring defaults)' : ''
    }:`
  );
  JSON.stringify(config, null, 2)
    .split('\n')
    .forEach((line) => {
      log.debug(line);
    });
}
