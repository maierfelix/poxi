export function undo() {
  if (this.sindex >= 0) {
    const op = this.currentStackOperation();
    this.fire(op, false);
    this.sindex--;
  }
};

/**
 * Dequeue items from stack
 * @param {Number} from
 * @param {Number} to
 */
export function dequeue(from, to) {
  from = from + 1;
  const count = (to - (from - 1));
  const batches = this.batches;
  // free all following (more recent) tile batches
  for (let ii = count; ii > 0; --ii) {
    let batch = this.batches.splice(from + ii - 1, 1)[0];
    // free batch from memory
    if (batch.buffer.texture instanceof WebGLTexture) {
      batch.tiles = [];
      batch.buffer.view = null;
      batch.buffer.data = null;
      batch.buffer.context = null;
      this.renderer.destroyTexture(batch.buffer.texture);
      batch.buffer.texture = null;
      batch.buffer = null;
    }
    batch = null;
    this.refreshBatches();
    this.stack.splice(from + ii - 1, 1);
  };
};
