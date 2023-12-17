import type { P } from 'pino';

import { pino } from 'pino';

type LogMessage = ({ msg: string } & Record<string, unknown>) | string;
type SummaryMessage = {
  conclusion: 'failure' | 'success';
  duration: number;
} & Record<string, number | string>;

export type LoggerConfig = {
  /**
   * The base properties to be logged with each message.
   */
  base?: Record<string, unknown>;
  /**
   * The pino formatters to be used for each message.
   */
  formatters?: P.LoggerOptions['formatters'];
  /**
   * The log level to be used for the logger. Standard pino levels are supported
   * as well as the `summary` level which is used to log summary messages
   * between info and warn levels.
   * @default info
   */
  level?: P.LoggerOptions['level'];
};

type ChildLoggerProperties = Record<string, unknown> & {
  hierarchicalName: string;
};
export interface ILogger {
  /**
   * Creates a child logger with the provided properties. The child logger
   * inherits the parent's properties and adds the provided properties. The
   * required `hierarchicalName` property is used to build a trace hierarchy to
   * assist in debugging/navigating.
   * @param props the properties to be added to the child logger
   */
  child(props: ChildLoggerProperties): ILogger;
  /**
   * Logs a debug message.
   * @param msg a string message to be logged or a log object with the `msg` key
   */
  debug(msg: LogMessage): void;
  /**
   * Signifies the logger has reached the end of a request. Useful when extended
   * loggers want to perform some action at the end of a request.
   */
  end(): void;
  /**
   * Logs an error message.
   * @param msg a string message to be logged or a log object with the `msg` key
   */
  error(msg: LogMessage): void;
  /**
   * Logs a fatal message.
   * @param msg a string message to be logged or a log object with the `msg` key
   */
  fatal(msg: LogMessage): void;
  /**
   * Logs an information message.
   * @param msg a string message to be logged or a log object with the `msg` key
   */
  info(msg: LogMessage): void;
  /**
   * Logs a summary message for a particular run that has concluded with
   * execution details.
   * @param msg a summary object containing at least the conclusion
   * (success/failure) and duration length (ms) to process the request.
   */
  summary(msg: SummaryMessage): void;
  /**
   * Logs a trace message.
   * @param msg a string message to be logged or a log object with the `msg` key
   */
  trace(msg: LogMessage): void;
  /**
   * Logs a warning message.
   * @param msg a string message to be logged or a log object with the `msg` key
   */
  warn(msg: LogMessage): void;
}

export interface LoggerEvents {
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
 * Logger that outputs a set of standard properties for each log message. The
 * sigil `@` is used to denote these properties for brevity, filtering, and
 * to avoid collisions with other properties that might be logged. The following
 * property keys are logged by default:
 * ```txt
 * '@t': the timestamp of the log message
 * '@h': the hierarchy of the logger in an array. Builds with each child logger.
 * '@m': the message of the log
 * '@l': the level of the log
 * '@a': the application name
 * '@r': the request info for the relevant run
 * '@s': summary info for the relevant run (for summary logs only)
 * ```
 */
export class Logger implements ILogger {
  protected customLevels = { summary: 35 };
  protected logger: P.Logger<'summary'>;
  protected pinoOptions: P.LoggerOptions<'summary'>;

  /**
   * @param config the optional config object for the logger
   * @param config.base the base properties to be logged with each message
   * @param config.formatters the formatters to be used for each message
   * @param config.level the log level to be used for the logger. Default = info
   * @param emitter an event emitter to be used to hook into any logger events.
   * Functions independently of the provided log level. All events are sent.
   */
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
      level: config.level?.toLowerCase() ?? 'info',
      messageKey: '@m',
      timestamp: () => `, "@t": ${Date.now()}`,
    };

    this.logger = pino<'summary'>(this.pinoOptions) as P.Logger<'summary'>;
  }

  public child(props: ChildLoggerProperties): Logger {
    const { hierarchicalName, ...rest } = props;
    return new Logger(
      {
        ...this.pinoOptions,
        base: {
          ...this.pinoOptions.base,
          ...rest,
          '@h': [...(this.pinoOptions.base || {})['@h'], hierarchicalName],
        },
      },
      this.emitter
    );
  }

  public debug(str: LogMessage): void {
    this.logger.debug(str);
    this.emitter?.emit('log', 'debug', str, this.pinoOptions.base);
  }

  public end(): void {
    this.emitter?.emit('end');
  }

  public error(str: LogMessage): void {
    this.logger.error(str);
    this.emitter?.emit('log', 'error', str, this.pinoOptions.base);
  }

  public fatal(str: LogMessage): void {
    this.logger.fatal(str);
    this.emitter?.emit('log', 'fatal', str, this.pinoOptions.base);
  }

  public info(str: LogMessage): void {
    this.logger.info(str);
    this.emitter?.emit('log', 'info', str, this.pinoOptions.base);
  }

  public summary(obj: SummaryMessage): void {
    const summary = { '@s': obj };
    this.logger.summary(summary);
    this.emitter?.emit('log', 'summary', obj, this.pinoOptions.base);
  }

  public trace(str: LogMessage): void {
    this.logger.trace(str);
    this.emitter?.emit('log', 'trace', str, this.pinoOptions.base);
  }

  public warn(str: LogMessage): void {
    this.logger.warn(str);
    this.emitter?.emit('log', 'warn', str, this.pinoOptions.base);
  }
}
