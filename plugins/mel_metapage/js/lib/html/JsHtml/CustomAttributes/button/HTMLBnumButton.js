import { EMPTY_STRING } from '../../../../constants/constants.js';
import { EWebComponentMode } from '../js_html_base_web_elements';
import AHTMLCustomInternalElement from '../lib/AHTMLCustomInternalElement.js';
import { HTMLWrapperElement } from '../wrapper.js';
import FormComponent, {
  CLASS_BUTTON,
  ENABLE_CLASS_BUTTON,
  OLD_BNUM_MODE,
} from './FormComponent.js';

const ENABLE_EXTRA_CLASS_BUTTON = true;
const EXTRA_CLASSES = ['no-margin-button', 'no-button-margin'];

export default class HTMLBnumButton extends AHTMLCustomInternalElement {
  /**
   * @type {string[]}
   * @readonly
   */
  static get observedAttributes() {
    return ['data-loading'];
  }

  /**
   * @type {import('../lib/AHTMLComponent.js').default[]}
   * @private
   */
  #_components;

  constructor() {
    super({ mode: EWebComponentMode.inline_block });
    this.#_components = [new FormComponent(this)];
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

  _p_main() {
    super._p_main();

    this.#_set_mode().setAttribute('role', 'button');

    if (ENABLE_CLASS_BUTTON) this.addClass(CLASS_BUTTON);

    if (ENABLE_EXTRA_CLASS_BUTTON) this.addClass(...EXTRA_CLASSES);

    this.setAttribute('tabindex', '0');

    let wrapper = HTMLWrapperElement.CreateNode();
    wrapper.addClass('internal__wrapper--main').append(...this.childNodes);
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
  }

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
}
