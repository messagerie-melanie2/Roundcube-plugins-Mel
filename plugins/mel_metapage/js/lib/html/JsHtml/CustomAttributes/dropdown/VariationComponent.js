import { EMPTY_STRING } from '../../../../constants/constants.js';
import { OLD_BNUM_MODE } from '../button/constants.js';
import {
  BnumHtmlIcon,
  BnumHtmlShadowIcon,
} from '../js_html_base_web_elements.js';
import AHTMLComponent from '../lib/AHTMLComponent.js';

/**
 * @class
 * @classdesc Gère la variation du bouton
 * @extends AHTMLComponent
 */
export default class DropDownVariationComponent extends AHTMLComponent {
  /**
   *
   * @param {HTMLElement} parent
   */
  constructor(parent) {
    super(parent);
  }

  /**
   * @protected
   * @returns {import('./HTMLDropDownElement.js').default}
   */
  _p_parent() {
    return super._p_parent();
  }

  /**
   * Variation du bouton
   * @type {EDropDownVariations}
   * @readonly
   */
  get variation() {
    return (
      EDropDownVariations.fromString(this.getData('variation')) ||
      EDropDownVariations.toString(EDropDownVariations.default)
    );
  }

  /**
   * @inheritdoc
   * @override
   * @param  {...any} args
   */
  setup(...args) {
    super.setup(...args);

    let iconElement = this._p_parent().querySelector(BnumHtmlIcon.TAG);

    if (iconElement) {
      args[0].prepend(BnumHtmlShadowIcon.Create({ icon: iconElement.icon }));
      iconElement.remove();
    } else if (
      (iconElement = this._p_parent().querySelector(BnumHtmlShadowIcon.TAG))
    ) {
      args[0].prepend(iconElement);
    }

    if (iconElement) this._p_parent().addClass('bnum-select--icon');

    switch (this.variation) {
      case EDropDownVariations.default:
        if (OLD_BNUM_MODE) {
          this._p_parent().classList.add(
            'input-mel',
            'fake-input',
            'form-control',
          );
        } else {
          this._p_parent().addClass('bnum-select--default');
        }
        break;

      case EDropDownVariations.alternate:
        if (!OLD_BNUM_MODE) this._p_parent().addClass('bnum-select--alternate');
        break;

      default:
        break;
    }

    this._p_parent().setState(EDropDownVariations.toString(this.variation));

    iconElement = null;
  }

  /**
   * Style du bouton
   * @returns {string}
   */
  style() {
    let style;
    switch (this.variation) {
      case EDropDownVariations.alternate:
        style = `
            :host(:state(alternate)) {
                color: var(--dropdown-color--alternate, var(--mel-button-text-color, #363a5b));
                padding: var(--dropdow-padding--alternate, 8px 10px 8px 0px);
                /*border-radius: 5px;*/
            }

            :host(:state(alternate)) > bnum-wrapper {
              justify-content: var(--dropdown-justify-content--alternate, left);
            }

            :host(:state(alternate)) select {
              padding-left: 0px;
              color: var(--dropdown-color--alternate, var(--mel-button-text-color, #363a5b));
              /*-moz-appearance: none; * Firefox *
              -webkit-appearance: none; * Safari and Chrome *
              appearance: none; */
            }

            :host(:state(alternate):hover) {
                background-color: var(--dropdown-background-color--alternate--hover, var(--mel-button-hover-background-color, #f0f0f0));
                color: var(--dropdown-color--alternate--hover, var(--mel-button-hover-text-color, #363a5b));
            }

            :host(:state(alternate):hover) select {
                color: var(--dropdown-color--alternate--hover, var(--mel-button-hover-text-color, #363a5b));
            }

            :host(:state(alternate):active) {
                background-color: var(--dropdown-background-color--alternate--clicked, var(--mel-button-active-background-color, #DDDDDD));
                color: var(--dropdown-color--alternate--clicked, var(--mel-button-active-text-color, #363a5b));
            }

            :host(:state(alternate):active) select {
                color: var(--dropdown-color--alternate--clicked, var(--mel-button-active-text-color, #363a5b));
            }
            `;
        break;

      default:
        break;
    }

    return style ?? EMPTY_STRING;
  }
}

/**
 * @enum {Symbol}
 * @property {Symbol} default
 * @property {Symbol} alternate
 * @property {(sym:Symbol) => string} toString
 * @property {(str:string) => Symbol} fromString
 */
export const EDropDownVariations = Object.freeze({
  default: Symbol('default'),
  alternate: Symbol('alternate'),
  toString(sym) {
    return Object.keys(this)
      .filter((x) => typeof EDropDownVariations[x] === 'symbol')
      .find((x) => EDropDownVariations[x] === sym);
  },
  fromString(str) {
    return EDropDownVariations[str];
  },
});
