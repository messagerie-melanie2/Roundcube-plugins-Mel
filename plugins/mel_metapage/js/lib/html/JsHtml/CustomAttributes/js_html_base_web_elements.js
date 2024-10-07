import { MaterialIcon } from '../../../icons.js';
export {
  HtmlCustomTag,
  BnumHtmlIcon,
  BnumHtmlSrOnly,
  BnumHtmlSeparate,
  BnumHtmlFlexContainer,
  BnumHtmlCenteredFlexContainer,
  EWebComponentMode,
};

/**
 * Contient des webcomponents de base ainsi que la classe parente.
 * @module WebComponents/Base
 * @local HtmlCustomTag
 * @local BnumHtmlIcon
 * @local EWebComponentMode
 */

/**
 * @callback LocalizationCallback
 * @param {string} text Texte à traduire
 * @returns {string} Texte traduit ou non
 */

/**
 * @class
 * @classdesc Classse de base pour les Webcomposants.
 * @extends HTMLElement
 * @abstract
 * @see {@link https://developer.mozilla.org/fr/docs/Web/API/Web_components/Using_shadow_DOM}
 */
class HtmlCustomTag extends HTMLElement {
  /**
   * Mode du composant, cad, son type de display par défaut.
   * @private
   * @type {EWebComponentMode}
   * @default eMode.span
   */
  #mode = EWebComponentMode.span;
  /**
   * Le shadow-dom est complètement optionnel et doit être voulu par "data-shadow=true".
   *
   * Si le shadow dom est activé, c'est le composant qui doit gérer son style et son affichage.
   *
   * Contient diverses fonctions utiles, les webcomposants doivent hériter de cette classe.
   * @param {Object} [param={}] Paramètres optionnes pour les enfants de cette classe.
   * @param {EWebComponentMode} [param.mode=EWebComponentMode.span] Mode du composant, cad son type d'affichage par défaut.
   */
  constructor({ mode = EWebComponentMode.span } = {}) {
    super();

    this.#mode = mode ?? EWebComponentMode.span;
    /**
     * Cet element en jQuery
     * @readonly
     * @type {external:jQuery}
     */
    this.$ = null;
    /**
     * Element sur lequel on doit ajouter des nodes enfants.
     *
     * Si le shadow dom est activé, ils seront ajoutés au shadow root, sinon à ce composant.
     * @readonly
     * @type {ShadowRoot | this}
     * @see {@link https://developer.mozilla.org/fr/docs/Web/API/Web_components/Using_shadow_DOM}
     */
    this.navigator = null;

    Object.defineProperty(this, 'navigator', {
      get: () => (this.shadowEnabled() ? this.shadowRoot : this),
    });

    Object.defineProperty(this, '$', {
      get: () => $(this),
    });
  }

  /**
   * Est appelé par le navigateur lorsque le composant est affiché.
   *
   * Gère dans un premier temps le mode puis appèle le setup enfant.
   * @see {@link _p_main}
   */
  connectedCallback() {
    switch (this.#mode) {
      case EWebComponentMode.div:
        this.setAttribute('component-mode', 'div');
        break;

      case EWebComponentMode.flex:
        this.setAttribute('component-mode', 'flex');
        break;

      case EWebComponentMode.inline_block:
        this.setAttribute('component-mode', 'inline-block');
        break;

      default:
        break;
    }

    this._p_main();
  }

  /**
   * Est appelé lorsque le composant est détruit.
   *
   * Permet de libérer des données.
   * @see {@link destroy}
   */
  disconnectedCallback() {
    this.destroy();
  }

  /**
   * Doit être surchargée par les classe fille.
   *
   * C'est ici que les instructions de setup doivent être mises.
   * @protected
   * @returns {this} Chaîne
   */
  _p_main() {
    return this;
  }

  /**
   * Créer un shadoroot si le shadow dom est activé. Sinon, renvoie `this`.
   * @protected
   * @returns {ShadowRoot | this}
   */
  _p_start_construct() {
    return this.shadowEnabled() ? this.attachShadow({ mode: 'open' }) : this;
  }

  /**
   * Vérifie si le shadow-dom est activé ou non.
   * @returns {boolean}
   */
  shadowEnabled() {
    return this.data('shadow') === 'true';
  }

  /**
   * Récupère une donnée "data" de l'élement.
   *
   * Si la valeur n'est pas défini, retourne la valeur du "data".
   * @param {string} key Clé de la data
   * @param {?any} [value=null] Valeur de la donnée. Si null, retourne la donnée.
   * @returns {HtmlCustomTag | any}
   */
  data(key, value = null) {
    if (value !== null && value !== undefined) {
      this.setAttribute(`data-${key}`, value);
      return this;
    } else return this.dataset[key];
  }

  /**
   * Vérfie si l'élement à une certaine classe.
   * @param {string} className Classe à tester
   * @returns {boolean}
   */
  hasClass(className) {
    return this.classList.contains(className);
  }

  /**
   * Ajoute une ou plusieurs classe(s).
   * @param  {...string} classes Classe(s) à ajouter.
   * @returns {this} Chaîne
   */
  addClass(...classes) {
    this.classList.add(...classes);
    return this;
  }

  /**
   * Supprime une classe de l'élément
   * @param {string} className Classe à supprimer
   * @returns {this} Chaîne
   */
  removeClass(className) {
    if (this.hasClass(className)) this.classList.remove(className);

    return this;
  }

  /**
   * Récupère un texte via une fonction de localisation, si elle existe.
   * @param {string} text Texte à afficher/à traduire
   * @returns {string} Si la fonction de localisation n'existe pas, le texte initial sera renvoyé.
   */
  text(text) {
    if (HtmlCustomTag._p_text_callback)
      return HtmlCustomTag._p_text_callback(text);
    else return text;
  }

  /**
   * Créer une node de texte
   * @param {string} text Texte à mettre dans la node.
   * @returns {Text}
   */
  createText(text) {
    return document.createTextNode(this.text(text));
  }

  /**
   * Libère les données.
   * @returns {this} Chaîne
   */
  destroy() {
    return this;
  }

  /**
   * Assigne la fonction de callback pour l'application.
   * @param {LocalizationCallback} callback Fonction qui sert à traduire un texte, le texte peut être un mot clé.
   */
  static SetTextCallback(callback) {
    this._p_text_callback = callback;
  }
}

/**
 * Callback servant à traduire un texte.
 * @static
 * @protected
 * @type {?LocalizationCallback}
 */
HtmlCustomTag._p_text_callback = null;

HtmlCustomTag.SetTextCallback((text) => rcmail.gettext(text));

/**
 * Enumération qui contient le mode de CustomTag
 * @enum {Symbol}
 */
const EWebComponentMode = {
  /**
   * Le composant sera mis en `display:block`
   * @type {Symbol}
   */
  div: Symbol(),
  /**
   * Comportement standard.
   * @type {Symbol}
   */
  span: Symbol(),
  /**
   * Le composant sera mis en `display:inline-block`
   * @type {Symbol}
   */
  inline_block: Symbol(),
  /**
   * Le composant sera mis en `display:flex`
   * @type {Symbol}
   */
  flex: Symbol(),
};

/**
 * @class
 * @classdesc Représente une icone material symbol. Balise : bnum-icon
 * @extends HtmlCustomTag
 */
class BnumHtmlIcon extends HtmlCustomTag {
  /**
   * data-icon => icone à afficher.
   * <br/>
   *
   * Le data-icon ne doit pas être mis si l'icône est mise à l'intérieur de la balise.
   * <br/>
   *
   * Le shadow-dom n'est pas supporté.
   */
  constructor() {
    super();
  }

  /**
   * Génère le comportement de la classe.
   *
   * Ajoute la bonne classe et l'icône si elle à été définie.
   * @protected
   */
  _p_main() {
    super._p_main();
    if (!this.getAttribute('class'))
      this.setAttribute('class', BnumHtmlIcon.HTML_CLASS);

    if (!this.classList.contains(BnumHtmlIcon.HTML_CLASS))
      this.classList.add(BnumHtmlIcon.HTML_CLASS);

    if (this.dataset['icon'])
      this.appendChild(document.createTextNode(this.dataset['icon']));

    this.removeAttribute('data-icon');
  }
}

/**
 * Classe de la balise bnum-icon
 * @static
 * @constant
 * @type {string}
 * @default 'material-symbols-outlined'
 */
BnumHtmlIcon.HTML_CLASS = MaterialIcon.html_class;
BnumHtmlIcon.TAG = 'bnum-icon';

class BnumHtmlSrOnly extends HtmlCustomTag {
  constructor() {
    super();
  }

  _p_main() {
    super._p_main();
    const sr_only = 'sr-only';

    if (!this.classList.contains(sr_only)) this.classList.add(sr_only);
  }
}
BnumHtmlSrOnly.TAG = 'bnum-screen-reader';

class BnumHtmlSeparate extends HtmlCustomTag {
  constructor({ mode = EWebComponentMode.span } = {}) {
    super(mode);
  }
}
BnumHtmlSeparate.TAG = 'bnum-separate';

class BnumHtmlFlexContainer extends HtmlCustomTag {
  constructor() {
    super();
  }

  _p_main() {
    super._p_main();

    this.style.display = 'flex';
  }
}
BnumHtmlFlexContainer.TAG = 'bnum-flex-container';

class BnumHtmlCenteredFlexContainer extends BnumHtmlFlexContainer {
  constructor() {
    super();
  }

  _p_main() {
    super._p_main();

    this.style.justifyContent = 'center';
  }
}

BnumHtmlCenteredFlexContainer.TAG = 'bnum-centered-flex-container';

{
  const TAGS = [
    { tag: BnumHtmlIcon.TAG, class: BnumHtmlIcon },
    { tag: BnumHtmlFlexContainer.TAG, class: BnumHtmlFlexContainer },
    { tag: BnumHtmlSrOnly.TAG, class: BnumHtmlSrOnly },
    { tag: BnumHtmlSeparate.TAG, class: BnumHtmlSeparate },
    {
      tag: BnumHtmlCenteredFlexContainer.TAG,
      class: BnumHtmlCenteredFlexContainer,
    },
  ];

  for (const TAG of TAGS) {
    if (!customElements.get(TAG.tag)) customElements.define(TAG.tag, TAG.class);
  }
}
