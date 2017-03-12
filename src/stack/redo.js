export function redo() {
  if (this.sindex < this.stack.length - 1) {
    this.sindex++;
    const op = this.currentStackOperation();
    this.fire(op, true);
  }
};

/**
 * @param {Object} op
 */
export function enqueue(op) {
  // our stack index is out of position
  // => clean up all more recent batches
  this.refreshStack();
  this.stack.push(op);
  this.redo();
  this.undo();
  this.redo();
};
