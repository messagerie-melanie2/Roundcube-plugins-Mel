import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object.js';
import { ModuleInit } from './init.js';
import { SearchModule } from './search.js';

const loader = [SearchModule, ModuleInit];
class AgendaMelElasticMain extends ABaseMelObject {
  #_callbacksOnDocumentReady = new Set();

  constructor() {
    super();
    if (this.get_env('task') === 'calendar') this.#_load();
  }

  #_load() {
    for (const Module of loader) {
      const module = new Module();

      if (
        module.onDocumentReady &&
        typeof module.onDocumentReady === 'function'
      ) {
        this.#_callbacksOnDocumentReady.add(
          module.onDocumentReady.bind(module),
        );
      }
    }
    loader.length = 0;
  }

  callForDocumentReady() {
    if (this.#_callbacksOnDocumentReady.size) {
      for (const fn of this.#_callbacksOnDocumentReady.values()) {
        fn();
      }
    }
  }
}

const module = new AgendaMelElasticMain();

document.addEventListener(
  'DOMContentLoaded',
  module.callForDocumentReady.bind(module),
);
