import { ABaseModulesJsHtml } from '../../../mel_metapage/js/lib/html/JsHtml/ABaseModulesJsHtml.js';
import { TchapFrameAction } from './webcomponents/tchap_web_component';

/**
 * @extends ABaseModulesJsHtml<J>
 * @template {import('../../../mel_metapage/js/lib/html/JsHtml/JsHtml.js')._JsHtml} J
 */
export class JsHtmlTchapModule extends ABaseModulesJsHtml {
  constructor(jshtml) {
    super(jshtml);
  }

  frames_actions({
    close_callback,
    attach_callback,
    fullscreen_callback,
    attribs = {},
  }) {
    attribs ??= {};

    return this._p_get().customElement(TchapFrameAction).attrs({
      ontchapclose: close_callback,
      ontchapattach: attach_callback,
      ontchapfullscreen: fullscreen_callback,
    });
  }
}
