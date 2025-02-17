import { EMPTY_STRING, SPACE } from '../../../constants/constants.js';
import { BootstrapLoader } from './bootstrap-loader.js';
import {
  BnumHtmlIcon,
  EWebComponentMode,
  HtmlCustomDataTag,
} from './js_html_base_web_elements.js';
import { HTMLWrapperElement } from './wrapper.js';

export {
  HTMLMelButton,
  HTMLIconMelButton,
  EIconPositions,
  EButtonType as EButtonVariation,
};

const ENABLE_CLASS_BUTTON = true;
const CLASS_BUTTON = 'mel-button';
const ENABLE_EXTRA_CLASS_BUTTON = true;
const EXTRA_CLASSES = ['no-margin-button', 'no-button-margin'];
const OLD_BNUM_MODE = true;

class HTMLMelButton extends HtmlCustomDataTag {
  /**
   * @type {string[]}
   * @readonly
   */
  static get observedAttributes() {
    return ['data-loading'];
  }

  /**
   * @type {ElementInternals}
   */
  #_internals;
  #_currentMode;
  constructor() {
    super({ mode: EWebComponentMode.inline_block });
    this.#_internals = this.attachInternals();
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
   * @type {EButtonType}
   * @readonly
   */
  get variation() {
    return EButtonType.fromString(
      this._p_get_data('variation') ||
        EButtonType.fromString(EButtonType.primary),
    );
  }

  /**
   * @type {boolean}
   * @readonly
   */
  get isLoadingMode() {
    return ['loading', 'true', true, 1].includes(this._p_get_data('loading'));
  }

  /**
   * @type {HTMLWrapperElement}
   * @readonly
   */
  get mainWrapper() {
    return this.querySelector('.internal__wrapper--main');
  }

  _p_main() {
    super._p_main();

    this.#_set_mode().setAttribute('role', 'button');

    if (ENABLE_CLASS_BUTTON) this.addClass(CLASS_BUTTON);

    if (ENABLE_EXTRA_CLASS_BUTTON) this.addClass(...EXTRA_CLASSES);

    this.setAttribute('tabindex', '0');

    this.#_currentMode = this.variation;

    {
      let variationClass = [];

      if (ENABLE_CLASS_BUTTON) variationClass.push(CLASS_BUTTON);

      switch (this.variation) {
        case EButtonType.primary:
          variationClass.push(OLD_BNUM_MODE ? EMPTY_STRING : '--primary');
          break;

        case EButtonType.secondary:
          variationClass.push(OLD_BNUM_MODE ? 'white' : '--secondary');
          break;

        case EButtonType.danger:
          variationClass.push(OLD_BNUM_MODE ? 'btn btn-danger' : '--danger');
          break;

        default:
          break;
      }

      this.addClass(
        ...variationClass
          .filter((x) => x !== EMPTY_STRING)
          .map((x) => (x.includes(SPACE) ? x.split(SPACE) : x))
          .flat(),
      );
    }

    let wrapper = HTMLWrapperElement.CreateNode();
    wrapper.addClass('internal__wrapper--main').append(...this.childNodes);
    wrapper.setAttribute('data-parent', this.internalId);

    if (this.isLoadingMode) wrapper.style.display = 'none';

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

    if (this.isLoadingMode) {
      this._p_save_into_data('loading', false);
      this.setloadingMode();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.mainWrapper) return;

    switch (name) {
      case 'data-loading':
        if (['loading', 'true', true, 1].includes(newValue))
          this.setloadingMode();
        else this.stopLoadingmode();
        break;

      default:
        break;
    }
  }

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
   * Récupère le font size d'un élément
   * @param {HTMLElement} element
   * @returns {string}
   * @private
   */
  #_getFontSize(element) {
    const fonstSize =
      element.style.fontSize ||
      ((element) => {
        const el = element;
        const style = window
          .getComputedStyle(el, null)
          .getPropertyValue('font-size');

        return style;
      })(element);

    return fonstSize;
  }

  setloadingMode() {
    if (!this.isLoadingMode) {
      this._p_save_into_data('loading', 'loading');
      this.disable();

      let wrapper = HTMLWrapperElement.CreateNode();
      let loader = BootstrapLoader.Create();
      loader.setSize(this.#_getFontSize(this.mainWrapper));

      wrapper.addClass('internal__wrapper--loading').appendChild(loader);

      if (this.mainWrapper) this.mainWrapper.style.display = 'none';
      this.appendChild(wrapper);

      this.#_internals.states.add('loading');

      wrapper = null;
      loader = null;
    }

    return this;
  }

  stopLoadingmode() {
    if (this.isLoadingMode) {
      this._p_save_into_data('loading', false);
      this.enable();
      this.querySelector('.internal__wrapper--loading')?.remove?.();

      if (this.mainWrapper) this.mainWrapper.style.display = null;

      this.#_internals.states.remove('loading');

      return this;
    }
  }

  disable() {
    this.setAttribute('aria-disabled', true);
    this.setAttribute('disabled', 'disabled');

    this.#_internals.states.add('disabled');

    return this.addClass(
      OLD_BNUM_MODE
        ? 'disabled'
        : `${ENABLE_CLASS_BUTTON ? CLASS_BUTTON : EMPTY_STRING}--disabled`,
    );
  }

  enable() {
    this.removeAttribute('aria-disabled');
    this.removeAttribute('disabled');

    this.#_internals.states.delete('disabled');

    return this.removeClass(
      OLD_BNUM_MODE
        ? 'disabled'
        : `${ENABLE_CLASS_BUTTON ? CLASS_BUTTON : EMPTY_STRING}--disabled`,
    );
  }

  /**
   * Créer un HTMLMelButton
   * @param {Object} [options={}]
   * @param {EWebComponentMode} [options.mode=EWebComponentMode.inline_block] Mode d'affichage du boutton
   * @param {null | ____JsHtml | Node | externa:jQuery} [options.contentsNode=null] Node enfant
   * @returns {HTMLMelButton}
   */
  static CreateNode({
    mode = EWebComponentMode.inline_block,
    contentsNode = null,
    variation = EButtonType.primary,
    loading = false,
  } = {}) {
    let node = document.createElement('bnum-button');

    if (mode !== EWebComponentMode.inline_block) {
      let modeSet = 'inline-block';
      switch (mode) {
        case EWebComponentMode.div:
          modeSet = 'div';
          break;

        case EWebComponentMode.flex:
          modeSet = 'flex';
          break;

        case EWebComponentMode.span:
          modeSet = 'span';
          break;

        case 'inline_flex':
          modeSet = 'inline-flex';

        default:
          break;
      }

      node.setAttribute('data-mode', modeSet);
    }

    if (contentsNode) {
      if (contentsNode.generate_dom) contentsNode = contentsNode.generate_dom();
      else if (contentsNode.css) contentsNode = contentsNode[0];

      node.appendChild(contentsNode);

      contentsNode = null;
    }

    node.setAttribute('data-variation', EButtonType.toString(variation));

    if (loading) node.setAttribute('data-loading', true);

    return node;
  }

  static get TAG() {
    return 'bnum-button';
  }
}

/**
 * @enum {Symbol}
 * @property {Symbol} primary
 * @property {Symbol} secondary
 * @property {Symbol} danger
 * @property {(sym:Symbol) => string} toString
 * @property {(str:string) => Symbol} fromString
 */
const EButtonType = Object.freeze({
  primary: Symbol('primary'),
  secondary: Symbol('secondary'),
  danger: Symbol('danger'),
  toString(sym) {
    return Object.keys(this)
      .filter((x) => typeof EButtonType[x] === 'symbol')
      .find((x) => EButtonType[x] === sym);
  },
  fromString(str) {
    return EButtonType[str];
  },
});

{
  const TAG = HTMLMelButton.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, HTMLMelButton);
}

const CSS_DEFAULT_MARGIN = 'var(--custom-button-icon-margin)';

class HTMLIconMelButton extends HTMLMelButton {
  constructor() {
    super();
  }

  get id() {
    if (!this._p_get_data('id')) {
      this._p_save_into_data(
        'id',
        this.getAttribute('id') || this.generateId('button-icon'),
      );
    }

    return this._p_get_data('id');
  }

  get iconPos() {
    return this._p_get_data('icon-pos') ?? 'right';
  }

  get iconMarginRight() {
    return this._p_get_data('icon-margin-right') ?? CSS_DEFAULT_MARGIN;
  }

  get iconMarginLeft() {
    return this._p_get_data('icon-margin-left') ?? CSS_DEFAULT_MARGIN;
  }

  get icon() {
    return (
      this._p_get_data('icon') ??
      this.querySelector(`#icon-${this.id}`)?.icon ??
      'add'
    );
  }

  set icon(value) {
    this._p_save_into_data('icon', value);
    this.querySelector(`#icon-${this.id}`).icon = value;
  }

  _p_main() {
    super._p_main();

    let bnumIcon = this.querySelector(`#icon-${this.id}`);
    if (!bnumIcon) {
      bnumIcon = this.querySelector('bnum-icon');
      if (!bnumIcon) {
        bnumIcon = BnumHtmlIcon.Create({ icon: this.icon });

        let style = null;
        let styleValue = null;
        switch (this.iconPos) {
          case 'right':
            style = 'marginLeft';
            styleValue = this.iconMarginLeft;
            break;

          case 'left':
            style = 'marginRight';
            styleValue = this.iconMarginRight;
            break;

          default:
            break;
        }

        if (style) bnumIcon.style[style] = styleValue;

        if (this.iconPos === 'right') this.appendChild(bnumIcon);
        else this.prepend(bnumIcon);
      } else bnumIcon.setAttribute('id', `icon-${this.id}`);
    }

    bnumIcon = null;
  }

  _p_mode() {
    return 'inline-flex';
  }

  static CreateNode(
    icon,
    {
      iconPos = EIconPositions.right,
      iconMarginRight = CSS_DEFAULT_MARGIN,
      iconMarginLeft = CSS_DEFAULT_MARGIN,
      content = null,
    } = {},
  ) {
    /**
     * @type {HTMLIconMelButton}
     */
    let node = document.createElement(this.TAG);

    if (content) {
      if (typeof content === 'string') node.innerHTML = content;
      else {
        if (content.generate_dom)
          content = content.generate_dom(); //jshtml
        else if (content.css) content = content[0]; //jquery

        node.appendChild(content);
      }

      content = null;
    }

    if (icon !== 'add') node.data('icon', icon);

    if (iconPos !== EIconPositions.right) node.data('icon-pos', 'left');

    if (iconMarginLeft !== CSS_DEFAULT_MARGIN)
      node.data('icon-margin-left', iconMarginLeft);

    if (iconMarginRight !== CSS_DEFAULT_MARGIN)
      node.data('icon-margin-right', iconMarginRight);

    return node;
  }

  static CreateClickableIcon(icon) {
    return this.CreateNode(icon, { iconMarginLeft: '0px' });
  }

  static get TAG() {
    return 'bnum-button-icon';
  }
}

/**
 * @enum
 */
const EIconPositions = {
  right: Symbol(),
  left: Symbol(),
};

{
  const TAG = HTMLIconMelButton.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, HTMLIconMelButton);
}
