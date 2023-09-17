import { log } from '../../index.js';

/**
 * Creates a new rapidstack project. The action to be run whenever the following
 * commands are run in a user's shell:
 * @param appName the name of the application directory to be created
 */
export async function action(appName?: string): Promise<void> {
  log.debug(`running inner create with appName: [${appName ?? ''}]`);
}
