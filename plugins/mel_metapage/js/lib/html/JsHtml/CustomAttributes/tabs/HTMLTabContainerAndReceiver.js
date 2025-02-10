import {
  EWebComponentMode,
  HtmlCustomTag,
} from '../js_html_base_web_elements.js';
export { HTMLTabContainer, HTMLTabReceiver };
/**
 * @class
 * @classdesc A ajouter dans un TabsElement, element parent qui sera en dehors des panneaux et qui contiendra les onglets. Doit avoir un HTMLTabReceiver qui contiendra les onglets
 * @extends HtmlCustomTag
 * @package
 * @hideconstructor
 */
class HTMLTabContainer extends HtmlCustomTag {
  constructor() {
    super();
  }

  _p_main() {
    super._p_main();
  }

  /**
   * Balise
   * @type {string}
   * @readonly
   */
  static get TAG() {
    return 'bnum-tab-container';
  }
}

{
  const TAG = HTMLTabContainer.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, HTMLTabContainer);
}

/**
 * @class
 * @classdesc A mettre dans un HTMLTabContainer, contient les onglets.
 * @package
 * @hideconstructor
 * @extends HtmlCustomTag
 */
class HTMLTabReceiver extends HtmlCustomTag {
  constructor() {
    super({ mode: EWebComponentMode.div });
  }

  _p_main() {
    super._p_main();
  }

  /**
   * Balise
   * @type {string}
   * @readonly
   */
  static get TAG() {
    return 'bnum-tab-receiver';
  }
}

{
  const TAG = HTMLTabReceiver.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, HTMLTabReceiver);
}
