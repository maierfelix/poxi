import Command from "./cmd";

export function redo() {
  if (this.sindex < this.stack.length - 1) {
    this.sindex++;
    const cmd = this.currentStackOperation();
    this.fire(cmd, true);
  }
  this.refreshMainTexture();
};

/**
 * @param {Number} kind
 * @param {Batch} batch
 */
export function enqueue(kind, batch) {
  // our stack index is out of position
  // => clean up all more recent batches
  this.refreshStack();
  const cmd = new Command(kind, batch);
  this.stack.push(cmd);
  this.redo();
};
