import AHTMLComponent from '../lib/AHTMLComponent.js';

/**
 * Rayon par défaut du bouton
 * @default '60px'
 * @type {string}
 * @constant
 */
const DEFAULT_RADIUS = '60px';
/**
 * Rayon par défaut du bouton avec des bords carrés, légèrement arrondis
 * @default '5px'
 * @type {string}
 * @constant
 */
const SQUARE_RADIUS = '5px';

/**
 * @class
 * @classdesc Gère la forme du bouton
 * @extends AHTMLComponent
 */
export default class RoundShapeComponent extends AHTMLComponent {
  /**
   *
   * @param {HTMLElement} parent
   */
  constructor(parent) {
    super(parent);
  }

  /**
   * Si le bouton à des bords carré légèrement arrondi ou non
   * @type {boolean}
   * @readonly
   */
  get isSquare() {
    return this._p_parent().hasAttribute('square');
  }

  /**
   * Initialise le composant
   * @override
   */
  setup() {
    if (this.isSquare) this._p_parent().addClass('bnum-select--roundsquare');
    else this._p_parent().removeClass('bnum-select--roundsquare');
  }

  /**
   * Style du bouton
   * @returns {string}
   */
  style() {
    return `
      :host {
        border-radius: ${this.isSquare ? `var(--dropdown-square-radius, ${SQUARE_RADIUS})!important` : `var(--dropdown-radius, ${DEFAULT_RADIUS})`};
      }
    `;
  }
}
