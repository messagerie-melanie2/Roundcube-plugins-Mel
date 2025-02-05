import { MelEnumerable } from '../../classes/enum.js';
import { isNullOrUndefined } from '../../mel.js';
import { ABaseModulesJsHtml } from './ABaseModulesJsHtml.js';
import { BootstrapLoader } from './CustomAttributes/bootstrap-loader.js';

/**
 * @class
 * @classdesc
 * @template {import('./JsHtml.js')._JsHtml} T
 */
export class JsBoostrapHtml extends ABaseModulesJsHtml {
  constructor(jshtml) {
    super(jshtml);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  row(attribs = {}) {
    return this._p_get().div(attribs).addClass('row');
  }

  /**
   * @param {number | string} size
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  column(size, attribs = {}) {
    return this._p_get().div(attribs).addClass(`col-${size}`);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_1(attribs = {}) {
    return this.column(1, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_2(attribs = {}) {
    return this.column(2, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_3(attribs = {}) {
    return this.column(3, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_4(attribs = {}) {
    return this.column(4, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_5(attribs = {}) {
    return this.column(5, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_6(attribs = {}) {
    return this.column(6, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_7(attribs = {}) {
    return this.column(7, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_8(attribs = {}) {
    return this.column(8, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_9(attribs = {}) {
    return this.column(9, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_10(attribs = {}) {
    return this.column(10, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_11(attribs = {}) {
    return this.column(11, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  col_12(attribs = {}) {
    return this.column(12, attribs);
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  card(attribs = {}) {
    return this._p_get().div(attribs).addClass('card');
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  card_body(attribs = {}) {
    return this._p_get().div(attribs).addClass('card-body');
  }

  /**
   * @param {Object} [options={}]
   * @param {import('./JsHtml.js').Attribs} [options.attribs={}]
   * @param {string} [options.tag='h5']
   * @returns {T}
   */
  card_title({ attribs = {}, tag = 'h5' } = {}) {
    return this._p_get().tag(tag, attribs).addClass('card-title');
  }

  /**
   * @param {Object} [options={}]
   * @param {import('./JsHtml.js').Attribs} [options.attribs={}]
   * @param {string} [options.tag='h6']
   * @returns {T}
   */
  card_subtitle({ attribs = {}, tag = 'h6' } = {}) {
    return this._p_get()
      .tag(tag, attribs)
      .addClass('card-subtitle')
      .addClass('mb-2');
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  card_text(attribs = {}) {
    return this._p_get().p(attribs).addClass('card-text');
  }

  /**
   * @param {string} [url='#']
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  card_link(url = '#', attribs = {}) {
    return this._p_get().a(attribs).addClass('card-link').attr('href', url);
  }

  /**
   * @param {string} src
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  card_img_top(src, attribs = {}) {
    return this._p_get().img(attribs).attr('src', src).addClass('card-img-top');
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  card_container(attribs = {}) {
    attribs ??= {};

    //prettier-ignore
    return this
    .card(attribs)
      .if(attribs['data-card-img-top'])
        .bootstrap().card_img_top(attribs['data-card-img-top'], {alt:(attribs['data-card-img-top-alt'] || attribs['data-card-img-top'])})
      .endif()
      .bootstrap().card_body()
        .if(attribs['data-card-title'])
          .bootstrap().card_title().resolveNow((jshtml) => attribs.id ? jshtml.attr('for', attribs.id) : jshtml)
            .text(attribs['data-card-title'])
          .end()
        .endif()
        .if(attribs['data-card-subtitle'])
          .bootstrap().card_subtitle()
            .text(attribs['data-card-subtitle'])
          .end()
        .endif()
        .if(attribs['data-card-body'])
          .bootstrap().card_text()
            .text(attribs['data-card-body'])
          .end()
        .endif()
        .if(attribs['data-card-footer-link-max'])
          .each((jshtml, it) => {
            if (attribs['data-card-footer-link-max'] && it <= +attribs['data-card-footer-link-max']){
              return jshtml.bootstrap().card_link({ href: attribs[`data-card-footer-link-${it}`] }).text(attribs[`data-card-footer-link-${it}-text`]).end();
            }
            else return jshtml;
          }, ...MelEnumerable.range(1, attribs['data-card-footer-link-max'] ? (+attribs['data-card-footer-link-max'] + 1) : 1))
        .endif()
  }

  /**
   * @returns {T}
   */
  center() {
    return this._p_get()._updated_balise().addClass('mx-auto');
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  btn_group(attribs = {}) {
    return this._p_get()
      .div(attribs)
      .addClass('btn-group')
      .attr('role', 'group');
  }

  /**
   *
   * @param {import('./JsHtml.js').Attribs} [attribs={}]
   * @returns {T}
   */
  btn_group_vertical(attribs = {}) {
    return this._p_get()
      .div(attribs)
      .addClass('btn-group-vertical')
      .attr('role', 'group');
  }

  /**
   *
   * @param {Object} [options={}]
   * @param {('inline' | 'block' | 'inline-block' | 'flex')} [options.mode='inline-block']
   * @param {string | undefined} [options.color=undefined]
   * @param {'border' | 'grow'} [options.spinner='border']
   * @param {boolean | null | undefined} [options.center=false]
   * @returns {T}
   */
  loader({
    mode = 'inline-block',
    color = undefined,
    spinner = 'border',
    center = false,
    attribs = {},
  } = {}) {
    attribs['data-mode'] = mode;
    attribs['data-spinner'] = spinner;

    if (color) attribs['data-color'] = color;
    if (!isNullOrUndefined(center)) attribs['data-center'] = center;

    return this._p_get().customElement(BootstrapLoader, attribs);
  }
}
