/**
 * @param {Class} cls
 * @param {Array} prot
 */
export function inherit(cls, prot) {
  let key = null;
  for (key in prot) {
    if (prot[key] instanceof Function) {
      cls.prototype[key] = prot[key];
    }
  };
}

/**
 * Returns a unique integer
 * @return {Number}
 */
let uidx = 0;
export function uid() {
  return (uidx++);
};

/**
 * String to hashcode like on our island java
 * @param {String} str
 * @return {Number}
 */
export function hashFromString(str) {
  let hash = 0;
  let length = str.length;
  for (let ii = 0; ii < length; ++ii) {
    let ch = str.charCodeAt(ii);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return (hash);
};