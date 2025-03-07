import { EMPTY_STRING } from '../../../../constants/constants.js';
import { isNullOrUndefined } from '../../../../mel.js';
import { EWebComponentMode } from '../js_html_base_web_elements';
import AHTMLCustomInternalElement from '../lib/AHTMLCustomInternalElement.js';
import { HTMLWrapperElement } from '../wrapper.js';
import FormComponent, {
  CLASS_BUTTON,
  EButtonType,
  ENABLE_CLASS_BUTTON,
  OLD_BNUM_MODE,
} from './FormComponent.js';
import IconComponent from './IconComponent.js';
import LoadingComponent, {
  CLASS_LOADING_RECEIVER,
} from './LoadingComponent.js';
import RoundShapeComment from './RoundShapeComponent.js';

const ENABLE_EXTRA_CLASS_BUTTON = true;
const EXTRA_CLASSES = ['no-margin-button', 'no-button-margin'];

export default class HTMLBnumButton extends AHTMLCustomInternalElement {
  /**
   * @type {string[]}
   * @readonly
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
      new RoundShapeComment(this),
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

  get iconPos() {
    return this.#_iconComponent.iconPos;
  }

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

  get icon() {
    return this.#_iconComponent.icon;
  }

  set icon(value) {
    this.#_iconComponent.icon = value;
  }

  _p_main() {
    super._p_main();

    // this.style.animation = 'none';
    // this.style.display = 'none';
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

  _p_before() {}

  attributeChangedCallback(name, oldValue, newValue) {
    for (const component of this.#_components) {
      component.attributeUpdated(name, newValue);
    }
  }

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

  setLoadingMode() {
    this.#_loadComponent.setLoadingMode();
    return this;
  }

  stopLoadingMode() {
    this.#_loadComponent.stopLoadingmode();
    return this;
  }

  static CreateNode(
    content,
    {
      form = EButtonType.primary,
      icon = null,
      iconPos = 'right',
      iconMarginLeft = null,
      iconMarginRight = null,
      disabled = false,
    },
  ) {
    /**
     * @type {HTMLBnumButton}
     */
    let node = document.createElement('mel-button');
    node.appendChild(
      typeof node === 'string' ? document.createTextNode(content) : content,
    );

    if (form) node.setAttribute('data-variation', EButtonType.toString(form));
    if (icon) node.setAttribute('data-icon', icon);
    if (iconMarginLeft)
      node.setAttribute('data-icon-margin-left', iconMarginLeft);
    if (iconMarginRight)
      node.setAttribute('data-icon-margin-right', iconMarginRight);
    if (disabled) node.disable();

    node.setAttribute('data-icon-pos', iconPos);

    return node;
  }

  /**
   * @type {HTMLBnumButtonCreator}
   * @readonly
   */
  static get Create() {
    return new HTMLBnumButtonCreator();
  }

  /**
   * @readonly
   */
  static get TAG() {
    return 'mel-button';
  }
}

class HTMLBnumButtonCreator {
  /**
   * @type {HTMLBnumButton}
   */
  #_node;
  constructor() {
    this.#_node = document.createElement(HTMLBnumButton.TAG);
  }

  /**
   * @type {boolean}
   * @readonly
   */
  get canSetup() {
    return !isNullOrUndefined(this.#_node);
  }

  setContent(content) {
    this.#_node.innerText = EMPTY_STRING;
    this.#_node.appendChild(
      typeof content === 'string' ? document.createTextNode(content) : content,
    );
    return this;
  }

  setVariation(variation) {
    this.#_node.setAttribute('data-variation', EButtonType.toString(variation));
    return this;
  }

  setPrimaryVariation() {
    return this.setVariation(EButtonType.primary);
  }

  setSecondaryVariation() {
    return this.setVariation(EButtonType.secondary);
  }

  setDangerVariation() {
    return this.setVariation(EButtonType.danger);
  }

  setIcon(icon) {
    this.#_node.setAttribute('data-icon', icon);
    return this;
  }

  setIconPos(pos) {
    this.#_node.setAttribute('data-icon-pos', pos);
    return this;
  }

  setIconMargin(margin) {
    this.#_node.setAttribute('data-icon-margin', margin);
    return this;
  }

  setDisabled() {
    this.#_node.disable();
    return this;
  }

  setEnabled() {
    this.#_node.enable();
    return this;
  }

  setLoading() {
    this.#_node.setAttribute('data-loading', 'loading');
    return this;
  }

  setSquare() {
    this.#_node.setAttribute('square', 'square');
    return this;
  }

  generate() {
    const node = this.#_node;
    this.#_node = null;
    return node;
  }
}

HTMLBnumButton.TryDefine(HTMLBnumButton.TAG, HTMLBnumButton);

export class HTMLBnumButtonPrimary extends HTMLBnumButton {
  constructor() {
    super();
  }

  _p_before() {
    this.attrs({
      'data-variation': EButtonType.toString(EButtonType.primary),
    });
  }

  _p_main() {
    super._p_main();
  }

  static get TAG() {
    return 'primary-button';
  }
}

HTMLBnumButton.TryDefine(HTMLBnumButtonPrimary.TAG, HTMLBnumButtonPrimary);

export class HTMLBnumButtonSecondary extends HTMLBnumButton {
  constructor() {
    super();
  }

  _p_before() {
    this.attrs({
      'data-variation': EButtonType.toString(EButtonType.secondary),
    });
  }

  _p_main() {
    super._p_main();
  }

  static get TAG() {
    return 'secondary-button';
  }
}

HTMLBnumButton.TryDefine(HTMLBnumButtonSecondary.TAG, HTMLBnumButtonSecondary);

export class HTMLBnumButtonDanger extends HTMLBnumButton {
  constructor() {
    super();
  }

  _p_before() {
    this.attrs({
      'data-variation': EButtonType.toString(EButtonType.danger),
    });
  }

  _p_main() {
    super._p_main();
  }

  static get TAG() {
    return 'error-button';
  }
}

HTMLBnumButton.TryDefine(HTMLBnumButtonDanger.TAG, HTMLBnumButtonDanger);
