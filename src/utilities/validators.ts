import { IUnique } from "../lib";

/**
 * Helper to check if something's a function.
 * 
 * @param symbol The symbol to test
 * 
 * @returns true if the item is a function
 */
export const isFunction = (symbol: any)
  : symbol is Function =>
  typeof symbol === "function";

/**
 * Helper to check if somethings an object.
 * 
 * @param symbol The symbol to check 
 * @param includeNulls (optional) If the value of 'null' returns true or not. (Defaults to false)
 * 
 * @returns true if it's an object 
 */
export const isObject = (symbol: any)
  : symbol is Record<any, any> & object =>
  typeof symbol === "object" && symbol !== null;

/**
 * Helper to check if something is a number.
 */
export const isNumber = (symbol: any)
  : symbol is number =>
  typeof symbol === "number";

/**
 * Helper to check if something is a string.
 */
export const isString = (symbol: any)
  : symbol is string =>
  typeof symbol === "string";

  /**
   * Helper to check if something is a string.
   */
  export const isSymbol = (symbol: any)
    : symbol is symbol =>
    typeof symbol === "symbol";

/**
 * Helper to check if somethings specifically an array.
 * 
 * @param symbol The symbol to check 
 * 
 * @returns true if it's an array
 */
export const isArray = (symbol: any)
  : symbol is Array<any> =>
  Array.isArray(symbol);

/**
 * Check if it's a unique object. (IUnique)
 */
export const isUnique = (symbol: any)
  : symbol is IUnique =>
  isObject(symbol)
  && symbol.isUnique
  && typeof symbol.id === 'string'
  && typeof symbol.keys === 'object'
  && typeof symbol.key === 'string'