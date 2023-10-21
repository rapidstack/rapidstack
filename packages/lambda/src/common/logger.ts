import type { P } from 'pino';

import { pino } from 'pino';

export class Logger {
  protected logger: P.Logger;
  constructor() {
    // WIP minimalistic logger
    this.logger = pino({
      base: null,
      formatters: { level: (level) => ({ level }) },
      level: process.env.LOG_LEVEL || 'info',
    });
  }

  public child(options: Record<string, unknown>): Logger {
    return Object.assign(new Logger(), {
      logger: this.logger.child(options),
    });
  }

  public debug(message: string): void {
    this.logger.debug(message);
  }
  public info(message: string): void {
    this.logger.info(message);
  }
}

// test out the logger
const logger = new Logger();
// @ts-ignore
logger.debug('debug');
logger.info('info');
