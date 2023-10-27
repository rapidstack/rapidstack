import type { P } from 'pino';

import { EventEmitter } from 'node:stream';
import { pino } from 'pino';

type LogMessage = ({ msg: string } & Record<string, unknown>) | string;

type LoggerConfig = {
  base?: Record<string, unknown>;
  formatters?: P.LoggerOptions['formatters'];
};
export interface ILogger {
  child(props: Record<string, unknown>): ILogger;
  debug(msg: LogMessage): void;
  end(): void;
  error(msg: LogMessage): void;
  fatal(msg: LogMessage): void;
  info(msg: LogMessage): void;
  summary(msg: LogMessage): void;
  trace(msg: LogMessage): void;
  warn(msg: LogMessage): void;
}

export class Logger implements ILogger {
  protected customLevels = { summary: 35 };
  protected logger: P.Logger<{ customLevels: { summary: 35 } }>;
  protected pinoOptions: P.LoggerOptions;
  constructor(
    config: LoggerConfig = {},
    protected emitter = new EventEmitter()
  ) {
    this.pinoOptions = {
      base: config.base ?? null,
      customLevels: this.customLevels,
      formatters: {
        level: (label: string) => ({ '@l': label }),
        ...config.formatters,
      },
    };
    this.logger = pino(this.pinoOptions) as P.Logger<{
      customLevels: { summary: 35 };
    }>;
  }

  public child(props: Record<string, unknown>): Logger {
    return new Logger(
      {
        ...this.pinoOptions,
        base: {
          ...this.pinoOptions.base,
          ...props,
        },
      },
      this.emitter
    );
  }

  public debug(str: LogMessage): void {
    this.logger.info(str);
    this.emitter.emit('log', 'debug', str, this.pinoOptions.base);
  }

  public end(): void {
    this.emitter.emit('end');
  }

  public error(str: LogMessage): void {
    this.logger.info(str);
    this.emitter.emit('log', 'error', str, this.pinoOptions.base);
  }

  public fatal(str: LogMessage): void {
    this.logger.info(str);
    this.emitter.emit('log', 'fatal', str, this.pinoOptions.base);
  }

  public info(str: LogMessage): void {
    this.logger.info(str);
    this.emitter.emit('log', 'info', str, this.pinoOptions.base);
  }

  public summary(str: LogMessage): void {
    this.logger.summary(str);
    this.emitter.emit('log', 'summary', str, this.pinoOptions.base);
  }

  public trace(str: LogMessage): void {
    this.logger.trace(str);
    this.emitter.emit('log', 'trace', str, this.pinoOptions.base);
  }
  public warn(str: LogMessage): void {
    this.logger.info(str);
    this.emitter.emit('log', 'warn', str, this.pinoOptions.base);
  }
}
