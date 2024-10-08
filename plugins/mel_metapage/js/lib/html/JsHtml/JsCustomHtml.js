import { BootstrapLoader } from './CustomAttributes/bootstrap-loader.js';
import {
  BnumHtmlCenteredFlexContainer,
  BnumHtmlFlexContainer,
  BnumHtmlIcon,
  BnumHtmlSeparate,
  BnumHtmlSrOnly,
  HtmlCustomTag,
} from './CustomAttributes/classes.js';
import { JsHtml } from './JsHtml.js';
export { JsHtml };

JsHtml.create_custom_tag = function (
  name,
  {
    already_existing_class = null,
    one_line = false,
    generate_callback = null,
    extend = null,
    prefix_tag = 'bnum',
  },
) {
  const tag = `${prefix_tag}-${name}`;
  if (!customElements.get(tag)) {
    let config = {};

    if (extend) config.extends = extend;

    customElements.define(tag, already_existing_class ?? HtmlCustomTag, config);
  }

  JsHtml.create_alias(name.replaceAll('-', '_'), {
    tag,
    generate_callback,
    online: one_line,
    after_callback: (html) => {
      return html.attr('data-custom-tag', name);
    },
  });

  return true;
};

JsHtml.create_custom_tag('icon', {
  already_existing_class: BnumHtmlIcon,
});

JsHtml.update('icon', function (self, old, icon, attribs = {}) {
  if (typeof icon !== 'string') {
    attribs = icon;
    icon = null;
  }

  let html = old.call(self, attribs); //.attr('data-icon', icon);

  if (icon) {
    html = html.attr('data-icon', icon);
  }

  return html;
});

JsHtml.create_custom_tag('screen-reader', {
  already_existing_class: BnumHtmlSrOnly,
});

JsHtml.extend('sr', function (attribs = {}) {
  return this.screen_reader(attribs);
});

JsHtml.create_custom_tag('separate', {
  already_existing_class: BnumHtmlSeparate,
  one_line: true,
});

JsHtml.create_custom_tag('flex-container', {
  already_existing_class: BnumHtmlFlexContainer,
});

JsHtml.update('flex_container', function (self, old, attribs = {}) {
  let html = old.call(self, attribs);

  return html.css('display', 'flex');
});

JsHtml.create_custom_tag('centered-flex-container', {
  already_existing_class: BnumHtmlCenteredFlexContainer,
});

JsHtml.create_custom_tag('placeholder', {});

JsHtml.create_custom_tag('loader', {
  prefix_tag: 'bootstrap',
  already_existing_class: BootstrapLoader,
});
