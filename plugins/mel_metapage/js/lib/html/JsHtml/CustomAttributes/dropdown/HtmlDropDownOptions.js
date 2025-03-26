import { EMPTY_STRING } from '../../../../constants/constants.js';
import { HtmlCustomTag } from '../js_html_base_web_elements.js';

/**
 * @interface
 * @extends HtmlCustomTag
 */
export default class IOption extends HtmlCustomTag {
  constructor() {
    super();
  }

  /**
   * Convertit cet élément en option
   * @returns {HTMLOptionElement}
   * @abstract
   */
  toOption() {}
}

/**
 * Options du dropdown. Elément par défaut
 * @class
 * @implements {IOption}
 */
export class HTMLBnumDropDownOption extends IOption {
  constructor() {
    super();
  }

  /**
   * @inheritdoc
   * @override
   */
  toOption() {
    super.toOption();
    let option = document.createElement('option');
    for (const element of this.attributes) {
      option.setAttribute(element.name, element.value);
    }
    option.innerHTML = this.innerHTML;

    if (!option.hasAttribute('value'))
      option.setAttribute('value', EMPTY_STRING);

    return option;
  }

  /**
   * @default 'bnum-option'
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return 'bnum-option';
  }
}

HTMLBnumDropDownOption.TryDefine(
  HTMLBnumDropDownOption.TAG,
  HTMLBnumDropDownOption,
);

/**
 * Options du dropdown. Placeholder
 * @class
 * @extends {HTMLBnumDropDownOption}
 */
export class HTMLBnumDropDownDefaultOption extends HTMLBnumDropDownOption {
  constructor() {
    super();
  }

  /**
   * @inheritdoc
   * @override
   */
  toOption() {
    let option = super.toOption();
    option.setAttribute('selected', 'selected');
    option.setAttribute('disabled', 'disabled');
    option.classList.add('disabled');
    option.style.display = 'none';
    return option;
  }

  /**
   * @default 'default-option'
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return 'default-option';
  }
}

HTMLBnumDropDownDefaultOption.TryDefine(
  HTMLBnumDropDownDefaultOption.TAG,
  HTMLBnumDropDownDefaultOption,
);

/**
 * Options du dropdown. Elément par défaut.
 * @class
 * @extends {HTMLBnumDropDownOption}
 */
export class HTMLBnumDropDownSelectedOption extends HTMLBnumDropDownOption {
  constructor() {
    super();
  }

  /**
   * @inheritdoc
   * @override
   */
  toOption() {
    let option = super.toOption();
    option.setAttribute('selected', 'selected');
    return option;
  }

  /**
   * @default 'selected-option'
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return 'selected-option';
  }
}

HTMLBnumDropDownSelectedOption.TryDefine(
  HTMLBnumDropDownSelectedOption.TAG,
  HTMLBnumDropDownSelectedOption,
);
