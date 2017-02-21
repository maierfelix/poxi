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