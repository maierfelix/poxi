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
  this.updateGlobalBoundings();
};

/**
 * Returns the latest stack operation
 * @return {Object}
 */
export function currentStackOperation() {
  return (this.stack[this.sindex]);
};

/**
 * @param {Array} op
 * @param {Boolean} state
 */
export function fire(op, state) {
  op.batch.tiles.map((tile) => {
    const cindex = tile.cindex;
    if (state) {
      // redo
      tile.cindex -= (tile.cindex > 0 ? 1 : 0);
    } else {
      // undo
      tile.cindex += (tile.cindex < tile.colors.length - 1 ? 1 : 0);
    }
  });
};
