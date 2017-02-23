/**
 * @param {Object} op
 */
export function enqueue(op) {
  // our stack index is out of position
  // => clean up all more recent batches
  if (this.sindex < this.stack.length - 1) {
    this.dequeue(this.sindex, this.stack.length - 1);
  }
  this.stack.splice(this.sindex + 1, this.stack.length);
  this.stack.push(op);
  this.redo();
  this.undo();
  this.redo();
};

/**
 * Dequeue items from stack
 * @param {Number} from
 * @param {Number} to
 */
export function dequeue(from, to) {
  from = from + 1;
  let count = (to - (from - 1));
  console.log("Dequeue stack by", count, "operations");
  let batches = this.batches;
  // free all following (more recent) tile batches
  for (let ii = 0; ii < count; ++ii) {
    let idx = (from + ii);
    let op = this.stack[idx];
    let batch = batches.splice(0, 1)[0];
    console.log(batch);
    for (let jj = 0; jj < batch.length; ++jj) {
      let tile = batch[jj];
      if (!(tile.overwritten.length)) continue;
      let ocindex = tile.overwritten.splice(0, 1)[0];
      tile.colors.unshift(tile.colors[ocindex]);
    };
    // TODO: Stable, no memory leaks?
    /*let sliced = batches.splice(idx, 1);
    for (let jj = 0; jj < sliced.length; ++jj) {
      let batch = sliced[jj];
      for (let kk = 0; kk < batch.length; ++kk) {
        let tile = batch[kk];
        if (!(tile.overwritten.length)) continue;
        let ow = tile.overwritten.splice(0, 1)[0];
        tile.colors.shift();
        tile.cindex = ow.cindex - tile.cindex;
      };
    };*/
    // recalculate stack batch index because we removed something
    // (we need valid stack indexes again after this iteration)
    for (let jj = 0; jj < this.stack.length; ++jj) {
      this.stack[jj].index -= 1;
    };
  };
  console.log("--");
};

/**
 * @param {Array} op
 * @param {Boolean} state
 */
export function fire(op, state) {
  op.batch.tiles.map((tile) => {
    let cindex = tile.cindex;
    let colors = tile.colors.length - 1;
    if (state === true) {
      // redo
      tile.cindex -= (cindex > 0 ? 1 : 0);
    } else {
      // undo
      tile.cindex += (cindex < colors ? 1 : 0);
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
