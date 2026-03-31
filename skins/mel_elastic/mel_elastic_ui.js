import { BaseStorage } from '../../plugins/mel_metapage/js/lib/classes/base_storage.js';
import { MelObject } from '../../plugins/mel_metapage/js/lib/mel_object.js';
import { ElasticUiMail } from './modules/mail.js';

class MelElasticUI extends MelObject {
  #_modules = new BaseStorage();

  constructor() {
    super();
    this.#_main();
  }

  #_main() {
    const MODULES = [ElasticUiMail];
    const FUNC_LOOP = ['init', 'go', 'after'];

    for (const funcName of FUNC_LOOP) {
      this.#_loop(MODULES, funcName);
    }
  }

  #_loop(modules, funcName) {
    console.log(
      `MelElasticUI: Looping through modules for function ${funcName}`,
    );
    for (const Module of modules) {
      const moduleName = Module.name || 'UnknownModule';
      const moduleInstance = this.#_modules.has(moduleName)
        ? this.#_modules.get(moduleName)
        : new Module();
      if (typeof moduleInstance[funcName] === 'function') {
        moduleInstance[funcName]();
      }

      if (!this.#_modules.has(moduleName)) {
        this.#_modules.add(moduleName, moduleInstance);
      }
    }

    return this;
  }

  static Start() {
    return new MelElasticUI();
  }
}

MelElasticUI.Start();
