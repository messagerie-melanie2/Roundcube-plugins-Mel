import { EMPTY_STRING } from '../../../constants/constants.js';
import { BnumEvent } from '../../../mel_events.js';
import { ABaseMelEvent } from './events.js';
import {
  BnumHtmlIcon,
  BnumHtmlSrOnly,
  EWebComponentMode,
  HtmlCustomDataTag,
} from './js_html_base_web_elements.js';

export class SearchBar extends HtmlCustomDataTag {
  constructor() {
    super({ mode: EWebComponentMode.inline_block });

    this.oncreate = new BnumEvent();
    this.onformsubmitted = new BnumEvent();
  }

  get internalId() {
    let id = this.id || this._p_get_data('id') || null;

    if (!id) {
      this._p_save_into_data('id', this.generateId('search-bar'));
      id = this.internalId;
    }

    return id;
  }

  get icon() {
    return this._p_get_data('icon') || 'search';
  }

  get iconPos() {
    return this._p_get_data('icon-pos');
  }

  get label() {
    let label =
      this.getAttribute('aria-labelledby') ||
      this._p_get_data('label') ||
      'Zone de recherche';

    return label;
  }

  get value() {
    return this.querySelector('input').value;
  }

  set value(val) {
    let input = this.querySelector('input');
    input.value = val;
    input.dispatchEvent(new Event('change'));
  }

  _p_main() {
    super._p_main();

    console.log('this', this, this.querySelector('form'));
    if (this.querySelector('form')) return;
    console.log('here', this);

    let form = document.createElement('form');
    form.setAttribute('role', 'search');
    form.setAttribute('id', `form-${this.internalId}`);

    let label = BnumHtmlSrOnly.Create();
    label.setAttribute('aria-labelledby', form.id);
    label.appendChild(this.createText(this.label));

    let group = document.createElement('div');
    group.classList.add('input-group');

    let input = document.createElement('input');
    input.classList.add('form-control', 'mel-input', 'input-mel');
    input.setAttribute('placeholder', this.label);

    input.onchange = (e) => {
      this._switch_to_empty_button(
        this.querySelector('bnum-icon')?.parentElement,
        this.querySelector('bnum-icon'),
      );
      this.dispatchEvent(
        new CustomEvent('api:search.input.change', {
          detail: { caller: this, originalEvent: e },
        }),
      );
    };

    input.oninput = (e) => {
      this._switch_to_empty_button(
        this.querySelector('bnum-icon')?.parentElement,
        this.querySelector('bnum-icon'),
      );
      this.dispatchEvent(
        new CustomEvent('api:search.input.input', {
          detail: { caller: this, originalEvent: e },
        }),
      );
    };

    input.onclick = (e) => {
      this.dispatchEvent(
        new CustomEvent('api:search.input.click', {
          detail: { caller: this, originalEvent: e },
        }),
      );
    };

    input.onkeydown = (e) => {
      if (e.key === 'Escape') {
        this.value = EMPTY_STRING;
      }
    };

    let icon = BnumHtmlIcon.Create({ icon: this.icon });
    icon.classList.add('input-group-text');
    let groupClass = '';

    group.appendChild(input);
    let side = document.createElement('div');

    switch (this.iconPos) {
      case SearchBar.EIconPos.left:
        groupClass = 'prepend';
        group.prepend(side);
        break;

      default:
        groupClass = 'append';
        group.appendChild(side);
        break;
    }

    side.classList.add(`input-group-${groupClass}`);
    side.appendChild(icon);

    form.appendChild(group);

    form.onsubmit = (ev) => {
      let searchEvent = new SearchSubmitEvent(this, ev);
      this.onformsubmitted.call({
        searchEvent,
      });

      if (!searchEvent.isBreak) {
        this.dispatchEvent(searchEvent);

        if (!searchEvent.isBreak) {
          ev.preventDefault();
        }
      }
    };

    this.appendChild(form);

    this.oncreate.call({
      form,
      label,
      input,
      icon,
      inputContainer: group,
      iconContainer: side,
    });

    form = null;
    label = null;
    group = null;
    input = null;
    icon = null;
    side = null;
  }

  /**
   *
   * @param {HTMLDivElement} iconContainer
   * @param {BnumHtmlIcon} icon
   */
  _switch_to_empty_button(iconContainer, icon) {
    if (!this.querySelector('button') && this.value.length > 0) {
      this._switch_to_empty_button.icon = icon.icon;

      let button = document.createElement('button');
      button.classList.add(
        'mel-button',
        'no-button-margin',
        'no-margin-button',
      );
      button.setAttribute('type', 'button');
      button.onclick = (e) => {
        this.value = EMPTY_STRING;
        this._remove_button();
      };

      let buttonIcon = BnumHtmlIcon.Create({ icon: 'close' });
      button.appendChild(buttonIcon);

      iconContainer.appendChild(button);
      icon.remove();
      button = null;
      buttonIcon = null;
    } else if (this.querySelector('button') && this.value === EMPTY_STRING)
      this._remove_button();
  }

  _remove_button() {
    let button = this.querySelector('button');

    if (button) {
      let icon = BnumHtmlIcon.Create({ icon: this.icon });
      icon.classList.add('input-group-text');

      let container = button.parentElement;

      button.remove();
      container.appendChild(icon);

      icon = null;
      button = null;
      container = null;
    }
  }

  static CreateNode({
    icon = 'search',
    id = null,
    iconPos = SearchBar.EIconPos.right,
    label = null,
    onCreate = null,
  } = {}) {
    let node = document.createElement(this.TAG);

    if (icon) node.setAttribute('data-icon', icon);

    if (id) node.setAttribute('id', id);

    if (iconPos) node.setAttribute('data-icon-pos', iconPos);

    if (label) node.setAttribute('data-label', label);

    if (onCreate) node.oncreate.push(onCreate);

    return node;
  }

  static get EventTag() {
    return SearchSubmitEvent.TAG;
  }
}

SearchBar.EIconPos = {
  right: 'right',
  left: 'left',
};

SearchBar.TAG = 'bnum-searchbar';

{
  const TAG = SearchBar.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, SearchBar);
}

class SearchSubmitEvent extends ABaseMelEvent {
  #base = null;
  #break = false;

  constructor(caller, baseEvent) {
    super(SearchSubmitEvent.BASE_TAG, caller);
    this.#base = baseEvent;
  }

  get originalEvent() {
    return this.#base;
  }

  get input() {
    return this.caller.querySelector('input');
  }

  get result() {
    return this.input.value;
  }

  get isBreak() {
    return this.#break;
  }

  break() {
    this.#break = true;
  }

  static get BASE_TAG() {
    return 'searchbar.submit';
  }

  static get TAG() {
    return `api:${this.BASE_TAG}`;
  }
}
