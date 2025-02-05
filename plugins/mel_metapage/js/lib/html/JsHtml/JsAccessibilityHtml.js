import { ABaseModulesJsHtml } from './ABaseModulesJsHtml.js';

/**
 * @class
 * @classdesc
 * @template {import('./JsHtml.js')._JsHtml} T
 */
export class JsHtmlAccessibility extends ABaseModulesJsHtml {
  constructor(jshtml) {
    super(jshtml);
  }

  #_generate_id() {
    let id;
    do {
      id = mel_metapage.Functions.generateWebconfRoomName();
    } while ($(`#${id}`).length > 0);

    return id;
  }

  /**
   *
   * @param {Object} [options={}]
   * @returns {T}
   */
  accessibilty_setup_button({ isChild = false, return_child = false } = {}) {
    let navigator = isChild
      ? this._p_get().childs[this._p_get().childs.length - 1]
      : this._p_get();
    navigator = navigator
      .attr('href', '#')
      .attr('role', 'button')
      .attr('tabindex', 0)
      .attr('onkeydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          $(event.target).click();
        }
      });

    return isChild ? (return_child ? navigator : this) : navigator;
  }

  /**
   *
   * @param {string} label
   * @param {Object} [options={}]
   * @returns {T}
   */
  input_text_floating(
    label,
    { div_attribs = {}, label_attribs = {}, inputs_attribs = {} } = {},
  ) {
    const id = inputs_attribs.id || this.#_generate_id();
    //prettier-ignore
    return this._p_get().div(div_attribs).addClass('form-floating pixel-correction')
                    .input_text(inputs_attribs).attr('id', id).attr('required', 'required')
                    .label(label_attribs).attr('for', id)
                        .text(label)
                    .end()
                .end();
  }
}
