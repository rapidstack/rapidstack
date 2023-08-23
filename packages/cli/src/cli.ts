import { Command } from 'commander';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

import { appStr, description, versionStr } from './utils/macros.js';

const program = new Command()
  .name(appStr)
  .version(versionStr)
  .description(description);

const commandsDir = join(__dirname, 'commands');
const commandDirs = await readdir(commandsDir);

const fns = commandDirs.map(async (commandDir) => {
  const sumCommandPath = join(commandsDir, commandDir, 'index.js');
  const subcommand = await import(sumCommandPath).then(
    ({ default: command }) => command as Command
  );

  program.addCommand(subcommand);
});

await Promise.all(fns);

/**
 * The Rapidstack CLI
 */
export const cli = (): void => {
  program.parse();
};
