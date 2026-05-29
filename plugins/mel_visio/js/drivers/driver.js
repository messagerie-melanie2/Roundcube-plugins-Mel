import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

/**
 * @typedef {Object} VisioAction
 * @property {string} text   Libellé du bouton
 * @property {string} icon   Icône du bouton
 * @property {string} action Action déclenchée au clic
 */

/**
 * Classe abstraite de base pour les drivers du module mel_visio (côté JS).
 *
 * Un driver permet d'étendre ou de personnaliser le comportement du module
 * de visioconférence sans modifier le code source principal. Il peut :
 * - exécuter une logique d'initialisation custom via {@link _p_main}
 * - modifier le bouton de création de visio via {@link _p_updateCreateVisioButton}
 *
 * Ne pas instancier directement : utiliser {@link ADriver.Start}.
 *
 * @abstract
 * @extends MelObject
 *
 * @example
 * class MonDriver extends ADriver {
 *   _p_main() {
 *     console.log('driver initialisé !');
 *   }
 *
 *   _p_updateCreateVisioButton(visio) {
 *     return { ...visio, text: 'Ma visio' };
 *   }
 * }
 *
 * MonDriver.Start();
 */
export class ADriver extends MelObject {
  constructor() {
    super();
  }

  /**
   * Initialise le driver.
   *
   * Appelle {@link _p_main} pour la logique custom, puis
   * {@link #_updateCreateVisioButton} pour brancher l'écouteur
   * de modification du bouton si nécessaire.
   *
   * @returns {void}
   */
  #_init() {
    this._p_main();
    this.#_updateCreateVisioButton();
  }

  /**
   * Branche l'écouteur roundcube `mel_metapage.create.actions`
   * si et seulement si la sous-classe a surchargé {@link _p_updateCreateVisioButton}
   * avec une implémentation non vide.
   *
   * Lorsque l'événement est déclenché, l'action `visio` du menu
   * de création est passée au driver qui peut la modifier.
   *
   * @returns {void}
   */
  #_updateCreateVisioButton() {
    if (
      typeof this._p_updateCreateVisioButton === 'function' &&
      !this.#_isEmptyMethod('_p_updateCreateVisioButton')
    ) {
      this.listen('mel_metapage.create.actions', (args) => {
        const { actions } = args;
        actions.visio =
          this._p_updateCreateVisioButton(actions.visio) || actions.visio;
        args.actions = actions;
        return args;
      });
    }
  }

  /**
   * Vérifie si une méthode de l'instance a un corps vide.
   *
   * Utilisé en interne pour ne pas brancher d'écouteur inutile
   * lorsque la sous-classe n'a pas surchargé un hook.
   *
   * @param {string} methodName Nom de la méthode à inspecter
   * @returns {boolean} `true` si la méthode est vide ou inexistante, `false` sinon
   */
  #_isEmptyMethod(methodName) {
    const fn = this[methodName];
    if (typeof fn !== 'function') return true;

    const body = fn
      .toString()
      .replace(/^[^{]*{/, EMPTY_STRING)
      .replace(/}[^}]*$/, EMPTY_STRING)
      .replace(/\/\/[^\n]*/g, EMPTY_STRING)
      .replace(/\/\*[\s\S]*?\*\//g, EMPTY_STRING)
      .trim();

    return body === EMPTY_STRING;
  }

  /**
   * Hook d'initialisation du driver.
   *
   * Surcharger cette méthode pour exécuter de la logique au démarrage
   * (écoutes d'événements, appels HTTP, modification du DOM, etc.).
   * Ne pas appeler directement : déclenché automatiquement par {@link ADriver.Start}.
   *
   * @returns {void}
   */
  _p_main() {}

  /**
   * Hook de modification du bouton de création de visioconférence.
   *
   * Surcharger cette méthode pour personnaliser le bouton (libellé, icône, action).
   * Si la méthode n'est pas surchargée (corps vide), aucun écouteur n'est branché.
   *
   * @param {VisioAction} visio Configuration actuelle du bouton visio
   * @returns {VisioAction} Configuration modifiée ou identique
   */
  _p_updateCreateVisioButton(visio) {
    return visio;
  }

  /**
   * Crée une instance du driver, l'initialise et la retourne.
   *
   * Point d'entrée unique pour utiliser un driver.
   * Appelle {@link #_init} après l'instanciation.
   *
   * @returns {this} Instance initialisée du driver
   * @static
   *
   * @example
   * const driver = MonDriver.Start();
   */
  static Start() {
    const object = new this();
    object.#_init();
    return object;
  }
}
