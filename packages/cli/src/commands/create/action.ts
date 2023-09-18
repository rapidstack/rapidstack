import { type Command } from 'commander';

import { log } from '../../index.js';
import { type TemplateConfig } from './tasks.js';

/**
 * Creates a new rapidstack project. The action to be run whenever the following
 * commands are run in a user's shell:
 * @param command
 * @param config
 */
export async function action(
  command: Command,
  config: TemplateConfig
): Promise<void> {
  log.debug(`running inner create with appName`);
}
