/**
 * @class
 * @classdesc Class qui contient les fonctions utiles pour les ressources
 * @hideconstructor
 */
class Utils {
  constructor() {
    throw new Error('This is a static class');
  }

  /**
   * Récupère une option via le `data-description`
   * @param {string} description Description de la ressource
   * @returns {?HTMLOptionElement}
   */
  static GetOptionByDescription(description) {
    return document.querySelector(
      `.mel-dialog-page select option[data-description="${description.toUpperCase()}"]`,
    );
  }

  /**
   * Récupère une option via le `data-postalcode`
   * @param {string} code Code postal de la ressource
   * @returns {?HTMLOptionElement}
   */
  static GetOptionByPostalCode(code) {
    return document.querySelector(
      `.mel-dialog-page select option[data-postalcode="${code}"]`,
    );
  }
}

export default Utils;
