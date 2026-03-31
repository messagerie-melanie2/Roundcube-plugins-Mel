import { ABaseModule } from './ABaseModule.js';

class Ui {
  constructor() {}

  /**
   * @returns {import('../design-system/ds-module-bnum.js').HTMLBnumInputSearch}
   */
  get search() {
    return document.getElementById('input-search-mail');
  }

  /**
   * @returns {import('../design-system/ds-module-bnum.js').HTMLBnumButtonIcon}
   */
  get filterButton() {
    return document.getElementById('input-search-filter-button');
  }
  /**
   * @returns {HTMLAnchorElement}
   */
  get rcFilterButton() {
    return document.querySelector('#mailsearchlist .searchbar a.options');
  }
  /**
   * @returns {HTMLInputElement}
   */
  get input() {
    return document.getElementById('mailsearchform');
  }
}

class FilterAction {
  /**
   * @type {Ui}
   */
  #_ui;
  /**
   * @type {Readonly<{ show: string; hide: string }>} Icons for show and hide states
   * @readonly
   */
  static #_ICONS = {
    show: 'filter_list',
    hide: 'filter_list_off',
  };

  /**
   * @param {Ui} ui
   */
  constructor(ui) {
    this.#_ui = ui;
  }

  #_show() {
    const bnumInputButton = this.#_ui.filterButton;
    const rcFilterButton = this.#_ui.rcFilterButton;

    bnumInputButton.data('show', true);
    bnumInputButton.icon = FilterAction.#_ICONS.hide;

    rcFilterButton.click();
  }

  #_hide() {
    const bnumInputButton = this.#_ui.filterButton;
    const rcFilterButton = this.#_ui.rcFilterButton;

    bnumInputButton.data('show', false);
    bnumInputButton.icon = FilterAction.#_ICONS.show;

    rcFilterButton.click();
  }

  toggle() {
    const bnumInputButton = this.#_ui.filterButton;
    const isShown = bnumInputButton.data('show');

    if (isShown) {
      this.#_hide();
    } else {
      this.#_show();
    }
  }

  /**
   *
   * @param {Ui} ui
   */
  static Start(ui) {
    const filterButton = ui.filterButton;
    const action = new FilterAction(ui);

    filterButton.addEventListener('click', action.toggle.bind(action));

    return action;
  }
}

export class ElasticUiMail extends ABaseModule {
  #__ui;

  /**
   * @returns {Ui}
   */
  get #_ui() {
    return (this.#__ui ??= new Ui());
  }

  constructor() {
    super();
  }

  _p_main() {
    FilterAction.Start(this.#_ui);
    this.#_addListeners().#_addRcmailListeners();
  }

  #_addListeners() {
    this.#_ui.search.addEventListener('bnum-input-search:search', (e) =>
      this.#_onInputSubmit(e),
    );

    this.#_ui.search.addEventListener('bnum-input-search:clear', () =>
      this.#_onInputClear(),
    );

    return this;
  }

  #_addRcmailListeners() {
    this.listen('responseaftersearch', () => this.#_afterSearch()).listen(
      'responseafterlist',
      () => this.#_afterList(),
    );

    return this;
  }

  /**
   *
   * @param {CustomEvent<{ value: string; name: string; caller: HTMLBnumInputSearch }>} e
   */
  #_onInputSubmit(e) {
    const baseInput = this.#_ui.input;
    const { value } = e.detail;

    baseInput.value = value;

    if ([true, 'true'].includes(this.#_ui.filterButton.data('show'))) {
      this.#_ui.filterButton.click();
    }

    setTimeout(() => {
      this.execCommand('search');
    }, 1);
  }

  #_onInputClear() {
    this.execCommand('reset-search');
  }

  #_afterSearch() {
    this.#_ui.search.setSuccessState('Search completed');
  }

  #_afterList() {
    this.#_ui.search.removeAttribute('state');
  }
}
