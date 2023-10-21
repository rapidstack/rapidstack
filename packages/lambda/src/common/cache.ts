// WIP+

import { isSafeKey } from '../utils/object.js';

export interface ICache {}
export class Cache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected store: Record<string, any> = Object.create(null);
  constructor() {}

  public getItem<T>(key: string): T | undefined {
    if (!isSafeKey(key)) return;
    return structuredClone(this.store[key]);
  }

  public removeItem(key: string): void {
    if (!isSafeKey(key)) return;

    // eslint-disable-next-line security/detect-object-injection
    delete this.store[key];
  }

  public setItem<T>(key: string, value: T, ttl: number): boolean {
    if (!isSafeKey(key)) return false;

    // eslint-disable-next-line security/detect-object-injection
    this.store[key] = value;
    return true;
  }
}
