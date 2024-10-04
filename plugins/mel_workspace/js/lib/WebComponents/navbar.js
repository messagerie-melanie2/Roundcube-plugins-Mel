import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { BnumModules } from '../../../../mel_metapage/js/lib/helpers/dynamic_load_modules.js';
import {
  EWebComponentMode,
  HtmlCustomTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';

export { WspNavBar };

/**
 * @enum {Symbol}
 */
const EFileType = {
  script: Symbol(),
  module: Symbol(),
  style: Symbol(),
};

class WspNavBar extends HtmlCustomTag {
  constructor() {
    super({ mode: EWebComponentMode.div });
  }

  _p_main() {
    this.data('shadow', true);

    let shadow = this._p_start_construct();

    let style = document.createElement('style');
    style.append(
      this.createText(`
      :host {
        width:100%;
        height:100%;
      }
      `),
    );

    this.#_setup_styles().#_setup_scripts().#_setup_modules();

    let div = document.createElement('div');
    div.classList.add('nav', 'melv2-card');

    shadow.append(div);
    div = null;

    style = null;
    shadow = null;
  }

  #_generate_script(file, { module = false } = {}) {
    let script = document.createElement('script');

    if (module) file += `?v=${BnumModules.VERSION}`;

    script.src = file;

    if (module) script.setAttribute('type', 'module');

    return script;
  }

  #_generate_css(file) {
    let css = document.createElement('link');
    css.setAttribute('rel', 'stylesheet');
    css.setAttribute('type', 'text/css');
    css.setAttribute('href', file);

    return css;
  }

  #_setup_modules() {
    return this.#_setup_files_type(EFileType.module);
  }

  #_setup_scripts() {
    return this.#_setup_files_type(EFileType.script);
  }

  /**
   *
   * @param {EFileType} type
   */
  #_setup_files_type(type) {
    let dataset = null;

    switch (type) {
      case EFileType.module:
        dataset = 'modules';
        break;

      case EFileType.script:
        dataset = 'scripts';
        break;

      case EFileType.style:
        dataset = 'css';
        break;

      default:
        throw new Error('Type non pris en charge');
    }

    const data = (this.data(dataset) ?? EMPTY_STRING)
      .replaceAll(' ', EMPTY_STRING)
      .split(',');

    if (data.length > 0) {
      let generated;
      for (const element of data) {
        if (element === '' || !element) continue;

        switch (type) {
          case EFileType.module:
            generated = this.#_generate_script(element, { module: true });
            break;

          case EFileType.script:
            generated = this.#_generate_script(element, { module: false });
            break;

          case EFileType.style:
            generated = this.#_generate_css(element);
            break;

          default:
            throw new Error('Type non pris en charge');
        }

        this.shadowRoot.append(generated);
        generated = null;
      }
    }

    return this;
  }

  #_setup_styles() {
    return this.#_setup_files_type(EFileType.style);
  }
}

{
  const TAG = 'bnum-wsp-nav';
  if (!customElements.get(TAG)) customElements.define(TAG, WspNavBar);
}
