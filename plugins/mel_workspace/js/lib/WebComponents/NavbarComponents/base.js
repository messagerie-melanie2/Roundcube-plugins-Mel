import { BaseStorage } from '../../../../../mel_metapage/js/lib/classes/base_storage.js';
import {
  EWebComponentMode,
  HtmlCustomTag,
} from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
export { NavBarComponent };

/**
 * @class
 * @classdesc
 * @extends HtmlCustomTag
 * @abstract
 */
class NavBarComponent extends HtmlCustomTag {
  /**
   * Contient les données des data
   * @private
   * @type {BaseStorage<string>}
   */
  #data = new BaseStorage();
  /**
   * NavBar parente. Si elle n'a pas été définie, renvoie `null`.<br/>
   *
   * Considérez qu'elle n'est jamais null.
   * @type {?WspNavBar}
   * @private
   */
  #parent = null;

  /**
   * La classe contient des aides utiles pour les composants de la barre de navagation.
   * @param {Object} [param0={}] Contient le mode ainsi que le parent.
   * @param {EWebComponentMode} [param0.mode=EWebComponentMode.span] Mode du composant
   * @param {?WspNavBar} [param0.parent=null] NavBar parente
   */
  constructor({ mode = EWebComponentMode.span, parent = null } = {}) {
    super({ mode });

    this._p_save_into_data('mode', mode);
    this.#parent = parent;
  }

  /**
   * Récupère la navbar parente
   * @returns {WspNavBar}
   */
  get parent() {
    return this.#parent;
  }

  _p_main() {
    switch (this._p_get_data('mode')) {
      case EWebComponentMode.div:
        this.style.display = 'block';
        break;

      case EWebComponentMode.flex:
        this.style.display = 'flex';
        break;

      case EWebComponentMode.inline_block:
        this.style.display = 'inline-block';
        break;

      default:
        break;
    }

    return super._p_main();
  }

  /**
   * Récupère l'élément ou le shadowroot si le data-shadow est activé. <br/>
   *
   * Si le parent est défini, le shaodw dom sera toujours inactif.
   * @protected
   * @returns {this | ShadowRoot}
   */
  _p_start_construct() {
    return !!this.parent ? this : super._p_start_construct();
  }

  /**
   * Récupère une data en mémoire et supprime l'attribut à la première récupération.
   * @param {string} dataName data. Pas de tirets.
   * @returns {string} Data en mémoire
   * @protected
   */
  _p_get_data(dataName) {
    if (!this.#data.has(dataName)) {
      this.#data.add(dataName, this.data(dataName));
      this.removeAttribute(`data-${dataName}`);
    }

    return this.#data.get(dataName);
  }

  _p_save_into_data(dataName, value) {
    this.#data.add(dataName, value);

    return this;
  }

  destroy() {
    super.destroy();

    this.#data.clear();
    this.#data = null;
    this.#parent = null;
  }

  /**
   * Set la navbar parent
   * @param {WspNavBar} parent
   */
  setNavBarParent(parent) {
    this.#parent = parent;
    return this;
  }
}
