import { Command } from 'commander';

import { red } from '../../utils/index.js';

export default new Command()
  .name('build-all')
  .description(`Builds all of the rapidstack packages. ${red('[Internal]')}`)
  .option('-d, --debug', 'output extra debug logging')
  .action(() => console.log('hello!'));
