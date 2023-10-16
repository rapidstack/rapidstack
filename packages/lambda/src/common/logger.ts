import type { P } from 'pino';

import { pino } from 'pino';

export class Logger {
  protected logger: P.Logger;
  constructor() {
    // WIP minimalistic logger
    this.logger = pino({
      formatters: { level: (level) => ({ level }) },
      level: process.env.LOG_LEVEL || 'info',
    });
  }

  public child(options: Record<string, unknown>): Logger {
    return Object.assign(new Logger(), {
      logger: this.logger.child(options),
    });
  }

  public log(message: string): void {
    this.logger.info(message);
  }
}
