/**
 * Classe utilitaire pour détecter le navigateur Internet utilisé.
 * @class
 * @hideconstructor
 * @static
 */
export class InternetNavigator {
  /**
   * Vérifie si le navigateur est Firefox.
   * @returns {boolean}
   */
  static IsFirefox() {
    return typeof InstallTrigger !== 'undefined';
  }

  /**
   * Vérifie si le navigateur est basé sur Chromium.
   * @returns {boolean}
   */
  static IsChromium() {
    return !!window.chrome;
  }
}
