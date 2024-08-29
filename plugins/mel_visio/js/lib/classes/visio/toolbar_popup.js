import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';

export class ToolbarPopup {
  constructor($parent, jscontent = null) {
    this.$popup = null;
    this.$content = null;

    let _$generated = this._generate_toolbar($parent, jscontent);

    Object.defineProperties(this, {
      $popup: {
        get() {
          return _$generated;
        },
      },
      $content: {
        get() {
          return _$generated.find('.toolbar-data');
        },
      },
    });
  }

  update_content(jscontent) {
    this.$content.html(jscontent.generate());
    return this;
  }

  set_tag(tag) {
    this.$popup.data('tag', tag);
    return this;
  }

  has_tag(tag) {
    return this.$popup.data('tag') === tag;
  }

  hide() {
    this.$popup.css('display', 'none');
    return this;
  }

  show() {
    this.$popup.css('display', EMPTY_STRING);
  }

  _generate_toolbar($parent, jscontent) {
    //prettier-ignore
    let jshtml =  MelHtml.start
    .div({ class:'toolbar-popup large-toolbar' })
      .div({ class:'toolbar-data' });

    if (jscontent) jshtml = jshtml.add_child(jscontent);

    return jshtml.end().end().generate().appendTo($parent);
  }

  is_show() {
    return this.$popup.css('display') !== 'none';
  }

  destroy() {
    this.$popup.remove();
    return null;
  }
}
