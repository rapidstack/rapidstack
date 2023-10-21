/**
 * Function to determine if string property is not a well known key on an object
 * that could be used to break then functionality of an object, inject malicious
 * code, or obtain unintended server-side in the case of reading or writing to
 * an object with `object[dynamicKey]` syntax.
 * @param key the key to test
 * @returns true if the key is valid
 */
export function isSafeKey(key: string): boolean {
  return !(
    key === '__defineGetter__' ||
    key === '__defineSetter__' ||
    key === '__lookupGetter__' ||
    key === '__lookupSetter__' ||
    key === '__proto__' ||
    key === 'constructor' ||
    key === 'isPrototypeOf' ||
    key === 'prototype' ||
    key === 'toString' ||
    key === 'toLocaleString' ||
    key === 'valueOf'
  );
}
