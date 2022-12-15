interface Set<T> {
  toArray(): T[];
}

if (!Set.prototype.toArray) {
  Object.defineProperty(Set.prototype, "toArray", {
    value: function toArray<T>(this: Set<T>): T[] {
      return [...this];
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}