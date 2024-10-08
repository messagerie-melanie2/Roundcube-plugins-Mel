import { BnumLog } from '../../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import {
  BnumHtmlIcon,
  BnumHtmlSeparate,
  EWebComponentMode,
} from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { PressedButton } from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js';
import { isNullOrUndefined } from '../../../../../mel_metapage/js/lib/mel.js';
import { NavBarComponent } from './base.js';

export { WspNavBarDescription };

/**
 * @class
 * @classdesc
 * @extends NavBarComponent
 * @package
 */
class WspNavBarDescription extends NavBarComponent {
  /**
   * @type {AttributeObserver}
   */
  #observer = null;

  /**
   * Permet d'assigner la description et/ou d'assigner le parent.
   * @param {Object} [param0={}]
   * @param {?string} [param0.description=null] Description de l'espace
   * @param {?WspNavBar} [param0.parent=null] NavBar parente
   */
  constructor({ description = null, parent = null } = {}) {
    super({ mode: EWebComponentMode.div, parent });

    description ??= parent?.description;

    if (description !== EMPTY_STRING && !isNullOrUndefined(description))
      this._p_save_into_data('description', description);

    this.#observer = new AttributeObserver(
      this._description_scroll_changed.bind(this),
      {
        itMax: 10,
        loopWhenCallback: this._description_scroll_changed.bind(this),
      },
    );
  }

  /**
   * @type {string}
   * @readonly
   */
  get description() {
    return this.parent?.description ?? this._p_get_data('description');
  }

  /**
   * @type {HTMLDivElement}
   * @readonly
   */
  get descriptionNode() {
    return this.querySelector('.description');
  }

  _p_main() {
    super._p_main();

    let element = this._p_start_construct();

    let mainDiv = document.createElement('div');
    mainDiv.classList.add('div-container');

    let description = document.createElement('div');
    description.classList.add('description', 'threelines');
    description.appendChild(this.createText(this.description));

    let descriptionContainer = document.createElement('div');
    descriptionContainer.classList.add('description-container');
    descriptionContainer.appendChild(description);

    let separator = new BnumHtmlSeparate({ mode: EWebComponentMode.div });
    separator.style.display = 'block';
    separator.style.opacity = 0;

    let button = new PressedButton({ mode: EWebComponentMode.flex });
    button.style.display = 'flex';
    button.classList.add('margin-top-5', 'disabled');
    button.setAttribute('title', 'Afficher/réduire la description');
    button.setAttribute('disabled', 'disabled');
    button.style.opacity = 0;

    let icon = new BnumHtmlIcon();
    icon.setAttribute('tabindex', -1);
    icon
      .data('inactive-icon', 'keyboard_arrow_down')
      .data('active-icon', 'keyboard_arrow_up');

    button.append(icon);
    button.addEventListener(
      'api:toggle',
      this._button_state_changed.bind(this),
    );

    button.onload = this._button_state_changed.bind(this);

    descriptionContainer.append(separator, button);

    mainDiv.appendChild(descriptionContainer);
    element.appendChild(mainDiv);

    this.#observer.observe(description, 'scrollHeight');

    element = null;
    mainDiv = null;
    description = null;
    separator = null;
    button = null;
  }

  destroy() {
    super.destroy();

    this.#observer?.destroy?.();
  }

  _description_scroll_changed(modified, description) {
    if (Math.ceil(description.scrollHeight) > description.clientHeight) {
      let button = description.parentNode.querySelector('bnum-pressed-button');
      let separator = description.parentNode.querySelector('bnum-separate');

      separator.style.opacity = 1;

      button.removeAttribute('disabled');
      button.classList.remove('disabled');
      button.style.opacity = 1;

      button = null;
      separator = null;
    }

    this.#observer.destroy();
    this.#observer = null;
  }

  _button_state_changed(e) {
    let icon = e.target.querySelector('bnum-icon');

    const pressed = e.detail.startPressed ?? e.detail.newState;

    if (pressed) {
      icon.innerText = icon.data('activeIcon');
      this.descriptionNode.classList.remove('threelines');
    } else {
      icon.innerText = icon.data('inactiveIcon');
      this.descriptionNode.classList.add('threelines');
    }
  }
}

{
  const TAG = 'bnum-wsp-nav-description';
  if (!customElements.get(TAG))
    customElements.define(TAG, WspNavBarDescription);
}

class AttributeObserver {
  #callback = null;
  #loopCallback = null;
  #itMax = null;
  #it = null;
  #interval = null;
  #node = null;
  #attributes = null;
  constructor(callback, { itMax = 0, loopWhenCallback = null } = {}) {
    this.#callback = callback;
    this.#loopCallback = loopWhenCallback;
    this.#itMax = itMax;
  }

  observe(node, ...attributes) {
    if (this.#node) return;

    if (BnumLog.log_level >= BnumLog.LogLevels.trace) {
      BnumLog.info(
        'AttributeObserver/observe',
        'Connected to',
        node,
        'attributes connected : ',
        ...attributes,
      );
    }

    this.#node = node;
    this.#attributes = {};
    this.#it = 0;

    for (const element of attributes) {
      this.#attributes[element] = node[element];
    }

    this.#interval = setInterval(() => {
      let attributes = {};
      for (const element of Object.keys(this.#attributes)) {
        if (this.#node[element] !== this.#attributes[element]) {
          attributes[element] = this.#node[element];
          this.#attributes[element] = attributes[element];
        }
      }

      if (Object.keys(attributes).length > 0) {
        this.#callback(attributes, this.#node);
      }

      if (this.#it !== null) {
        if (this.#it >= this.#itMax) {
          this.#it = null;
          this.#itMax = null;

          if (this.#loopCallback) {
            this.#loopCallback(attributes, this.#node);
            this.#loopCallback = null;
          }
        } else this.#it += 1;
      }
    }, 100);
  }

  disconnect() {
    clearInterval(this.#interval);

    this.#interval = null;
    this.#attributes = null;
    this.#node = null;
    this.#it = null;

    BnumLog.info('AttributeObserver/disconnect', 'Observer disconnected');
  }

  destroy() {
    this.disconnect();

    this.#callback = null;
    this.#loopCallback = null;
    this.#itMax = null;

    BnumLog.info('AttributeObserver/destroy', 'Observer destroyed');
  }
}
