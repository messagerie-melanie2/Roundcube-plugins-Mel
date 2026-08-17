import { ABaseModule } from './ABaseModule.js';

/**
 * Module de base destiné à être chargé en tant que sous-module d'un
 * {@link ABaseModuleWithSubModules}, avec une référence vers son parent.
 *
 * @extends ABaseModule
 */
export class ABaseSubModule extends ABaseModule {
  /**
   * Module parent ayant chargé ce sous-module.
   *
   * @type {import('./ABaseModule.js').ABaseModuleWithSubModules}
   */
  #_parent;

  /**
   * @param {import('./ABaseModule.js').ABaseModuleWithSubModules} parent Module parent propriétaire de ce sous-module.
   */
  constructor(parent) {
    super();
    this.#_parent = parent;
  }

  /**
   * Accesseur pour le module parent.
   *
   * @returns {import('./ABaseModule.js').ABaseModuleWithSubModules} Le module parent ayant chargé ce sous-module.
   * @readonly
   */
  get parent() {
    return this.#_parent;
  }
}
