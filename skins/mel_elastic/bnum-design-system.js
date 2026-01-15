/**
 * Point d'entrée pour le Design System Bnum.
 * Gère l'initialisation des bridges du design system.
 */
import { MelObject } from '../../plugins/mel_metapage/js/lib/mel_object.js';
import BridgeMail from './design-system/bridges/BridgeMail.js';

/**
 * Classe singleton permettant de démarrer les bridges du design system.
 * @class
 * @extends MelObject
 */
class DsBridge extends MelObject {
  /**
   * Instance unique de DsBridge (singleton).
   * @type {DsBridge}
   * @private
   */
  static #_instance = null;

  /**
   * Retourne l'instance unique de DsBridge.
   * @returns {DsBridge}
   */
  static get Instance() {
    return (this.#_instance ??= new DsBridge());
  }

  /**
   * Indique si le design system a déjà été démarré.
   * @type {boolean}
   * @private
   */
  #_started = false;

  /**
   * Liste des bridges à initialiser.
   * @type {import("./design-system/bridges/ABridge.js").default[]}
   * @private
   */
  #_bridges = [BridgeMail];

  constructor() {
    super();
  }

  /**
   * Tente de démarrer le design system.
   * Initialise tous les bridges si ce n'est pas déjà fait.
   * @returns {boolean} true si le démarrage a eu lieu, false sinon.
   */
  TryStart() {
    if (this.#_started) return false;

    for (const bridge of this.#_bridges) {
      bridge.Start();
    }

    this.#_started = true;
    return true;
  }
}

/**
 * Démarrage automatique du design system à l'import du fichier.
 */
DsBridge.Instance.TryStart();
