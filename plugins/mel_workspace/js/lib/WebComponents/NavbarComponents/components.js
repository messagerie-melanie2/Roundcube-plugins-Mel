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

    mainDiv.appendChild(description);

    if (
      true ||
      Math.ceil(description.scrollHeight) > description.clientHeight
    ) {
      let separator = new BnumHtmlSeparate({ mode: EWebComponentMode.div });
      separator.style.display = 'block';

      let button = new PressedButton({ mode: EWebComponentMode.flex });
      button.style.display = 'flex';
      button.setAttribute('title', 'Afficher/réduire la description');

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

      mainDiv.append(separator, button);

      separator = null;
      button = null;
    }

    element.appendChild(mainDiv);

    element = null;
    mainDiv = null;
    description = null;
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
