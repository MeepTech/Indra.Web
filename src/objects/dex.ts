import { BREAK, LoopBreak } from "../utilities/shared";
import {
  isArray,
  isFunction,
  isNumber,
  isObject,
  isString,
  isSymbol,
  isUnique
} from "../utilities/validators";
import IUnique from "./unique";

/**
 * A hash key for a dex item.
 */
export type HashKey = string | number | symbol;

/**
 * A Tag for a dex.
 */
export type Tag = string | symbol | number;

/**
 * Valid entry types.
 */
export type Entry
  = string
  | number
  | symbol
  | Function
  | Array<unknown>
  | {}
  | Object
  | object
  | { [k: string]: unknown }
  | IUnique

//#region Queries

/**
 * Options for Dex queries like the select function.
 */
export enum Flags {

  /**
   * Must match all provided values with no other options.
   */
  Strict = 0,

  /**
   * Indicates the Query can match one of any of the provided options instead of needing to match all of them.
   */
  Or = 1,

  /**
   * Same as Strict but can be combined with other options.
   */
  And = 2,

  /**
   * Indicates the Query should return after it's found the first item.
   */
  First = 4,

  /**
   * Indicates the Query should return results that don't match instead of do match.
   */
  Not = 8,

  /**
   * Returns the results as a dex for chaining.
   */
  Chain = 16
}

/**
 * Represents a special kind of query that selects and returns a sub-Dex
 */
interface Query<
  TEntry extends Entry,
  ReturnType
  extends QueryResultType
  = QueryResultType.Dex
> extends QueryMethods<TEntry, ReturnType> {
  not: Query<TEntry>;
  and: Query<TEntry>;
  or: Query<TEntry>;
  first: Query<TEntry, QueryResultType.Single>;
}

interface QueryMethods<TEntry extends Entry, ResultType extends QueryResultType = QueryResultType.Dex> {
  (tags: Tag[] | Tag, additionalTags?: Tag | Tag[]): QueryResult<TEntry, ResultType>
  (options?: Flags, tags?: Tag[]): QueryResult<TEntry, ResultType>
  (options?: Flags, ...tags: Tag[]): QueryResult<TEntry, ResultType>
}

/**
 * The results of a query.
 */
type QueryResult<TEntry extends Entry, ResultType extends (QueryResultType | Flags) = QueryResultType.Dex>
  = ResultType extends Flags
  ? ResultType extends Flags.Chain
  ? Dex<TEntry>
  : ResultType extends Flags.First
  ? TEntry
  : TEntry[]
  : ResultType extends QueryResultType.Dex
  ? Dex<TEntry>
  : ResultType extends QueryResultType.Array
  ? TEntry[]
  : TEntry;

/**
 * How results can be returned from a dex query
 */
const enum QueryResultType {
  /**
   * For when a full Dex is returned
   */
  Dex,

  /**
   * For when an array of entries is returned
   */
  Array,

  /**
   * For single/first returns
   */
  Single
}

//#endregion

//#region Access Helper Objects

/**
 * A set of tags from a tag query.
 * 
 * Has some extra filtering options.
 */
interface TagSet<TForEntry> extends Readonly<Omit<Set<Tag>, 'add' | 'delete' | 'clear'>> {

  /**
   * Fetch all the tags that match a given target.
   */
  for(
    // a target entry/value/object
    target?: TForEntry
      // filter for targets
      | ((entry: TForEntry) => boolean)
      // target entry's hash key
      | HashKey
  ): Set<Tag>
}

/**
 * Interface for the map helper object.
 */
interface MapHelper<TEntry> {

  /**
   * Get a map of the entries and their tags, or map all unique pairs to your own array of values.
   * 
   * @param transform The transform function. Takes every unique pair. If not provided, this returns a map of type Map<Entry, Tag[]>
   * @param outerLoopType The type to use in the outer loop. This is to help speed in certain cases where you want to break out of the loop early.
   * 
   * @returns A mapped array of values, or a Map<Entry, Tag[]> if no transform was provided.
   */
  <TResult = undefined>(
    transform?: (entry: TEntry, tag: Tag) => TResult | LoopBreak,
    outerLoopType?: 'entry' | 'tag'
  ): TResult extends undefined ? Map<TEntry, Set<Tag>> : TResult[]

  /**
   * Map all unique entries
   */
  entries: <TResult = TEntry>(
    transform?: (entry?: TEntry, tags?: Set<Tag>) => TResult | LoopBreak
  ) => TResult[];

  /**
   * Map all unique tags
   */
  tags: <TResult = Tag>(
    transform?: (tag?: Tag, entries?: Set<TEntry>) => TResult | LoopBreak
  ) => TResult[];
}

/**
 * Interface for the for helper object.
 */
interface ForHelper<TEntry> {

  /**
   * Do some logic for each unique tag-entry pair.
   * 
   * @param func The function to loop on each entry and tag pair
   * @param outerLoopType The type to use in the outer loop. This is to help speed in certain cases where you want to break out of the loop early.
   */
  (func: (entry: TEntry, tag: Tag) => void | LoopBreak | any,
    outerLoopType?: 'entry' | 'tag'
  ): void;

  /**
   * Do some logic for each unique tag.
   * 
   * @param func The function to loop on each tag
   */
  tags: (
    func: (tag: Tag, entries: Set<TEntry>) => void | LoopBreak | any
  ) => void;

  /**
   * Do some logic for each unique entry.
   * 
   * @param func The function to loop on each entry
   */
  entries: (
    func: (entry: TEntry, tags: Set<Tag>) => void | LoopBreak | any
  ) => void;
}

//#endregion

/**
 * A collection of unque entries, keyed by various custom tags.
 * 
 * This represents a many to many replationship of Tags to Entries.
 */
export default class Dex<TEntry extends Entry = Entry> {
  private _numberOfEntries
    : number = 0;
  private readonly _allTags
    = new Set<Tag>();
  private readonly _allHashes
    = new Set<HashKey>();
  private readonly _hashesByTag
    : Record<Tag, Set<HashKey>>
    = {};
  private readonly _tagsByEntryHash
    : Record<HashKey, Set<Tag>>
    = {};
  private readonly _entriesByHash
    : Record<HashKey, TEntry>
    = {};

  //#region Initialization

  /**
   * Make a new empty dex
   */
  constructor()

  /**
   * Make a new dex of just empty tags
   */
  constructor(values: Tag[])

  /**
   * Make a new dex of just empty tags
   */
  constructor(...values: [TEntry, ...Tag[]][])

  /**
   * Make a new dex of just empty tags
   */
  constructor(...values: [TEntry, Tag[]][])

  /**
   * Make a new dex from entries and tags. 
   * (it's not advised to use this ctor pattern for dexes that can store types that can be Tags as well)
   */
  constructor(values: [TEntry, ...Tag[]][])

  /**
   * Make a new dex from an array of entries with an array of tags.
   */
  constructor(values: [TEntry, (Tag[] | [])][])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(values: { entry?: TEntry, tags?: Tag[] | Tag | Set<Tag>, tag?: Tag }[])

  /**
   * Make a new dex from an object with entries and tags
   */
  constructor(...values: { entry?: TEntry, tags?: Tag[] | Tag | Set<Tag>, tag?: Tag }[])

  /**
   * Make a new dex from a map
   */
  constructor(values: (Map<TEntry, Set<Tag>> | Map<TEntry, Tag[]>))

  /**
   * Make a new dex
   */
  constructor(values?: (
    Array<
      [TEntry, ...Tag[]]
      | [TEntry, Tag[]]
      | { entry?: TEntry, tags?: Tag[] | Tag | Set<Tag>, tag?: Tag }
      | Tag
    > | Map<TEntry, Set<Tag>> 
      | Map<TEntry, Tag[]>
      | { entry?: TEntry, tags?: Tag[] | Tag | Set<Tag>, tag?: Tag }
  )) {
    if (values) {
      // if it's an array of values
      if (isArray(values)) {
        // entries with tags in an array
        if (isArray(values[0])) {
          values.forEach((entry, ...tags) => this.add(entry as TEntry, tags as Tag[]));
        } // entries with object keys
        else if (isObject(values[0]) && (values[0]?.hasOwnProperty("entry") || values[0]?.hasOwnProperty("tags") || values[0]?.hasOwnProperty("tag"))) {
          values.forEach(e => {
            this.add(
              ((e as any).entry as TEntry),
              ((e as any).tag as Tag[])
                || ((e as any).tags as Tag[] | Tag | Set<Tag>),
            );
          });
        }
        // just tags
        else {
          values.forEach((tag) => this.add(tag as Tag));
        }
      } // if it's a map of values
      else if (values instanceof Map) {
        values.forEach((t, e) => this.add(e, t));
      } // if it's a single object
      else {
        this.add(values.entry as TEntry, values.tags || values.tag);
      }
    }
  }

  //#endregion

  //#region Get

  //#region Properties

  /**
   * @alias {@link numberOfEntries}
   */
  get length()
    : number {
    return this._numberOfEntries;
  }

  /**
   * @alias {@link numberOfTags}
   */
  get size()
    : number {
    return this.numberOfTags;
  }

  /**
   * How many uniue entries  are in the dex
   */
  get numberOfEntries()
    : number {
    return this._numberOfEntries;
  }

  /**
   * How many uniue tags are in the dex
   */
  get numberOfTags()
    : number {
    return this._allTags.size;
  }

  /**
   * Used to get all the unique entries in one array.
   */
  get entries()
    : TEntry[] {
    return Object.values(this._entriesByHash);
  }

  /**
   * Used to get all the unique hash keys in one set.
   */
  get hashes()
    : Readonly<Omit<Set<HashKey>, 'add' | 'delete' | 'clear'>> {
    return this._allHashes;
  }

  //#endregion

  /**
   * Check if this contains the given entry
   */
  contains(entry: TEntry | HashKey): boolean {
    return this._allHashes.has(Dex.hash(entry)!);
  }

  /**
   * Check if this has a given tag.
   */
  has(tag: Tag): boolean {
    return this._allTags.has(tag);
  }

  /**
   * Get a entry by it's unique hash key
   */
  get(key: HashKey): TEntry {
    return this._entriesByHash[key];
  }

  /**
   * Used to all tags, or tags for specific target entries
   */
  tags: TagSet<TEntry>
    = this._tagSetConstructor(this._allTags);

  //#region Looping and Mapping

  /**
   * Quick access to the foreach loops.
   * for() = forEach()
   * for.entries() = forEachEntry()
   * for.tags() = forEachTag()
   */
  for: ForHelper<TEntry>
    = this._forObjectConstructor();

  /**
   * For each unique entry and tag pair.
   * 
   * @param func 
   */
  forEach(
    func: (entry: TEntry, tag: Tag) => void | LoopBreak | any,
    outerLoopType: 'entry' | 'tag' = 'entry'
  ): void {
    if (outerLoopType === 'tag') {
      for (const tag of this._allTags) {
        for (const hash of this._hashesByTag[tag]) {
          if (func(this._entriesByHash[hash], tag) === BREAK) {
            break;
          }
        }
      }
    } else {
      for (const hash of this._allHashes) {
        for (const tag of this._tagsByEntryHash[hash]) {
          if (func(this._entriesByHash[hash], tag) === BREAK) {
            break;
          }
        }
      }
    }
  }

  /**
   * Iterate logic on each tag in the dex.
   */
  forEachTag(
    func: (tag: Tag, entries: Set<TEntry>) => void | LoopBreak | any
  ): void {
    for (const tag of this._allTags) {
      if (func(tag, this._hashesByTag[tag].map(h => this._entriesByHash[h])) === BREAK) {
        break;
      }
    }
  }

  /**
   * Iterate logic on each entry in the dex.
   */
  forEachEntry(
    func: (entry: TEntry, tags: Set<Tag>) => void | LoopBreak | any
  ): void {
    for (const hash of this._allHashes) {
      if (func(this._entriesByHash[hash], this._tagsByEntryHash[hash]) === BREAK) {
        break;
      }
    }
  }

  /**
   * Quick access to the foreach loops.
   * map() = mapAllPairs()
   * map.entries() = toArray()
   * map.tags() = splay()
   */
  map = this._getMap();
  _getMap(): MapHelper<TEntry> {
    return this._mapObjectConstructor();
  }

  /**
   * Get a map of the entries and their tags, or map all unique pairs to your own array of values.
   * 
   * @param transform The transform function. Takes every unique pair. If not provided, this returns a map of type Map<Entry, Tag[]>
   * @param outerLoopType The type to use in the outer loop. This is to help speed in certain cases where you want to break out of the loop early.
   * 
   * @returns A mapped array of values, or a Map<Entry, Tag[]> if no transform was provided.
   */
  toMap<TResult = undefined>(
    transform?: (entry: TEntry, tag: Tag) => TResult | LoopBreak,
    outerLoopType: 'entry' | 'tag' = 'entry'
  ): (TResult extends undefined ? Map<Entry, Tag[]> : TResult[]) {
    if (!transform) {
      return new Map<TEntry, Tag[]>() as any;
    }

    const results: TResult[] = [];
    this.forEach((e, t) => {
      const result = transform(e, t);
      if (result === BREAK) {
        return result;
      }

      results.push(result);
    }, outerLoopType);

    return results as any;
  }

  /**
   * Map this dex's entries to an array.
   */
  toArray<TResult = TEntry>(
    transform?: (entry?: TEntry, tags?: Set<Tag>) => TResult | LoopBreak
  ): TResult[] {
    if (!transform) {
      return this.entries as any as TResult[];
    }

    const results: TResult[] = [];
    this.forEachEntry((e, t) => {
      const result = transform(e, t);
      if (result === BREAK) {
        return result;
      }

      results.push(result);
    });

    return results;
  }

  /**
   * Splay//map this dex's tags into an array.
   */
  splay<TResult>(
    transform?: (tag?: Tag, entries?: Set<TEntry>) => TResult | LoopBreak
  ): TResult[] {
    if (!transform) {
      return this.tags as any as TResult[];
    }

    const results: TResult[] = [];
    this.forEachTag((t, e) => {
      const result = transform(t, e);
      if (result === BREAK) {
        return result;
      }

      results.push(result);
    });

    return results;
  }

  //#endregion

  //#region Queries

  //#region Return Any Type

  /**
   * Get an array of all entries that strictly match a given set of tags.
   */
  query(
    tags: string | string[],
    anotherTag?: string
  ): TEntry[];

  /**
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   * 
   * @returns An array of entries(using find => values), unless the Chain flag is provided; then it instead returns a Dex of entries (using find => fitler).
   */
  query<TFlags extends Flags>(
    options?: TFlags,
    ...tags: string[]
  ): QueryResult<TFlags>;

  /**  
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   * 
   * @returns An array of entries(using find => values), unless the Chain flag is provided; then it instead returns a Dex of entries (using find => fitler).
   */
  query<TFlags extends Flags>(
    options?: TFlags,
    tags?: string[]
  ): QueryResult<TFlags>;

  /**
   * Get an array of all entries that strictly match a given set of tags.
   */
  query(
    tags: Tag | Tag[],
    anotherTag?: Tag
  ): TEntry[];

  /**
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   * 
   * @returns An array of entries(using find => values), unless the Chain flag is provided; then it instead returns a Dex of entries (using find => fitler).
   */
  query<TFlags extends Flags>(
    options?: TFlags,
    ...tags: Tag[]
  ): QueryResult<TFlags>;

  /**  
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   * 
   * @returns An array of entries(using find => values), unless the Chain flag is provided; then it instead returns a Dex of entries (using find => fitler).
   */
  query<TFlags extends Flags>(
    options?: TFlags,
    tags?: Tag[]
  ): QueryResult<TFlags>;

  /**
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   * 
   * @returns An array of entries(using find => values), unless the Chain flag is provided; then it instead returns a Dex of entries (using find => fitler).
   */
  query<TFlags extends Flags>(
    tagsOrOptions?: Tag | TFlags | Tag[],
    additionalTags?: Tag[] | Tag
  ): Dex<TEntry> | TEntry[] | TEntry {
    return this._splitForTagsOrOptions<QueryResultType.Array | QueryResultType.Dex | QueryResultType.Single>(
      this.filter,
      tagsOrOptions,
      additionalTags
    );
  }

  /**
   * Get an array or dex of all entries that match a given set of tags and the optionally provided settings.
   * (This is a less versitile version of query)
   * 
   * @returns An array of entries(using find => values), unless the Chain flag is provided; then it instead returns a Dex of entries (using find => fitler).
   */
  filter(tags?: Tag[], options?: Flags): TEntry[] | Dex<TEntry> {
    if ((options ?? Flags.Strict) & Flags.Chain) {
      return this.select(options, tags);
    }

    return this.values(options, tags);
  }

  //#endregion

  //#region Return Chainable Dex

  /**
   * Query for a new dex that is a sub-set of the items from this dex match the query.
   * 
   * @param tagsOrOptions A tag or tags to match
   *   , or the QueryFlags for this query. (QueryFlags defaults to Strict(0) if not provided) 
   */
  select
    : Query<TEntry>
    = this._addSubQueries(
      (a, b) => this._splitForTagsOrOptions(this.with, a, b)
    );

  /**
   * Returns a new dex filtered by the given tags and options.
   * Similar to select, but without sub-methods and less versitile.
   * 
   */
  with(tags?: Array<Tag>, options?: Flags): Dex<TEntry> {
    new Dex<TEntry>();
    const values = this.values(options, tags);
  }

  not(
    tagOrOptions: Flags | Tag,
    ...additionalTags: Array<Tag>
  ): TEntry {

  }

  and(
    tagOrOptions: Flags | Tag,
    ...additionalTags: Array<Tag>
  ): TEntry {

  }

  //#endregion

  //#region Return Array of Entries

  /**
   * Used to get all the matching values into an array.
   */
  values(
    tags?: Tag | Tag[],
    anotherTag?: Tag
  ): TEntry[];

  /**
   * Used to get all the matching values into an array.
   */
  values(
    options?: Flags,
    ...tags: Tag[]
  ): TEntry[];

  /**
   * Used to get all the matching values into an array.
   */
  values(
    options?: Flags,
    tags?: Tag[]
  ): TEntry[];

  values(
    tagsOrOptions?: Tag | Flags | Tag[],
    additionalTags?: Tag[] | Tag
  ): TEntry[] {
    if (!tagsOrOptions) {
      return this.entries;
    }

    return this._splitForTagsOrOptions<QueryResultType.Array>(
      (tags, options) => {
        options ??= Flags.Strict;
        const values: TEntry[] = [];

        if (options === Flags.Strict) {

        }

        if (options & Flags.Not) {

        } else {

        }

        return values;
      },
      tagsOrOptions,
      additionalTags
    );
  }

  //#endregion

  //#region Return Single value

  first(
    tagOrOptions: Flags | Tag,
    ...additionalTags: Array<Tag>
  ): TEntry {

  }

  any(
    tagOrOptions: Flags | Tag,
    ...additionalTags: Array<Tag>
  ): boolean {

  }

  count(
    tagOrOptions: Flags | Tag,
    ...additionalTags: Array<Tag>
  ): number {

  }

  //#endregion

  //#endregion

  //#endregion

  //#region Modify

  /**
   * Add an empty tag, or a entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    entry: TEntry | Tag,
    ...tags: Tag[]
  ): void;

  /**
   * Add an empty tag, or a entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    entry: TEntry | Tag,
    tags?: Tag[] | Set<Tag> | Tag
  ): void;

  /**
   * Add an empty tag, or a entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    entry: TEntry | Tag,
    tag?: Tag
  ): void

  /**
   * Add an empty tag, or a entry with any number of tags to the dex
   *
   * @returns The uniqueid/hash of the item added to the dex
   * , or if just an empty tag was added: just the name of the tag is returned.
   */
  add(
    entry: TEntry | Tag,
    tags?: Tag[] | Tag | Set<Tag>
  ): HashKey {
    const hash: HashKey | undefined = Dex.hash(entry);

    if (hash === undefined) {
      throw new Error(`Invalid item id/hash for item of type: ${typeof entry}, being added to a dex.`);
    }

    if (!isArray(tags) && !(tags instanceof Set)) {
      tags = tags ? [tags] : [];
    }

    // if we're only provided a string argument, then it's just for an empty tag group:
    if ((tags instanceof Set ? !tags.size : !tags?.length) && (isSymbol(entry) || isString(entry) || isNumber(entry))) {
      // add the new empty tag group:
      this._allTags.add(entry);
      if (!this._hashesByTag[entry]) {
        this._hashesByTag[entry] = new Set<HashKey>();
      }

      this._updateIndex(entry);
      return entry;
    } // if we have tags howerver~
    else {
      const uniqueTags = new Set<Tag>(tags);

      // set the entries by tag.
      uniqueTags.forEach(t => {
        this._allTags.add(t);
        if (this._hashesByTag[t]) {
          this._hashesByTag[t].add(hash);
        } else {
          this._hashesByTag[t] = new Set<HashKey>([hash]);
        }

        this._updateIndex(t);
      });

      // set the tags by entry's hash
      const currentTags = this._tagsByEntryHash[hash];
      if (currentTags) {
        uniqueTags.forEach(currentTags.add);
      } else {
        this._tagsByEntryHash[hash] = uniqueTags;
      }

      // set the hash key
      if (!this._allHashes.has(hash)) {
        this._allHashes.add(hash);
        this._entriesByHash[hash] = entry as TEntry;
        this._numberOfEntries++;
      }

      return hash;
    }
  }

  /**
   * Remove entries from the dex.
   */
  remove(
    target: TEntry
      | ((entry?: TEntry, tag?: Tag) => boolean)
      | HashKey,
    cleanEmptyTags: boolean = false
  ): number {
    let removedCount = 0;
    const emptiedTags: Set<Tag> = new Set();
    // if it's a function we need to check all entries for all tags.
    if (isFunction(target)) {
      this._allTags.forEach(t => {
        const entriesForTag = this._hashesByTag[t].toArray();
        // remove the matching entries for this tag
        entriesForTag.remove(
          isFunction(target)
            ? (e) => target(this._entriesByHash[e], t)
            : Dex.hash(target)!,
          (removed: TEntry) => {
            // then remove the tag for the entry
            const removedEntryHash = Dex.hash(removed)!;
            this._tagsByEntryHash[removedEntryHash].delete(t);

            // remove entries with no remaining tags:
            if (!this._tagsByEntryHash[removedEntryHash].size) {
              this._removeItemAt(removedEntryHash);
              removedCount++;
            }
          }
        );

        if (entriesForTag.length === 0) {
          emptiedTags.add(t);
        } else {
          this._hashesByTag[t] = new Set(entriesForTag);
        }

        this._updateIndex(t);
      });
    } // remove by match/hash
    else {
      const hash = Dex.hash(target)!;
      const effectedTags = this._tagsByEntryHash[hash];
      if (effectedTags) {
        effectedTags.forEach(t => {
          this._hashesByTag[t].delete(hash);
          if (!this._hashesByTag[t].size) {
            emptiedTags.add(t);
          }
        });
        this._removeItemAt(hash);
      }
    }

    if (cleanEmptyTags) {
      this.drop(...emptiedTags);
    }

    return removedCount;
  }

  /**
   * Used to remove all empty tags.
   */
  clean(): TEntry[];

  /**
   * Used to remove tags without dropping related items.
   */
  clean(...tags: Tag[]): void;

  clean(...tags: Tag[]): TEntry[] | void {
    if (!tags?.length) {

    } else {
      const effectedEntries = [];
      tags.forEach(tag => {
        if (this.has(tag) && this._hashesByTag[tag].size) {

        }
      });

    }
  }


  /**
   * Removes the matching items from this dex and cleans up all emtpy tags and values.
   */
  reduce(
    tagsOrOptions?: Tag | Flags | Tag[],
    additionalTags?: Tag[] | Tag
  ): this {
    //this.drop(...tags);

    return this;
  }

  /**
   * Remove whole tags from the dex, and any entries under them that have no remaining tags.
   * 
   * @returns A set of the effected entries.
   */
  drop(
    ...tags: Array<Tag>
  ): Set<TEntry> {
    const effectedEntries = new Set<TEntry>;
    tags.forEach(t => {
      if (this._allTags.delete(t)) {
        this._hashesByTag[t].forEach(hash => {
          // mark the entry as effected
          effectedEntries.add(this._entriesByHash[hash]);

          // remove for the entry
          this._tagsByEntryHash[hash].delete(t);

          // if there's no tags left for the given entry"
          if (!this._tagsByEntryHash[hash].size) {
            this._removeItemAt(hash);
          }
        });

        // remove all the tag entries
        delete this._hashesByTag[t];
      }

      this._updateIndex(t);
    });

    return effectedEntries;
  }

  /**
   * Drop all tags and entries at once.
   */
  clear(): void {
    this.drop(...this._allTags);
  }

  private _removeItemAt(hash: HashKey) {
    delete this._tagsByEntryHash[hash];
    delete this._entriesByHash[hash];
    this._allHashes.delete(hash);
    this._numberOfEntries--;
  }

  //#endregion

  //#region Helpers

  /**
   * Get a dex's hash key for any type of entry.
   */
  public static hash(entry: Entry)
    : HashKey | undefined {
    return isUnique(entry)
      ? entry.id
      : isString(entry) || isNumber(entry) || isSymbol(entry)
        ? entry
        : isObject(entry) || isFunction(entry)
          ? entry.uuid
          : undefined;
  }

  //#endregion

  //#region Internal 
  // TODO: move to the ends of their respective sections above.

  private _forObjectConstructor() {
    const func = this.forEach as any as ((
      func: (entry: TEntry, tag: Tag) => void | LoopBreak | any,
      outerLoopType?: 'entry' | 'tag'
    ) => void) & {
      tags: (
        func: (tag: Tag, entries: Set<TEntry>) => void | LoopBreak | any
      ) => void;
      entries: (
        func: (entry: TEntry, tags: Set<Tag>) => void | LoopBreak | any
      ) => void;
    }

    func.tags = this.forEachTag;
    func.entries = this.forEachEntry;

    return func;
  }

  private _mapObjectConstructor() {
    const func = this.toMap as any as (
      <TResult = undefined>(
        transform?: (entry: TEntry, tag: Tag) => TResult | LoopBreak,
        outerLoopType?: 'entry' | 'tag'
      ) => TResult extends undefined ? Map<TEntry, Set<Tag>> : TResult[]
    ) & {
      entries: <TResult = TEntry>(
        transform?: (entry?: TEntry, tags?: Set<Tag>) => TResult | LoopBreak
      ) => TResult[];
      tags: <TResult = Tag>(
        transform?: (tag?: Tag, entries?: Set<TEntry>) => TResult | LoopBreak
      ) => TResult[];
    }

    func.tags = this.splay;
    func.entries = this.toArray;

    return func;
  }

  private _tagSetConstructor(base: Set<Tag>): TagSet<TEntry> {
    (base as any).for = function (
      target?: TEntry
        | ((entry: TEntry) => boolean)
        | HashKey
    ): Set<Tag> {
      if (target === undefined) {
        return this.tags;
      }

      if (isFunction(target)) {
        const set = new Set<Tag>();
        Object.keys(this._entriesByHash).forEach(hash => {
          if (target(this._entriesByHash[hash])) {
            this._tagsByEntryHash[hash].forEach(set.add);
          }
        });

        return set;
      } else {
        const hash: HashKey
          = (target instanceof String
            || target instanceof Number
            || target instanceof Symbol
          ) ? target as HashKey
            : Dex.hash(target)!;

        return new Set(this._tagsByEntryHash[hash]);
      }
    }

    return base as any;
  }

  private _splitForTagsOrOptions<TResultType extends QueryResultType = QueryResultType.Dex>(
    base: (tags?: Tag[], options?: Flags) => QueryResult<TEntry, TResultType>,
    tagsOrOptions?: Tag | Flags | Tag[],
    additionalTags?: Tag[] | Tag
  ): QueryResult<TEntry, TResultType> {
    if (tagsOrOptions === undefined) {
      return base();
    }

    const aIsArray = isArray(tagsOrOptions);
    if (!aIsArray && tagsOrOptions in Flags) {
      return base(
        isArray(additionalTags) || additionalTags === undefined
          ? additionalTags
          : [additionalTags],
        tagsOrOptions as Flags
      );
    } else {
      let tags: Tag[];
      if (additionalTags === undefined) {
        tags = [
          ...(aIsArray ? tagsOrOptions : [tagsOrOptions])
        ];
      } else {
        tags = [
          ...(aIsArray ? tagsOrOptions : [tagsOrOptions]),
          ...(isArray(additionalTags) ? additionalTags : [additionalTags])
        ];
      }

      return base(tags);
    }
  }

  private _addSubQueries(base: QueryMethods<TEntry>): Query<TEntry> {
    const subQueries = base as any as Query<TEntry>;
    const self = this;
    Object.defineProperty(subQueries, "not", {
      get() {
        return self._addSubQueries(self._addFlags(base, Flags.Not))
      }
    });
    Object.defineProperty(subQueries, "and", {
      get() {
        return self._addSubQueries(self._addFlags(base, Flags.And))
      }
    });
    Object.defineProperty(subQueries, "or", {
      get() {
        return self._addSubQueries(self._addFlags(base, Flags.Or))
      }
    });
    Object.defineProperty(subQueries, "first", {
      get() {
        return self._addSubQueries(self._addFlags(base, Flags.First))
      }
    });

    return subQueries;
  }

  private _addFlags(base: QueryMethods<TEntry>, extraFlags: Flags): QueryMethods<TEntry> {
    return (tagsOrOptions, additionalTags) => {
      if (tagsOrOptions === undefined) {
        return base(extraFlags);
      }

      const aIsArray = isArray(tagsOrOptions);
      if (!aIsArray && tagsOrOptions in Flags) {
        return base(((tagsOrOptions as Flags) | extraFlags) as Flags, additionalTags);
      } else {
        let tags: Tag[];
        if (additionalTags === undefined) {
          tags = [
            ...(aIsArray ? tagsOrOptions : [tagsOrOptions])
          ];
        } else {
          tags = [
            ...(aIsArray ? tagsOrOptions : [tagsOrOptions]),
            ...(isArray(additionalTags) ? additionalTags : [additionalTags])
          ];
        }

        return base(extraFlags, tags);
      }
    }
  }

  private _updateIndex(forTag: Tag) {
    if (!this._allTags.has(forTag)) {
      /* @ts-expect-error set here only */
      delete this[forTag];
    }

    /* @ts-expect-error set here only */
    this[forTag]
      = this._hashesByTag
      [forTag]
        ?.toArray()
        .map(hash =>
          this._entriesByHash[hash]);
  }

  //#endregion
}
