import { BootstrapLoader } from './CustomAttributes/bootstrap-loader.js';
// import {
//   MelWindow,
//   MelWindowFrame,
// } from './CustomAttributes/frames_web_elements.js';
import {
  BnumHtmlCenteredFlexContainer,
  BnumHtmlFlexContainer,
  BnumHtmlIcon,
  BnumHtmlSeparate,
  BnumHtmlSrOnly,
  HtmlCustomTag,
} from './CustomAttributes/js_html_base_web_elements.js';
import { ABaseModulesJsHtml, JsHtml } from './JsHtml.js';

export { JsHtml };

class JsCustomHtml extends ABaseModulesJsHtml {
  constructor(jshtml) {
    super(jshtml);
  }

  icon(icon, attribs = {}) {
    if (typeof icon !== 'string') {
      attribs = icon ?? {};
      icon = null;
    }

    return this._p_get()
      .customElement(BnumHtmlIcon, attribs)
      .resolveNow((jshtml) => (icon ? jshtml.attr('data-icon', icon) : jshtml));
  }
}

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

// JsHtml.create_custom_tag('mel-window', {
//   already_existing_class: MelWindow,
// });

// JsHtml.update('mel_window', function (self, old, id, attribs = {}) {
//   attribs['data-window-id'] = id;

//   let html = old.call(self, attribs);

//   return html;
// });

// JsHtml.create_custom_tag('mel-window-frame', {
//   already_existing_class: MelWindowFrame,
// });

JsHtml.create_custom_tag('loader', {
  prefix_tag: 'bootstrap',
  already_existing_class: BootstrapLoader,
});
