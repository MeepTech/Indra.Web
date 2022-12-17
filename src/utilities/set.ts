import {
  BREAK,
  TransformEntryFunction as TransformEntryFunction,
  LoopBreak,
  transformEntries
} from "./shared";

export { };
declare global {
  interface Set<T> {

    /**
     * Turn the set into an array.
     */
    toArray<R = T>(transform?: TransformEntryFunction<T, R>): R[];

    /**
     * Map the set.
     */
    map<R>(transform: TransformEntryFunction<T, R>): Set<R>
  }
}

if (!Set.prototype.toArray) {
  Object.defineProperty(Set.prototype, "toArray", {
    value: function toArray<T, R = T>(this: Set<T>, transform?: TransformEntryFunction<T, R>): R[] {
      if (transform) {
        const results: R[] = [];
        transformEntries<T, R>(
          this,
          transform,
          results.push
        );
      }

      return [...this] as any as R[];
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Set.prototype.map) {
  Object.defineProperty(Set.prototype, "map", {
    value: function map<T, R>(this: Set<T>, transform: TransformEntryFunction<T, R>): Set<R> {
      const results = new Set<R>;
      transformEntries<T, R>(
        this,
        transform,
        results.add
      );

      return results;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}
