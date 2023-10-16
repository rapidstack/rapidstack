// WIP
export class Cache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: Record<string, any> = {};
  constructor() {}

  private isValidKey(key: string): boolean {
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

  public getItem<T>(key: string): T | undefined {
    return Object.assign({}, this.store[key]);
  }

  public removeItem(key: string): void {
    if (!this.isValidKey(key)) return;

    // eslint-disable-next-line security/detect-object-injection
    delete this.store[key];
  }

  public setItem<T>(key: string, value: T, ttl: number): boolean {
    if (!this.isValidKey(key)) return false;

    // eslint-disable-next-line security/detect-object-injection
    this.store[key] = value;
    return true;
  }
}
