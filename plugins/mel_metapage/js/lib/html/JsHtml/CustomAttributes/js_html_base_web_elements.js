import ABaseMelObject from '../../../base_mel_object.js';
import { BaseStorage } from '../../../classes/base_storage.js';
import { Random } from '../../../classes/random.js';
import { BnumModules } from '../../../helpers/dynamic_load_modules.js';
import { MaterialIcon } from '../../../icons.js';
import { isNullOrUndefined } from '../../../mel.js';
export {
  HtmlCustomTag,
  HtmlCustomDataTag,
  BnumHtmlIcon,
  BnumHtmlShadowIcon,
  BnumHtmlSrOnly,
  BnumVoice as BnumHtmlVoiceElement,
  BnumHtmlSeparate,
  BnumHtmlFlexContainer,
  BnumHtmlCenteredFlexContainer,
  EWebComponentMode,
  HTMLBnumPlaceholder,
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
  #loaded = false;
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
  }

  /**
   * Element sur lequel on doit ajouter des nodes enfants.
   *
   * Si le shadow dom est activé, ils seront ajoutés au shadow root, sinon à ce composant.
   * @readonly
   * @type {ShadowRoot | this}
   * @see {@link https://developer.mozilla.org/fr/docs/Web/API/Web_components/Using_shadow_DOM}
   */
  get navigator() {
    return this.shadowEnabled() ? this.shadowRoot : this;
  }

  /**
   * Cet element en jQuery
   * @readonly
   * @type {external:jQuery}
   */
  get $() {
    return $(this);
  }

  /**
   * Si l'élément est chargé ou non
   * @type {string}
   * @readonly
   */
  get elementLoaded() {
    return this.#loaded;
  }

  /**
   * Est appelé par le navigateur lorsque le composant est affiché.
   *
   * Gère dans un premier temps le mode puis appèle le setup enfant.
   * @see {@link _p_main}
   */
  connectedCallback() {
    if (!this.#loaded) {
      this.setMode(this.#mode, { ignoreLoad: true });

      if (this._p_main) this._p_main();

      this.#loaded = true;
    }
  }

  /**
   * Est appelé lorsque le composant est détruit.
   *
   * Permet de libérer des données.
   * @see {@link destroy}
   */
  disconnectedCallback() {
    if (this.destroy) this.destroy();
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
  _p_start_construct({ shadowConfig = {} } = {}) {
    shadowConfig['mode'] = 'open';
    return this.shadowEnabled() ? this.attachShadow(shadowConfig) : this;
  }

  /**
   * Vérifie si le shadow-dom est activé ou non.
   * @returns {boolean}
   */
  shadowEnabled() {
    return this.data('shadow') === 'true';
  }

  /**
   *
   * @param {EWebComponentMode} mode
   * @returns {this}
   */
  setMode(mode, { ignoreLoad = false } = {}) {
    this.#mode = mode;

    if (this.#loaded || ignoreLoad) {
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
          this.removeAttribute('component-mode');
          break;
      }
    }

    return this;
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
    } else return this.dataset[key] || this.getAttribute(`data-${key}`);
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
   * @overload
   * Récupère la valeur d'un attribut
   * @param {string} key Clé de l'attribut
   * @returns {string} Valeur de l'attribut
   * //**
   * @overload
   * Change la valeur d'un attribut.
   * @param {string} key Clé de l'attribut
   * @param {*} value Valeur à mettre
   * @returns {this}
   */
  attr(key, value = null) {
    if (isNullOrUndefined(value)) return this.getAttribute(key);
    else {
      this.setAttribute(key, value);
      return this;
    }
  }

  /**
   * Ajoute plusieurs attributs à l'élément.
   * @param {Object<string, string | number | boolean>} config
   * @returns {this} Chaîne
   */
  attrs(config) {
    for (const key in config) {
      this.attr(key, config[key]);
    }

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
   *
   * @param {Object} [param0={}]
   * @param {?HTMLElement} [param0.node=null]
   * @returns
   */
  disable({ node = null } = {}) {
    node ??= this;

    return HtmlCustomTag.Disable(node);
  }

  enable({ node = null } = {}) {
    node ??= this;

    return HtmlCustomTag.Enable(node);
  }

  /**
   *
   * @param {HTMLElement} node
   */
  toButton(node) {
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', 0);
    node.addEventListener('keydown', (e) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          e.target.click();
          break;

        default:
          break;
      }
    });

    return node;
  }

  generateId(namespace = 'htmlcustom') {
    let id;

    do {
      id = `${namespace}-${Random.random_string(Random.intRange(2, 10))}`;
    } while (document.querySelector(`#${id}`));

    return id;
  }

  /**
   * Libère les données.
   * @returns {this} Chaîne
   */
  destroy() {
    return this;
  }

  /**
   * Active un élément html, cad, supprime l'attribut `disabled` et la classe `disabled`.
   * @param {TNode} node Node à activer
   * @returns {TNode} Node activée
   * @template {HTMLElement} TNode
   */
  static Enable(node) {
    node.removeAttribute('disabled');
    node.classList.remove('disabled');

    return node;
  }

  /**
   * Désactive un élément html, cad, ajoute l'attribut `disabled` et la classe `disabled`.
   * @param {TNode} node Node à désactiver
   * @returns {TNode} Node désactivée
   * @template {HTMLElement} TNode
   */
  static Disable(node) {
    node.setAttribute('disabled', 'disabled');
    node.classList.add('disabled');

    return node;
  }

  /**
   * Assigne la fonction de callback pour l'application.
   * @param {LocalizationCallback} callback Fonction qui sert à traduire un texte, le texte peut être un mot clé.
   */
  static SetTextCallback(callback) {
    this._p_text_callback = callback;
  }

  /**
   * D�fini un �l�ment si il n'a pas �t� d�fini.
   * @static
   * @param {string} tag Tag de l'�l�ment custom
   * @param {typeof HtmlCustomTag} constructor Element d�riv� de HTMLCustomElement
   */
  static TryDefine(tag, constructor) {
    if (!customElements.get(tag)) customElements.define(tag, constructor);
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
  div: Symbol('div'),
  /**
   * Comportement standard.
   * @type {Symbol}
   */
  span: Symbol('span'),
  /**
   * Le composant sera mis en `display:inline-block`
   * @type {Symbol}
   */
  inline_block: Symbol('inline-block'),
  /**
   * Le composant sera mis en `display:flex`
   * @type {Symbol}
   */
  flex: Symbol('flex'),
};

class HtmlCustomDataTag extends HtmlCustomTag {
  #data = new BaseStorage();

  constructor({ mode = EWebComponentMode.span } = {}) {
    super({ mode });
  }

  /**
   * Récupère l'élément ou le shadowroot si le data-shadow est activé. <br/>
   *
   * Si le parent est défini, le shaodw dom sera toujours inactif.
   * @protected
   * @returns {this | ShadowRoot}
   */
  _p_start_construct() {
    return super._p_start_construct();
  }

  _p_main() {
    super._p_main();
  }

  /**
   * Récupère une data en mémoire et supprime l'attribut à la première récupération.
   * @param {string} dataName data. Pas de tirets.
   * @returns {string} Data en mémoire
   * @protected
   */
  _p_get_data(dataName) {
    if (!this.#data) this.#data = new BaseStorage();

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

    // for (const key of this.#data.keys) {
    //   if (['string', 'number'].includes(typeof this.#data.get(key)))
    //     this.setAttribute(`data-${key}`, this.#data.get(key));
    // }

    // this.#data.clear();
    // this.#data = null;
  }
}

/**
 * @class
 * @classdesc Représente une icone material symbol. Balise : bnum-icon
 * @extends HtmlCustomTag
 */
class BnumHtmlIcon extends HtmlCustomTag {
  #icon = null;

  /**
   * data-icon => icone à afficher.
   * <br/>
   *
   * Le data-icon ne doit pas être mis si l'icône est mise à l'intérieur de la balise.
   * <br/>
   *
   * Le shadow-dom n'est pas supporté.
   */
  constructor(icon = null) {
    super({ mode: EWebComponentMode.span });

    this.#icon = icon;
  }

  get icon() {
    let icon = this.innerText || this.data('icon') || this.#icon;

    if (this.hasAttribute('data-icon')) this.removeAttribute('data-icon');

    return icon;
  }

  set icon(value) {
    this.#_update_icon(value);
  }

  /**
   * Génère le comportement de la classe.
   *
   * Ajoute la bonne classe et l'icône si elle à été définie.
   * @protected
   */
  _p_main() {
    if (this._p_override_main() === false) {
      if (!this.classList.contains(BnumHtmlIcon.HTML_CLASS))
        this.classList.add(BnumHtmlIcon.HTML_CLASS);

      this.#_update_icon(this.icon);
    }
  }

  _p_override_main() {
    return false;
  }

  #_update_icon(icon) {
    this.innerText = icon;
  }

  static Create({ icon = null, context = document } = {}) {
    let node = context.createElement(this.TAG);

    if (icon) node.setAttribute('data-icon', icon);

    return node;
  }

  /**
   * @type {BnumHtmlIcon}
   * @readonly
   * @static
   */
  static get Close() {
    return this.Create({ icon: 'close' });
  }

  /**
   * @type {BnumHtmlIcon}
   * @readonly
   * @static
   */
  static get CalendarMonth() {
    return this.Create({ icon: 'calendar_month' });
  }

  /**
   * @type {{right:Readonly<BnumHtmlIcon>, left:Readonly<BnumHtmlIcon>, down:Readonly<BnumHtmlIcon>}}
   * @readonly
   * @static
   */
  static get Chevron() {
    let obj = {};

    Object.defineProperties(obj, {
      right: {
        get: () => this.Create({ icon: 'chevron-right' }),
      },
      left: {
        get: () => this.Create({ icon: 'chevron-left' }),
      },
      down: {
        get: () => this.Create({ icon: 'keyboard_arrow_down' }),
      },
    });

    return obj;
  }

  /**
   * @type {{right:Readonly<BnumHtmlIcon>, left:Readonly<BnumHtmlIcon>, down:Readonly<BnumHtmlIcon>}}
   * @readonly
   * @static
   */
  static get Arrow() {
    let obj = {};

    Object.defineProperties(obj, {
      right: {
        get: () => this.Create({ icon: 'arrow_right_alt' }),
      },
      left: {
        get: () => this.Create({ icon: 'arrow_left_alt' }),
      },
      down: {
        get: () => this.Create({ icon: 'keyboard_arrow_down' }),
      },
    });

    return obj;
  }

  /**
   * @type {BnumHtmlIcon}
   * @readonly
   * @static
   */
  static get Refresh() {
    return this.Create({ icon: 'refresh' });
  }
}

class BnumHtmlShadowIcon extends BnumHtmlIcon {
  #_icon;
  constructor() {
    super();
  }

  /**
   * @type {BnumHtmlIcon}
   * @readonly
   * @private
   */
  get #_shadowIcon() {
    return this.navigator.querySelector('bnum-icon');
  }

  get icon() {
    const icon = this.data('icon') || this.#_icon;

    if (!this.#_icon) this.#_icon = icon;

    if (this.hasAttribute('data-icon')) this.removeAttribute('data-icon');

    return icon;
  }

  set icon(value) {
    this.#_shadowIcon.icon = value;
    this.#_icon = value;
  }

  _p_main() {
    super._p_main();
    let root = this._p_start_construct();

    root.append(this.#_loadStyle(), BnumHtmlIcon.Create({ icon: this.icon }));

    root = null;
  }

  async #_saveStyle() {
    if (BnumHtmlShadowIcon._style_in_save) return;

    BnumHtmlShadowIcon._style_in_save = true;
    await ABaseMelObject.Empty().http_call({
      url: `${window.location.origin + window.location.pathname}skins/mel_elastic/material-symbols.css?v=${BnumModules.VERSION}`,
      on_success: (loaded) => {
        ABaseMelObject.Empty().save(
          'shadow-icon-material-symbol-version',
          BnumModules.VERSION,
        );
        ABaseMelObject.Empty().save('shadow-icon-material-symbol', loaded);
      },
    });

    BnumHtmlShadowIcon._style_in_save = false;
  }

  #_loadStyle() {
    let style;
    let loaded_style = ABaseMelObject.Empty().load(
      'shadow-icon-material-symbol',
    );

    if (!loaded_style) {
      this.#_saveStyle();
      style = document.createElement('link');
      style.rel = 'stylesheet';
      style.href = `skins/mel_elastic/material-symbols.css?v=${BnumModules.VERSION}`;
    } else if (
      (ABaseMelObject.Empty().load('shadow-icon-material-symbol-version') ||
        true) &&
      ABaseMelObject.Empty().load('shadow-icon-material-symbol-version') !==
        BnumModules.VERSION
    ) {
      ABaseMelObject.Empty().save('shadow-icon-material-symbol', null);
      style = this.#_loadStyle();
    } else {
      style = document.createElement('style');
      style.appendChild(document.createTextNode(loaded_style));
    }

    return style;
  }

  shadowEnabled() {
    return true;
  }

  _p_override_main() {
    return true;
  }

  /**
   * @readonly
   * @type {string}
   */
  static get TAG() {
    return 'bnum-shadow-icon';
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

  static Create() {
    return document.createElement(BnumHtmlSrOnly.TAG);
  }
}
BnumHtmlSrOnly.TAG = 'bnum-screen-reader';

class BnumVoice extends BnumHtmlSrOnly {
  /**
   * Attributs observés par le navigateur
   * @type {string[]}
   * @readonly
   * @static
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements}
   */
  static get observedAttributes() {
    return ['for'];
  }

  constructor() {
    super();
  }

  _p_main() {
    super._p_main();

    let root = this._p_start_construct();
    let label = document.createElement('label');

    if (this.hasAttribute('for'))
      label.setAttribute('for', this.getAttribute('for'));

    label.appendChild(...this.childNodes);
    let style = document.createElement('style');
    style.appendChild(
      document.createTextNode(`
        :host {
        border: 0;
  clip: rect(0,0,0,0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
  }
        `),
    );

    root.append(style, label);

    label = null;
    style = null;
    root = null;
  }

  /**
   * Est appelé quand un attribut de {@link observedAttributes} est modifié
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'for' && newValue !== null && this.elementLoaded) {
      this.navigator.querySelector('label').setAttribute('for', newValue);
    }
  }

  shadowEnabled() {
    return true;
  }

  static Create(text) {
    let node = document.createElement('bnum-voice');
    node.appendChild(document.createTextNode(text));

    return node;
  }

  static get TAG() {
    return 'bnum-voice';
  }
}

class BnumHtmlSeparate extends HtmlCustomTag {
  constructor({ mode = EWebComponentMode.span } = {}) {
    super(mode);
  }

  static Create() {
    return document.createElement(BnumHtmlSeparate.TAG);
  }
}
BnumHtmlSeparate.TAG = 'bnum-separate';

class BnumHtmlFlexContainer extends HtmlCustomTag {
  constructor() {
    super({ mode: EWebComponentMode.flex });
  }

  _p_main() {
    super._p_main();

    // this.style.display = 'flex';
  }

  /**
   *
   * @returns {BnumHtmlFlexContainer}
   */
  static Create() {
    return document.createElement('bnum-flex-container');
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

/**
 * @class
 * @classdesc
 * @extends HtmlCustomTag
 */
class HTMLBnumPlaceholder extends HtmlCustomTag {
  constructor() {
    super();
  }

  /**
   * Permet de créer un élément de type HTMLBnumPlaceholder
   * @returns {HTMLBnumPlaceholder}
   * @static
   */
  static CreateNode() {
    return document.createElement(this.TAG);
  }

  /**
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return 'bnum-placeholder';
  }
}

{
  const TAGS = [
    { tag: BnumHtmlIcon.TAG, class: BnumHtmlIcon },
    { tag: BnumHtmlShadowIcon.TAG, class: BnumHtmlShadowIcon },
    { tag: BnumHtmlFlexContainer.TAG, class: BnumHtmlFlexContainer },
    { tag: BnumHtmlSrOnly.TAG, class: BnumHtmlSrOnly },
    { tag: BnumVoice.TAG, class: BnumVoice },
    { tag: BnumHtmlSeparate.TAG, class: BnumHtmlSeparate },
    {
      tag: BnumHtmlCenteredFlexContainer.TAG,
      class: BnumHtmlCenteredFlexContainer,
    },
    {
      tag: HTMLBnumPlaceholder.TAG,
      class: HTMLBnumPlaceholder,
    },
  ];

  for (const TAG of TAGS) {
    if (!customElements.get(TAG.tag)) {
      customElements.define(TAG.tag, TAG.class);
    }
  }
}
