import { EMPTY_STRING } from '../../../constants/constants.js';
import { isNullOrUndefined } from '../../../mel';
import { BnumEvent } from '../../../mel_events';
import { EWebComponentMode, HtmlCustomTag } from './js_html_base_web_elements';

export { InputFile };

class InputFile extends HtmlCustomTag {
  // make element form-associated
  static formAssociated = true;

  #accepts = EInputMode.all;
  #name = null;
  #multiple = false;
  #required = false;
  /**
   * @type {ElementInternals}
   */
  #internals = null;
  #input = null;

  constructor({
    accept = EInputMode.all,
    mode = EWebComponentMode.inline_block,
  } = {}) {
    super({ mode });

    this._init();
    this.#accepts = accept;
  }

  _init() {
    this.#accepts = EInputMode.all;
    this.#name = null;
    this.#input = null;
    this.#internals = null;
    this.#multiple = false;
    this.#required = false;
    this.onfilesload = new BnumEvent();

    return this;
  }

  _setup(accept) {
    switch (accept) {
      case EInputMode.image:
        accept = 'image/*';
        break;

      case EInputMode.audio:
        accept = 'video/*';
        break;

      case EInputMode.audio:
        accept = 'audio/*';
        break;

      default:
        if (this.hasAttribute('accept')) {
          accept = this.getAttribute('accept');
          this.removeAttribute('accept');
        } else accept = null;
        break;
    }

    Object.defineProperties(this, {
      '#accepts': {
        value: accept,
        configurable: false,
        writable: false,
      },
      '#name': {
        value: this.getAttribute('name'),
        configurable: false,
        writable: false,
      },
      '#multiple': {
        value: this.hasAttribute('multiple'),
        configurable: false,
        writable: false,
      },
      '#required': {
        value: this.hasAttribute('required'),
        configurable: false,
        writable: false,
      },
      '#input': {
        get: () => this.navigator.querySelector('input'),
      },
    });

    return this;
  }

  _main() {
    this._setup(this.#accepts);

    if (![true, 'true', false, 'false'].includes(this.data('shadow')))
      this.data('shadow', true);

    let component = this._p_start_construct();

    let input = document.createElement('input');
    input.setAttribute('type', 'file');

    if (!isNullOrUndefined(this.#accepts))
      input.setAttribute('accepts', this.#accepts);

    if (!isNullOrUndefined(this.#name) && this.#name !== EMPTY_STRING)
      input.setAttribute('name', this.#name);

    if (this.#multiple) input.setAttribute('multiple', true);

    if (this.#required) input.setAttribute('required', true);

    if (this.shadowEnabled()) {
      let style = document.createElement('style');
      let txt = `
        input{
          display:none;
        }
      `;

      style.append(txt);
      component.appendChild(style);
      style = null;
    }

    let main_div = document.createElement('div');
    main_div.classList.add('');
    let falseInput = document.createElement('input');
    let button = document.createElement('button');

    main_div.append(input, falseInput, button);

    component.appendChild(main_div);

    this.#internals = this.attachInternals();
    input.addEventListener('change', this._on_change.bind(this));
    input.addEventListener('cancel', (event) => {
      this.dispatchEvent(event);
    });

    input = null;
    main_div = null;
    falseInput = null;
    button = null;
  }

  _p_main() {
    super._p_main();

    this._main();
  }

  destroy() {
    super.destroy();

    this.#internals = null;
  }

  async _on_change() {
    let filesGet = await new Promise((ok, nok) => {
      let data = [];
      let files = this.#input.files;
      let fileReader = new FileReader();

      fileReader.onload = () => {
        data.push(fileReader.result);

        if (data.length === files.length) ok(data);
      };

      fileReader.onerror = () => {
        nok(fileReader.error);
      };

      for (const file of files) {
        this._p_read_function(fileReader, file);
      }
    });

    let from = null;
    let data = filesGet;

    switch (data.length) {
      case 0:
        data = null;
        break;

      case 1:
        data = data[0];
        break;

      default:
        const name = this.#name ?? 'file';
        form = new FormData();

        for (
          let index = 0, len = data.length, element = null;
          index < len;
          ++index
        ) {
          element = data[index];

          form.append(`${name}_${index}`, element);
        }

        break;
    }

    this.#internals.setFormValue(form ?? data);

    this.dispatchEvent(new InputFileEvent(data));
  }

  /**
   *
   * @param {FileReader} fileReader
   */
  _p_read_function(fileReader, file) {
    if (this.#accepts.includes('image/*')) fileReader.readAsDataURL(file);
    else fileReader.readAsText(file);
  }
}

const EInputMode = {
  all: Symbol(),
  image: Symbol(),
  video: Symbol(),
  audio: Symbol(),
  custom: Symbol(),
};

class InputFileEvent extends CustomEvent {
  #files = null;
  constructor(data, dict = {}) {
    super('change', dict);

    this.#files = data;
  }

  get() {
    return this.#files;
  }
}
