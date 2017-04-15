import {
  STORAGE_KEY,
  STORAGE_OBJECT
} from "../cfg";

/**
 * @param {String} key 
 * @param {String} value 
 */
export function writeStorage(key, value) {
  const access = `${STORAGE_KEY}::${key}`;
  STORAGE_OBJECT.setItem(access, value);
};

/**
 * @param {String} key 
 * @param {String} value 
 */
export function appendStorage(key, value) {
  const access = `${STORAGE_KEY}::${key}`;
  const base = this.readStorage(key);
  this.writeStorage(key, base + value);
};
