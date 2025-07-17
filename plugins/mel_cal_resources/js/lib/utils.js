import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';

/**
 * @class
 * @classdesc Classe qui contient les fonctions utilitaires pour les ressources.
 * @hideconstructor
 */
class Utils {
  constructor() {
    throw new Error('This is a static class');
  }

  /**
   * Récupère une option via l'attribut `data-description`.
   * @param {string} description - Description de la ressource.
   * @param {Object} [options] - Options supplémentaires.
   * @param {?string} [options.resource=null] - Type de ressource à cibler.
   * @returns {?HTMLOptionElement} L'élément option correspondant ou null si non trouvé.
   */
  static GetOptionByDescription(description, { resource = null } = {}) {
    return document.querySelector(
      `.mel-dialog-page${this.#_GetResourceSelector(resource)} select option[data-description="${description.toUpperCase()}"]`,
    );
  }

  /**
   * Récupère une option via l'attribut `data-postalcode`.
   * @param {string} code - Code postal de la ressource.
   * @param {Object} [options] - Options supplémentaires.
   * @param {?string} [options.resource=null] - Type de ressource à cibler.
   * @returns {?HTMLOptionElement} L'élément option correspondant ou null si non trouvé.
   */
  static GetOptionByPostalCode(code, { resource = null } = {}) {
    return document.querySelector(
      `.mel-dialog-page${this.#_GetResourceSelector(resource)} select option[data-postalcode="${code}"]`,
    );
  }

  /**
   * Génère le sélecteur CSS pour cibler une ressource spécifique.
   * @private
   * @param {?string} resource - Type de ressource à cibler.
   * @returns {string} Sélecteur CSS pour la ressource ou chaîne vide.
   */
  static #_GetResourceSelector(resource) {
    return resource ? ` [data-resourcetype="${resource}"]` : EMPTY_STRING;
  }
}

export default Utils;
