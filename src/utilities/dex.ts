import { isFunction, isNumber, isObject, isString, isUnique } from "./validators";

/**
 * A hash key for a dex item.
 */
export type HashKey = string | number | symbol;

/**
 * The base type for a Dex; a collection of items indexed by tags.
 */
export type TDex<TValue> = {

  /**
   * Used to get all the unique values in one array.
   */
  get values(): Array<TValue>;

  /**
   * Used to get all the tags(keys) in one array
   */
  get keys(): Set<string>;

  /**
   * Used to get all the unique hash keys in one array.
   */
  get hashes(): Set<HashKey>

  /**
   * Get a value by it's unique hash key
   */
  get(key: HashKey): TValue

  /**
   * Used to get tags for all or specific target values
   */
  tags(
    forTarget?: TValue | ((value: TValue) => boolean)
  ): Set<string>;
  
  /**
   * Add an empty tag, or a value with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    value: TValue | string,
    ...tags: Array<string>
  ): HashKey;
  
  /**
   * Remove values from the dex.
   */
  remove(
    target: TValue | ((value: TValue, tag?: string) => boolean),
    removeEmptiedTags?: boolean
  ): number;
  
  /**
   * Remove whole tags from the dex.
   * 
   * @returns A set of the effected values.
   */
  drop(
    ...tags: Array<string>
  ): Set<TValue>

  /**
   * Drop all tags and values at once.
   */
  clear(): void;
} & {

  /**
   * The tagged values are stored by index in arrays for easy access and manipulation.
   */
  readonly [tag: string]: ReadonlyArray<TValue>;
}

/**
 * A collection of values indexed by various custom tags.
 */
export default class Dex<TValue> implements TDex<TValue> {
  /** @ts-expect-error index issue from type */
  private readonly _allTags
    = new Set<string>();
  /** @ts-expect-error index issue from type */
  private readonly _valuesByTag
    : Record<string, Set<HashKey>>
    = {};
    /** @ts-expect-error index issue from type */
  private readonly _tagsByValueHash
    : Record<HashKey, Set<string>>
    = {}; 
    /** @ts-expect-error index issue from type */
  private readonly _valuesByHash
    : Record<HashKey, TValue>
    = {}; 

  //#region Get
  
  readonly [tag: string]: ReadonlyArray<TValue>;

  get values()
    : Array<TValue> {
    return Object.values(this._valuesByHash);
  }

  /** @ts-expect-error index issue from type */
  get hashes()
    : Set<HashKey> {
    return new Set(Object.keys(this._tagsByValueHash));
  }

  /** @ts-expect-error index issue from type */
  get keys()
    : Set<string> {
    return new Set(this._allTags);
  }

  /** @ts-expect-error index issue from type */
  get = (key: HashKey)
    : TValue => this._valuesByHash[key];

  /** @ts-expect-error index issue from type */
  tags(
    forTarget?: TValue | ((value: TValue) => boolean)
  ): Set<string> {
    if (forTarget === undefined) {
      return this.keys;
    }

    if (isFunction(forTarget)) {
      const set = new Set<string>();
      Object.keys(this._valuesByHash).forEach(hash => {
        if (forTarget(this._valuesByHash[hash])) {
          this._tagsByValueHash[hash].forEach(set.add);
        }
      });

      return set;
    } else {
      const hash: HashKey = Dex.hash(forTarget)!;
      return new Set(this._tagsByValueHash[hash]);
    }
  }

  //#endregion

  /** @ts-expect-error index issue from type */
  add(
    value: TValue | string,
    ...tags: Array<string>
  ): HashKey {
    const hash: HashKey | undefined = Dex.hash(value);

    if (hash === undefined) {
      throw new Error(`Invalid item id/hash for item of type: ${typeof value}, being added to a dex.`);
    }
    
    // if we're only provided a string argument, then it's just for an empty tag group:
    if (!tags?.length && typeof value === 'string') {
      // add the new empty tag group:
      this._allTags.add(value);
      if (!this._valuesByTag[value]) {
        this._valuesByTag[value] = new Set<HashKey>();
      }
      
      this._updateIndex(value);
      return value;
    } // if we have tags howerver~
    else {
      const uniqueTags = new Set<string>(tags);
      
      // set the values by tag.
      uniqueTags.forEach(t => {
        this._allTags.add(t);
        if (this._valuesByTag[t]) {
          this._valuesByTag[t].add(hash);
        } else {
          this._valuesByTag[t] = new Set<HashKey>([hash]);
        }

        this._updateIndex(t);
      });

      // set the tags by value
      const currentTags = this._tagsByValueHash[hash];
      if (currentTags) {
        uniqueTags.forEach(this._tagsByValueHash[hash].add);
      } else {
        this._tagsByValueHash[hash] = uniqueTags;
      }

      // set the hash key
      this._valuesByHash[hash] = value as TValue;

      return hash;
    }
  }

  /** @ts-expect-error index issue from type */
  remove(
    target: TValue | ((value: TValue, tag?: string) => boolean),
    removeEmptiedTags: boolean = true
  ): number {
    let removedCount = 0;
    const emptiedTags: Set<string> = new Set();
    this._allTags.forEach(t => {
      const valuesForTag = this._valuesByTag[t].toArray();
      // remove the matching values for this tag
      valuesForTag.remove(
        isFunction(target)
          ? (e) => target(this._valuesByHash[e], t)
          : Dex.hash(target)!,
        (removed: TValue) => {
          // then remove the tag for the value
          const removedValueHash = Dex.hash(removed)!;
          this._tagsByValueHash[removedValueHash].delete(t);

          // remove values with no remaining tags:
          if (!this._tagsByValueHash[removedValueHash].size) {
            delete this._tagsByValueHash[removedValueHash];
            delete this._valuesByHash[removedValueHash];
            removedCount++;
          }
        }
      );

      this._valuesByTag[t] = new Set(valuesForTag);
      
      if (valuesForTag.length === 0) {
        emptiedTags.add(t);
      }

      this._updateIndex(t);
    });

    if (removeEmptiedTags) {
      this.drop(...emptiedTags);
    }

    return removedCount;
  }

  /** @ts-expect-error index issue from type */
  drop(
    ...tags: Array<string>
  ): Set<TValue> {
    const effectedValues = new Set<TValue>;
    tags.forEach(t => {
      if (this._allTags.delete(t)) {
        this._valuesByTag[t].forEach(hash => {
          // mark the value as effected
          effectedValues.add(this._valuesByHash[hash]);

          // remove for the value
          this._tagsByValueHash[hash].delete(t);

          // if there's no tags left for the given value"
          if (!this._tagsByValueHash[hash].size) {
            delete this._tagsByValueHash[hash];
            delete this._valuesByHash[hash];
          }
        });

        // remove all the tag values
        delete this._valuesByTag[t];
      }
      
      this._updateIndex(t);
    });

    return effectedValues;
  }

  /** @ts-expect-error index issue from type */
  clear(): void {
    this.drop(...this._allTags);
  }

  /**
   * Get a dex's hash key for any type of value.
   */
  public static hash = (value: string | any)
    : HashKey | undefined =>
    isUnique(value)
      ? value.id
      : isString(value) || isNumber(value) || typeof value === 'symbol'
        ? value
        : isObject(value)
          ? value.uuid
          : undefined;

  /** @ts-expect-error index issue from type */
  private _updateIndex(forTag: string) {
    if (!this._allTags.has(forTag)) {
      /* @ts-expect-error set here only */
      delete this[forTag];
    }

    /* @ts-expect-error set here only */
    this[forTag]
      = this._valuesByTag
        [forTag]
        .toArray()
        .map(hash =>
          this._valuesByHash[hash]);
  }
}