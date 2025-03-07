import { EMPTY_STRING } from '../../../../constants/constants.js';
import { isNullOrUndefined } from '../../../../mel';
import { EButtonType } from './FormComponent';
import HTMLBnumButton from './HTMLBnumButton.js';

export class HTMLBnumButtonBaseCreator {
  /**
   * @type {HTMLBnumButton}
   */
  #_node;
  constructor(tag = HTMLBnumButton.TAG) {
    this.#_node = document.createElement(tag);
  }

  /**
   * @type {boolean}
   * @readonly
   */
  get canSetup() {
    return !isNullOrUndefined(this.#_node);
  }

  /**
   * @type {HTMLBnumButton}
   * @readonly
   * @protected
   */
  get _p_node() {
    return this.#_node;
  }

  setContent(content) {
    this.#_node.innerText = EMPTY_STRING;
    this.#_node.appendChild(
      typeof content === 'string' ? document.createTextNode(content) : content,
    );
    return this;
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

export class HTMLBnumButtonCreator extends HTMLBnumButtonBaseCreator {
  constructor() {
    super();
  }

  setVariation(variation) {
    this._p_node.setAttribute(
      'data-variation',
      EButtonType.toString(variation),
    );
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
}
