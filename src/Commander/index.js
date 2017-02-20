/**
 * @class Commander
 */
class Commander {

  /**
   * @param {Picaxo} instance
   */
  constructor(instance) {
    this.index = 0;
    this.stack = [];
    this.instance = instance;
  }

  /**
   * Update and secure stack index
   * TODO: Secure, remove throw error
   * @param {Number} idx
   */
  updateStackIndex(idx) {
    let value = this.index + idx;
    if (value >= 0 && value <= this.stack.length - 1) {
      this.index = value;
    } else {
      throw new Error("Stack index out of bounds!");
    }
  }

  undo() {
    this.updateStackIndex(-1);
    return (this.stack[this.index]);
  }

  redo() {
    this.updateStackIndex(-1);
    return (this.stack[this.index]);
  }

  /**
   * @param {Array} op
   */
  push(op) {
    this.stack.push(op);
  }

};

export default Commander;