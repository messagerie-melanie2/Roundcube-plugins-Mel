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
   * @param {string} description Description de la resosurce
   * @returns {external:jQuery}
   */
  static GetOptionByDescription(description) {
    return $(
      `.mel-dialog-page select option[data-description="${description.toUpperCase()}"]`,
    );
  }
}

export default Utils;
