import { BnumHtmlIcon } from '../js_html_base_web_elements.js';
import AHTMLComponent from '../lib/AHTMLComponent.js';
import { HTMLWrapperElement } from '../wrapper';

export const CLASS_LOADING_RECEIVER = 'loading-receiver';
export default class LoadingComponent extends AHTMLComponent {
  /**
   * @type {import('../button/HTMLBnumButton.js').default}
   */
  #_parent;
  constructor(parent) {
    super(parent);
    this.#_parent = parent;
  }

  /**
   * @type {boolean}
   * @readonly
   */
  get isLoadingMode() {
    return ['loading', 'true', true, 1, '1'].includes(this.getData('loading'));
  }

  setup() {
    if (this.isLoadingMode) {
      setTimeout(() => {
        this._p_save_data('loading', false);
        this.setLoadingMode();
      }, 250);
    }
  }

  attributeUpdated(name, value) {
    console.log('loaded', this.#_parent.elementLoaded);
    if (!this.#_getTargetWrapper() || !this.#_parent.elementLoaded) return;

    switch (name) {
      case 'data-loading':
        if (['loading', 'true', true, 1, '1'].includes(value))
          this.setLoadingMode();
        else this.stopLoadingmode();
        break;

      default:
        break;
    }
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
      ((el) => {
        const style = window
          .getComputedStyle(el, null)
          .getPropertyValue('font-size');

        return style;
      })(element);

    return fonstSize;
  }

  #_getTargetWrapper() {
    return this.#_parent.querySelector(`.${CLASS_LOADING_RECEIVER}`);
  }

  setLoadingMode() {
    if (!this.isLoadingMode) {
      this.#_parent.style.width = `${this.#_parent.offsetWidth}px`;
      this.#_parent.style.height = `${this.#_parent.offsetHeight}px`;

      this._p_save_data('loading', 'loading');
      this.disable();
      console.log(
        this.#_parent.icon,
        this.#_parent.querySelector('bnum-icon'),
        this.#_parent.outerHTML,
      );
      if (this.#_parent.icon) {
        this._p_save_data('icon', this.#_parent.icon);
        this.#_parent.icon = 'progress_activity';
        this.#_parent.querySelector('bnum-icon').classList.add('spin');
      } else {
        this._p_save_data('init_state', true);
        let targetWrapper = this.#_getTargetWrapper();
        let wrapper = HTMLWrapperElement.CreateNode();
        let loader = BnumHtmlIcon.Create({
          icon: 'progress_activity',
        }).addClass('spin');
        loader.style.fontSize = this.#_getFontSize(targetWrapper);
        loader.style.verticalAlign = 'middle';

        wrapper.style.textAlign = 'center';
        wrapper.addClass('internal__wrapper--loading').appendChild(loader);

        targetWrapper.style.display = 'none';

        targetWrapper.parentElement.appendChild(wrapper);

        targetWrapper = null;
        wrapper = null;
        loader = null;
      }

      this.#_parent.setState('loading');
    }

    return this;
  }

  stopLoadingmode() {
    if (this.isLoadingMode) {
      let targetWrapper = this.#_getTargetWrapper();

      this._p_save_data('loading', false);
      this.enable();

      if (this.#_parent.icon && !this.getData('init_state')) {
        this.#_parent.icon = this.getData('icon');
        this.#_parent.querySelector('bnum-icon').classList.remove('spin');
      } else {
        this.#_parent.style.width = null;
        this.#_parent.style.height = null;

        this._p_save_data('init_state', false);
        this.#_parent.querySelector('.internal__wrapper--loading')?.remove?.();
        this.#_parent.removeState('loading');

        targetWrapper.style.display = null;
        targetWrapper = null;
      }

      return this;
    }
  }
}
