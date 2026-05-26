import { SearchModule } from './search.js';

const loader = [SearchModule];
class AgendaMelElasticMain {
  constructor() {
    this.#_load();
  }

  #_load() {
    for (const Module of loader) {
      new Module();
    }
    loader.length = 0;
  }
}

new AgendaMelElasticMain();
