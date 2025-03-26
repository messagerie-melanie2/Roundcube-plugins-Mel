import { BaseStorage } from '../../../../classes/base_storage.js';
import { HtmlCustomTag } from '../js_html_base_web_elements.js';

/**
 * @class
 * @classdesc Classe de base pour les composant d'un webcomponent
 * @abstract
 */
export default class AHTMLComponent {
  /**
   * @type {import('../js_html_base_web_elements.js').HtmlCustomDataTag}
   * @private
   */
  #_parent;
  /**
   * @type {BaseStorage<string | boolean | number>}
   * @private
   */
  #_data;
  /**
   *
   * @param {import('../js_html_base_web_elements.js').HtmlCustomDataTag} parent Element qui contient les données du composant
   */
  constructor(parent) {
    this.#_parent = parent;
    this.#_data = new BaseStorage();
  }

  /**
   * @description Méthode d'initialisation du composant
   * @abstract
   */
  setup(...args) {}

  /**
   * @description Méthode appelée lorsqu'un attribut est mis à jour
   * @param {string} name
   * @param {string} value
   * @abstract
   */
  attributeUpdated(name, value) {}

  /**
   * Récupère les données du composant
   * @param {string} key Clé de la donnée à récupérer
   * @returns {?(string | number | boolean )} Valeur de la donnée
   */
  getData(key) {
    var returnValue = null;
    const data = `data-${key}`;
    if (this.#_data.has(key)) returnValue = this.#_data.get(key);
    else if (this.#_parent.hasAttribute(data)) {
      const value = this.#_parent.getAttribute(data);
      this.#_data.add(key, value);
      this.#_parent.removeAttribute(data);
      returnValue = value;
    }

    return returnValue;
  }

  /**
   * @protected
   * @returns {import('../js_html_base_web_elements.js').HtmlCustomDataTag}
   */
  _p_parent() {
    return this.#_parent;
  }

  /**
   * @protected
   * @param {string} key
   * @param {any} value
   * @returns {this}
   */
  _p_save_data(key, value) {
    this.#_data.add(key, value);
    return this;
  }

  /**
   * Désactive un élément
   * @returns {import('../js_html_base_web_elements.js').HtmlCustomDataTag}
   */
  disable() {
    return HtmlCustomTag.Disable(this.#_parent);
  }

  /**
   * Active un élément
   * @returns {import('../js_html_base_web_elements.js').HtmlCustomDataTag}
   */
  enable() {
    return HtmlCustomTag.Enable(this.#_parent);
  }
}
