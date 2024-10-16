import { EMPTY_STRING } from '../../../constants/constants.js';
import { HtmlCustomDataTag } from './js_html_base_web_elements.js';
export class BootstrapLoader extends HtmlCustomDataTag {
  #mode = null;

  /**
   * Data utiles : <br>
   *
   * - data-mode => Doit valoir 'rien, inline, block, inline-block, flex'. => mode du spinner<br/>
   *
   * - data-color => Doit valoir 'rien, primary, secondary, danger, warning, info' => Couleur du spinner<br/>
   *
   * - data-spinner => Doit valoir 'rien, grow, border' => Type de spinner<br/>
   *
   * - data-center => Doit valoir 'rien, true, false' => Si true, centre au milieu, verticalement et horizontalement, sinon, seulement horizontalement.<br/>
   *
   *
   * @param {Object} [param0={}]
   * @param {BootstrapLoader.EMode} [param0.mode=BootstrapLoader.EMode.block] Mode d'affichage du module
   */
  constructor({ mode = BootstrapLoader.EMode.block } = {}) {
    super();

    this.#mode = mode;
  }

  get mode() {
    let mode = this._p_get_data('mode');

    if (mode && typeof mode === 'string') {
      switch (mode) {
        case 'block':
          mode = BootstrapLoader.EMode.block;
          break;

        case 'inline-block':
          mode = BootstrapLoader.EMode.inline_block;
          break;

        case 'flex':
          mode = BootstrapLoader.EMode.flex;
          break;

        default:
          mode = BootstrapLoader.EMode.default;
          break;
      }

      this._p_save_into_data('mode', mode);
    }

    return mode || this.#mode;
  }

  _p_main() {
    super._p_main();

    switch (this.mode) {
      case BootstrapLoader.EMode.default:
        this.style.display = 'inline';
        break;

      case BootstrapLoader.EMode.block:
        this.style.display = 'block';
        break;

      case BootstrapLoader.EMode.inline_block:
        this.style.display = 'inline-block';
        break;

      case BootstrapLoader.EMode.flex:
        this.style.display = 'flex';
        break;

      default:
        break;
    }

    let shadow = this.attachShadow({ mode: 'open' });

    let spinnerClass = EMPTY_STRING;
    let spinnerColor = EMPTY_STRING;

    switch (this.dataset.spinner) {
      case 'grow':
        spinnerClass = 'spinner-grow';
        break;

      case 'border':
      default:
        spinnerClass = 'spinner-border';
        break;
    }

    if (this.hasAttribute('data-color'))
      spinnerColor = `text-${this.dataset.color}`;

    let div = document.createElement('div');
    div.classList.add(spinnerClass);

    if (spinnerColor !== EMPTY_STRING) div.classList.add(spinnerColor);

    shadow.append(div);

    if (this.hasAttribute('data-center') && this.dataset.center !== 'false') {
      this.classList.add('absolute-center');
    } else {
      let style = document.createElement('style');
      style.appendChild(
        document.createTextNode(`
          :host {
            text-align:center
          }
        `),
      );

      shadow.appendChild(style);
      style = null;
    }

    let element;
    for (element of document.querySelectorAll('link')) {
      if (element.href.includes('bootstrap')) {
        shadow.appendChild(element.cloneNode());
        break;
      }

      element = null;
    }

    this.removeAttribute('data-spinner');
    this.removeAttribute('data-color');

    shadow = null;
    div = null;
    element = null;
  }

  static Create({
    mode = null,
    color = null,
    spinner = null,
    center = null,
  } = {}) {
    let node = document.createElement('bootstrap-loader');

    if (mode) node.setAttribute('data-mode', mode);
    if (color) node.setAttribute('data-color', color);
    if (spinner) node.setAttribute('data-spinner', spinner);
    if (center) node.setAttribute('data-center', center);

    return node;
  }
}

/**
 * @enum
 */
BootstrapLoader.EMode = {
  block: Symbol(),
  inline_block: Symbol(),
  default: Symbol('inline'),
  flex: Symbol(),
};

{
  const TAG = 'bootstrap-loader';

  if (!customElements.get(TAG)) customElements.define(TAG, BootstrapLoader);
}
