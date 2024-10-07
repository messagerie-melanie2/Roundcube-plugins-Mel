import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { BnumModules } from '../../../../mel_metapage/js/lib/helpers/dynamic_load_modules.js';
import {
  EWebComponentMode,
  HtmlCustomTag,
} from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { isNullOrUndefined } from '../../../../mel_metapage/js/lib/mel.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { WspNavBarDescription } from './NavbarComponents/components.js';

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
  #data = {};

  constructor() {
    super({ mode: EWebComponentMode.div });
  }

  /**
   * Id de l'espace
   * @type {string}
   * @readonly
   */
  get uid() {
    return this.#_get_data('uid');
  }

  /**
   * Image de l'espace
   * @type {string}
   * @readonly
   */
  get picture() {
    return this.#_get_data('picture');
  }

  /**
   * Description de l'espace
   * @type {string}
   * @readonly
   */
  get description() {
    return this.#_get_data('description');
  }

  /**
   * Titre de l'espace
   * @type {string}
   * @readonly
   */
  get title() {
    return this.#_get_data('title');
  }

  /**
   * Div principale du shadow-dom
   * @type {HTMLDivElement}
   * @readonly
   */
  get mainDiv() {
    return this.shadowRoot.querySelector(`#${this.id}`);
  }

  /**
   * Id de la div principale du shadow-dom
   * @type {string}
   * @readonly
   * @default `wsp-nav-${this.uid}`
   */
  get id() {
    return `wsp-nav-${this.uid}`;
  }

  _p_main() {
    this.data('shadow', true);

    let shadow = this._p_start_construct();

    this.#_setup_styles().#_setup_scripts().#_setup_modules();

    let div = document.createElement('div');
    div.classList.add('nav', 'melv2-card');
    div.setAttribute('id', this.id);

    shadow.append(div);

    this._generate_picture()._generate_title()._generate_description();

    top.history.replaceState(
      {},
      document.title,
      MelObject.Empty()
        .url('workspace', {
          action: 'navbar',
          params: {
            _uid: 'dev-du-bnum-1',
            _force_bnum: 1,
          },
        })
        .replace('is_from', 'rotomeca'),
    );

    div = null;
    shadow = null;
  }

  _generate_picture() {
    let img = document.createElement('img');
    img.classList.add('picture');
    img.src = this.picture;

    let div = document.createElement('div');
    div.classList.add('picture-container');
    div.append(img);

    this.mainDiv.append(div);

    img = null;
    div = null;

    return this;
  }

  _generate_title() {
    let div = document.createElement('div');
    let span = document.createElement('h2');

    div.classList.add('wsp-title-container');
    span.classList.add('wsp-title');
    span.appendChild(this.createText(this.title));
    div.appendChild(span);

    this.mainDiv.appendChild(div);

    span = null;
    div = null;

    return this;
  }

  _generate_description() {
    /**
     * Composant "description" de la barre de navigation
     * @type {WspNavBarDescription}
     * @package
     */
    let description = new WspNavBarDescription({
      parent: this,
    }).setNavBarParent(this);

    this.mainDiv.append(description);

    description = null;

    return this;
  }

  #_get_data(data) {
    if (!this.#data[data]) {
      this.#data[data] = this.dataset[data];
      this.removeAttribute(`data-${data}`);
    }

    return this.#data[data];
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

    this.removeAttribute(`data-${dataset}`);

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
