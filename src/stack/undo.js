export function undo() {
  if (this.sindex >= 0) {
    const cmd = this.currentStackOperation();
    this.fire(cmd, false);
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
  for (let ii = count; ii > 0; --ii) {
    const idx = from + ii - 1;
    const cmd = this.stack[idx];
    cmd.batch.kill();
    this.stack.splice(idx, 1);
  };
};
