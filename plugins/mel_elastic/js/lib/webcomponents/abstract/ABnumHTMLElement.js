import { BaseStorage } from '../../../../../mel_metapage/js/lib/classes/base_storage.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';

/**
 * @callback BnumHTMLElementAttributeChangedCallback
 * @param {string} name - Nom de l'attribut modifié.
 * @param {?string} oldVal - Ancienne valeur de l'attribut.
 * @param {?string} newVal - Nouvelle valeur de l'attribut.
 * @returns {void}
 */

/**
 * Classe de base pour les composants bnum personnalisés.
 *
 * Fournit les méthodes de cycle de vie et de gestion des attributs pour les webcomponents.
 * @class
 * @extends HTMLElement
 * @abstract
 */
export default class ABnumHTMLElement extends HTMLElement {
  /**
   * Données mises en mémoire
   * @type {BaseStorage<any>}
   * @private
   */
  #_data = new BaseStorage();
  static #_NoItem = Symbol();
  /**
   * Retourne la liste des attributs observés par le composant.
   * @readonly
   * @returns {string[]} Liste des noms d'attributs à observer.
   */
  static get observedAttributes() {
    return this._p_observedAttributes();
  }

  /**
   * Méthode interne pour définir les attributs observés.
   *
   * Peut être surchargée par les classes dérivées.
   * @protected
   * @returns {string[]} Liste des attributs à observer.
   */
  static _p_observedAttributes() {
    return [];
  }

  /**
   * Constructeur du composant.
   *
   * Initialise le shadow DOM et l'événement de changement d'attribut.
   */
  constructor() {
    super();

    if (this._p_isShadowElement()) this.attachShadow({ mode: 'open' });
    /**
     * Événement déclenché lors d'un changement d'attribut.
     * @protected
     * @type {BnumEvent<BnumHTMLElementAttributeChangedCallback>}
     */
    this._p_on_attribute_changed = new BnumEvent();
  }

  /**
   * Callback appelée lors d'un changement d'attribut observé.
   * @param {string} name - Nom de l'attribut modifié.
   * @param {string|null} oldVal - Ancienne valeur de l'attribut.
   * @param {string|null} newVal - Nouvelle valeur de l'attribut.
   */
  attributeChangedCallback(name, oldVal, newVal) {
    this._p_on_attribute_changed.call(name, oldVal, newVal);
  }

  /**
   * Callback appelée lorsque le composant est ajouté au DOM.
   * Gère le préchargement, le rendu et l'attachement des événements.
   */
  connectedCallback() {
    this._p_preload();
    {
      const rendered = this._p_render();
      if (typeof rendered === 'string') {
        (this._p_isShadowElement() ? this.shadowRoot : this).innerHTML =
          `${this._p_style() || EMPTY_STRING}${rendered}`;
      }
    }
    this._p_attach();
  }

  /**
   * Callback appelée lorsque le composant est retiré du DOM.
   * Gère le pré-déchargement et le détachement des événements.
   */
  disconnectedCallback() {
    this._p_preunload();
    this._p_detach();
  }

  //#region Public
  data(
    name,
    value = ABnumHTMLElement.#_NoItem,
    { fromAttribute = false } = {},
  ) {
    var returnValue;
    if (value === ABnumHTMLElement.#_NoItem)
      returnValue = this.#_getData(name, fromAttribute);
  }
  //#endregion

  #_getData(name, fromAttribute) {
    var data = EMPTY_STRING;

    if (fromAttribute) data = this.getAttribute(`data-${name}`);
    else {
      if (this._p_hasData(name)) data = this._p_getData(name);
      else {
        data = this.#_getData(name, true);
        this.removeAttribute(`data-${name}`);
        this._p_setData(data);
      }
    }

    return data;
  }

  #_setData(name, value, fromAttribute) {}

  //#region Protected
  /**
   * Recupère une donnée depuis les données en mémoire
   * @param {string} name Nom de la donnée à récupérée
   * @returns {T}
   * @template T
   * @protected
   */
  _p_getData(name) {
    return this.#_data.get(name);
  }

  /**
   * Met une donnée dans les données en mémoire
   * @param {string} name Nom de la donnée à récupérée
   * @param {T} value Valeur à mettre en mémoire
   * @returns {this}
   * @template T
   * @protected
   */
  _p_setData(name, value) {
    this.#_data.add(name, value);
    return this;
  }

  _p_hasData(name) {
    return this.#_data.has(name);
  }
  //#endregion

  //#region Virtual

  /**
   * Méthode interne pour fournir le style du composant.
   * Peut être surchargée.
   * @protected
   * @returns {string} Le style CSS à appliquer.
   */
  _p_style() {
    return EMPTY_STRING;
  }

  /**
   * Méthode appelée avant le rendu du composant.
   * Peut être surchargée.
   * @protected
   */
  _p_preload() {}

  /**
   * Méthode interne pour générer le HTML du composant.
   * Peut être surchargée.
   * @protected
   * @returns {string} Le HTML à afficher dans le shadow DOM.
   */
  _p_render() {
    return EMPTY_STRING;
  }

  /**
   * Méthode appelée après le rendu pour attacher des événements ou des comportements.
   * Peut être surchargée.
   * @protected
   */
  _p_attach() {}

  /**
   * Méthode appelée avant le retrait du composant du DOM.
   * Peut être surchargée.
   * @protected
   */
  _p_preunload() {}

  /**
   * Méthode appelée pour détacher les événements ou comportements lors du retrait du composant.
   * Peut être surchargée.
   * @protected
   */
  _p_detach() {}
  /**
   * Indique si l'élément est un élément de type Shadow DOM.
   * @returns {boolean}
   * @protected
   */
  _p_isShadowElement() {
    return true;
  }

  //#endregion
}
