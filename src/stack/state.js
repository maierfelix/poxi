/**
 * Manually refresh the stack,
 * clear future operations etc.
 */
export function refreshStack() {
  if (this.sindex < this.stack.length - 1) {
    this.dequeue(this.sindex, this.stack.length - 1);
  } else {
    this.stack.splice(this.sindex + 1, this.stack.length);
  }
  //this.updateGlobalBoundings();
};

/**
 * Returns the latest stack operation
 * @return {Object}
 */
export function currentStackOperation() {
  return (this.stack[this.sindex]);
};

/**
 * @param {Command} cmd
 * @param {Boolean} state
 */
export function fire(cmd, state) {
  if (cmd.batch.isEraser) {
    if (state) cmd.batch.dejectErasedTiles();
    else cmd.batch.injectErasedTiles();
  }
};
