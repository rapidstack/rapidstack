export class HandlerExecuteError extends Error {
  constructor(message: string) {
    super(`HandlerExecuteError: ${message}`);
    this.name = 'HandlerExecuteError';
  }
}
export class RouteNotFoundError extends Error {
  constructor(route: string) {
    super(
      `RouteNotFoundError: A route handler matching the route [${route}] was \
      not found.`
    );
    this.name = 'RouteNotFoundError';
  }
}
