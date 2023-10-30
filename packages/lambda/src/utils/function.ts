/**
 * Attempts to determine if a passed function is one that can be invoked with
 * the `new` keyword.
 * @param fn The function to test.
 * @returns The resulting boolean test.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function isConstructable(fn?: any): fn is { new (...args: any[]): any } {
  return !!fn && !!fn.prototype && !!fn.prototype.constructor;
}
