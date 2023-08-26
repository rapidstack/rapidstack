import { Command } from 'commander';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

import { logger } from './utils/index.js';
import { appStr, description, versionStr } from './utils/macros.js';

// if (
//   process.argv.includes('--debug') ||
//   process.argv.some((arg) => /^-([a-ce-z]*d[a-ce-z]*)$/i.test(arg))
// ) {
//   process.env.DEBUG_LOGGING = '1';
//   logger.debug('cli arguments: ', JSON.stringify(process.argv));
// }

const program = new Command()
  .name(appStr)
  .version(versionStr)
  .description(description);
// .option('-d, --debug', 'output extra debug logging');

const commandsDir = join(__dirname, 'commands');
const commandDirs = await readdir(commandsDir);

const fns = commandDirs.map(async (commandDir) => {
  if (!(await stat(join(commandsDir, commandDir))).isDirectory()) return;

  const sumCommandPath = join(commandsDir, commandDir, 'index.js');
  const subcommand = await import(sumCommandPath).then(
    ({ default: command }) => command as Command
  );

  program.addCommand(subcommand);
  logger.debug(`loaded command: ${commandDir.replace('-private', '')}`);
});

await Promise.all(fns);

/**
 * The Rapidstack CLI
 */
export const cli = (): void => {
  program.parse();
};
