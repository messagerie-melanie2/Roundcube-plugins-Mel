import { BaseStorage } from '../../../../../mel_metapage/js/lib/classes/base_storage.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events.js';

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

    const script = this.querySelector('script');
    if (script) script.remove();
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
    this.render();
  }

  /**
   * Callback appelée lorsque le composant est retiré du DOM.
   * Gère le pré-déchargement et le détachement des événements.
   */
  disconnectedCallback() {
    this._p_preunload();
    this._p_detach();
  }

  render() {
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

  //#region Public
  /**
   * Récupère une donnée ou la définit pour le composant.
   *
   * Si `value` est fourni, la donnée est définie et le composant est retourné.
   *
   * Si `value` n'est pas fourni, la donnée est récupérée.
   *
   * Si `fromAttribute` est `true`, la donnée est récupérée depuis l'attribut `data-{name}` ou stockée dans l'attribut `data-{name}`.
   *
   * Sinon, elle est récupérée ou stockée dans les données en mémoire.
   * @param {*} name
   * @param {Object} [param1={}]
   * @param {T | symbol} [param1.value=ABnumHTMLElement.#_NoItem]
   * @param {boolean} [param1.fromAttribute=false]
   * @returns {T | this}
   * @template T
   */
  data(
    name,
    { value = ABnumHTMLElement.#_NoItem, fromAttribute = false } = {},
  ) {
    var returnValue = null;

    if (value === ABnumHTMLElement.#_NoItem)
      returnValue = this.#_getData(name, fromAttribute);
    else {
      this.#_setData(name, value, fromAttribute);
      returnValue = this;
    }

    return returnValue;
  }

  // --- jQuery-like methods ---

  /**
   * Ajoute une ou plusieurs classes à l'élément.
   * @param {...string} classNames
   * @returns {this}
   */
  addClass(...classNames) {
    this.classList.add(...classNames.flatMap((c) => c.split(' ')));
    return this;
  }

  /**
   * Retire une ou plusieurs classes à l'élément.
   * @param {...string} classNames
   * @returns {this}
   */
  removeClass(...classNames) {
    this.classList.remove(...classNames.flatMap((c) => c.split(' ')));
    return this;
  }

  /**
   * Bascule une classe sur l'élément.
   * @param {string} className
   * @param {boolean} [force]
   * @returns {this}
   */
  toggleClass(className, force) {
    this.classList.toggle(className, force);
    return this;
  }

  /**
   * Vérifie si l'élément possède une classe.
   * @param {string} className
   * @returns {boolean}
   */
  hasClass(className) {
    return this.classList.contains(className);
  }

  /**
   * Obtient ou définit un attribut.
   * @param {string} name
   * @param {string} [value]
   * @returns {string|this}
   */
  attr(name, value) {
    if (arguments.length === 1) return this.getAttribute(name);
    this.setAttribute(name, value);
    return this;
  }

  /**
   * Obtient ou définit le style CSS.
   * @param {string|Object} prop
   * @param {string} [value]
   * @returns {string|this}
   */
  css(prop, value) {
    if (typeof prop === 'string') {
      if (arguments.length === 1) return this.style[prop];
      this.style[prop] = value;
    } else if (typeof prop === 'object') {
      for (const [k, v] of Object.entries(prop)) {
        this.style[k] = v;
      }
    }
    return this;
  }

  /**
   * Obtient ou définit le HTML de l'élément.
   * @param {string} [value]
   * @returns {string|this}
   */
  html(value) {
    if (arguments.length === 0) return this.innerHTML;
    this.innerHTML = value;
    return this;
  }

  /**
   * Obtient ou définit le texte de l'élément.
   * @param {string} [value]
   * @returns {string|this}
   */
  text(value) {
    if (arguments.length === 0) return this.textContent;
    this.textContent = value;
    return this;
  }

  /**
   * Obtient ou définit la valeur de l'élément (pour input, select, textarea).
   * @param {string} [value]
   * @returns {string|this}
   */
  val(value) {
    if ('value' in this) {
      if (arguments.length === 0) return this.value;
      this.value = value;
      return this;
    }
    return undefined;
  }

  /**
   * Ajoute un écouteur d'événement.
   * @param {string} type
   * @param {Function} listener
   * @param {Object|boolean} [options]
   * @returns {this}
   */
  on(type, listener, options) {
    this.addEventListener(type, listener, options);
    return this;
  }

  /**
   * Retire un écouteur d'événement.
   * @param {string} type
   * @param {Function} listener
   * @param {Object|boolean} [options]
   * @returns {this}
   */
  off(type, listener, options) {
    this.removeEventListener(type, listener, options);
    return this;
  }

  /**
   * Déclenche un événement.
   * @param {string} type
   * @param {Object} [detail]
   * @returns {this}
   */
  trigger(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
    return this;
  }

  /**
   * Ajoute du contenu ou des éléments à la fin de l'élément courant.
   * @param {...(Node|string)} nodes
   * @returns {this}
   */
  append(...nodes) {
    for (const node of nodes) {
      if (typeof node === 'string') {
        this.insertAdjacentHTML('beforeend', node);
      } else {
        this.appendChild(node);
      }
    }

    return this;
  }

  /**
   * Ajoute l'élément courant à la fin de la cible.
   * @param {Element} target
   * @returns {this}
   */
  appendTo(target) {
    if (target && typeof target.appendChild === 'function') {
      target.appendChild(this);
    }
    return this;
  }

  /**
   * Ajoute du contenu ou des éléments au début de l'élément courant.
   * @param {...(Node|string)} nodes
   * @returns {this}
   */
  prepend(...nodes) {
    for (let len = nodes.length, index = len; index > 0; --index) {
      const node = nodes[index];
      if (typeof node === 'string') {
        this.insertAdjacentHTML('afterbegin', node);
      } else {
        this.insertBefore(node, this.firstChild);
      }
    }
    return this;
  }

  /**
   * Ajoute l'élément courant au début de la cible.
   * @param {Element} target
   * @returns {this}
   */
  prependTo(target) {
    if (target && typeof target.insertBefore === 'function') {
      target.insertBefore(this, target.firstChild);
    }
    return this;
  }

  /**
   * Insère du contenu ou des éléments juste avant l'élément courant.
   * @param {...(Node|string)} nodes
   * @returns {this}
   */
  before(...nodes) {
    for (const node of nodes) {
      if (typeof node === 'string') {
        this.insertAdjacentHTML('beforebegin', node);
      } else if (this.parentNode) {
        this.parentNode.insertBefore(node, this);
      }
    }

    return this;
  }

  /**
   * Insère du contenu ou des éléments juste après l'élément courant.
   * @param {...(Node|string)} nodes
   * @returns {this}
   */
  after(...nodes) {
    for (let len = nodes.length, index = len; index > 0; --index) {
      const node = nodes[index];

      if (typeof node === 'string') {
        this.insertAdjacentHTML('afterend', node);
      } else if (this.parentNode) {
        if (this.nextSibling) {
          this.parentNode.insertBefore(node, this.nextSibling);
        } else {
          this.parentNode.appendChild(node);
        }
      }
    }

    return this;
  }
  //#endregion

  //#region Private
  #_getData(name, fromAttribute) {
    var data = EMPTY_STRING;

    if (fromAttribute) data = this.getAttribute(`data-${name}`);
    else {
      if (this.hasAttribute(`data-${name}`)) {
        data = this.#_getData(name, true);
        this.removeAttribute(`data-${name}`);
        this._p_setData(name, data);
      } else data = this._p_getData(name);
    }

    return data;
  }

  #_setData(name, value, fromAttribute) {
    if (fromAttribute) this.setAttribute(`data-${name}`, value);
    else this._p_setData(name, value);

    return this;
  }
  //#endregion

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

  /**
   * Crée une instance de l'élément.
   *
   * Doit être implémentée dans les classes dérivées.
   * @returns {ABnumHTMLElement} Instance de l'élément créé.
   * @throws {Error} Si la méthode n'est pas implémentée dans la classe dérivée.
   * @static
   * @abstract
   */
  static Create() {
    throw new Error('Create method must be implemented in derived class.');
  }

  /**
   * Retourne le nom de la balise HTML associée à ce composant.
   *
   * Doit être implémentée dans les classes dérivées.
   * @type {string}
   * @throws {Error} Si la propriété n'est pas implémentée dans la classe dérivée.
   * @static
   * @abstract
   * @readonly
   */
  static get TAG() {
    throw new Error('TAG getter must be implemented in derived class.');
  }

  /**
   * Défini un élément si il n'a pas été défini.
   */
  static TryDefine() {
    this.TryDefineElement(this.TAG, this);
  }

  /**
   * Défini un élément si il n'a pas été défini.
   * @template {ABnumHTMLElement} T
   * @param {string} tag Tag de l'élément custom
   * @param {new (...args: any[]) => T} constructor Constructeur de l'élément (doit hériter de ABnumHTMLElement)
   */
  static TryDefineElement(tag, constructor) {
    if (!customElements.get(tag)) customElements.define(tag, constructor);
  }
}
