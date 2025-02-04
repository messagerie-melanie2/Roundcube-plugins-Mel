import { MelEnumerable } from '../../classes/enum.js';
import { ABaseModulesJsHtml } from './JsHtml.js';

export class JsBoostrapHtml extends ABaseModulesJsHtml {
  constructor(jshtml) {
    super(jshtml);
  }

  row(attribs = {}) {
    return this._p_get().div(attribs).addClass('row');
  }

  column(size, attribs = {}) {
    return this._p_get().div(attribs).addClass(`col-${size}`);
  }

  col_1(attribs = {}) {
    return this.column(1, attribs);
  }

  col_2(attribs = {}) {
    return this.column(2, attribs);
  }

  col_3(attribs = {}) {
    return this.column(3, attribs);
  }

  col_4(attribs = {}) {
    return this.column(4, attribs);
  }

  col_5(attribs = {}) {
    return this.column(5, attribs);
  }

  col_6(attribs = {}) {
    return this.column(6, attribs);
  }

  col_7(attribs = {}) {
    return this.column(7, attribs);
  }

  col_8(attribs = {}) {
    return this.column(8, attribs);
  }

  col_9(attribs = {}) {
    return this.column(9, attribs);
  }

  col_10(attribs = {}) {
    return this.column(10, attribs);
  }

  col_11(attribs = {}) {
    return this.column(11, attribs);
  }

  col_12(attribs = {}) {
    return this.column(12, attribs);
  }

  card(attribs = {}) {
    return this._p_get().div(attribs).addClass('card');
  }

  card_body(attribs = {}) {
    return this._p_get().div(attribs).addClass('card-body');
  }

  card_title({ attribs = {}, tag = 'h5' } = {}) {
    return this._p_get().tag(tag, attribs).addClass('card-title');
  }

  card_subtitle({ attribs = {}, tag = 'h6' } = {}) {
    return this._p_get()
      .tag(tag, attribs)
      .addClass('card-subtitle')
      .addClass('mb-2');
  }

  card_text(attribs = {}) {
    return this._p_get().p(attribs).addClass('card-text');
  }

  card_link(url = '#', attribs = {}) {
    return this._p_get().a(attribs).addClass('card-link').attr('href', url);
  }

  card_img_top(src, attribs = {}) {
    return this._p_get().img(attribs).attr('src', src).addClass('card-img-top');
  }

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

  center() {
    return this._p_get()._updated_balise().addClass('mx-auto');
  }

  btn_group({ attribs = {} }) {
    return this._p_get()
      .div(attribs)
      .addClass('btn-group')
      .attr('role', 'group');
  }

  btn_group_vertical({ attribs = {} }) {
    return this._p_get()
      .div(attribs)
      .addClass('btn-group-vertical')
      .attr('role', 'group');
  }
}
