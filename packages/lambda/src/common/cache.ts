// WIP

import { isSafeKey } from '../utils/object.js';

export interface ICache {
  getItem<T>(key: string): T | undefined;
  removeItem(key: string): void;
  setItem<T>(key: string, value: T, ttl?: false | number): boolean;
}
export interface ICacheConfig {
  avoidClones?: boolean;
  pruneInterval?: false | number;
  storeType?: 'map' | 'object';
  ttl?: number;
}

type StoredItem = {
  exp: number;
  val: unknown;
};
export class Cache implements ICache {
  protected config: Required<ICacheConfig>;
  protected store: Map<string, unknown> | Record<string, unknown>;

  constructor(config?: ICacheConfig) {
    this.config = {
      avoidClones: config?.avoidClones ?? true,
      pruneInterval: config?.pruneInterval ?? 60_000,
      storeType: config?.storeType ?? 'map',
      ttl: config?.ttl ?? 10_000,
    };

    this.store =
      this.config.storeType === 'map' ? new Map() : Object.create(null);

    if (this.config.pruneInterval) {
      setInterval(this.maintenance, this.config.pruneInterval);
    }
  }

  private delete(key: string): void {
    if (this.config.storeType === 'map') {
      (this.store as Map<string, unknown>).delete(key);
    }

    // eslint-disable-next-line security/detect-object-injection
    delete (this.store as Record<string, unknown>)[key];
  }

  private maintenance(): void {
    const now = Date.now();
    if (this.config.storeType === 'map') {
      (this.store as Map<string, StoredItem>).forEach((value, key) => {
        if (value.exp < now) this.delete(key);
      });
      return;
    }

    Object.entries(this.store as Record<string, StoredItem>).forEach(
      ([key, value]) => {
        if (value.exp < now) this.delete(key);
      }
    );
  }

  private retrieve(key: string): StoredItem | undefined {
    return this.config.storeType === 'map'
      ? (this.store as Map<string, StoredItem>).get(key)
      : // eslint-disable-next-line security/detect-object-injection
        (this.store as Record<string, StoredItem>)[key];
  }

  private set<T>(key: string, value: T, ttl: number): void {
    const exp = Date.now() + ttl;
    const wrappedValue = { exp, val: value };
    if (this.config.storeType === 'map') {
      (this.store as Map<string, StoredItem>).set(key, wrappedValue);
      return;
    }

    // eslint-disable-next-line security/detect-object-injection
    (this.store as Record<string, StoredItem>)[key] = wrappedValue;
  }

  public getItem<T>(key: string): T | undefined {
    if (!isSafeKey(key)) return;

    const wrappedValue = this.retrieve(key);
    if (!wrappedValue) return;

    if (wrappedValue.exp && wrappedValue.exp < Date.now()) {
      this.removeItem(key);
      return;
    }

    return this.config.avoidClones
      ? (wrappedValue.val as T)
      : structuredClone(wrappedValue.val as T);
  }

  public removeItem(key: string): void {
    if (!isSafeKey(key)) return;

    this.delete(key);
  }

  public setItem<T>(key: string, value: T, ttl?: false | number): boolean {
    if (!isSafeKey(key) || ttl === false) return false;

    this.set(key, value, ttl ?? this.config.ttl);
    return true;
  }
}
