import { MelHtml } from '../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { TchapFrameAction } from './webcomponents/tchap_web_component.js';
export { MelHtml };
MelHtml.create_custom_tag('tchap-actions', {
  already_existing_class: TchapFrameAction,
});

MelHtml.update(
  'tchap_actions',
  function (
    self,
    old,
    close_callback,
    attach_callback,
    fullscreen_callback,
    attribs = {},
  ) {
    attribs = attribs || {};
    let html = old.call(self, attribs);

    html.attr('ontchapclose', close_callback);
    html.attr('ontchapattach', attach_callback);
    html.attr('ontchapfullscreen', fullscreen_callback);

    return html;
  },
);
