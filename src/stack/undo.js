import CommandKind from "./kind";

/**
 * @return {Void}
 */
export function undo() {
  // prevent undo/redo when in e.g drawing state
  if (this.isInActiveState()) return;
  if (this.sindex >= 0) {
    const cmd = this.currentStackOperation();
    this.fire(cmd, false);
    this.sindex--;
  }
  this.updateGlobalBoundings();
  this.redraw = true;
  return;
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
    const kind = this.getCommandKind(cmd);
    switch (kind) {
      case CommandKind.BATCH_OPERATION:
        cmd.batch.kill();
      break;
    };
    this.stack.splice(idx, 1);
  };
};
