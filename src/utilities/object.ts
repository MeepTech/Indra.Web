import { isFunction, isObject, isString } from "./validators";
import { v4 as uuidv4 } from 'uuid';

const NUMBERS = '0123456789';
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_';
const CLOSING_INDEX_BRACKET = ']';
const OPENING_INDEX_BRACKET = '[';
const STRING_QUOTE = '"';
const OBJECT_PROPERTY_DOT_SEPERATOR = '.';

declare global {
  interface Object {
    /**
     * Find a deep property in an object, returning true on success.
     *
     * @param path Array of keys, or dot seperated propery key."
     * @param thenDo A[set of] callback[s] that takes the found value as a parameter. Defaults to just the onTrue method if a single function is passed in on it's own.
     
     * @returns true if the property exists, false if not.
     */
    hasProp(
      path: string | Array<string>,
      thenDo?: ThenDoCallback
    ): boolean;

    /**
     * Get a deep property from an object, or return null.
     *
     * @param path Array of keys, or dot seperated propery key.
     * @param defaultValue (Optional) a default value to return, or a function to execute to get the default value.
     * @param defaultValueFunctionIsNotTheValueAndIsUsedToFetchTheValue If this is true, and the defaultValue passed in is a function, this will execute that function with no parameters to try to get the value. (defautls to true)
     *
     * @returns The found deep property, or undefined if not found.
     */
    getProp(
      path: string | Array<string>,
      defaultValue?: any,
      defaultValueFunctionIsNotTheValueAndIsUsedToFetchTheValue?: true | boolean
    ): any | undefined;

    /**
     * Set a deep property in an object, even if it doesn't exist.
     *
     * @param path Array of keys, or dot seperated propery key.
     * @param value The value to set, or a function to update the current value and return it.
     * @param valueFunctionIsNotTheValueAndIsUsedToFetchTheValue If this is true, and the value passed in is a function, this will execute that function with no parameters to try to get the value. (defautls to true)
     */
    setProp(
      path: string | Array<string>,
      value: any,
      valueFunctionIsNotTheValueAndIsUsedToFetchTheValue?: true | boolean
    ): void

    /**
     * Gets a unique id for this object and sets it to a 'secret' property on it.
     * The first run of this can be slow as it needs to generate a new guid.
     */
    get uuid(): string;
  }
}

if (!Object.prototype.hasProp) {
  Object.defineProperty(Object.prototype, 'hasProp', {
    value: function hasProp(
      path: string | Array<string>,
      thenDo?: ThenDoCallback
    ) {
      if (thenDo) {
        return tryToGetDeepProperty(path, thenDo, this);
      } else {
        return containsDeepProperty(path, this);
      }
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Object.prototype.getProp) {
  Object.defineProperty(Object.prototype, 'getProp', {
    value: function getProp(
      path: string | Array<string>,
      defaultValue?: any,
      defaultValueFunctionIsNotTheValueAndIsUsedToFetchTheValue?: true | boolean
    ): any | undefined {
      const value = getDeepProperty(path, this);
      if (defaultValue !== undefined && (value === undefined)) {
        if (defaultValueFunctionIsNotTheValueAndIsUsedToFetchTheValue && isFunction(defaultValue)) {
          return defaultValue();
        } else {
          return defaultValue;
        }
      }

      return value;
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Object.prototype.setProp) {
  Object.defineProperty(Object.prototype, 'setProp', {
    value: function setProp(
      path: string | Array<string>,
      value: any,
      valueFunctionIsNotTheValueAndIsUsedToFetchTheValue?: true | boolean
    ): void {
      return setDeepProperty(
        path,
        value,
        this,
        valueFunctionIsNotTheValueAndIsUsedToFetchTheValue
      );
    },
    enumerable: false,
    writable: false,
    configurable: false
  });
}

if (!Object.prototype.uuid) {
  Object.defineProperty(Object.prototype, 'uuid', {
    get() {
      let id: string;
      if (id = (this as any).__uuid) {
        return id;
      } else {
        (this as any).__uuid
          = id
          = uuidv4();
      }

      return id;
    },
    enumerable: false,
    writable: false,
    configurable: false
  })
}

/**
 * A callback for certain property helper methods and other settings.
 */
export type ThenDoCallback
  = ThenDoCallbacks
  | ThenDoOnTrueCallback;

/**
 * Callback executed on true
 */
export type ThenDoOnTrueCallback
  = (found?: any) => any;
  
/**
 * Callback executed on false
 */
export type ThenDoOnFalseCallback
  = (result?: any) => any;

/**
 * Callback with options for onTrue and onFalse
 */
export type ThenDoCallbacks = {
  onTrue?: ThenDoOnTrueCallback;
  onFalse?: ThenDoOnFalseCallback;
};

/**
 * Find a deep property in an object.
 *
 * @param path Array of keys, or dot seperated propery key."
 * @param onObject The object containing the desired key
 *
 * @returns true if the property exists, false if not.
 */
export function containsDeepProperty(path: string | Array<string>, onObject: any): boolean {
  const keys = (isString(path))
    ? splitPropertyPath(path)
    : path;

  let parent = onObject;
  for (const currentKey of keys) {
    if (!isObject(parent)) {
      return false;
    }

    if (!parent.hasOwnProperty(currentKey)) {
      return false;
    }

    parent = parent[currentKey];
  }

  return true;
}

/**
 * Get a deep property in an object, null if not found.
 *
 * @param path Array of keys, or dot seperated propery key.
 * @param fromObject The object containing the desired key
 * @param thenDo A(set of) callback(s) that takes the found value as a parameter. Defaults to just the onTrue method if a single function is passed in on it's own.
 *
 * @returns if the property exists.
 */
export function tryToGetDeepProperty(path: string | Array<string>, fromObject: any, thenDo?: ThenDoCallback): boolean {
  const keys = (isString(path))
    ? splitPropertyPath(path as string)
    : path;

  let parent = fromObject;
  for (const currentKey of keys) {
    if (!isObject(parent) || !parent.hasOwnProperty(currentKey)) {
      if (thenDo && (thenDo as ThenDoCallbacks).onFalse) {
        (thenDo as ThenDoCallbacks).onFalse!();
      }

      return false;
    }

    parent = parent[currentKey];
  }

  if (thenDo) {
    const then: ThenDoOnTrueCallback
      = ((thenDo as ThenDoCallbacks)?.onTrue ?? thenDo) as ThenDoOnTrueCallback;

    if (then) {
      return then(parent);
    }
  }

  return true;
}

/**
 * Get a deep property in an object, null if not found.
 *
 * @param path Array of keys, or dot seperated propery key.
 * @param fromObject The object containing the desired property
 *
 * @returns The found deep property, or null if not found.
 */
export function getDeepProperty(path: string | Array<string>, fromObject: any): any | undefined {
  return ((isString(path))
    ? splitPropertyPath(path as string)
    : path)
    .reduce((t, p) => t?.[p], fromObject);
}

/**
  * Set a deep property in an object, even if it doesn't exist.
  *
  * @param path Array of keys, or dot seperated propery key.
  * @param value The value to set, or a function to update the current value and return it.
  * @param onObject The object to set the property on
  * @param valueFunctionIsNotTheValueAndIsUsedToFetchTheValue If this is true, and the value passed in is a function, this will execute that function with no parameters to try to get the value. (defautls to true)
  */
export function setDeepProperty(path: string | Array<string>, value: any, onObject: any, valueFunctionIsNotTheValueAndIsUsedToFetchTheValue?: true | boolean): void {
  const keys = (isString(path))
    ? splitPropertyPath(path as string)
    : path;

  let parent = onObject;
  let currentKey;
  for (currentKey of keys) {
    if (!isObject(parent)) {
      throw new Error(`Property: ${currentKey}, in Path: ${path}, is not an object. Child property values cannot be set!`);
    }

    // if this parent doesn't have the property we want, add it as an empty object for now.
    if (!parent.hasOwnProperty(currentKey)) {
      parent[currentKey] = {};
    }

    // if this isn't the last one, set it as parent.
    if (currentKey != keys[keys.length - 1]) {
      parent = parent[currentKey];
    }
  }

  if (!currentKey) {
    throw new Error("No Final Key Provided!?");
  }

  if (valueFunctionIsNotTheValueAndIsUsedToFetchTheValue && isFunction(value)) {
    parent[currentKey] = value(parent[currentKey]);
  } else {
    parent[currentKey] = value;
  }
}

/**
 * Splits a path to an object property into it's keys.
 *
 * @param path The path to an object property or deep object property.
 *   Supported notation:
 *    - dot notation: "parent.child"
 *    - property name indexing: "parent['child']"
 *    - numeric property indexing: "parent[0]";
 *    - deep properties and combinations of the above: "parent.child[0]['key'].item"
 *
 * @returns the property path as an array of its parts
 */
export function splitPropertyPath(path: string): Array<string> {
  // replace single with double quotes.
  path = path.replace(/'/g, STRING_QUOTE);

  // validate
  let error: Error | null;
  if (error = checkPropertyPathForErrors(path)) {
    throw error;
  }

  // chop up
  return path
    .split(OBJECT_PROPERTY_DOT_SEPERATOR)
    .map(dotPart =>
      dotPart.split(OPENING_INDEX_BRACKET)
        .map(indexPart => {
          if (indexPart.endsWith(CLOSING_INDEX_BRACKET)) {
            indexPart = indexPart.slice(0, -1);
          }

          if (indexPart.startsWith(STRING_QUOTE) && indexPart.endsWith(STRING_QUOTE)) {
            indexPart = indexPart.slice(1, -1);
          }

          return indexPart;
        })
    ).flat();
}

/**
 * Validates an path to an object property or deep property makes sense in js.
 *
 * @param path The path to an object property or deep object property.
 *   Supported notation:
 *    - dot notation: "parent.child"
 *    - property name indexing: "parent['child']"
 *    - numeric property indexing: "parent[0]";
 *    - deep properties and combinations of the above: "parent.child[0]['key'].item"
 *
 * @returns Error if the path is not valid, null
 */
export function checkPropertyPathForErrors(path: string): Error | null {
  let isCurrentlyInStringIndexBrackets: boolean = false;
  let isCurrentlyInNumberIndexBrackets: boolean = false;

  for (let charIndex = 0; charIndex < path.length; charIndex++) {
    const currentChar = path[charIndex];
    const nextChar = path[charIndex + 1];

    // dot
    if (currentChar === OBJECT_PROPERTY_DOT_SEPERATOR) {
      // can't start with a dot
      if (charIndex === 0) {
        return new Error(`Invalid character: '${currentChar}', at index ${charIndex}, in: "${path}", path may not start with a dot('.').`);
      }

      // the thing following a dot must be a valid in-code js variable name.
      if (!LETTERS.includes(nextChar)) {
        return new Error(`Invalid character: '${nextChar}', at index: ${charIndex + 1}, in "${path}", expected a letter, '_', or '$' to follow a dot('.').`);
      }
    }

    // begin index bracket
    if (currentChar === OPENING_INDEX_BRACKET) {
      // array numeric indexing
      if (NUMBERS.includes(nextChar)) {
        isCurrentlyInNumberIndexBrackets = true;
        // dont skip next char, we need it
        continue;
      } // string property indexing
      else if (nextChar === STRING_QUOTE) {
        // no empty strings
        if (path[charIndex + 2] === STRING_QUOTE) {
          return new Error(`Invalid character: '${path[charIndex + 2]}', at index: ${charIndex + 2}, in: "${path}", string key property indexers in paths can't be empty!`);
        }

        isCurrentlyInStringIndexBrackets = true;
        // skip next char
        charIndex += 1;
        continue;
      } else {
        return new Error(`Invalid character: '${nextChar}', at index: ${charIndex + 1}, in: "${path}", expected number or '"' to follow an opening index bracket('[')`);
      }
    }

    // end string index bracket
    if (isCurrentlyInStringIndexBrackets && currentChar === STRING_QUOTE) {
      if (nextChar === CLOSING_INDEX_BRACKET) {
        isCurrentlyInStringIndexBrackets = false;
        charIndex += 1; // skip next char
        continue; // skip rest of current char
      } else {
        return new Error(`Invalid character: '${nextChar}', at index: ${charIndex + 1}, in: "${path}", expected a closing index bracket(']') to follow a string quote('"')`);
      }
    }

    // end number index bracket.
    if (isCurrentlyInNumberIndexBrackets && currentChar === CLOSING_INDEX_BRACKET) {
      isCurrentlyInNumberIndexBrackets = false;
      continue;
    }

    if (isCurrentlyInStringIndexBrackets && (currentChar === OBJECT_PROPERTY_DOT_SEPERATOR || currentChar === CLOSING_INDEX_BRACKET || currentChar === OPENING_INDEX_BRACKET)) {
      return new Error(`Invalid character: '${currentChar}', at index: ${charIndex}, in: "${path}"`);
    }

    if (isCurrentlyInNumberIndexBrackets && !NUMBERS.includes(currentChar)) {
      return new Error(`Invalid character: '${currentChar}', at index: ${charIndex}, in: "${path}", numeric indexer expected inside current brackets!`);
    }

    if (!isCurrentlyInNumberIndexBrackets && !isCurrentlyInStringIndexBrackets) {
      if (currentChar === CLOSING_INDEX_BRACKET) {
        return new Error(`Invalid character: '${currentChar}', at index: ${charIndex}, in: "${path}", expected start bracket('[') as next char!`);
      }
    }
  }

  return null;
}