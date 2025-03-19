export {CursorUtils};

/**
 * Classe utilitaire pour la gestion des curseurs dans l'application.
 * Fournit des méthodes pour modifier dynamiquement le style du curseur sur la page.
 */
class CursorUtils {

  /**
   * Élément body stocké sous forme d'objet jQuery pour éviter les appels répétitifs.
   * Chargé de manière différée lors du premier accès.
   * @type {jQuery|null}
   */
  static #_body = null;

  /**
   * Récupère le body en tant qu'objet jQuery
   */
  static get Body() {
    if (!this.#_body) this.#_body = $('body');
    return this.#_body;
  }

  /**
   * Définit le curseur sur "wait" (chargement)
   */
  static SetLoadingCursor() {
    this.SetCursor('wait');
  }

  /**
   * Réinitialise le curseur à son état par défaut
   */
  static ResetCursor() {
    this.SetCursor('');
  }

  /**
   * Définit un curseur personnalisé
   * @param {string} cursorType - Type de curseur CSS (ex: 'pointer', 'progress', 'crosshair')
   */
  static SetCursor(cursorType) {
    this.Body.css('cursor', cursorType);
  }
}