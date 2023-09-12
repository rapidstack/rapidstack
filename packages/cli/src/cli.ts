import { Command } from 'commander';

import { buildAllCommand } from './commands/build-all-private/index.js';
import { buildCreateCommand } from './commands/create/index.js';
import { buildCreatePluginCommand } from './commands/create-plugin/index.js';
import { buildVersionCommand } from './commands/version-all-private/index.js';
import { DEBUG_FLAG_REGEX, handleExit, isLocal, log } from './utils/index.js';
import { appStr, description, versionStr } from './utils/macros.js';

const commands: {
  private: { [key: string]: Command };
  public: { [key: string]: Command };
} = {
  private: {
    'build-all': buildAllCommand(),
    'version-all': buildVersionCommand(),
  },
  public: {
    'create': buildCreateCommand(),
    'create-plugin': buildCreatePluginCommand(),
  },
};

if (
  process.argv.includes('--debug') ||
  process.argv.some((arg) => DEBUG_FLAG_REGEX.test(arg))
) {
  log.debug('cli arguments:');
  JSON.stringify(process.argv, null, 2)
    .split('\n')
    .forEach((str) => log.debug(str));

  log.debug('calling cwd:');
  log.debug(process.cwd());
}

const program = new Command()
  .name(appStr)
  .version(versionStr)
  .description(description)
  .option('-d, --debug', 'output extra debug logging')
  .exitOverride(handleExit);

// Only load private commands if running in the context of the rapidstack repo
if (await isLocal()) {
  const privateCommands = Object.entries(commands.private);
  privateCommands.forEach(([name, command]) => {
    program.addCommand(command);
    log.debug(`added internal command: [${name}]`);
  });
}

const publicCommands = Object.entries(commands.public);
publicCommands.forEach(([name, command]) => {
  program.addCommand(command);
  log.debug(`added public command: [${name}]`);
});

/**
 * The Rapidstack CLI
 */
export function cli(): void {
  program.parse();
}
