import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import {
  BnumHtmlIcon,
  EWebComponentMode,
} from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { PressedButton } from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/pressed_button_web_element.js';
import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../../../mel_metapage/js/lib/mel_object.js';
import { NavBarComponent } from './base.js';

export class WspButton extends NavBarComponent {
  /**
   * @type {WspButton.Style}
   */
  #style = null;
  #text = null;
  #icon = null;

  constructor(
    parent = null,
    {
      style = WspButton.Style.classic,
      text = EMPTY_STRING,
      icon = EMPTY_STRING,
    } = {},
  ) {
    super({ mode: EWebComponentMode.flex, parent });
    this.#style = style;
    this.#text = text;
    this.#icon = icon;

    this.afterstyle = new BnumEvent();
  }

  get uid() {
    return this.parent.workspace.uid;
  }

  get customMode() {
    return this.#style === WspButton.Style.custom
      ? this._p_get_data('custom-style')
      : 'custom';
  }

  _p_main() {
    super._p_main();

    this._p_beforeMain();

    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', 0);

    this.addEventListener('keydown', (e) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          this.click();
          break;

        default:
          break;
      }
    });

    let style = 'classic';
    switch (this.#style) {
      case WspButton.Style.custom:
        style = this.customMode;
        break;

      case WspButton.Style.white:
        style = 'white';
        break;

      default:
        break;
    }

    this.setAttribute('wspbutton', style);
    this.addClass('mel-focus', 'shadow-mel-button');
    this.style.justifyContent = 'space-between';
    this.style.padding = '2.5px 5px';
    this.style.borderRadius = '50px';

    this.afterstyle.call(this);

    let span = document.createElement('span');
    span.appendChild(this.createText(this.#text));
    this.appendChild(span);

    if (!!(this.#icon || false)) {
      let icon = new BnumHtmlIcon(this.#icon);
      this.appendChild(icon);
      icon = null;
    }

    span = null;
  }

  _p_beforeMain() {
    return this;
  }

  async _p_post(action, params = {}) {
    params ??= {};
    params._uid = this.uid;
    let data = null;
    let errored = false;
    await MelObject.Empty().http_internal_post({
      task: 'workspace',
      on_success: (sData) => {
        data = sData;
      },
      on_error: (...args) => {
        errored = args;
      },
      params,
      action,
    });

    if (errored) throw errored;

    return data;
  }

  async _p_param_post(key, params = {}) {
    params ??= {};
    params._key = key;
    return await this._p_post('param', params);
  }
}

/**
 * @enum
 */
WspButton.Style = {
  classic: Symbol(),
  white: Symbol(),
  custom: Symbol(),
};

{
  const TAG = 'bnum-wsp-button';
  if (!customElements.get(TAG)) customElements.define(TAG, WspButton);
}

const NAMESPACE = 'wsp-nav-button';
export class WspNavigationButton extends NavBarComponent {
  #startingState = null;
  #startingIcon = null;
  #text = null;
  #id = null;

  constructor(
    parent = null,
    {
      text = EMPTY_STRING,
      iconPressed = 'visibility_off',
      iconNotPressed = 'visibility',
      startingPressedState = false,
    } = {},
  ) {
    super({ parent, mode: EWebComponentMode.flex });

    this.#id =
      this.getAttribute('id') || this.generateId(`${NAMESPACE}-container`);
    this.#startingIcon = startingPressedState ? iconPressed : iconNotPressed;
    this.#startingState = startingPressedState;
    this.#text = text;

    this.onbuttonclick = new BnumEvent();
    this.oniconclicked = new BnumEvent();

    this.onbuttonclick.push((e) => {
      this.dispatchEvent(
        new CustomEvent('api:buttonclick', { detail: { originalEvent: e } }),
      );
    });

    this.oniconclicked.push((obj, button) => {
      if (obj.newState) this.icon.icon = iconPressed;
      else this.icon.icon = iconNotPressed;

      this.dispatchEvent(
        new CustomEvent('api:iconclick', {
          detail: { state: obj.newState, button, caller: this },
        }),
      );
    });
  }

  get uid() {
    return this.#id;
  }

  get taskButtonId() {
    return `${this.uid}-task`;
  }

  get visibilityButtonId() {
    return `${this.uid}-visibility`;
  }

  get taskButton() {
    return this.querySelector(`#${this.taskButtonId}`);
  }

  get visibilityButton() {
    return this.querySelector(`#${this.visibilityButtonId}`);
  }

  get icon() {
    return this.visibilityButton.querySelector('bnum-icon');
  }

  get canBeHidden() {
    return this._p_get_data('can-be-hidden') !== 'false';
  }

  _p_main() {
    super._p_main();

    // let button = new WspButton(this.parent, {
    //   style: WspButton.Style.custom,
    //   text: this.#text,
    // });
    let button = PressedButton.Create();
    let visibilityButton = PressedButton.Create(); //new PressedButton();
    let icon = BnumHtmlIcon.Create({ icon: this.#startingIcon }); //new BnumHtmlIcon(this.#startingIcon);

    button.data('custom-style', 'navigation').style.marginTop = 0;
    button.classList.add('left-button');
    button.setAttribute('id', this.taskButtonId);
    button.addEventListener(
      'click',
      this.onbuttonclick.call.bind(this.onbuttonclick),
    );
    button.appendChild(this.createText(this.#text));
    button.setAttribute('wspbutton', 'navigation');
    button.style.justifyContent = 'left';

    this.appendChild(button);
    // debugger;
    if (this.canBeHidden) {
      visibilityButton
        .data('data-start-pressed', this.#startingState)
        .appendChild(icon);
      visibilityButton.classList.add('transparent-bckg');
      visibilityButton.setAttribute('id', this.visibilityButtonId);
      visibilityButton.ontoggle.push(
        this.oniconclicked.call.bind(this.oniconclicked),
      );
      visibilityButton.onmouseenter = () => {
        /**
         * @type {PressedButton}
         */
        let button = this.querySelector(`#${this.taskButtonId}`);

        $(button).css({
          '--navigation-border-radius-top-right': 0,
          '--navigation-border-radius-bottom-right': 0,
        }); //['--navigation-border-radius-top-right'] = '0px';
        // button.style['--navigation-border-radius-bottom-right'] = '0px';
        button = null;
      };
      visibilityButton.onmouseleave = () => {
        /**
         * @type {PressedButton}
         */
        let button = this.querySelector(`#${this.taskButtonId}`);
        $(button).css({
          '--navigation-border-radius-top-right': EMPTY_STRING,
          '--navigation-border-radius-bottom-right': EMPTY_STRING,
        });
        button = null;
      };

      this.appendChild(visibilityButton);
      visibilityButton = null;
    }

    icon = null;
    button = null;
  }
}

{
  const TAG = 'bnum-wsp-navigation-button';
  if (!customElements.get(TAG)) customElements.define(TAG, WspNavigationButton);
}
