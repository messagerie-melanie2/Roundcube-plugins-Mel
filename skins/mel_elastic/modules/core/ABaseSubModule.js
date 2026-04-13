import { ABaseModule } from './ABaseModule.js';

export class ABaseSubModule extends ABaseModule {
  #_parent;
  constructor(parent) {
    super();
    this.#_parent = parent;
  }

  get parent() {
    return this.#_parent;
  }
}
