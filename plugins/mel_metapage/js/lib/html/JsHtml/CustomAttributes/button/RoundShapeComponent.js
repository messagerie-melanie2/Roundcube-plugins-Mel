import AHTMLComponent from '../lib/AHTMLComponent.js';

export default class RoundShapeComment extends AHTMLComponent {
  /**
   * @type {import('../button/HTMLBnumButton.js').default}
   */
  #_parent;
  constructor(parent) {
    super(parent);
    this.#_parent = parent;
  }

  get isSquare() {
    return this.#_parent.hasAttribute('square');
  }

  setup() {
    this.#_updateSquare();
  }

  attributeUpdated(name, value) {
    if (name === 'square') {
      this.#_updateSquare();
    }
  }

  #_updateSquare() {
    this.#_parent.style.borderRadius = this.isSquare ? '5px' : null;
  }
}
