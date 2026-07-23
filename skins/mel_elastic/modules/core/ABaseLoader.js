import { BaseStorage } from '../../../../plugins/mel_metapage/js/lib/classes/base_storage.js';

/**
 * Charge une liste de modules en exécutant leurs cycles de vie `init`, `go`
 * et `after` dans cet ordre, puis conserve les instances chargées dans un
 * {@link BaseStorage}.
 *
 * @template {import('./ABaseModule.js').ABaseModule} T
 */
export class ABaseLoader {
  /**
   * Classes de modules à instancier et à faire passer par le cycle de vie.
   * Mise à `null` une fois le chargement effectué.
   *
   * @type {Array<new () => T>|null}
   */
  #_rawModules;

  /**
   * Indique si `load()` a déjà été exécuté, pour empêcher un second chargement.
   *
   * @type {boolean}
   */
  #_init = false;

  /**
   * Stockage des instances de modules déjà chargées, indexées par nom de classe.
   *
   * @type {BaseStorage<T>}
   */
  #_modules = new BaseStorage();

  /**
   * @param {Array<new () => T>} modules Classes des modules à charger (non instanciées).
   */
  constructor(modules) {
    this.#_rawModules = modules;
  }

  /**
   * Charge les modules en appelant leurs méthodes `init`, `go` et `after` dans cet ordre.
   * Idempotent : un second appel ne relance pas le cycle de vie et retourne
   * directement le stockage déjà constitué.
   *
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

  /**
   * Exécute une étape du cycle de vie (`init`, `go` ou `after`) sur chaque module,
   * en instanciant celui-ci au premier passage si nécessaire.
   *
   * @param {Array<new () => T>} modules  Classes des modules à traiter.
   * @param {string}             funcName Nom de la méthode de cycle de vie à invoquer (`init`, `go` ou `after`).
   * @returns {this} L'instance courante, pour chaînage éventuel.
   * @private
   */
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
   *
   * @returns {BaseStorage<T>} Le stockage contenant les instances des modules chargés.
   * @readonly
   */
  get modules() {
    return this.#_modules;
  }
}
