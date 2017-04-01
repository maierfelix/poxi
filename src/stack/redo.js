import Command from "./cmd";

/**
 * @return {Void}
 */
export function redo() {
  if (this.sindex < this.stack.length - 1) {
    this.sindex++;
    const cmd = this.currentStackOperation();
    this.fire(cmd, true);
  } else {
    // prevent redo =^ stack size spamming
    if (this.sindex !== 0) return;
  }
  // auto update our main texture as soon as we changed our state
  this.refreshMainTexture();
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
  // refresh and cache the batch's canvas copy
  //batch.refreshCanvasBuffer();
  const cmd = new Command(kind, batch);
  this.stack.push(cmd);
  this.redo();
};
