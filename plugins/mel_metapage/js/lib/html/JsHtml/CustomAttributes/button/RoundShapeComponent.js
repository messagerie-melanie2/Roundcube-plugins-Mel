import AHTMLComponent from '../lib/AHTMLComponent.js';

/**
 * Border radius par défaut
 * @default 'var(--cwc-button-border-radius, 5px)'
 * @type {string}
 * @constant
 */
const DEFAULT_BORDER_RADIUS = 'var(--cwc-button-border-radius, 5px)';

/**
 * @class
 * @classdesc Gère la forme du du bouton
 * @extends AHTMLComponent
 */
export default class RoundShapeComponent extends AHTMLComponent {
  /**
   * @type {import('../button/HTMLBnumButton.js').default}
   */
  #_parent;
  /**
   *
   * @param {import('../button/HTMLBnumButton.js').default} parent
   */
  constructor(parent) {
    super(parent);
    this.#_parent = parent;
  }

  /**
   * Si le bouton à des bords carré légèrement arrondi ou non
   * @type {boolean}
   * @readonly
   */
  get isSquare() {
    return this.#_parent.hasAttribute('square');
  }

  /**
   * Initialise le composant
   * @override
   */
  setup() {
    this.#_updateSquare();
  }

  /**
   * Action lorsqu'un attribut a été modifié
   * @param {string} name
   * @returns {void}
   */
  attributeUpdated(name) {
    if (name === 'square') {
      this.#_updateSquare();
    }
  }

  /**
   * Met à jour la forme du bouton
   * @returns {void}
   */
  #_updateSquare() {
    this.#_parent.style.borderRadius = this.isSquare
      ? DEFAULT_BORDER_RADIUS
      : null;

    if (this.isSquare) this.#_parent.addClass('bnum-button--roundsquare');
    else this.#_parent.removeClass('bnum-button--roundsquare');
  }
}
