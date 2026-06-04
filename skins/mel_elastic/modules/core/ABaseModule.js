import { MelObject } from '../../../../plugins/mel_metapage/js/lib/mel_object.js';
import { ABaseLoader } from './ABaseLoader.js';

/**
 * @typedef {'init'|'main'|'after'} LifeCycle
 */

export class ABaseModule extends MelObject {
  constructor() {
    super();
  }

  init() {
    this._p_init();
    return this;
  }
  go() {
    this._p_main();
    return this;
  }
  after() {
    this._p_after();
    return this;
  }

  _p_init() {}
  _p_main() {}
  _p_after() {}

  /**
   * Méthode statique pour définir les cycles de vie à ignorer. Les modules qui retournent des cycles de vie dans cette méthode ne seront pas exécutés pour ces cycles de vie spécifiques lors du chargement par le ModuleLoader.
   * @return {LifeCycle[]} Un tableau de cycles de vie à ignorer.
   * @protected
   */
  static _p_ignoreLifeCycles() {}

  /**
   * Accesseur statique pour les cycles de vie à ignorer. Les modules peuvent définir les cycles de vie à ignorer en implémentant la méthode statique _p_ignoreLifeCycles, et cet accesseur permet d'accéder facilement à ces informations.
   * @returns {Readonly<LifeCycle[]>} Un tableau de cycles de vie à ignorer.
   * @readonly
   */
  static get Ignore() {
    return this._p_ignoreLifeCycles() || [];
  }

  static Start() {
    return new this();
  }
}

/**
 * @typedef {import('./ABaseLoader.js').ABaseLoader<import('./ABaseSubModule.js').ABaseSubModule} SubModuleLoader
 */

export class ABaseModuleWithSubModules extends ABaseModule {
  #_submodules;
  /**
   *  @type {?SubModuleLoader}
   */
  #_loader;

  /**
   *
   * @param {?import('./ABaseSubModule.js').ABaseSubModule[]} submodules
   */
  constructor(submodules) {
    super();
    this.#_submodules = submodules;
  }

  isSubModulesLoaded() {
    return !!this.#_loader;
  }

  loadSubModules() {
    if (!this.#_loader) {
      this.#_loader = new ABaseLoader(this.#_submodules);
      this.#_loader.load();
    }
    return this;
  }

  get subModules() {
    return this.#_loader ? this.#_loader.modules : null;
  }
}
