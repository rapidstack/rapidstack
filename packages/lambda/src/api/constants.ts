import type { HttpErrorCodes } from './types/http.js';

export const HttpErrorExplanations = {
  400: {
    message:
      'The server could not understand the request due to invalid syntax.',
    name: 'Bad Request',
  },
  401: {
    message: 'You need to be authenticated to request this resource or action.',
    name: 'Unauthorized',
  },
  402: {
    message:
      'Your request or action limit has been reached or you have insufficient \
      funds.',
    name: 'Payment Required',
  },
  403: {
    message:
      'The request or action is prohibited or you do not have necessary \
      permissions with your current credentials.',
    name: 'Forbidden',
  },
  404: {
    message: 'The requested resource or action could not be found.',
    name: 'Not Found',
  },
  405: {
    message: 'The HTTP method used is not allowed for this resource.',
    name: 'Method Not Allowed',
  },
  406: {
    message:
      'The server cannot respond with the accept-header specified in the \
      request.',
    name: 'Not Acceptable',
  },
  407: {
    message: 'The client has not authenticated itself with the proxy.',
    name: 'Proxy Authentication Required',
  },
  408: {
    message: 'The server timed out waiting for the request.',
    name: 'Request Timeout',
  },
  409: {
    message: 'There was a conflict trying to fulfill the request.',
    name: 'Conflict',
  },
  410: {
    message:
      'The resource requested is no longer available and will not be available \
      again.',
    name: 'Gone',
  },
  411: {
    message:
      'The request did not specify the length of its content, which is \
      required by the requested resource.',
    name: 'Length Required',
  },
  412: {
    message:
      'The request was denied as it failed several conditions defined in the \
      request-headers.',
    name: 'Precondition Failed',
  },
  413: {
    message: 'The request was denied as it was deemed too big by the server.',
    name: 'Payload Too Large',
  },
  414: {
    message: 'The URI provided was too long for the server to process.',
    name: 'URI Too Long',
  },
  415: {
    message:
      'The request entity has a media type which the server or resource does \
      not support.',
    name: 'Unsupported Media Type',
  },
  416: {
    message: 'The server cannot serve the requested ranges.',
    name: 'Range Not Satisfiable',
  },
  417: {
    message:
      'The server cannot meet the requirements of the Expect request-header \
      field.',
    name: 'Expectation Failed',
  },
  418: {
    message: '🫖',
    name: "I'm a Teapot",
  },
  421: {
    message:
      'The request was directed to a server that is not able to produce a \
      response.',
    name: 'Misdirected Request',
  },
  422: {
    message:
      'The server understands the content type, and the syntax is correct, but \
      it was unable to process the contained instructions. Do not repeat \
      request without modification!',
    name: 'Unprocessable Entity',
  },
  423: {
    message: 'The resource that was requested is currently locked.',
    name: 'Locked',
  },
  424: {
    message:
      'The request failed because it depended on another request and that \
      request failed.',
    name: 'Failed Dependency',
  },
  425: {
    message:
      'The request failed because the server was not ready or it had not \
      completed a security handshake with the client.',
    name: 'Too Early',
  },
  426: {
    message: 'The client needs to switch to a different protocol.',
    name: 'Upgrade Required',
  },
  428: {
    message:
      'The server requires the request to be conditional to avoid conflicts.',
    name: 'Precondition Required',
  },
  429: {
    message: 'The user has sent too many requests in a given amount of time.',
    name: 'Too Many Requests',
  },
  431: {
    message:
      'The server is unwilling to process the request because either an \
      individual header field, or all the header fields collectively, are too \
      large.',
    name: 'Request Header Fields Too Large',
  },
  451: {
    message:
      'We have received a legal demand to deny access to a resource or to a \
      set of resources that includes the requested resource.',
    name: 'Unavailable For Legal Reasons',
  },
  500: {
    message:
      'The server has encountered a situation it does not know how to handle.',
    name: 'Internal Server Error',
  },
  501: {
    message:
      'The request method is not supported by the server and cannot be \
      handled.',
    name: 'Not Implemented',
  },
  502: {
    message:
      'The server received a bad response when attempting to fulfill the \
      request.',
    name: 'Bad Gateway',
  },
  503: {
    message:
      'The server cannot handle the request because it is overloaded or down \
      for maintenance.',
    name: 'Service Unavailable',
  },
  504: {
    message:
      'The gateway did not receive a timely response from the upstream server \
      handling the request.',
    name: 'Gateway Timeout',
  },
  505: {
    message:
      'The server does not support the HTTP protocol version used in the \
      request.',
    name: 'HTTP Version Not Supported',
  },
  506: {
    message:
      'The content negotiation for the request results in a circular \
      reference.',
    name: 'Variant Also Negotiates',
  },
  507: {
    message:
      'The server is unable to store the representation needed to complete the \
      request.',
    name: 'Insufficient Storage',
  },
  508: {
    message:
      'The server detected an infinite loop while processing the request.',
    name: 'Loop Detected',
  },
  510: {
    message:
      'Further extensions to the request are required for the server to \
      fulfill it.',
    name: 'Not Extended',
  },
  511: {
    message: 'The client needs to authenticate to gain network access.',
    name: 'Network Authentication Required',
  },
} satisfies {
  [key in HttpErrorCodes]: {
    message: string;
    name: string;
  };
};
