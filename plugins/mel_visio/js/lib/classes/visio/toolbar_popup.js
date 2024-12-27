import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';

export { ToolbarPopup };

/**
 * Contient la clase qui gère les popup de la visio
 * @module Visio/Toolbar/Popup
 * @local ToolbarPopup
 */

/**
 * @class
 * @classdesc Gère et représente un popup de la toolbar de la visio (Notemment pour le micro et la vidéo par ex.)
 */
class ToolbarPopup {
  /**
   * Construit la popup à partir d'une div parente et du contenu en jshtml
   * @param {external:jQuery} $parent Div parente
   * @param {?____JsHtml} [jscontent=null] Contenu de la popup
   * @frommoduleparam JsHtml jscontent
   */
  constructor($parent, jscontent = null) {
    /**
     * Popup
     * @type {external:jQuery}
     * @readonly
     */
    this.$popup = null;
    /**
     * Contenu de la popup
     * @type {external:jQuery}
     * @readonly
     */
    this.$content = null;

    let _$generated = this._generate_toolbar($parent, jscontent);

    Object.defineProperties(this, {
      $popup: {
        get() {
          return _$generated;
        },
      },
      $content: {
        get() {
          return _$generated.find('.toolbar-data');
        },
      },
    });
  }

  /**
   * Met à jours le contenu de la popup
   * @param {____JsHtml} jscontent Nouveau contenu de la popup
   * @returns {ToolbarPopup} Chaîne
   * @frommoduleparam JsHtml jscontent
   */
  update_content(jscontent) {
    this.$content.html(jscontent.generate());
    return this;
  }

  /**
   * Défini le tag de la popup
   * @param {string} tag
   * @returns {ToolbarPopup} Chaîne
   */
  set_tag(tag) {
    this.$popup.data('tag', tag);
    return this;
  }

  /**
   * Vérifie si la popup à un tag précis
   * @param {string} tag
   * @returns {boolean}
   */
  has_tag(tag) {
    return this.$popup.data('tag') === tag;
  }

  /**
   * Cache la popup
   * @returns {ToolbarPopup} Chaîne
   */
  hide() {
    this.$popup.css('display', 'none');
    return this;
  }

  /**
   * Affiche la popup
   * @returns {ToolbarPopup} Chaîne
   */
  show() {
    this.$popup.css('display', EMPTY_STRING);
    return this;
  }

  /**
   * Génère la popup
   * @param {external:jQuery} $parent Div parent
   * @param {____JsHtml} jscontent COntenu de la popup
   * @returns {external:jQuery} Frame générée
   * @package
   * @frommoduleparam JsHtml jscontent
   */
  _generate_toolbar($parent, jscontent) {
    //prettier-ignore
    let jshtml =  MelHtml.start
    .div({ class:'toolbar-popup large-toolbar' })
      .div({ class:'toolbar-data' });

    if (jscontent) jshtml = jshtml.add_child(jscontent);

    return jshtml.end().end().generate().appendTo($parent);
  }

  /**
   * Vérifie si la popup est visible
   * @returns {boolean}
   */
  is_show() {
    return this.$popup.css('display') !== 'none';
  }

  /**
   * Supprime la popup
   * @returns {null}
   */
  destroy() {
    this.$popup.remove();
    return null;
  }
}
