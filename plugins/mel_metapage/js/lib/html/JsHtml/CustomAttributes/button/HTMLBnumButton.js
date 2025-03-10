import { EMPTY_STRING } from '../../../../constants/constants.js';
import { EWebComponentMode } from '../js_html_base_web_elements';
import AHTMLCustomInternalElement from '../lib/AHTMLCustomInternalElement.js';
import { HTMLWrapperElement } from '../wrapper.js';
import {
  HTMLBnumButtonBaseCreator,
  HTMLBnumButtonCreator,
} from './ButtonCreator.js';
import {
  CLASS_BUTTON,
  CLASS_LOADING_RECEIVER,
  ENABLE_CLASS_BUTTON,
  ENABLE_EXTRA_CLASS_BUTTON,
  EXTRA_CLASSES,
  OLD_BNUM_MODE,
} from './constants.js';
import FormComponent, { EButtonType } from './FormComponent.js';
import IconComponent from './IconComponent.js';
import LoadingComponent from './LoadingComponent.js';
import RoundShapeComponent from './RoundShapeComponent.js';

/**
 * @class
 * @classdesc Bouton personalisé du Bnum
 * @extends AHTMLCustomInternalElement
 */
export default class HTMLBnumButton extends AHTMLCustomInternalElement {
  /**
   * Attributs observés par le navigateur
   * @type {string[]}
   * @readonly
   * @static
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_custom_elements}
   */
  static get observedAttributes() {
    return ['data-loading', 'square'];
  }

  /**
   * @type {import('../lib/AHTMLComponent.js').default[]}
   * @private
   */
  #_components;

  constructor() {
    super({ mode: EWebComponentMode.inline_block });
    this.#_components = [
      new FormComponent(this),
      new IconComponent(this),
      new RoundShapeComponent(this),
      new LoadingComponent(this),
    ];
  }

  /**
   * @type {FormComponent}
   * @readonly
   * @private
   */
  get #_formComponent() {
    return this.#_components[0];
  }

  /**
   * @type {IconComponent}
   * @readonly
   * @private
   */
  get #_iconComponent() {
    return this.#_components[1];
  }

  /**
   * @type {LoadingComponent}
   * @readonly
   * @private
   */
  get #_loadComponent() {
    return this.#_components[3];
  }

  /**
   * Position de l'icône
   * @type {'right' | 'left'}
   * @readonly
   */
  get iconPos() {
    return this.#_iconComponent.iconPos;
  }

  /**
   * Margin de l'icône
   * @type {string}
   * @readonly
   */
  get iconMargin() {
    return this.#_iconComponent.iconMargin;
  }

  /**
   * @type {string}
   * @readonly
   */
  get internalId() {
    if (!this.hasAttribute('id'))
      this.setAttribute('id', this.generateId('mel-button'));

    return this.id;
  }

  /**
   * @type {import('./FormComponent.js').EButtonType}
   * @readonly
   */
  get variation() {
    return this.#_formComponent.variation;
  }

  /**
   * Icône
   * @type {?string}
   */
  get icon() {
    return this.#_iconComponent.icon;
  }

  set icon(value) {
    this.#_iconComponent.icon = value;
  }

  /**
   * Est appelé à l'affichage
   * @override
   */
  _p_main() {
    super._p_main();

    this._p_before();

    this.#_set_mode().attr('role', 'button').attr('tabindex', '0');

    if (ENABLE_CLASS_BUTTON) this.addClass(CLASS_BUTTON);

    if (ENABLE_EXTRA_CLASS_BUTTON) this.addClass(...EXTRA_CLASSES);

    let wrapper = HTMLWrapperElement.CreateNode();
    wrapper
      .addClass('internal__wrapper--main', CLASS_LOADING_RECEIVER)
      .append(...this.childNodes);
    wrapper.setAttribute('data-parent', this.internalId);

    this.appendChild(wrapper);

    this.onkeydown = (e) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          this.click();
          break;

        default:
          break;
      }
    };

    wrapper = null;

    for (const component of this.#_components) {
      component.setup();
    }

    this.style.animation = null;
    this.style.display = null;
  }

  /**
   * Est appelé avant l'affichage
   * @protected
   * @abstract
   */
  _p_before() {}

  /**
   * Est appelé quand un attribut de {@link observedAttributes} est modifié
   * @param {string} name
   * @param {string} oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    for (const component of this.#_components) {
      component.attributeUpdated(name, newValue);
    }
  }

  /**
   * Désactive le bouton
   * @returns {this}
   */
  disable() {
    this.setAttribute('aria-disabled', true);
    this.setAttribute('disabled', 'disabled');

    this.internals.states.add('disabled');

    return this.addClass(
      OLD_BNUM_MODE
        ? 'disabled'
        : `${ENABLE_CLASS_BUTTON ? CLASS_BUTTON : EMPTY_STRING}--disabled`,
    );
  }

  /**
   * Active le bouton
   * @returns {this}
   */
  enable() {
    this.removeAttribute('aria-disabled');
    this.removeAttribute('disabled');

    this.internals.states.delete('disabled');

    return this.removeClass(
      OLD_BNUM_MODE
        ? 'disabled'
        : `${ENABLE_CLASS_BUTTON ? CLASS_BUTTON : EMPTY_STRING}--disabled`,
    );
  }

  /**
   * Mode d'affichage du bouont (display)
   * @protected
   * @returns {string}
   */
  _p_mode() {
    return this._p_get_data('mode')?.toLowerCase?.();
  }

  #_set_mode() {
    const mode = this._p_mode();
    if (mode && mode !== 'inline-block') {
      switch (mode) {
        case 'span':
          this.setAttribute('component-mode', 'span');
          break;

        case 'flex':
          this.setAttribute('component-mode', 'flex');
          break;

        case 'div':
          this.setAttribute('component-mode', 'div');
          break;

        case 'inline-flex':
          this.setAttribute('component-mode', 'inline-flex');
          break;

        default:
          break;
      }
    }

    return this;
  }

  /**
   * Active l'apparance et le fonctionnement du mode "chargement"
   * @returns {this}
   */
  setLoadingMode() {
    this.#_loadComponent.setLoadingMode();
    return this;
  }

  /**
   * Désactive l'apparance et le fonctionnement du mode "chargement"
   * @returns {this}
   */
  stopLoadingMode() {
    this.#_loadComponent.stopLoadingmode();
    return this;
  }

  /**
   * Génère un bouton
   * @param {string | HTMLElement} content Contenu du bouton
   * @param {Object} [options={}]
   * @param {EButtonType} [options.form=EButtonType.primary] Type de bouton
   * @param {?string} [options.icon=null] Icône
   * @param {'right' | 'left'} [options.iconPos='right'] Position de l'icône
   * @param {string | 0 | null} [options.iconMargin=null] Margin de l'icône à gauche
   * @param {boolean} [options.disabled=false] Désactive le bouton
   * @returns {HTMLBnumButton}
   */
  static CreateNode(
    content,
    {
      form = EButtonType.primary,
      icon = null,
      iconPos = 'right',
      iconMargin = null,
      disabled = false,
    },
  ) {
    /**
     * @type {HTMLBnumButton}
     */
    let node = document.createElement(this.tag);
    node.appendChild(
      typeof node === 'string' ? document.createTextNode(content) : content,
    );

    if (form) node.setAttribute('data-variation', EButtonType.toString(form));
    if (icon) node.setAttribute('data-icon', icon);
    if (iconMargin) node.setAttribute('data-icon-margin', iconMargin);

    if (disabled) node.disable();

    node.setAttribute('data-icon-pos', iconPos);

    return node;
  }

  /**
   * Commencer la création d'un bouton
   * @type {HTMLBnumButtonCreator}
   * @readonly
   */
  static get StartCreate() {
    return new HTMLBnumButtonCreator();
  }

  /**
   * @readonly
   * @type {string}
   */
  static get TAG() {
    return 'bnum-button';
  }
}

HTMLBnumButton.TryDefine(HTMLBnumButton.TAG, HTMLBnumButton);

/**
 * @class
 * @classdesc Bouton personalisé du Bnum, variation primaire, par défaut
 * @extends HTMLBnumButton
 */
export class HTMLBnumButtonPrimary extends HTMLBnumButton {
  constructor() {
    super();
  }

  /**
   * Est appelé avant l'affichage
   *
   * Met la bonne variation
   * @protected
   * @override
   */
  _p_before() {
    this.attrs({
      'data-variation': EButtonType.toString(EButtonType.primary),
    });
  }

  _p_main() {
    super._p_main();
  }

  /**
   * Génère un bouton
   * @param {string | HTMLElement} content Contenu du bouton
   * @param {Object} [options={}]
   * @param {?string} [options.icon=null] Icône
   * @param {'right' | 'left'} [options.iconPos='right'] Position de l'icône
   * @param {string | 0 | null} [options.iconMargin=null] Margin de l'icône à gauche
   * @param {boolean} [options.disabled=false] Désactive le bouton
   * @returns {HTMLBnumButtonPrimary}
   */
  static CreateNode(
    content,
    { icon = null, iconPos = 'right', iconMargin = null, disabled = false },
  ) {
    super.CreateNode(content, {
      icon,
      iconPos,
      iconMargin,
      disabled,
    });
  }

  /**
   * Commencer la création d'un bouton
   * @type {HTMLBnumButtonBaseCreator}
   * @readonly
   */
  static get StartCreate() {
    return new HTMLBnumButtonBaseCreator(this.TAG);
  }

  /**
   * @readonly
   * @type {string}
   */
  static get TAG() {
    return 'primary-button';
  }
}

HTMLBnumButton.TryDefine(HTMLBnumButtonPrimary.TAG, HTMLBnumButtonPrimary);

export class HTMLBnumButtonSecondary extends HTMLBnumButton {
  constructor() {
    super();
  }

  /**
   * Est appelé avant l'affichage
   *
   * Met la bonne variation
   * @protected
   * @override
   */
  _p_before() {
    this.attrs({
      'data-variation': EButtonType.toString(EButtonType.secondary),
    });
  }

  _p_main() {
    super._p_main();
  }

  /**
   * Génère un bouton
   * @param {string | HTMLElement} content Contenu du bouton
   * @param {Object} [options={}]
   * @param {?string} [options.icon=null] Icône
   * @param {'right' | 'left'} [options.iconPos='right'] Position de l'icône
   * @param {string | 0 | null} [options.iconMargin=null] Margin de l'icône à gauche
   * @param {boolean} [options.disabled=false] Désactive le bouton
   * @returns {HTMLBnumButtonSecondary}
   */
  static CreateNode(
    content,
    {
      icon = null,
      iconPos = 'right',
      iconMarginLeft = null,
      iconMarginRight = null,
      disabled = false,
    },
  ) {
    super.CreateNode(content, {
      icon,
      iconPos,
      iconMarginLeft,
      iconMarginRight,
      disabled,
      form: EButtonType.secondary,
    });
  }

  /**
   * @type {HTMLBnumButtonBaseCreator}
   * @readonly
   * @static
   */
  static get StartCreate() {
    return new HTMLBnumButtonBaseCreator(this.TAG);
  }

  /**
   * @static
   * @readonly
   * @type {string}
   */
  static get TAG() {
    return 'secondary-button';
  }
}

HTMLBnumButton.TryDefine(HTMLBnumButtonSecondary.TAG, HTMLBnumButtonSecondary);

/**
 * @class
 * @classdesc Bouton personalisé du Bnum, variation danger
 * @extends HTMLBnumButton
 */
export class HTMLBnumButtonDanger extends HTMLBnumButton {
  constructor() {
    super();
  }

  /**
   * Est appelé avant l'affichage
   *
   * Met la bonne variation
   * @protected
   * @override
   */
  _p_before() {
    this.attrs({
      'data-variation': EButtonType.toString(EButtonType.danger),
    });
  }

  _p_main() {
    super._p_main();
  }

  /**
   * Génère un bouton
   * @param {string | HTMLElement} content Contenu du bouton
   * @param {Object} [options={}]
   * @param {?string} [options.icon=null] Icône
   * @param {'right' | 'left'} [options.iconPos='right'] Position de l'icône
   * @param {string | 0 | null} [options.iconMargin=null] Margin de l'icône à gauche
   * @param {boolean} [options.disabled=false] Désactive le bouton
   * @returns {HTMLBnumButtonDanger}
   */
  static CreateNode(
    content,
    {
      icon = null,
      iconPos = 'right',
      iconMarginLeft = null,
      iconMarginRight = null,
      disabled = false,
    },
  ) {
    super.CreateNode(content, {
      icon,
      iconPos,
      iconMarginLeft,
      iconMarginRight,
      disabled,
      form: EButtonType.danger,
    });
  }

  /**
   * @type {HTMLBnumButtonBaseCreator}
   * @readonly
   */
  static get StartCreate() {
    return new HTMLBnumButtonBaseCreator(this.TAG);
  }

  /**
   * @static
   * @readonly
   * @type {string}
   */
  static get TAG() {
    return 'error-button';
  }
}

HTMLBnumButton.TryDefine(HTMLBnumButtonDanger.TAG, HTMLBnumButtonDanger);
