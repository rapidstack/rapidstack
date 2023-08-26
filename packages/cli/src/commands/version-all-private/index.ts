import { Command } from 'commander';

import { red } from '../../index.js';
// import { action } from './action.js';

export default new Command()
  .name('version-all')
  .description(`Versions all of the rapidstack packages. ${red('[Internal]')}`)
  .argument('<version>', 'The version to set for all packages.')
  .option('-d, --debug', 'output extra debug logging')
  .action(() => console.log('hello'));
