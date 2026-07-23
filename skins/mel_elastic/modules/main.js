import { MelObject } from '../../../plugins/mel_metapage/js/lib/mel_object.js';
import { ModuleLoader } from './loader.js';

/**
 * Point d'entrée de l'interface de la skin `mel_elastic`. Déclenche le
 * chargement des modules UI via le singleton `ModuleLoader` et s'expose
 * globalement sous le nom `BNUM_UI`.
 *
 * @extends MelObject
 */
export class MelElasticUI extends MelObject {
  /**
   * Stockage des modules UI chargés, retourné par `ModuleLoader.Instance.load()`.
   *
   * @type {import('../../../plugins/mel_metapage/js/lib/classes/base_storage.js').BaseStorage<import('./core/ABaseModule.js').ABaseModule>}
   */
  #_modules;

  constructor() {
    super();
    this.#_main();
  }

  /**
   * Charge les modules UI via le `ModuleLoader` singleton et expose
   * l'instance courante globalement sous le nom `BNUM_UI`.
   *
   * @private
   */
  #_main() {
    this.#_modules = ModuleLoader.Instance.load();

    this.export('BNUM_UI');
  }

  /**
   * Accesseur pour les modules UI chargés.
   *
   * @returns {import('../../../plugins/mel_metapage/js/lib/classes/base_storage.js').BaseStorage<import('./core/ABaseModule.js').ABaseModule>} Le stockage des modules UI chargés.
   * @readonly
   */
  get modules() {
    return this.#_modules;
  }

  /**
   * Fabrique statique instanciant et démarrant l'interface `mel_elastic`.
   *
   * @returns {MelElasticUI} La nouvelle instance de l'interface.
   */
  static Start() {
    return new MelElasticUI();
  }
}
