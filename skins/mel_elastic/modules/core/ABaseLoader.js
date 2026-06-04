import { BaseStorage } from '../../../../plugins/mel_metapage/js/lib/classes/base_storage.js';

/**
 * @template {import('./ABaseModule.js').ABaseModule} T
 */
export class ABaseLoader {
  #_rawModules;
  #_init = false;
  /**
   * @type {BaseStorage<T>}
   */
  #_modules = new BaseStorage();
  constructor(modules) {
    this.#_rawModules = modules;
  }

  /**
   * Charge les modules en appelant leurs méthodes init, go et after dans cet ordre.
   * @returns {BaseStorage<T>} Le stockage contenant les instances des modules chargés.
   */
  load() {
    if (!this.#_init) {
      this.#_init = true;

      const FUNC_LOOP = ['init', 'go', 'after'];

      for (const funcName of FUNC_LOOP) {
        this.#_loop(this.#_rawModules, funcName);
      }

      this.#_rawModules = null;
    }

    return this.#_modules;
  }

  #_loop(modules, funcName) {
    for (const Module of modules) {
      const moduleName = Module.name || 'UnknownModule';
      const moduleInstance = this.#_modules.has(moduleName)
        ? this.#_modules.get(moduleName)
        : new Module();

      // Convention : 'go' est le nom public de la méthode de cycle de vie,
      // mais les modules déclarent leur exclusion sous le nom 'main' dans _p_ignoreLifeCycles.
      const lifecycleName = funcName === 'go' ? 'main' : funcName;
      if (
        !Module.Ignore.includes(lifecycleName) &&
        typeof moduleInstance[funcName] === 'function'
      ) {
        moduleInstance[funcName]();
      }

      if (!this.#_modules.has(moduleName)) {
        this.#_modules.add(moduleName, moduleInstance);
      }
    }

    return this;
  }

  /**
   * Accesseur pour les modules chargés.
   * @returns {BaseStorage<T>} Le stockage contenant les instances des modules chargés.
   * @readonly
   */
  get modules() {
    return this.#_modules;
  }
}
