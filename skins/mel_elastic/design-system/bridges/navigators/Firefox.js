import { ANavigators } from './ANavigators.js';

export class Firefox extends ANavigators {
  constructor() {
    super();
  }

  initiateDragTimeout(target) {
    this.signal = new AbortController();
    this.signal.signal.addEventListener('abort', () => {
      this.stopDragTimeout();
    });
    this.timeout = setTimeout(() => {
      if (!this.signal || this.signal.signal.aborted) return;

      target.toggle();
      this.signal.abort();
    }, 1000);
  }

  stopDragTimeout() {
    if (this.signal) {
      if (!this.signal.signal.aborted) this.signal.abort();
      else {
        if (this.timeout) clearTimeout(this.timeout);
        this.signal = null;
        this.timeout = null;
      }
    }
  }
}
