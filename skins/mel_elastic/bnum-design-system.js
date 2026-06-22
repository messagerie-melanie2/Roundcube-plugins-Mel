/**
 * Point d'entrée pour le Design System Bnum.
 * Gère l'initialisation des bridges du design system.
 */
import { BnumLog } from '../../plugins/mel_metapage/js/lib/classes/bnum_log.js';
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

function checkUndefinedComponents() {
  const undefined_elements = document.querySelectorAll(':not(:defined)');

  if (undefined_elements.length > 0) {
    BnumLog.warning(
      'windows/load',
      `${undefined_elements.length} composants non upgradés, correction...`,
    );
    customElements.upgrade(document.body);

    document.querySelectorAll(':not(:defined)').forEach((el) => {
      BnumLog.error(
        'windows/load',
        `Composant non enregistré : <${el.localName}>`,
      );
    });
  } else {
    BnumLog.info('windows/load', 'Tous les composants sont définis.');
  }
}

// Si load est déjà passé quand le module s'exécute → appel direct
if (document.readyState === 'complete') {
  BnumLog.warning('windows/load', 'load déjà passé, appel direct');
  checkUndefinedComponents();
} else {
  window.addEventListener('load', checkUndefinedComponents, { once: true });
}
