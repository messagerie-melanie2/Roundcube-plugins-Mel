import { HTMLBnumInputText } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum';
import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object';
import { JsHtml } from '../../../../mel_metapage/js/lib/html/JsHtml/JsHtml';

export class LinkModal {
  static get(id, title, url, icon) {
    const helper = ABaseMelObject.Empty();
    const plugin = 'mel_useful_link';
    //prettier-ignore
    return JsHtml.start
    .div()
      .bootstrap().row({ class: 'mx-2' })
          .span({ class: 'text-danger' })
              .text('*')
          .end()
          .text(helper.getLocalization('required_fields', { plugin }))
      .end('row')
      .input({ id: 'mulc-id', type: 'hidden', value: id })
      .bootstrap().row({ class: 'mx-2' })
        .tag(HTMLBnumInputText.TAG, { id: 'mulc-title', class: 'required', required: true, placeholder: helper.getLocalization('link_title', { plugin }), value: title })
          .span({ class: 'text-danger' })
            .text('*')
          .end()
          .text(helper.getLocalization('link_name', { plugin }))
        .end('input-text')
      .end('row')
      .bootstrap().row({ class: 'mx-2' })
        .tag(HTMLBnumInputText.TAG, { id: 'mulc-url', class: 'required', required: true, placeholder: 'URL', value: url })
          .span({ class: 'text-danger' })
            .text('*')
          .end()
          .text(helper.getLocalization('link_url', { plugin }))
        .end('input-text')
      .end('row')
    .end('premsdiv')
    ;
  }
}
