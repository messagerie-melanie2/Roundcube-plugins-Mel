import { EMPTY_STRING } from '../constants/constants.js';

export { BnumMessage, eMessageType };

/**
 * @class
 * @classdesc Contient des fonctions utiles pour afficher des messages sur le bnum
 * @static
 */
class BnumMessage {
  /**
   * @private
   */
  constructor() {
    throw 'Cannot be instantiate';
  }

  /**
   * Affiche un message sur le bnum
   * @param {string} message Message à afficher
   * @param {eMessageType} type Couleur ou icône lié au message
   * @returns {string}
   * @static
   */
  static DisplayMessage(message, type = eMessageType.Information) {
    return rcmail.display_message(message, type);
  }

  /**
   * Passe le bnum en mode "occupé" et affiche un message de chargement
   * @static
   */
  static SetBusyLoading() {
    if (!this.busy) {
      /**
       * @type {?string}
       */
      this.busy = rcmail.set_busy(true, 'loading');
    }
  }

  /**
   * Passe le bnum en mode "libre" et supprime le message de chargement
   * @static
   */
  static StopBusyLoading() {
    if (this.busy) {
      rcmail.set_busy(false, 'loading', this.busy);
      this.busy = null;
    }
  }
}

/**
 * Type de message
 * @enum {string}
 * @see {@link BnumMessage.DisplayMessage}
 */
const eMessageType = {
  Information: EMPTY_STRING,
  Confirmation: 'confirmation',
  Error: 'error',
  Warning: 'warning',
};
