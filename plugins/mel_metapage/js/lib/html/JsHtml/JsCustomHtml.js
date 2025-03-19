import { ABaseModulesJsHtml } from './ABaseModulesJsHtml.js';
import {
  BnumHtmlCenteredFlexContainer,
  BnumHtmlFlexContainer,
  BnumHtmlIcon,
  BnumHtmlSeparate,
  BnumHtmlSrOnly,
} from './CustomAttributes/js_html_base_web_elements.js';
import {
  HTMLTabContainer,
  HTMLTabReceiver,
} from './CustomAttributes/tabs/HTMLTabContainerAndReceiver.js';
import { HTMLTabsElement } from './CustomAttributes/tabs/HTMLTabElement.js';
import { HTMLWrapperElement } from './CustomAttributes/wrapper.js';

/**
 * @class
 * @classdesc
 * @extends ABaseModulesJsHtml<T>
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

  /**
   *
   * @param {import('./JsHtml.js').Attribs} attribs
   * @returns {T}
   */
  wrapper(attribs = {}) {
    return this._p_get().customElement(HTMLWrapperElement, attribs);
  }

  /**
   * Génère une liste d'onglets et son fonctionnement.
   *
   * Utilisez {@link tab_receiver} pour définir où se trouve les onglets (optionnels).
   *
   * Celui-ci doit se trouver dans un {@link tab_container}.
   *
   * Utilisez {@link tab_panel} pour définir les différents panneaux liés aux onglets.
   *
   * @param {string} navs Liste des onglets, séparé par une virgule.
   * @param {string} desc Description du groupe d'onglets
   * @param {Object} [options={}]
   * @param {import('./JsHtml.js').Attribs} [options.attribs={}]
   * @param {string | null | undefined} [options.pluginText=null] Plugin du texte des onglets
   * @returns {T}
   */
  tabs(navs, desc, { attribs = {}, pluginText = null } = {}) {
    attribs ??= {};
    attribs['data-navs'] = navs;
    attribs['data-description'] = desc;

    if (pluginText) attribs['data-ex-label'] = pluginText;

    return this._p_get().customElement(HTMLTabsElement, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} attribs
   * @returns {T}
   */
  tab_container(attribs = {}) {
    return this._p_get().customElement(HTMLTabContainer, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} attribs
   * @returns {T}
   */
  tab_receiver(attribs = {}) {
    return this._p_get().customElement(HTMLTabReceiver, attribs);
  }

  /**
   *
   * @param {string} linkedNav
   * @param {import('./JsHtml.js').Attribs} attribs
   * @returns {T}
   */
  tab_panel(linkedNav, attribs = {}) {
    attribs ??= {};
    attribs['data-linked-to'] = linkedNav;

    return this.wrapper(attribs);
  }
}
