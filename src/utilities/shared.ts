const Break = Symbol("break");

/**
 * Special type for things that can break a for loop
 */
export type LoopBreak = typeof Break;

/**
 * Special variable for breaking from a loop
 */
export const BREAK: LoopBreak = Break;

/**
 * Transforms an entity into another
 */
export type TransformEntryFunction<T, R>
  = ((entry: T, index: number) => R | LoopBreak);

export function transformEntries<TEntry, TResult>(
  entries: Set<TEntry> | TEntry[],
  transform: TransformEntryFunction<TEntry, TResult>,
  then: (result: TResult) => void
): void {
  if (transform.arguments.length === 2) {
    let index: number = 0;
    for (const entry of entries) {
      const result = transform(entry, index++);
      if (result === BREAK) {
        break;
      }
      
      then(result);
    }
  } else if (transform.arguments.length === 1) {
    for (const entry of entries) {
      const result = transform(entry, -1);
      if (result === BREAK) {
        break;
      }

      then(result);
    }
  } else if (!transform.arguments.length) {
    for (const {} of entries) {
      const result = transform(null!, -1);
      if (result === BREAK) {
        break;
      }

      then(result);
    }
  }
}