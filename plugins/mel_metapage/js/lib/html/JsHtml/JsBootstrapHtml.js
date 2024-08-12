import { JsHtml } from './JsHtml.js';
export { JsHtml };

JsHtml.create_alias('row', {
  after_callback(html) {
    return html.addClass('row');
  },
});

JsHtml.create_alias('column', {
  after_callback(html, md, ...args) {
    if (typeof md === 'number') html = html.addClass(`col-${md}`);
    else if (args.length > 0) html = html.addClass(`col-${args[0]}`);

    return html;
  },
});

function create_col(number) {
  JsHtml.create_alias(`col_${number}`, {
    generate_callback(html, ...args) {
      const [attribs, md] = args;
      return html.column(attribs, number);
    },
  });
}

for (let index = 1; index <= 12; ++index) {
  create_col(index);
}

JsHtml.create_alias('card', {
  tag: 'div',
  after_callback(html) {
    return html.addClass('card');
  },
});

JsHtml.create_alias('card_body', {
  tag: 'div',
  after_callback(html) {
    return html.addClass('card-body');
  },
});

JsHtml.create_alias('card_title', {
  tag: 'h5',
  generate_callback(jshtml, attribs) {
    return jshtml.h5(attribs);
  },
  after_callback(html) {
    return html.addClass('card-title');
  },
});

JsHtml.create_alias('card_subtitle', {
  tag: 'h6',
  generate_callback(jshtml, attribs) {
    return jshtml.h6(attribs);
  },
  after_callback(html) {
    return html.addClass('card-subtitle').addClass('mb-2');
  },
});

JsHtml.create_alias('card_text', {
  tag: 'p',
  after_callback(html) {
    return html.addClass('card-text');
  },
});

JsHtml.create_alias('card_link', {
  tag: 'a',
  generate_callback(jshtml, attribs) {
    return jshtml.a(attribs);
  },
  after_callback(html) {
    return html.addClass('card-link');
  },
});

JsHtml.create_alias('card_img_top', {
  tag: 'img',
  generate_callback(jshtml, attribs) {
    const class_card = 'card-img-top';
    if (!attribs) attribs = { class: '' };
    if (!attribs.hasOwnProperty('class')) attribs.class = '';
    if (!attribs.class.includes(class_card)) attribs.class += ` ${class_card}`;

    return jshtml.img(attribs);
  },
});

JsHtml.extend('card_container', function (attribs = {}) {
  let card = this.card(attribs);

  if (!attribs) attribs = {};

  if (attribs['data-card-img-top']) {
    card = card.card_img_top({
      src: attribs['data-card-img-top'],
      alt: attribs['data-card-img-top-alt'] || attribs['data-card-img-top'],
    });
  }

  card = card.card_body();

  if (attribs['data-card-title']) {
    card = card.card_title();

    if (attribs.id) card.attribs.for = attribs.id;

    card = card.text(attribs['data-card-title']).end();
  }

  if (attribs['data-card-subtitle']) {
    card = card.card_title().text(attribs['data-card-subtitle']).end();
  }

  if (attribs['data-card-body']) {
    card = card.card_text().text(attribs['data-card-body']).end();
  }

  if (attribs['data-card-footer-link-max']) {
    const max = attribs['data-card-footer-link-max'];

    for (let index = 1; index <= max; index++) {
      card = card
        .card_link({ href: attribs[`data-card-footer-link-${index}`] })
        .text(attribs[`data-card-footer-link-${index}-text`])
        .end();
    }
  }

  return card;
});

JsHtml.extend('center', function () {
  this._updated_balise().addClass('mx-auto');

  return this;
});

JsHtml.extend('btn_group', function (attribs = {}) {
  return this.div(attribs).addClass('btn-group').attr('role', 'group');
});

JsHtml.extend('btn_group_vertical', function (attribs = {}) {
  return this.div(attribs).addClass('btn-group-vertical').attr('role', 'group');
});
