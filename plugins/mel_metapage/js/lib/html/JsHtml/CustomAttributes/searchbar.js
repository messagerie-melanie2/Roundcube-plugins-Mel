import {
  BnumHtmlIcon,
  BnumHtmlSrOnly,
  EWebComponentMode,
  HtmlCustomDataTag,
} from './js_html_base_web_elements.js';

export class SearchBar extends HtmlCustomDataTag {
  constructor() {
    super({ mode: EWebComponentMode.inline_block });
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
    return this._p_get_data('icon');
  }

  get iconPos() {
    return this._p_get_data('icon-pos');
  }

  _p_main() {
    super._p_main();

    let form = document.createElement('form');
    form.setAttribute('role', 'search');
    form.setAttribute('id', `form-${this.internalId}`);

    let label = BnumHtmlSrOnly.Create();
    label.setAttribute('aria-labelledby', form.id);

    let group = document.createElement('div');
    group.classList.add('input-group');

    let input = document.createElement('input');
    input.classList.add('form-control', 'mel-input', 'input-mel');

    input.onchange = (e) => this.dispatchEvent(e);
    input.oninput = (e) => this.dispatchEvent(e);
    input.onclick = (e) => this.dispatchEvent(e);

    let icon = BnumHtmlIcon.Create({ icon: this.icon });
    let groupClass = '';

    group.appendChild(input);
    let side = document.createElement('div');

    switch (this.iconPos) {
      case SearchBar.EIconPos.right:
        groupClass = 'append';
        group.appendChild(side);
        break;

      default:
        groupClass = 'prepend';
        group.prepend(side);
        break;
    }

    side.classList.add(`input-group-${groupClass}`);
    side.appendChild(icon);

    form.appendChild(group);

    this.appendChild(form);

    form = null;
    label = null;
    group = null;
    input = null;
    icon = null;
    side = null;
  }
}

SearchBar.EIconPos = {
  right: 'right',
  left: 'left',
};
