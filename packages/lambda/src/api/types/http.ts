/* eslint-disable perfectionist/sort-union-types */
/* eslint-disable perfectionist/sort-object-types */

// eslint-disable-next-line @typescript-eslint/ban-types
export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

export type Http100s = {
  Continue: 100;
  SwitchingProtocols: 101;
  Processing: 102;
  EarlyHints: 103;
};

export type Http100Names = Simplify<keyof Http100s>;
export type Http100Codes = Http100s[keyof Http100s];

export type Http200s = {
  OK: 200;
  Created: 201;
  Accepted: 202;
  NonAuthoritativeInformation: 203;
  NoContent: 204;
  ResetContent: 205;
  PartialContent: 206;
  MultiStatus: 207;
  AlreadyReported: 208;
  IMUsed: 226;
};

export type Http200Names = Simplify<keyof Http200s>;
export type Http200Codes = Http200s[keyof Http200s];

export type Http300s = {
  MultipleChoices: 300;
  MovedPermanently: 301;
  Found: 302;
  SeeOther: 303;
  NotModified: 304;
  TemporaryRedirect: 307;
  PermanentRedirect: 308;
};

export type Http300Names = Simplify<keyof Http300s>;
export type Http300Codes = Http300s[keyof Http300s];

export type Http400s = {
  BadRequest: 400;
  Unauthorized: 401;
  PaymentRequired: 402;
  Forbidden: 403;
  NotFound: 404;
  MethodNotAllowed: 405;
  NotAcceptable: 406;
  ProxyAuthenticationRequired: 407;
  RequestTimeout: 408;
  Conflict: 409;
  Gone: 410;
  LengthRequired: 411;
  PreconditionFailed: 412;
  PayloadTooLarge: 413;
  URITooLong: 414;
  UnsupportedMediaType: 415;
  RangeNotSatisfiable: 416;
  ExpectationFailed: 417;
  ImATeapot: 418;
  MisdirectedRequest: 421;
  UnprocessableEntity: 422;
  Locked: 423;
  FailedDependency: 424;
  TooEarly: 425;
  UpgradeRequired: 426;
  PreconditionRequired: 428;
  TooManyRequests: 429;
  RequestHeaderFieldsTooLarge: 431;
  UnavailableForLegalReasons: 451;
};

export type Http400Names = Simplify<keyof Http400s>;
export type Http400Codes = Http400s[keyof Http400s];

export type Http500s = {
  InternalServerError: 500;
  NotImplemented: 501;
  BadGateway: 502;
  ServiceUnavailable: 503;
  GatewayTimeout: 504;
  HTTPVersionNotSupported: 505;
  VariantAlsoNegotiates: 506;
  InsufficientStorage: 507;
  LoopDetected: 508;
  NotExtended: 510;
  NetworkAuthenticationRequired: 511;
};

export type Http500Names = Simplify<keyof Http500s>;
export type Http500Codes = Http500s[keyof Http500s];

export type HttpNonErrorCodes = Http100Codes | Http200Codes | Http300Codes;
export type HttpNonErrors = Simplify<
  Http100Names | Http200Names | Http300Names
>;
export type HttpErrorCodes = Http400Codes | Http500Codes;
export type HttpErrors = Simplify<Http400Names | Http500Names>;

export type HttpVerbs =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'COPY'
  | 'HEAD'
  | 'OPTIONS'
  | 'LINK'
  | 'UNLINK'
  | 'PURGE'
  | 'LOCK'
  | 'UNLOCK'
  | 'PROPFIND'
  | 'VIEW';

export type HttpUpgradeHeaderOptions =
  | 'HTTP/2.0'
  | 'SHTTP/1.3'
  | 'WebSocket'
  | 'IRC/6.9'
  | 'RTA/x11'
  | 'TLS/1.0'
  | 'HTTP/1.1'
  | string;
