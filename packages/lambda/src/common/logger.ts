import type { P } from 'pino';

import { pino } from 'pino';

type LogMessage = ({ msg: string } & Record<string, unknown>) | string;
type SummaryMessage = {
  conclusion: 'failure' | 'success';
  duration: number;
} & Record<string, number | string>;

type LoggerConfig = {
  base?: Record<string, unknown>;
  formatters?: P.LoggerOptions['formatters'];
};

type ChildLoggerProperties = Record<string, unknown> & {
  hierarchicalName: string;
};
export interface ILogger {
  child(props: ChildLoggerProperties): ILogger;
  debug(msg: LogMessage): void;
  end(): void;
  error(msg: LogMessage): void;
  fatal(msg: LogMessage): void;
  info(msg: LogMessage): void;
  summary(msg: SummaryMessage): void;
  trace(msg: LogMessage): void;
  warn(msg: LogMessage): void;
}

interface LoggerEvents {
  emit(
    event: 'log',
    level: 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn',
    msg: LogMessage,
    props: Record<string, unknown> | null | undefined
  ): boolean;
  emit(
    event: 'log',
    level: 'summary',
    msg: SummaryMessage,
    props: Record<string, unknown> | null | undefined
  ): boolean;
  emit(event: 'end'): boolean;
  on(
    event: 'log',
    listener: (
      level: string,
      msg: LogMessage,
      props: Record<string, unknown> | null | undefined
    ) => void
  ): this;
  on(event: 'end', listener: () => void): this;
}
/**
 * Logger that outputs a set of standard properties for each log message:
 * ```
 * '@t': the timestamp of the log message
 * '@h': the hierarchy of the logger in an array. Builds with each child logger.
 * '@m': the message of the log
 * '@l': the level of the log
 * '@a': the application name
 * '@r': the request info for the relevant run
 * ```
 */
export class Logger implements ILogger {
  protected customLevels = { summary: 35 };
  protected logger: P.Logger<{ customLevels: { summary: 35 } }>;
  protected pinoOptions: P.LoggerOptions;
  constructor(
    config: LoggerConfig = {},
    protected emitter?: LoggerEvents
  ) {
    this.pinoOptions = {
      base: {
        '@h': ['toolkit:root'],
        ...config.base,
      },
      customLevels: this.customLevels,
      formatters: {
        level: (label: string) => ({ '@l': label }),
        ...config.formatters,
      },
      messageKey: '@m',
      timestamp: () => `, "@t": ${Date.now()}`,
    };
    this.logger = pino(this.pinoOptions) as P.Logger<{
      customLevels: { summary: 35 };
    }>;
  }

  public child(props: ChildLoggerProperties): Logger {
    return new Logger(
      {
        ...this.pinoOptions,
        base: {
          ...this.pinoOptions.base,
          ...props,
          '@h': [
            ...(this.pinoOptions.base || {})['@h'],
            props.hierarchicalName,
          ],
        },
      },
      this.emitter
    );
  }

  public debug(str: LogMessage): void {
    this.logger.info(str);
    this.emitter?.emit('log', 'debug', str, this.pinoOptions.base);
  }

  public end(): void {
    this.emitter?.emit('end');
  }

  public error(str: LogMessage): void {
    this.logger.info(str);
    this.emitter?.emit('log', 'error', str, this.pinoOptions.base);
  }

  public fatal(str: LogMessage): void {
    this.logger.info(str);
    this.emitter?.emit('log', 'fatal', str, this.pinoOptions.base);
  }

  public info(str: LogMessage): void {
    this.logger.info(str);
    this.emitter?.emit('log', 'info', str, this.pinoOptions.base);
  }

  public summary(str: SummaryMessage): void {
    this.logger.summary(str);
    this.emitter?.emit('log', 'summary', str, this.pinoOptions.base);
  }

  public trace(str: LogMessage): void {
    this.logger.trace(str);
    this.emitter?.emit('log', 'trace', str, this.pinoOptions.base);
  }

  public warn(str: LogMessage): void {
    this.logger.info(str);
    this.emitter?.emit('log', 'warn', str, this.pinoOptions.base);
  }
}

const logger = new Logger();

logger.info('hello!');
const c = logger.child({ hierarchicalName: 'my-helper' });
c.info('hello from child');
