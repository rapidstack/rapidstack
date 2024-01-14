/**
 * Attempts to determine if a passed function is one that can be instantiated
 * with the `new` keyword.
 * @param fn the function to test.
 * @returns the resulting boolean test.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function isConstructable(fn?: any): fn is { new (...args: any[]): any } {
  return !!fn && !!fn.prototype && !!fn.prototype.constructor;
}
