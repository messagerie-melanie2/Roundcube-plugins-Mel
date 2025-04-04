import { Random } from '../../../../classes/random.js';
import {
  BnumHtmlIcon,
  EWebComponentMode,
} from '../js_html_base_web_elements.js';
import AHTMLComponent from '../lib/AHTMLComponent.js';
import { HTMLWrapperElement } from '../wrapper.js';
import { CLASS_LOADING_RECEIVER, CSS_DEFAULT_MARGIN } from './constants.js';

/**
 * @class
 * @classdesc Gère l'icône du bouton
 * @extends AHTMLComponent
 */
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
   * Id interne
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
   * Position de l'icône
   * @type {'left' | 'right'}
   * @readonly
   */
  get iconPos() {
    return this.getData('icon-pos') ?? 'right';
  }

  /**
   * Margin de l'icône
   * @type {string}
   * @readonly
   */
  get iconMargin() {
    return this.getData('icon-margin') ?? CSS_DEFAULT_MARGIN;
  }

  /**
   * Icône
   * @type {?string}
   */
  get icon() {
    return (
      this.getData('icon') ??
      this.querySelector(`#icon-${this.id}`)?.icon ??
      this.querySelector('bnum-icon')?.icon ??
      (this.querySelector('bnum-icon')?.innerText || null)
    );
  }

  set icon(value) {
    this._p_save_data('icon', value);
    this.#_initIcon().querySelector(`#icon-${this.id}`).icon = value;
  }

  /**
   * Initialise le composant
   * @override
   */
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

  /**
   * Gère l'affichage de l'icône
   * @returns {this}
   * @private
   */
  #_initIcon() {
    if (this.icon) {
      this.#_parent.addClass('bnum-button--icon');
      let bnumIcon = this.querySelector(`#icon-${this.id}`);

      if (!bnumIcon) {
        bnumIcon = this.querySelector('bnum-icon');

        if (bnumIcon) {
          if (bnumIcon.parentElement.childNodes[0] === bnumIcon)
            this._p_save_data('icon-pos', 'left');
          else this._p_save_data('icon-pos', 'right');
        } else bnumIcon = BnumHtmlIcon.Create({ icon: this.icon });

        bnumIcon.attr('id', `icon-${this.id}`);

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
          let loaders = this.#_parent.querySelectorAll(
            `.${CLASS_LOADING_RECEIVER}`,
          );
          if (loaders.length) {
            for (const element of loaders) {
              element.classList.remove(CLASS_LOADING_RECEIVER);
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
          .addClass(CLASS_LOADING_RECEIVER)
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
      }

      bnumIcon = null;
    }

    return this;
  }

  /**
   * Active le bouton
   * @returns {import('../lib/AHTMLCustomInternalElement').default}
   */
  enable() {
    super.enable();
    return this.#_parent.removeState('disabled');
  }

  /**
   * Désactive le bouton
   * @returns {import('../lib/AHTMLCustomInternalElement').default}
   */
  disable() {
    super.disable();
    return this.#_parent.setState('disabled');
  }
}
