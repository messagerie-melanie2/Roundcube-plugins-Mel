import { MelObject } from '../../../../plugins/mel_metapage/js/lib/mel_object.js';
import { ABaseLoader } from './ABaseLoader.js';

/**
 * @typedef {'init'|'main'|'after'} LifeCycle
 */

/**
 * Classe de base pour un module applicatif à cycle de vie.
 *
 * Un module traverse trois étapes, dans cet ordre : `init`, `main` (invoquée
 * via `go()`), `after`. Les sous-classes implémentent leur logique dans les
 * méthodes protégées `_p_init`, `_p_main`, `_p_after` plutôt que de surcharger
 * directement `init`/`go`/`after`.
 *
 * @extends MelObject
 */
export class ABaseModule extends MelObject {
  constructor() {
    super();
  }

  /**
   * Exécute l'étape d'initialisation du cycle de vie.
   *
   * @returns {this} L'instance courante, pour chaînage.
   */
  init() {
    this._p_init();
    return this;
  }

  /**
   * Exécute l'étape principale du cycle de vie.
   *
   * @returns {this} L'instance courante, pour chaînage.
   */
  go() {
    this._p_main();
    return this;
  }

  /**
   * Exécute l'étape finale du cycle de vie.
   *
   * @returns {this} L'instance courante, pour chaînage.
   */
  after() {
    this._p_after();
    return this;
  }

  /**
   * Logique d'initialisation du module. À surcharger dans les sous-classes ;
   * implémentation vide par défaut.
   *
   * @protected
   */
  _p_init() {}

  /**
   * Logique principale du module. À surcharger dans les sous-classes ;
   * implémentation vide par défaut.
   *
   * @protected
   */
  _p_main() {}

  /**
   * Logique de finalisation du module. À surcharger dans les sous-classes ;
   * implémentation vide par défaut.
   *
   * @protected
   */
  _p_after() {}

  /**
   * Méthode statique pour définir les cycles de vie à ignorer. Les modules qui retournent des cycles de vie dans cette méthode ne seront pas exécutés pour ces cycles de vie spécifiques lors du chargement par le ModuleLoader.
   *
   * @returns {LifeCycle[]} Un tableau de cycles de vie à ignorer.
   * @protected
   */
  static _p_ignoreLifeCycles() {}

  /**
   * Accesseur statique pour les cycles de vie à ignorer. Les modules peuvent définir les cycles de vie à ignorer en implémentant la méthode statique _p_ignoreLifeCycles, et cet accesseur permet d'accéder facilement à ces informations.
   *
   * @returns {Readonly<LifeCycle[]>} Un tableau de cycles de vie à ignorer.
   * @readonly
   */
  static get Ignore() {
    return this._p_ignoreLifeCycles() || [];
  }

  /**
   * Fabrique statique instanciant le module courant.
   *
   * @returns {ABaseModule} Une nouvelle instance du module.
   */
  static Start() {
    return new this();
  }
}

/**
 * @typedef {import('./ABaseLoader.js').ABaseLoader<import('./ABaseSubModule.js').ABaseSubModule>} SubModuleLoader
 */

/**
 * Module de base pouvant lui-même orchestrer une collection de sous-modules
 * via un {@link ABaseLoader} interne, chargé à la demande.
 *
 * @extends ABaseModule
 */
export class ABaseModuleWithSubModules extends ABaseModule {
  /**
   * Classes des sous-modules à charger (non instanciées).
   *
   * @type {?import('./ABaseSubModule.js').ABaseSubModule[]}
   */
  #_submodules;

  /**
   * Chargeur interne des sous-modules, instancié uniquement lors du premier
   * appel à `loadSubModules()`.
   *
   * @type {?SubModuleLoader}
   */
  #_loader;

  /**
   * @param {?import('./ABaseSubModule.js').ABaseSubModule[]} submodules Classes des sous-modules à charger.
   */
  constructor(submodules) {
    super();
    this.#_submodules = submodules;
  }

  /**
   * Indique si les sous-modules ont déjà été chargés.
   *
   * @returns {boolean} `true` si `loadSubModules()` a déjà été invoqué avec succès.
   */
  isSubModulesLoaded() {
    return !!this.#_loader;
  }

  /**
   * Charge les sous-modules via un {@link ABaseLoader} dédié. Idempotent : un
   * second appel ne recrée pas le chargeur.
   *
   * @returns {this} L'instance courante, pour chaînage.
   */
  loadSubModules() {
    if (!this.#_loader) {
      this.#_loader = new ABaseLoader(this.#_submodules);
      this.#_loader.load();
    }
    return this;
  }

  /**
   * Accesseur pour les sous-modules chargés.
   *
   * @returns {?import('./ABaseLoader.js').BaseStorage} Le stockage des instances de sous-modules, ou `null` si non chargés.
   * @readonly
   */
  get subModules() {
    return this.#_loader ? this.#_loader.modules : null;
  }
}
