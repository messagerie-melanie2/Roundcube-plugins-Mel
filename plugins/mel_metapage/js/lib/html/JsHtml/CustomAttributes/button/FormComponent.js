import { EMPTY_STRING, SPACE } from '../../../../constants/constants.js';
import AHTMLComponent from '../lib/AHTMLComponent.js';
import {
  ENABLE_CLASS_BUTTON,
  CLASS_BUTTON,
  OLD_BNUM_MODE,
} from './constants.js';

/**
 * @class
 * @classdesc Gère les variations du bouton
 * @extends AHTMLComponent
 */
export default class FormComponent extends AHTMLComponent {
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
   * Variation du bouton
   * @type {EButtonType}
   * @readonly
   */
  get variation() {
    return EButtonType.fromString(
      this.getData('variation') || EButtonType.toString(EButtonType.primary),
    );
  }

  /**
   * Initialise le composant
   * @override
   */
  setup() {
    super.setup();

    let variationClass = [];

    if (ENABLE_CLASS_BUTTON) variationClass.push(CLASS_BUTTON);

    switch (this.variation) {
      case EButtonType.primary:
        variationClass.push(OLD_BNUM_MODE ? EMPTY_STRING : '--primary');
        this.#_parent.setState('primary');
        break;

      case EButtonType.secondary:
        variationClass.push(OLD_BNUM_MODE ? 'white' : '--secondary');
        this.#_parent.setState('secondary');
        break;

      case EButtonType.danger:
        variationClass.push(OLD_BNUM_MODE ? 'btn btn-danger' : '--danger');
        this.#_parent.setState('danger');
        break;

      default:
        throw new Error('Variation pas géré');
    }

    this.#_parent.addClass(
      ...variationClass
        .filter((x) => x !== EMPTY_STRING)
        .map((x) => (x.includes(SPACE) ? x.split(SPACE) : x))
        .flat(),
    );
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
export const EButtonType = Object.freeze({
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
