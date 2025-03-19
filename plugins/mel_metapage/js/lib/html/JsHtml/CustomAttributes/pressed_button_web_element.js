import { BnumEvent } from '../../../mel_events.js';
import {
  BnumHtmlIcon,
  EWebComponentMode,
  HtmlCustomDataTag,
} from './js_html_base_web_elements.js';

console.info('i[pressed]generate classes');

export class PressedButton extends HtmlCustomDataTag {
  constructor({ mode = EWebComponentMode.inline_block } = {}) {
    super({ mode });

    this.onpressed = new BnumEvent();
    this.onunpressed = new BnumEvent();
    this.ontoggle = new BnumEvent();
  }

  _p_main() {
    super._p_main();

    let _startPressed = this.dataset.startPressed;

    this.setAttribute('role', 'button');
    this.setAttribute('tabindex', 0);

    if (['true', true, '1'].includes(_startPressed)) {
      this.ariaPressed = true;
      this.setAttribute('aria-pressed', true);
    } else {
      this.ariaPressed = false;
      this.setAttribute('aria-pressed', false);
    }

    this.removeAttribute('data-start-pressed');

    this.addEventListener('click', this.toggleState.bind(this));

    this.onkeydown = (e) => {
      switch (e.key) {
        case ' ':
        case 'Enter':
          this.click();
          break;

        default:
          break;
      }
    };

    this.dispatchEvent(
      new CustomEvent('load', {
        detail: { button: this, startPressed: this.ariaPressed },
      }),
    );
  }

  disable() {
    this.setAttribute('disabled', 'disabled');
    this.setAttribute('aria-disabled', true);
    this.classList.add('disabled');

    return this;
  }

  enable() {
    this.removeAttribute('disabled');
    this.removeAttribute('aria-disabled');
    this.classList.remove('disabled');

    return this;
  }

  select() {
    this.ariaPressed = true;
    this.setAttribute('aria-pressed', true);
  }

  unselect() {
    this.ariaPressed = false;
    this.setAttribute('aria-pressed', false);
  }

  press() {
    this.ariaPressed = true;
    this.setAttribute('aria-pressed', true);

    this.onpressed.call({ state: this.ariaPressed }, this);
    this.dispatchEvent(
      new CustomEvent('api:pressed', { detail: { state: this.ariaPressed } }),
    );

    return this;
  }

  unpress() {
    this.ariaPressed = false;
    this.setAttribute('aria-pressed', false);

    this.onunpressed.call({ state: this.ariaPressed }, this);
    this.dispatchEvent(
      new CustomEvent('api:unpressed', { detail: { state: this.ariaPressed } }),
    );

    return this;
  }

  isPressed() {
    return [1, true, '1', 'true'].includes(this.ariaPressed);
  }

  toggleState() {
    this.ontoggle.call({ newState: !this.isPressed() }, this);
    this.dispatchEvent(
      new CustomEvent('api:toggle', {
        detail: { newState: !this.isPressed() },
      }),
    );

    if (this.isPressed()) this.unpress();
    else this.press();

    return this;
  }

  /**
   *
   * @returns {PressedButton}
   */
  static Create() {
    return document.createElement(PressedButton.TAG);
  }
}

PressedButton.TAG = 'bnum-pressed-button';

{
  const TAG = PressedButton.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, PressedButton);
}

export class FavoriteButton extends PressedButton {
  constructor() {
    super();

    this._icon = null;

    this.onpressed.push(this._on_pressed.bind(this));
    this.onunpressed.push(this._on_unpressed.bind(this));
  }

  _on_pressed() {
    this.classList.remove(this._inactive_class);
    this.classList.add(this._active_class);
    this._icon.innerText = this._active_icon;
  }

  _on_unpressed() {
    this.classList.remove(this._active_class);
    this.classList.add(this._inactive_class);
    this._icon.innerText = this._inactive_icon;
  }

  get _active_icon() {
    return (
      this._p_get_data('favorite-icon') ??
      this._p_get_data('favoriteIcon') ??
      'keep'
    );
  }

  get _inactive_icon() {
    return (
      this._p_get_data('not-favorite-icon') ??
      this._p_get_data('notFavoriteIcon') ??
      'keep_off'
    );
  }

  get _active_class() {
    return (
      this._p_get_data('favorite-class') ??
      this._p_get_data('favoriteClass') ??
      'active'
    );
  }

  get _inactive_class() {
    return (
      this._p_get_data('not-favorite-class') ??
      this._p_get_data('notFavoriteClass') ??
      'not-active'
    );
  }

  get #_add_default_classes() {
    return (
      this._p_get_data('add-default-classes') ||
      this._p_get_data('addDefaultClasses')
    );
  }

  get _add_default_classes() {
    return ![false, 'false'].includes(this.#_add_default_classes);
  }

  _p_main() {
    super._p_main();

    let icon = document.createElement('bnum-icon');
    icon.setAttribute(
      'data-icon',
      this.isPressed() ? this._active_icon : this._inactive_icon,
    );

    if (this._add_default_classes)
      this.classList.add(...FavoriteButton.DEFAULT_CLASSES.split(' '));

    if (this.isPressed()) this.classList.add(this._active_class);
    else this.classList.add(this._inactive_class);

    this.appendChild(icon);

    this._icon = icon;

    icon = null;
  }

  destroy() {
    super.destroy();

    this._icon = null;

    return this;
  }

  static Create() {
    return document.createElement(FavoriteButton.TAG);
  }
}

FavoriteButton.DEFAULT_CLASSES = 'mel-focus roundbadge can-be-favorite';
FavoriteButton.TAG = 'bnum-favorite-button';

{
  const TAG = FavoriteButton.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, FavoriteButton);
}
