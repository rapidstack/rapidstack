import type { P } from 'pino';

import { pino } from 'pino';

type LogMessage = ({ msg: string } & Record<string, unknown>) | string;

export interface ILogger {
  trace(msg: LogMessage): void;
  debug(msg: LogMessage): void;
  info(msg: LogMessage): void;
  summary(msg: LogMessage): void;
  warn(msg: LogMessage): void;
  error(msg: LogMessage): void;
  fatal(msg: LogMessage): void;
}

export class Logger implements ILogger {
  protected logger: P.Logger;
  constructor(
    protected pinoOptions: any,
    protected destinations: any
  ) {
    // WIP minimalistic logger
    this.logger = pino(pinoOptions, destinations);
    // this.logger = pino(
    //   {
    //     base: null,
    //     formatters: { level: (level) => ({ level }) },
    //     level: process.env.LOG_LEVEL || 'info',
    //   },
    //   createWriteStream('/dev/null')
    // );
  }

  public child(options: Record<string, unknown>): Logger {
    return new Logger(
      {
        ...this.pinoOptions,
        base: {
          ...(this.pinoOptions.base || {}),
          ...options,
        },
      },
      this.destinations
    );
  }

  public info(str: LogMessage): void {
    this.logger.info(str);
  }
}

// // test out the logger
// const logger = new Logger();
// // @ts-ignore
// logger.debug('debug');
// logger.info('info');
