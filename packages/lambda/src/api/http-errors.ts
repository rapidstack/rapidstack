import type { ValiError } from 'valibot';

import type { ValibotSchema } from '../utils/index.js';
import type {
  Http400s,
  Http500s,
  HttpErrorCodes,
  HttpUpgradeHeaderOptions,
  HttpVerbs,
} from './types/http.js';

import { HttpErrorExplanations } from './constants.js';

// TODO: needs rework for overloading
export class HttpError extends Error {
  public code: HttpErrorCodes;
  public headers?: Record<string, string>;
  public message: string;

  constructor(code: HttpErrorCodes, message?: string, other?: never);

  constructor(
    code: Http400s['MethodNotAllowed'],
    methods: HttpVerbs[],
    message?: string
  );

  constructor(
    code: Http400s['RangeNotSatisfiable'],
    range: number,
    message?: string
  );

  constructor(
    code: Http400s['UpgradeRequired'],
    upgrade: HttpUpgradeHeaderOptions[],
    message?: string
  );

  constructor(
    code: Http500s['ServiceUnavailable'],
    retryAfterSeconds: number,
    message?: string
  );

  constructor(
    code: HttpErrorCodes,
    message?: HttpUpgradeHeaderOptions[] | HttpVerbs[] | number | string,
    other?: string
  ) {
    switch (code) {
      case 405: {
        const m =
          other || 'The HTTP method used is not allowed for this resource.';
        super(`${code} Method Not Allowed - ${m}`);
        this.message = m;

        this.headers = {
          Allow: (message as HttpVerbs[]).join().toUpperCase(),
        };
        break;
      }

      case 416: {
        const m = other || 'The server cannot serve the requested ranges.';
        super(`${code} Range Not Satisfiable - ${m}`);
        this.message = m;

        this.headers = { 'Content-Range': `bytes */${message}` };
        break;
      }

      case 426: {
        const m =
          other || 'The client needs to switch to a different protocol.';
        super(`${code} Upgrade Required - ${m}`);
        this.message = m;

        this.headers = {
          Connection: `Upgrade`,
          Upgrade: (message as string[]).join(', '),
        };
        break;
      }

      case 503: {
        const m =
          other ||
          'The server cannot handle the request because it is overloaded or down for maintenance.';
        super(`${code} Service Unavailable - ${m}`);
        this.message = m;

        this.headers = {
          'retry-after': (message as number).toString(),
        };
        break;
      }

      default: {
        if (message) {
          // eslint-disable-next-line security/detect-object-injection
          super(`${code} ${HttpErrorExplanations[code].name} - ${message}`);
          this.message = message as string;
        } else {
          super(
            // eslint-disable-next-line security/detect-object-injection
            `${code} ${HttpErrorExplanations[code].name} - ${HttpErrorExplanations[code].message}`
          );
          // eslint-disable-next-line security/detect-object-injection
          this.message = HttpErrorExplanations[code].message;
        }

        break;
      }
    }

    this.name = 'HTTPError';
    this.code = code;
  }
}

export type HttpValidationErrorProps = {
  body?: [error: ValiError, schema: ValibotSchema, inputExists?: boolean];
  cookies?: [error: ValiError, schema: ValibotSchema, inputExists?: boolean];
  headers?: [error: ValiError, schema: ValibotSchema, inputExists?: boolean];
  qsp?: [error: ValiError, schema: ValibotSchema, inputExists?: boolean];
};
export class HttpValidationError extends Error {
  constructor(public validationErrors: HttpValidationErrorProps) {
    super('HTTP request failed validation');
  }
}
