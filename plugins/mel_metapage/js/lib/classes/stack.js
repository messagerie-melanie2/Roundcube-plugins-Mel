export class Stack {
  constructor(max = Number.POSITIVE_INFINITY) {
    this._stack = [];
    this._max = max;
  }

  add(item) {
    this._stack.push(item);
    if (this._stack.length > this._max) this.pop();
    return this;
  }

  pop() {
    if (this._stack.length > 0) {
      let item = this._stack[0];
      this._stack = this._stack.slice(1);
      return item;
    } else return null;
  }
}
