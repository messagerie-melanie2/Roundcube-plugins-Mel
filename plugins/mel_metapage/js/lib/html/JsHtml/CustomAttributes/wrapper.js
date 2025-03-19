import { EMPTY_STRING } from '../../../constants/constants.js';
import {
  EWebComponentMode,
  HtmlCustomTag,
} from './js_html_base_web_elements.js';

export class HTMLWrapperElement extends HtmlCustomTag {
  constructor() {
    super({ mode: EWebComponentMode.div });
  }

  _p_main() {
    super._p_main();
  }

  /**
   * Met des éléments dans le wrapper
   * @param {string | ____JsHtml | HTMLElement | external:jQuery} data (string | ____JsHtml | HTMLElement | external:jQuery)
   * @returns {HTMLWrapperElement} Chaînage
   */
  wrap(data) {
    if (typeof data === 'string') this.innerHTML = data;
    else if (typeof data === 'object') {
      this.innerHTML = EMPTY_STRING;
      if (data.generate_dom) this.appendChild(data.generate_dom());
      else this.appendChild(data[0]);
    } else {
      this.innerHTML = EMPTY_STRING;
      this.appendChild(data);
    }

    return this;
  }

  /**
   * Créer un wrapper
   * @param {Object} [options={}]
   * @param {null | string | ____JsHtml | HTMLElement | external:jQuery} [options.contents=null] Données à l'intérieur du wrapper.
   * @returns {HTMLWrapperElement}
   */
  static CreateNode({ contents = null, context = document } = {}) {
    let node = context.createElement(this.TAG);

    if (contents) node.wrap(contents);

    return node;
  }

  /**
   * @type {string}
   * @default 'bnum-wrapper'
   * @readonly
   */
  static get TAG() {
    return 'bnum-wrapper';
  }
}

{
  if (!customElements.get(HTMLWrapperElement.TAG))
    customElements.define(HTMLWrapperElement.TAG, HTMLWrapperElement);
}
