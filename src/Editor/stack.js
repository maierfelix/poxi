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
};

/**
 * Dequeue items from stack
 * @param {Number} from
 * @param {Number} to
 */
export function dequeue(from, to) {
  from = from + 1;
  let count = (to - (from - 1));
  let batches = this.batches;
  // free all following (more recent) tile batches
  for (let ii = count; ii > 0; --ii) {
    this.batches.splice(from + ii - 1, 1);
    this.refreshBatches();
    this.stack.splice(from + ii - 1, 1);
  };
};

/**
 * @param {Array} op
 * @param {Boolean} state
 */
export function fire(op, state) {
  op.batch.tiles.map((tile) => {
    let cindex = tile.cindex;
    if (state) {
      // redo
      tile.cindex -= (tile.cindex > 0 ? 1 : 0);
    } else {
      // undo
      tile.cindex += (tile.cindex < tile.colors.length - 1 ? 1 : 0);
    }
  });
};

export function currentStackOperation() {
  return (this.stack[this.sindex]);
};

export function undo() {
  if (this.sindex >= 0) {
    let op = this.currentStackOperation();
    this.fire(op, false);
    this.sindex--;
  }
};

export function redo() {
  if (this.sindex < this.stack.length - 1) {
    this.sindex++;
    let op = this.currentStackOperation();
    this.fire(op, true);
  }
};
