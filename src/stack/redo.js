import Command from "./cmd";

/**
 * @return {Void}
 */
export function redo() {
  // prevent undo/redo when in e.g. drawing state
  if (this.isInActiveState()) return;
  if (this.sindex < this.stack.length - 1) {
    this.sindex++;
    const cmd = this.currentStackOperation();
    this.fire(cmd, true);
  }
  this.updateGlobalBoundings();
  this.redraw = true;
  return;
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
  //this.undo();
  //this.redo();
};
