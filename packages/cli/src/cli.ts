import { program as commander } from 'commander';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { appStr, description } from './utils/macros.js';

const program = commander
  .name(appStr)
  .version('0.0.0')
  .description(description);

const commandsDir = join(__dirname, 'commands');
const commandDirs = await readdir(commandsDir);

const fns = commandDirs.map(async (commandDir) => {
  const [command] = commandDir.split('-private');
  const commandConfigPath = join(commandsDir, commandDir, 'index.js');
  const {
    action,
    args = {} as { [key: string]: string },
    description,
    opts = {},
    usage,
  } = await import(commandConfigPath);

  // Add the command
  program.command(`${command} ${usage}`).description(description);

  // Add any args/options
  Object.entries(args).forEach((arg) =>
    program.option(...(arg as [string, string]))
  );
  Object.entries(opts).forEach((opt) =>
    program.option(...(opt as [string, string]))
  );

  // Add the action
  program.action(action);
});

await Promise.all(fns);

/**
 * The Rapidstack CLI
 */
export const cli = (): void => {
  program.parse();
};
