/**
 * An error to be thrown if a lambda handler internally fails in execution.
 * _(to be implemented in custom handlers)_
 */
export class HandlerExecuteError extends Error {
  /**
   * @param message the message to be displayed with the error
   */
  constructor(message: string) {
    super(`${message}`);
    this.name = 'HandlerExecuteError';
  }
}
/**
 * An error to be thrown if a lambda handler handling HTTP requests fails to
 * find a valid route.
 */
export class RouteNotFoundError extends Error {
  /**
   * @param route the route that was not found
   */
  constructor(route: string) {
    super(`A route handler matching the route [${route}] was not found.`);
    this.name = 'RouteNotFoundError';
  }
}
