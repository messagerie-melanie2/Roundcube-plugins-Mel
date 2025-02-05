import { ABaseModulesJsHtml } from './ABaseModulesJsHtml.js';
import {
  BnumHtmlCenteredFlexContainer,
  BnumHtmlFlexContainer,
  BnumHtmlIcon,
  BnumHtmlSeparate,
  BnumHtmlSrOnly,
} from './CustomAttributes/js_html_base_web_elements.js';

/**
 * @class
 * @classdesc
 * @template {import('./JsHtml.js')._JsHtml} T
 */
export class JsCustomHtml extends ABaseModulesJsHtml {
  constructor(jshtml) {
    super(jshtml);
  }

  /**
   * @param {string} icon
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  icon(icon, attribs = {}) {
    if (typeof icon !== 'string') {
      attribs = icon ?? {};
      icon = null;
    }

    return this._p_get()
      .customElement(BnumHtmlIcon, attribs)
      .resolveNow((jshtml) => (icon ? jshtml.attr('data-icon', icon) : jshtml));
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  screen_reader(attribs = {}) {
    return this._p_get().customElement(BnumHtmlSrOnly, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  sr(attribs = {}) {
    return this.screen_reader(attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  separate(attribs = {}) {
    return this._p_get().customElement(BnumHtmlSeparate, attribs).end();
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  flex_container(attribs = {}) {
    return this._p_get()
      .customElement(BnumHtmlFlexContainer, attribs)
      .css('display', 'flex');
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  centered_flex_container(attribs = {}) {
    return this._p_get()
      .customElement(BnumHtmlCenteredFlexContainer, attribs)
      .css('display', 'flex');
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  placeholder(attribs = {}) {
    return this._p_get().customElement(
      { tag: 'bnum-placeholder', onconnected: () => {}, hasShadowDom: false },
      attribs,
    );
  }
}
