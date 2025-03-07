import { Random } from '../../../../classes/random.js';
import {
  BnumHtmlIcon,
  EWebComponentMode,
} from '../js_html_base_web_elements.js';
import AHTMLComponent from '../lib/AHTMLComponent.js';
import { HTMLWrapperElement } from '../wrapper.js';

const CSS_DEFAULT_MARGIN = 'var(--custom-button-icon-margin)';

export default class IconComponent extends AHTMLComponent {
  #_id;
  /**
   * @type {import('../lib/AHTMLCustomInternalElement').default}
   */
  #_parent;
  /**
   *
   * @param {import('../lib/AHTMLCustomInternalElement').default} parent
   */
  constructor(parent) {
    super(parent);
    this.#_parent = parent;
  }

  /**
   * @type {string}
   * @readonly
   */
  get id() {
    return (
      this.#_parent.id ||
      (() => {
        //On génère un id si il n'existe pas
        if (!this.#_id) {
          do {
            this.#_id = Random.random_string(Random.intRange(2, 10));
          } while (document.getElementById(`icon-${this.#_id}`));
        }

        //On récupère le bon id
        return this.#_id;
      })()
    );
  }

  /**
   * @type {'left' | 'right'}
   * @readonly
   */
  get iconPos() {
    return this.getData('icon-pos') ?? 'right';
  }

  /**
   * @type {string}
   * @readonly
   */
  get iconMargin() {
    return this.getData('icon-margin') ?? CSS_DEFAULT_MARGIN;
  }

  /**
   * @type {?string}
   */
  get icon() {
    return this.getData('icon') ?? this.querySelector(`#icon-${this.id}`)?.icon;
  }

  set icon(value) {
    this._p_save_data('icon', value);
    this.#_initIcon().querySelector(`#icon-${this.id}`).icon = value;
  }

  setup() {
    super.setup();
    this.#_initIcon();
  }

  /**
   * Selectionne un élément
   * @param {K} selectors
   * @returns {?HTMLElementTagNameMap[K]}
   * @template {HTMLElementTagNameMap} K
   */
  querySelector(selectors) {
    return this.#_parent.querySelector(selectors);
  }

  #_initIcon() {
    if (this.icon) {
      let bnumIcon = this.querySelector(`#icon-${this.id}`);

      if (!bnumIcon) {
        bnumIcon = this.querySelector('bnum-icon');

        if (!bnumIcon) {
          bnumIcon = BnumHtmlIcon.Create({ icon: this.icon }).attr(
            'id',
            `icon-${this.id}`,
          );

          let style = null;
          let styleValue = this.iconMargin;
          switch (this.iconPos) {
            case 'right':
              style = 'marginLeft';
              break;

            case 'left':
              style = 'marginRight';
              break;

            default:
              break;
          }

          if (style) bnumIcon.style[style] = styleValue;
          bnumIcon.style.verticalAlign = 'middle';

          {
            let loaders = this.#_parent.querySelectorAll('.loading-receiver');
            if (loaders.length) {
              for (const element of loaders) {
                element.classList.remove('loading-receiver');
              }
            }

            let wrapper = this.#_parent.querySelectorAll('bnum-wrapper');
            if (wrapper.length) {
              for (const element of wrapper) {
                element.setMode(EWebComponentMode.inline_block);
              }
            }
          }

          bnumIcon = HTMLWrapperElement.CreateNode({
            contents: bnumIcon,
          })
            .addClass('loading-receiver')
            .setMode(EWebComponentMode.inline_block);

          let mainWrapper = HTMLWrapperElement.CreateNode()
            .addClass('internal__wrapper--icon')
            .setMode(EWebComponentMode.flex);

          mainWrapper.style.alignItems = 'center';

          mainWrapper.append(...this.#_parent.children);

          if (this.iconPos === 'right') mainWrapper.appendChild(bnumIcon);
          else mainWrapper.prepend(bnumIcon);
          this.#_parent.appendChild(mainWrapper);
          mainWrapper = null;
        } else bnumIcon.setAttribute('id', `icon-${this.id}`);
      }

      bnumIcon = null;
    }

    return this;
  }

  enable() {
    super.enable();
    return this.#_parent.removeState('disabled');
  }

  disable() {
    super.disable();
    return this.#_parent.setState('disabled');
  }
}
