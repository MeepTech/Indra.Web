import { ThenDoCallback, ThenDoOnTrueCallback } from "./object";
import { isFunction } from "./validators";

declare global {
  interface Array<T> {

    /**
     * Get the first element of an array, or undefined.
     */
    first(): T | undefined;

    /**
     * Get the last element of an array, or undefined.
     */
    last(): T | undefined;

    /**
     * @alias {@link includes}
     */
    contains(target: T): boolean;

    /**
     * Remove all elements of the given type from the current array.
     * 
     * @returns the number of removed elements
     */
    remove(target: T | ((entry: T) => boolean), thenDo?: ThenDoCallback): number;

    /**
     * Remove the first matching element from the current array.
     *
     * @returns true if an element was removed. 
     */
    pluck(target: T): boolean;

    /**
     * Randomize the current array.
     */
    shuffle(): this;

    /**
     * Get a unique collection of elements based on this array.
     */
    unique(): T[];

    /**
     * Return a new array with the value appended.
     */
    append(item: T): T[];

    /**
     * Return a new array with the value prepended(added to the front).
     */
    prepend(item: T): T[];

    /**
     * Return a new array without any instnances of the given value.
     */
    without(item: T): T[];

    /**
     * Return a record of the items, indexed via the given key property.
     */
    record(key: string | ((entry: T) => any)): Record<any, T>;

    /**
     * Return a record of arrays of the items, indexed via the given key property.
     */
    bucket(key: string | ((entry: T) => any)): Record<any, Array<T>>;
  }
}

if (!Array.prototype.first) {
  Object.defineProperty(Array.prototype, "first", {
    value: function first<T>(this: T[]): T | undefined {
      return this[0];
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Array.prototype.last) {
  Object.defineProperty(Array.prototype, "last", {
    value: function last<T>(this: T[]): T | undefined {
      return this[this.length - 1];
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Array.prototype.contains) {
  Object.defineProperty(Array.prototype, "contains", {
    value: function contains<T>(this: T[], target: T): boolean {
      return this.includes(target);
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Array.prototype.remove) {
  Object.defineProperty(Array.prototype, "remove", {
    value: function remove<T>(this: T[], target: (T | ((entry: T) => boolean)), thenDo: ThenDoOnTrueCallback): number {
      let count: number = 0;
      let index: number = 0;

      if (isFunction(target)) {
        while ((index = this.findIndex(e => target(e))) > -1) {
          const removed = this.splice(index, 1)[0];
          thenDo(removed);
          count++;
        }
      } else {
        while ((index = this.indexOf(target, 0)) > -1) {
          const removed = this.splice(index, 1)[0];
          thenDo(removed);
          count++;
        }
      }

      return count;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Array.prototype.pluck) {
  Object.defineProperty(Array.prototype, "pluck", {
    value: function pluck<T>(this: T[], target: T): boolean {
      const index = this.indexOf(target, 0);
      if (index > -1) {
        this.splice(index, 1);
        return true;
      }

      return false;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Array.prototype.unique) {
  Object.defineProperty(Array.prototype, "unique", {
    value: function unique<T>(this: T[]): T[] {
      return [...new Set(this)];
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Array.prototype.append) {
  Object.defineProperty(Array.prototype, "append", {
    value: function append<T>(this: T[], item: T): T[] {
      return [...this, item];
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Array.prototype.prepend) {
  Object.defineProperty(Array.prototype, "prepend", {
    value: function prepend<T>(this: T[], item: T): T[] {
      return [item, ...this];
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Array.prototype.without) {
  Object.defineProperty(Array.prototype, "without", {
    value: function <T>(this: T[], item: T): T[] {
      return this.filter(i => i !== item);
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Array.prototype.record) {
  Object.defineProperty(Array.prototype, "record", {
    value: function record(uniqueKeyPropertyPath: string): Record<any, any> {
      const result: Record<any, any> = {};

      for (const i of this) {
        const key = i.getProp(uniqueKeyPropertyPath);
        if (key === undefined) {
          throw new Error(`Aggregation Key not found at path: ${uniqueKeyPropertyPath}.`);
        }

        if (result[key]) {
          throw new Error(`Key already exists in aggregate object, can't index another object by it: ${uniqueKeyPropertyPath}.`);
        } else {
          result[key] = i;
        }
      }

      return result;
    },
    enumerable: false
  });
}

if (!Array.prototype.bucket) {
  Object.defineProperty(Array.prototype, "bucket", {
    value: function bucket(key: string): Record<any, any[]> {
      const result: Record<any, any[]> = {};

      for (const i of this) {
        const k = i
          ? i.getProp(key, "")
          : "";

        if (result[k]) {
          result[k].push(i);
        } else {
          result[k] = [i];
        }
      }

      return result;
    },
    enumerable: false
  });
}