import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import {
  BnumHtmlIcon,
  EWebComponentMode,
} from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { PressedButton } from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js';
import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../../../mel_metapage/js/lib/mel_object.js';
import { NavBarComponent } from './base.js';

/**
 * Classe représentant un bouton de la barre de navigation de l'espace de travail.
 * @class
 * @extends NavBarComponent
 */
export class WspButton extends NavBarComponent {
  /**
   * Style du bouton.
   * @type {WspButton.Style}
   * @private
   */
  #style = null;
  /**
   * Texte du bouton.
   * @type {?string}
   * @private
   */
  #text = null;
  /**
   * Icône du bouton.
   * @type {?string}
   * @private
   */
  #icon = null;
  /**
   * Indique si le bouton a été initialisé.
   * @type {boolean}
   * @private
   */
  #_initalized = false;

  /**
   * Crée une instance de WspButton.
   */
  constructor() {
    super({ mode: EWebComponentMode.flex });

    /**
     * Événement déclenché après l'application du style.
     * @type {BnumEvent<(btn: WspButton) => void>}
     */
    this.afterstyle = new BnumEvent();
  }

  /**
   * Identifiant unique du bouton, hérité du parent.
   * @type {string}
   * @readonly
   */
  get uid() {
    return this.parent.workspace.uid;
  }

  /**
   * Mode personnalisé du bouton.
   * @type {string}
   * @readonly
   */
  get customMode() {
    return this.#style === WspButton.Style.custom
      ? this._p_get_data('custom-style')
      : 'custom';
  }

  /**
   * Position du bouton (gauche ou droite).
   * @type {string}
   * @readonly
   */
  get pos() {
    return this._p_get_data('position') || 'right';
  }

  /**
   * Méthode principale d'initialisation du bouton.
   * @protected
   */
  _p_main() {
    super._p_main();

    this.#_initialize()._p_beforeMain();

    this.classList.add('not-busy-only');

    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', 0);

    this.addEventListener('keydown', (e) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          this.click();
          break;

        default:
          break;
      }
    });

    let style = 'classic';
    switch (this.#style) {
      case WspButton.Style.custom:
        style = this.customMode;
        break;

      case WspButton.Style.white:
        style = 'white';
        break;

      default:
        break;
    }

    this.setAttribute('wspbutton', style);
    this.addClass('mel-focus', 'shadow-mel-button');
    this.style.justifyContent = 'space-between';
    this.style.borderRadius = '50px';

    this.afterstyle.call(this);

    let span = document.createElement('span');
    span.appendChild(this.createText(this.#text));
    this.appendChild(span);

    if (this.#icon || false) {
      let icon = new BnumHtmlIcon(this.#icon);
      switch (this.pos) {
        case 'left':
          this.prepend(icon);
          break;

        default:
          this.appendChild(icon);
          break;
      }
      icon = null;
    }

    span = null;
  }

  /**
   * Méthode appelée avant l'initialisation principale.
   * @returns {WspButton}
   * @protected
   */
  _p_beforeMain() {
    return this;
  }

  /**
   * Effectue une requête POST interne.
   * @param {string} action Action à effectuer.
   * @param {Object<string, any>} [params={}] Paramètres de la requête.
   * @returns {Promise<any>}
   * @protected
   * @throws {any} En cas d'erreur lors de la requête.
   */
  async _p_post(action, params = {}) {
    params ??= {};
    params._uid = this.uid;
    let data = null;
    let errored = false;
    await MelObject.Empty().http_internal_post({
      task: 'workspace',
      on_success: (sData) => {
        data = sData;
      },
      on_error: (...args) => {
        errored = args;
      },
      params,
      action,
    });

    if (errored) throw errored;

    return data;
  }

  /**
   * Effectue une requête POST pour un paramètre spécifique.
   * @param {string} key Clé du paramètre.
   * @param {Object} [params={}] Paramètres supplémentaires.
   * @returns {Promise<any>}
   * @protected
   */
  async _p_param_post(key, params = {}) {
    params ??= {};
    params._key = key;
    return await this._p_post('param', params);
  }

  /**
   * Initialise les propriétés privées du bouton.
   * @returns {WspButton}
   * @private
   */
  #_initialize() {
    if (!this.#_initalized) {
      this.#icon = this._p_get_data('icon') || EMPTY_STRING;
      this.#text = this._p_get_data('text') || EMPTY_STRING;
      this.#style = WspButton.Style.fromString(
        this._p_get_data('style') || WspButton.Style.classic.toString(),
      );

      this.#_initalized = true;
    }

    return this;
  }

  /**
   * Crée un nouveau bouton WspButton.
   * @param {Object} [param0={}] Paramètres de création.
   * @param {?NavBarComponent} [param0.parent=null] Parent du bouton.
   * @param {WspButton.Style} [param0.style=WspButton.Style.classic] Style du bouton.
   * @param {string} [param0.text=EMPTY_STRING] Texte du bouton.
   * @param {string} [param0.icon=EMPTY_STRING] Icône du bouton.
   * @returns {WspButton}
   * @static
   */
  static Create({
    parent = null,
    style = WspButton.Style.classic,
    text = EMPTY_STRING,
    icon = EMPTY_STRING,
  } = {}) {
    /**
     * @type {WspButton}
     */
    let node = document.createElement(this.TAG);

    if (parent) node.setNavBarParent(parent);

    node.setAttribute('data-style', WspButton.Style.toString(style));
    node.setAttribute('data-text', text);
    node.setAttribute('data-icon', icon);

    return node;
  }

  /**
   * Tag HTML du composant bouton.
   * @type {string}
   * @readonly
   * @static    // new WspNavigationButton(this, {
    //   text,
    //   startingPressedState: ['true', true].includes(
    //     this.parent.startingStates[task],
    //   ),
    // });
   */
  static get TAG() {
    return 'bnum-wsp-button';
  }
}

/**
 * Enumération des styles de bouton.
 * @enum {symbol}
 */
WspButton.Style = {
  classic: Symbol(),
  white: Symbol(),
  custom: Symbol(),
  /**
   * Convertit un symbole de style en chaîne.
   * @param {symbol} sym Symbole du style.
   * @returns {string}
   */
  toString(sym) {
    return Object.keys(this).find((x) => this[x] === sym) || EMPTY_STRING;
  },
  /**
   * Récupère le symbole de style à partir d'une chaîne.
   * @param {string} str Chaîne du style.
   * @returns {?symbol}
   */
  fromString(str) {
    return Object.values(this).find((x) => this.toString(x) === str) || null;
  },
};

{
  const TAG = 'bnum-wsp-button';
  if (!customElements.get(TAG)) customElements.define(TAG, WspButton);
}

const NAMESPACE = 'wsp-nav-button';

/**
 * Classe représentant un bouton de navigation avec gestion de visibilité.
 * @class
 * @extends NavBarComponent
 */
export class WspNavigationButton extends NavBarComponent {
  /**
   * État initial du bouton de visibilité.
   * @type {?boolean}
   * @private
   */
  #startingState = null;
  /**
   * Icône initiale du bouton.
   * @type {?string}
   * @private
   */
  #startingIcon = null;
  /**
   * Texte du bouton.
   * @type {?string}
   * @private
   */
  #text = null;
  /**
   * Identifiant du bouton.
   * @type {?string}
   * @private
   */
  #id = null;
  /**
   * Indique si le bouton a été initialisé.
   * @type {boolean}
   * @private
   */
  #_initialized = false;

  /**
   * Crée une instance de WspNavigationButton.
   */
  constructor() {
    super({ mode: EWebComponentMode.flex });

    /**
     * Événement déclenché lors du clic sur le bouton principal.
     * @type {BnumEvent<(e: Event) => void>}
     */
    this.onbuttonclick = new BnumEvent();
    /**
     * Événement déclenché lors du clic sur l'icône de visibilité.
     * @type {BnumEvent<(e: any) => void>}
     */
    this.oniconclicked = new BnumEvent();
    /**
     * Événement déclenché après l'application du style.
     * @type {BnumEvent<(btn: PressedButton, navBtn: WspNavigationButton) => void>}
     */
    this.afterstyle = new BnumEvent();
  }

  /**
   * Identifiant unique du bouton.
   * @type {string}
   * @readonly
   */
  get uid() {
    return this.#id;
  }

  /**
   * Identifiant du bouton de tâche.
   * @type {string}
   * @readonly
   */
  get taskButtonId() {
    return `${this.uid}-task`;
  }

  /**
   * Identifiant du bouton de visibilité.
   * @type {string}
   * @readonly
   */
  get visibilityButtonId() {
    return `${this.uid}-visibility`;
  }

  /**
   * Récupère le bouton de tâche.
   * @type {PressedButton}
   * @readonly
   */
  get taskButton() {
    return this.querySelector(`#${this.taskButtonId}`);
  }

  /**
   * Récupère le bouton de visibilité.
   * @type {PressedButton}
   * @readonly
   */
  get visibilityButton() {
    return this.querySelector(`#${this.visibilityButtonId}`);
  }

  /**
   * Récupère l'icône du bouton de visibilité.
   * @type {BnumHtmlIcon}
   * @readonly
   */
  get icon() {
    return this.visibilityButton.querySelector('bnum-icon');
  }

  /**
   * Indique si le bouton peut être masqué.
   * @type {boolean}
   * @readonly
   */
  get canBeHidden() {
    return this._p_get_data('can-be-hidden') !== 'false';
  }

  /**
   * Méthode principale d'initialisation du bouton de navigation.
   * @protected
   */
  _p_main() {
    super._p_main();
    this.#_initialize();

    let button = PressedButton.Create();
    let visibilityButton = PressedButton.Create();
    let icon = BnumHtmlIcon.Create({ icon: this.#startingIcon });

    button.data('custom-style', 'navigation').style.marginTop = 0;
    button.classList.add('left-button');
    button.setAttribute('id', this.taskButtonId);
    button.onpressed.push(this.onbuttonclick.call.bind(this.onbuttonclick));

    let span = document.createElement('span');
    span.appendChild(this.createText(this.#text));

    button.appendChild(span);
    button.setAttribute('wspbutton', 'navigation');
    button.style.justifyContent = 'left';

    this.appendChild(button);

    if (this.canBeHidden) {
      visibilityButton
        .data('start-pressed', this.#startingState)
        .appendChild(icon);
      visibilityButton.classList.add('transparent-bckg', 'visibility-icon');
      visibilityButton.setAttribute('id', this.visibilityButtonId);
      visibilityButton.ontoggle.push(
        this.oniconclicked.call.bind(this.oniconclicked),
      );
      visibilityButton.onmouseenter = () => {
        /**
         * @type {PressedButton}
         */
        let button = this.querySelector(`#${this.taskButtonId}`);

        $(button).css({
          '--navigation-border-radius-top-right': 0,
          '--navigation-border-radius-bottom-right': 0,
        });
        button = null;
      };
      visibilityButton.onmouseleave = () => {
        /**
         * @type {PressedButton}
         */
        let button = this.querySelector(`#${this.taskButtonId}`);
        $(button).css({
          '--navigation-border-radius-top-right': EMPTY_STRING,
          '--navigation-border-radius-bottom-right': EMPTY_STRING,
        });
        button = null;
      };

      this.appendChild(visibilityButton);
      visibilityButton = null;
    }

    this.afterstyle.call(button, this);

    icon = null;
    button = null;
    span = null;
  }

  /**
   * Initialise les propriétés privées du bouton de navigation.
   * @returns {WspNavigationButton}
   * @private
   */
  #_initialize() {
    if (!this.#_initialized) {
      const startingPressedState = this._p_get_data('sps') === 'true';
      const text = this._p_get_data('text') || EMPTY_STRING;
      const iconPressed = this._p_get_data('icon-pressed') || 'visibility_off';
      const iconNotPressed =
        this._p_get_data('icon-not-pressed') || 'visibility';

      this.#id =
        this.getAttribute('id') || this.generateId(`${NAMESPACE}-container`);
      this.#startingIcon = startingPressedState ? iconPressed : iconNotPressed;
      this.#startingState = startingPressedState;
      this.#text = text;

      this.onbuttonclick.push((e) => {
        this.dispatchEvent(
          new CustomEvent('api:buttonclick', { detail: { originalEvent: e } }),
        );
      });

      this.oniconclicked.push((obj, button) => {
        if (obj.newState) this.icon.icon = iconPressed;
        else this.icon.icon = iconNotPressed;

        this.dispatchEvent(
          new CustomEvent('api:iconclick', {
            detail: { state: obj.newState, button, caller: this },
          }),
        );
      });

      this.#_initialized = true;
    }

    return this;
  }

  /**
   * Crée un nouveau bouton de navigation.
   * @param {Object} [param0={}] Paramètres de création.
   * @param {?NavBarComponent} [param0.parent=null] Parent du bouton.
   * @param {string} [param0.text=EMPTY_STRING] Texte du bouton.
   * @param {string} [param0.iconPressed='visibility_off'] Icône lorsque le bouton est pressé.
   * @param {string} [param0.iconNotPressed='visibility'] Icône lorsque le bouton n'est pas pressé.
   * @param {boolean} [param0.startingPressedState=false] État initial du bouton.
   * @returns {WspNavigationButton}
   * @static
   */
  static Create({
    parent = null,
    text = EMPTY_STRING,
    iconPressed = 'visibility_off',
    iconNotPressed = 'visibility',
    startingPressedState = false,
  } = {}) {
    /**
     * @type {WspButton}
     */
    let node = document.createElement(this.TAG);

    if (parent) node.setNavBarParent(parent);

    node.setAttribute('data-text', text);
    node.setAttribute('data-icon-pressed', iconPressed);
    node.setAttribute('data-icon-not-pressed', iconNotPressed);
    node.setAttribute('data-sps', startingPressedState ? 'true' : 'false');

    return node;
  }

  /**
   * Tag HTML du composant bouton de navigation.
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return 'bnum-wsp-navigation-button';
  }
}

{
  const TAG = WspNavigationButton.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, WspNavigationButton);
}
