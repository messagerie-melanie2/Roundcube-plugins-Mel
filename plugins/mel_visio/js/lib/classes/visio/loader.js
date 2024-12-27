export { VisioLoader };

/**
 * Gère l'affichage du loader de la visio
 * @module Visio/Loader
 * @local VisioLoader
 */

/**
 * @class
 * @classdesc Gère le loader de la visio
 */
class VisioLoader {
  /**
   * Initialise la classe
   * @param {string} selector Selecteur du loader
   */
  constructor(selector) {
    this._init()._setup(selector);
  }

  /**
   * @private
   */
  _init() {
    /**
     * Loader
     * @type {external:jQuery}
     * @readonly
     */
    this.loader = null;

    return this;
  }

  /**
   * @private
   */
  _setup(selector) {
    Object.defineProperty(this, 'loader', {
      get() {
        return $(selector);
      },
    });

    return this;
  }

  /**
   * Met à jours le texte du loader
   * @param {string} text Nouveau texte
   * @returns {VisioLoader} Chaînage
   */
  update_text(text) {
    this.loader.html(text);
    return this;
  }

  /**
   * Supprime le loader
   */
  destroy() {
    let $to_destroy = this.loader.parent();

    if (!$to_destroy.hasClass('absolute-center')) $to_destroy = this.loader;

    $to_destroy.remove();

    $to_destroy = null;
  }
}
