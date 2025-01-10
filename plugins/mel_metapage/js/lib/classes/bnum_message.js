import { EMPTY_STRING } from '../constants/constants.js';
import { MelObject } from '../mel_object.js';

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
   * @type {rcube_webmail}
   * @readonly
   */
  static get Rcmail() {
    return MelObject.Empty().rcmail();
  }

  /**
   * Affiche un message sur le bnum
   * @param {string} message Message à afficher
   * @param {eMessageType} type Couleur ou icône lié au message
   * @returns {string}
   * @static
   */
  static DisplayMessage(message, type = eMessageType.Information) {
    return this.Rcmail.display_message(message, type);
  }

  /**
   * Affiche un message de chargement sur le Bnum
   * @returns {string} Id du message
   */
  static DisplayLoadingMessage() {
    return this.DisplayMessage('loading', 'loading');
  }

  /**
   * Supprime les messages du bnum
   * @returns {typeof BnumMessage} Chaînage
   * @static
   */
  static ClearMessages() {
    this.Rcmail.clear_messages();
    return this;
  }

  /**
   * Supprime un message sur le bnum à partir de son id.
   * @param {string} id Id du message
   * @returns {typeof BnumMessage} Chaînage
   * @static
   */
  static ClearMessage(id) {
    this.Rcmail.hide_message(id);
    return this;
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
      this.busy = this.Rcmail.set_busy(true, 'loading');
    }
  }

  /**
   * Passe le bnum en mode "libre" et supprime le message de chargement
   * @static
   */
  static StopBusyLoading() {
    if (this.busy) {
      this.Rcmail.set_busy(false, 'loading', this.busy);
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
