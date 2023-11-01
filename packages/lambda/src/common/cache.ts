import { isSafeKey } from '../utils/object.js';

export interface ICache {
  /**
   * Retrieves an item from the cache. If the item has expired, or was not
   * found, `undefined` will be returned.
   * @param key the key of the item to retrieve
   * @template T the type of the item to retrieve
   * @returns the item `T` if found and not expired, otherwise `undefined`
   */
  getItem<T>(key: string): T | undefined;
  /**
   * Removes an item from the cache.
   * @param key the key of the item to remove.
   */
  removeItem(key: string): void;
  /**
   * Sets an item in the cache.
   * @template T the item to be stored in the cache.
   * @param key a string key identifier for the item to be stored.
   * @param value a value of type `T` to be stored in the cache.
   * @param ttl an override value from the default time to live for this item in
   * milliseconds. If `false`, the item will not be saved in the store and the
   * call will be a no-op. If `0`, the item will be saved in the store and never
   * expire.
   * @returns `true` if the item was saved, otherwise `false`.
   */
  setItem<T>(key: string, value: T, ttl?: false | number): boolean;
}
export type CacheConfig = {
  /**
   * Will avoid performing structured clones when retrieving items from the
   * cache.
   * @default false
   */
  avoidClones?: boolean;
  /**
   * the interval in milliseconds to prune expired items from the cache. If
   * `false` or `0`, no pruning will occur.
   * @default 60_000
   */
  pruneInterval?: false | number;
  /**
   * The type of store to use for the cache. If `map`, a `Map` will be used.
   * Otherwise, a plain object will be used.
   * @default 'map'
   */
  storeType?: 'map' | 'object';
  /**
   * The default time to live for items in the cache in milliseconds.
   * @default 10_000
   */
  ttl?: number;
};

type StoredItem = {
  exp: number;
  val: unknown;
};
/**
 * A minimalistic in-memory cache for storing values in handlers and helpers.
 * Disallows storing otherwise sensitive keys relating to prototypes.
 */
export class Cache implements ICache {
  protected config: Required<CacheConfig>;
  protected store: Map<string, unknown> | Record<string, unknown>;

  /**
   *
   * @param config the configuration for the cache
   * @param config.avoidClones will avoid performing structured clones when
   * retrieving items from the cache.
   * @param config.pruneInterval the interval in milliseconds to prune expired
   * items from the cache. If `false` or `0`, no pruning will occur.
   * @param config.storeType the type of store to use for the cache. If `map`,
   * a `Map` will be used. Otherwise, a plain object will be used.
   * @param config.ttl the default time to live for items in the cache in
   * milliseconds.
   */
  constructor(config?: CacheConfig) {
    this.config = {
      avoidClones: config?.avoidClones ?? false,
      pruneInterval: config?.pruneInterval ?? 60_000,
      storeType: config?.storeType ?? 'map',
      ttl: config?.ttl ?? 10_000,
    };

    this.store =
      this.config.storeType === 'map' ? new Map() : Object.create(null);

    if (this.config.pruneInterval) {
      setInterval(this.maintenance.bind(this), this.config.pruneInterval);
    }
  }

  /**
   * Internal method to delete an item from the store.
   * @param key the key of the item to delete
   */
  private delete(key: string): void {
    if (this.config.storeType === 'map') {
      (this.store as Map<string, unknown>).delete(key);
    }

    // eslint-disable-next-line security/detect-object-injection
    delete (this.store as Record<string, unknown>)[key];
  }

  /**
   * Internal method to loop through the store and delete expired items.
   */
  private maintenance(): void {
    const now = Date.now();
    if (this.config.storeType === 'map') {
      (this.store as Map<string, StoredItem>).forEach((value, key) => {
        if (value.exp && value.exp < now) this.delete(key);
      });
      return;
    }

    Object.entries(this.store as Record<string, StoredItem>).forEach(
      ([key, value]) => {
        if (value.exp < now) this.delete(key);
      }
    );
  }

  /**
   * Internal method to retrieve a `StoredItem` from the Map or Object store.
   * @param key the key of the item to retrieve
   * @returns the wrapped `StoredItem` object, if it exists, regardless of
   * expiration status.
   */
  private retrieve(key: string): StoredItem | undefined {
    return this.config.storeType === 'map'
      ? (this.store as Map<string, StoredItem>).get(key)
      : // eslint-disable-next-line security/detect-object-injection
        (this.store as Record<string, StoredItem>)[key];
  }

  /**
   * Internal method to package a cache-able item in a `StoredItem` wrapper.
   * @template T the type of the item to be stored
   * @param key the key of the item to be stored
   * @param value the value of the item to be stored
   * @param ttl the time to live for the item in milliseconds
   */
  private set<T>(key: string, value: T, ttl: number): void {
    const exp = !ttl ? 0 : Date.now() + ttl;
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

    return this.config.avoidClones || typeof wrappedValue.val !== 'object'
      ? (wrappedValue.val as T)
      : structuredClone(wrappedValue.val as T);
  }

  public removeItem(key: string): void {
    if (!isSafeKey(key)) return;

    this.delete(key);
  }

  public setItem<T>(
    key: string,
    value: T,
    ttl: false | number = this.config.ttl
  ): boolean {
    if (!isSafeKey(key) || ttl === false) return false;

    this.set(key, value, ttl);
    return true;
  }
}
