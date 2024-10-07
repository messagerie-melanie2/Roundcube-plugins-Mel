import { BnumEvent } from '../../../mel_events.js';
import { MelHtml } from '../MelHtml.js';
import {
  EWebComponentMode,
  HtmlCustomTag,
} from './js_html_base_web_elements.js';

export class PressedButton extends HtmlCustomTag {
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
    return this.ariaPressed;
  }

  toggleState() {
    this.ontoggle.call({ newState: !this.ariaPressed }, this);
    this.dispatchEvent(
      new CustomEvent('api:toggle', {
        detail: { newState: !this.ariaPressed },
      }),
    );

    if (this.ariaPressed) this.unpress();
    else this.press();

    return this;
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
    this._active_icon = null;
    this._inactive_icon = null;
    this._active_class = null;
    this._inactive_class = null;
    this._add_default_classes = null;

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

  _p_main() {
    super._p_main();

    Object.defineProperties(this, {
      _active_icon: {
        value: this.dataset?.favoriteIcon ?? 'keep',
        writable: false,
        configurable: false,
      },
      _inactive_icon: {
        value: this.dataset?.notFavoriteIcon ?? 'keep_off',
        writable: false,
        configurable: false,
      },
      _active_class: {
        value: this.dataset?.favoriteClasses ?? 'active',
        writable: false,
        configurable: false,
      },
      _inactive_class: {
        value: this.dataset?.notFavoriteClasses ?? 'not-active',
        writable: false,
        configurable: false,
      },
      _add_default_classes: {
        value: ![false, 'false'].includes(this.dataset?.addDefaultClasses),
        writable: false,
        configurable: false,
      },
    });

    let icon = MelHtml.start
      .icon(this.isPressed() ? this._active_icon : this._inactive_icon)
      .end()
      .generate_dom();

    if (this._add_default_classes)
      this.classList.add(...FavoriteButton.DEFAULT_CLASSES.split(' '));

    if (this.isPressed()) this.classList.add(this._active_class);
    else this.classList.add(this._inactive_class);

    this.appendChild(icon);

    this._icon = icon;

    icon = null;

    const data = [
      'favorite-icon',
      'not-favorite-icon',
      'favorite-classes',
      'not-favorite-classes',
      'add-default-classes',
    ];

    for (const element of data) {
      this.removeAttribute(`data-${element}`);
    }
  }

  destroy() {
    super.destroy();

    this._icon = null;

    return this;
  }
}

FavoriteButton.DEFAULT_CLASSES = 'mel-focus roundbadge can-be-favorite';
FavoriteButton.TAG = 'bnum-favorite-button';

{
  const TAG = FavoriteButton.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, FavoriteButton);
}
