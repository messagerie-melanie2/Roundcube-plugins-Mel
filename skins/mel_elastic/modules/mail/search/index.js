import { BnumLog } from '../../../../../plugins/mel_metapage/js/lib/classes/bnum_log.js';
import { EMPTY_STRING } from '../../../../../plugins/mel_metapage/js/lib/constants/constants.js';
import { ABaseSubModule } from '../../core/ABaseSubModule.js';
import { CheckboxSync } from '../../core/CheckboxSync.js';
import { FilterAction } from './filterAction.js';
import { update_show_contentframe } from './index.internal/show_contentframe.js';
import { FilterUi, Ui } from './ui.js';

/**
 * Arguments transmis lors de la réinitialisation du champ de recherche.
 * @typedef OnClearEventArgs
 * @property {import('../../design-system/ds-module-bnum.js').HTMLBnumInputSearch} caller Le composant de saisie qui déclenche l'effacement.
 * @property {boolean} ignoreOriginal Indique s'il faut ignorer le comportement par défaut.
 * @property {Readonly<(e: Event) => Result<void>>} inputValueChangedFunction Fonction à appeler pour notifier le changement de valeur.
 * @property {?() => void | undefined} after Fonction optionnelle à exécuter après l'effacement.
 */

export class Search extends ABaseSubModule {
  #__ui;
  #___ui;

  /**
   * Retourne l'interface DOM du module, en initialisant une instance de Ui si nécessaire.
   * @returns {Ui}
   */
  get #_ui() {
    return (this.#__ui ??= new Ui());
  }

  /**
   * @returns {FilterUi}
   */
  get #_filterUi() {
    return (this.#___ui ??= new FilterUi());
  }

  constructor(parent) {
    super(parent);
  }

  /**
   * Point d'entrée principal du module.
   * Initialise les actions de filtre et les écouteurs d'événements.
   * @returns {void}
   */
  _p_main() {
    FilterAction.Start(this.#_ui);
    this.#_init().#_addOverrides().#_addListeners().#_addRcmailListeners();
  }

  #_init() {
    return this.#_initFilters();
  }

  #_initFilters() {
    return this.#_initSearchFilter()
      .#_initDateFilter()
      .#_initSearchOptionsFilters();
  }

  #_initSearchFilter() {
    this.#_copyFiltersOptions('searchfilter', 'search-filter-dummy');
    this.#_filterUi.searchFilterDummy.addEventListener('change', (e) => {
      const original = this.#_filterUi.searchFilter;
      const dummy = this.#_filterUi.searchFilterDummy;

      original.value = dummy.value;

      original.dispatchEvent(new Event('change', { bubbles: true }));
    });

    this.#_filterUi.searchFilter.addEventListener('change', () => {
      const original = this.#_filterUi.searchFilter;
      const dummy = this.#_filterUi.searchFilterDummy;

      const valExist = dummy.select.querySelector(
        `option[value="${CSS.escape(original.value)}"]`,
      );
      if (!valExist) {
        dummy.select.querySelector('#dummy-custom')?.remove?.();

        const option = document.createElement('option');
        option.setAttribute('value', original.value);
        option.setAttribute('id', 'dummy-custom');
        option.innerText = 'Custom';
        dummy.appendChild(option);
      }

      requestAnimationFrame(() => {
        setTimeout(() => {
          dummy.value = original.value;
        }, 0);
      });
    });

    return this;
  }

  #_initDateFilter() {
    this.#_copyFiltersOptions('s_interval', 's-date-dummy');
    this.#_filterUi.searchDateDummy.addEventListener('change', (e) => {
      const original = this.#_filterUi.searchDate;
      const dummy = this.#_filterUi.searchDateDummy;

      original.value = dummy.value;

      original.dispatchEvent(e);
    });

    return this;
  }

  #_initSearchOptionsFilters() {
    const INPUT_NAME = 's_mods[]';
    const WCS_NAME = `fake_${INPUT_NAME}`;
    /**
     * @type {HTMLInputElement[]}
     */
    const baseInputs = document.querySelectorAll(`input[name="${INPUT_NAME}"]`);

    for (const input of baseInputs) {
      const inputSelector = `input[name="${INPUT_NAME}"][value="${input.getAttribute('value')}"]`;
      const wcSelector = `[name="${WCS_NAME}"][value="${input.getAttribute('value')}"]`;

      {
        const sync = new CheckboxSync(inputSelector, wcSelector, 'checked');

        sync.init();
      }
      const fake = document.querySelector(wcSelector);

      if (fake) {
        fake.addEventListener(
          'change',
          function (mirrorSelector) {
            debugger;
            const element = document.querySelector(mirrorSelector);

            if (element) {
              element.checked = this.checked;
              element.dispatchEvent(new Event('change', { bubble: true }));
            }
          }.bind(fake, inputSelector),
        );
      } else
        BnumLog.error(
          '#_initSearchOptionsFilters',
          'Impossible de trouver le webcomposant !',
        );
    }

    return this;
  }

  #_copyFiltersOptions(idOriginal, idDummy) {
    /**
     * @type {HTMLSelectElement}
     */
    const original =
      document.getElementById(idOriginal) ??
      this.#_throw(`Impossible de trouver ${idOriginal}`);
    /**
     * @type {HTMLSelectElement}
     */
    const dummy =
      document.getElementById(idDummy) ??
      this.#_throw(`Impossible de trouver ${idDummy}`);

    const originalOptions = original.querySelectorAll('option');

    dummy.append(...Array.from(originalOptions).map((x) => x.cloneNode(true)));

    return this;
  }

  #_throw(message) {
    throw new Error(message);
  }

  /**
   * Registers event listeners on the search field and related UI controls.
   * @returns {this}
   */
  #_addListeners() {
    const { search, searchButton } = this.#_ui;

    if (!search) return this;

    search.addEventListener('bnum-input-search:search', (e) =>
      this.#_onInputSubmit(e),
    );
    search.onclear.push((params) => this.#_onInputClear(params));

    if (searchButton) {
      this.#_bindSearchToggle(search, searchButton);
    }

    return this;
  }

  /**
   * Binds the toggle behavior between the search button and the back button.
   * Encapsulates all DOM side-effects related to showing/hiding the search bar.
   * @param {HTMLElement} search
   * @param {HTMLElement} searchButton
   */
  #_bindSearchToggle(search, searchButton) {
    /** @type {HTMLElement | null} */
    const backButton = this.$.input_search_back_button;
    /** @type {HTMLElement | null} */
    const headerLeft = document.querySelector(
      '#messagelist-header .header-left',
    );
    const searchContainer = search.parentElement?.parentElement;

    if (!backButton || !searchContainer || !headerLeft) return;

    const applyVisibility = (isExpanded) => {
      searchButton.dataset.show = isExpanded.toString();
      search.style.display = isExpanded ? null : 'none';
      searchContainer.style.justifyContent = isExpanded ? 'center' : null;
      headerLeft.style.display = isExpanded ? 'none' : null;
      backButton.classList.toggle('bds-hidden', !isExpanded);
    };

    searchButton.addEventListener('click', (e) => {
      e.preventDefault();
      // dataset.show drives the "is currently visible" state
      const isCurrentlyShown = [true, 'true'].includes(
        searchButton.dataset.show,
      );
      applyVisibility(!isCurrentlyShown);
    });

    backButton.addEventListener('click', () => searchButton.click());
  }

  /**
   * Ajoute les écouteurs Roundcube pour les réponses de recherche et de liste.
   * @returns {this}
   */
  #_addRcmailListeners() {
    this.listen('responseaftersearch', () => this.#_afterSearch())
      .listen('responseafterlist', () => this.#_afterList())
      .listen('quick-filter.reset', () => {
        this.#_filterUi.searchFilterDummy.value = 'ALL';
      });

    return this;
  }

  #_addOverrides() {
    update_show_contentframe();

    return this;
  }

  /**
   * Soumet la recherche saisie et déclenche la commande Roundcube correspondante.
   * @param {CustomEvent<{ value: string; name: string; caller: HTMLBnumInputSearch }>} e
   * @returns {void}
   */
  #_onInputSubmit(e) {
    const baseInput = this.#_ui.input;
    const { value } = e.detail;

    baseInput.value = value;

    if ([true, 'true'].includes(this.#_ui.filterButton.data('show'))) {
      this.#_ui.filterButton.click();
    }

    queueMicrotask(() => this.execCommand('search'));
  }

  /**
   * Réinitialise la recherche lorsque le champ est effacé.
   * @param {OnClearEventArgs} params
   * @returns {OnClearEventArgs}
   */
  #_onInputClear(params) {
    this.execCommand('reset-search');
    params.caller.value = EMPTY_STRING;
    params.inputValueChangedFunction();
    params.ignoreOriginal = true;
    return params;
  }

  /**
   * Traite la fin d'une recherche en affichant un état de succès.
   * @returns {void}
   */
  #_afterSearch() {
    this.#_ui.search.setSuccessState('Search completed');
  }

  /**
   * Réinitialise l'état du composant de recherche après le rafraîchissement de la liste.
   * @returns {void}
   */
  #_afterList() {
    this.#_ui.search.removeAttribute('state');
  }

  static _p_ignoreLifeCycles() {
    return ['init', 'after'];
  }
}
