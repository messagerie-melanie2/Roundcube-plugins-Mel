import { JsHtml } from './JsHtml.js';
import './JsAccessibilityHtml.js';
export { JsHtml };

JsHtml.update('input', function (self, old, attribs = {}) {
  let html = old.call(self, attribs);

  if (
    !['checkbox', 'button', 'color', 'file', 'image'].includes(attribs.type)
  ) {
    html.childs[html.childs.length - 1]
      .addClass('form-control')
      .addClass('input-mel');
  }

  return html;
});

JsHtml.update('select', function (self, old, attribs = {}) {
  let html = old.call(self, attribs);
  return html.addClass('form-control').addClass('input-mel');
});

JsHtml.update('textarea', function (self, old, attribs = {}) {
  let html = old.call(self, attribs);
  return html.addClass('form-control').addClass('input-mel');
});

JsHtml.update('button', function (self, old, attribs = {}) {
  let html = old.call(self, attribs);
  return html
    .addClass('mel-button')
    .addClass('no-button-margin')
    .addClass('no-margin-button')
    .css('border-style', 'solid');
});

JsHtml.extend('mel_button', function (attribs = {}) {
  return this.button(attribs)
    .removeClass('no-button-margin')
    .removeClass('no-margin-button');
});

JsHtml.extend('raw_button', function (attribs = {}) {
  return this.button(attribs).removeClass('mel-button');
});

JsHtml.update(
  'text',
  function meltext(self, old, text, plugin = 'mel_metapage') {
    return old.call(self, rcmail.gettext(text, plugin));
  },
);

JsHtml.update(
  'accessibilty_setup_button',
  function (self, old, { isChild = false }) {
    let html = old.call(self, { isChild, return_child: isChild });

    html = html.addClass('mel-focus');

    if (isChild) html = html.parent();

    return html;
  },
);
