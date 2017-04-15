import {
  STORAGE_KEY,
  STORAGE_OBJECT
} from "../cfg";

/**
 * @param {String} key 
 * @return {String}
 */
export function readStorage(key) {
  const access = `${STORAGE_KEY}::${key}`;
  const value = STORAGE_OBJECT.getItem(access);
  return (value || "");
};
