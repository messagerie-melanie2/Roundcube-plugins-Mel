import { BnumLog } from '../../../../../plugins/mel_metapage/js/lib/classes/bnum_log.js';
import { EMPTY_STRING } from '../../../../../plugins/mel_metapage/js/lib/constants/constants.js';
import { ABaseSubModule } from '../../core/ABaseSubModule.js';
import { CheckboxSync } from '../../core/CheckboxSync.js';
import { FilterAction } from './filterAction.js';
import { update_show_contentframe } from './index.internal/show_contentframe.js';
import { FilterUi, Ui } from './ui.js';

// ─── Types ────────────────────────────────────────────────────────────────────
//#region Types

/**
 * Arguments transmis lors de la réinitialisation du champ de recherche.
 * @typedef OnClearEventArgs
 * @property {import('../../design-system/ds-module-bnum.js').HTMLBnumInputSearch} caller
 *   Le composant de saisie qui déclenche l'effacement.
 * @property {boolean} ignoreOriginal
 *   Indique s'il faut ignorer le comportement par défaut.
 * @property {Readonly<(e: Event) => Result<void>>} inputValueChangedFunction
 *   Fonction à appeler pour notifier le changement de valeur.
 * @property {?() => void | undefined} after
 *   Fonction optionnelle à exécuter après l'effacement.
 */

//#endregion
// ─── SearchFiltersInitializer ─────────────────────────────────────────────────
//#region SearchFiltersInitializer
/**
 * Initialise les composants de filtres de la vue de recherche mail.
 * Synchronise les selects natifs avec leurs équivalents web components,
 * et gère la synchronisation des checkboxes de recherche avancée.
 *
 * Responsabilité unique : setup du DOM de filtres, sans connaissance
 * des événements Roundcube ni du cycle de vie du module parent.
 */
class SearchFiltersInitializer {
  /** @type {FilterUi} */
  #_filterUi;

  /**
   * @param {FilterUi} filterUi - Accesseurs vers les éléments de filtre du DOM.
   */
  constructor(filterUi) {
    this.#_filterUi = filterUi;
  }

  /**
   * Initialise l'ensemble des filtres du panneau de recherche.
   * @returns {this}
   */
  init() {
    return this.#_initSearchFilter()
      .#_initDateFilter()
      .#_initSearchOptionsFilters();
  }

  //#endregion
  // ─── Filtre de recherche ───────────────────────────────────────────────────
  //#region Filtre de recherche

  /**
   * Synchronise le filtre de recherche natif avec son équivalent web component.
   * Gère la bidirectionnalité : changements depuis le WC vers le natif et inversement.
   * Ajoute dynamiquement une option « Custom » si la valeur courante est absente du WC.
   * @returns {this}
   */
  #_initSearchFilter() {
    this.#_copyFiltersOptions('searchfilter', 'search-filter-dummy');

    this.#_filterUi.searchFilterDummy.addEventListener('change', () => {
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

  //#endregion
  // ─── Filtre de date ────────────────────────────────────────────────────────
  //#region Filtre de date

  /**
   * Synchronise le filtre de date natif avec son équivalent web component.
   * @returns {this}
   */
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

  //#endregion
  // ─── Filtres options (checkboxes) ──────────────────────────────────────────
  //#region Filtres options

  /**
   * Initialise la synchronisation des checkboxes de recherche avancée (`s_mods[]`).
   * Pour chaque input natif trouvé, crée un {@link CheckboxSync} avec son homologue
   * web component, puis attache un listener de propagation des changements vers le natif.
   * @returns {this}
   */
  #_initSearchOptionsFilters() {
    const INPUT_NAME = 's_mods[]';
    const WCS_NAME = `fake_${INPUT_NAME}`;

    /** @type {NodeListOf<HTMLInputElement>} */
    const baseInputs = document.querySelectorAll(`input[name="${INPUT_NAME}"]`);

    for (const input of baseInputs) {
      const value = input.getAttribute('value');
      const inputSelector = `input[name="${INPUT_NAME}"][value="${value}"]`;
      const wcSelector = `[name="${WCS_NAME}"][value="${value}"]`;

      new CheckboxSync(inputSelector, wcSelector, 'checked').init();

      const fake = document.querySelector(wcSelector);

      if (fake) {
        fake.addEventListener(
          'change',
          function (mirrorSelector) {
            const element = document.querySelector(mirrorSelector);
            if (element) {
              element.checked = this.checked;
              element.dispatchEvent(new Event('change', { bubble: true }));
            }
          }.bind(fake, inputSelector),
        );
      } else {
        BnumLog.error(
          'SearchFiltersInitializer/#_initSearchOptionsFilters',
          'Impossible de trouver le webcomposant !',
        );
      }
    }

    return this;
  }

  //#endregion
  // ─── Utilitaires ──────────────────────────────────────────────────────────
  //#region Utilitaires

  /**
   * Copie les options d'un select natif vers un select web component.
   * @param {string} idOriginal - ID du select natif source.
   * @param {string} idDummy - ID du select web component cible.
   * @returns {this}
   * @throws {Error} Si l'un des éléments est introuvable dans le DOM.
   */
  #_copyFiltersOptions(idOriginal, idDummy) {
    /** @type {HTMLSelectElement} */
    const original =
      document.getElementById(idOriginal) ??
      this.#_throw(`Impossible de trouver ${idOriginal}`);

    /** @type {HTMLSelectElement} */
    const dummy =
      document.getElementById(idDummy) ??
      this.#_throw(`Impossible de trouver ${idDummy}`);

    dummy.append(
      ...Array.from(original.querySelectorAll('option')).map((x) =>
        x.cloneNode(true),
      ),
    );

    return this;
  }

  /**
   * Lance une erreur avec le message donné.
   * Utilisé comme fallback dans les expressions `?? this.#_throw(...)`.
   * @param {string} message
   * @throws {Error}
   */
  #_throw(message) {
    throw new Error(message);
  }
}

//#endregion
// ─── Search ───────────────────────────────────────────────────────────────────
//#region Search

/**
 * Sous-module orchestrant la fonctionnalité de recherche dans la vue mail.
 *
 * Délègue l'initialisation des filtres à {@link SearchFiltersInitializer},
 * et se concentre sur le câblage des listeners UI, des événements Roundcube
 * et des patches nécessaires au bon fonctionnement du contentframe.
 *
 * @extends ABaseSubModule
 */
export class Search extends ABaseSubModule {
  // ─── Accesseurs DOM ────────────────────────────────────────────────────────
  //#region Search/Accesseurs DOM

  /** @type {Ui | undefined} */
  #_uiCache;
  /** @type {FilterUi | undefined} */
  #_filterUiCache;

  /**
   * Retourne l'interface DOM du module, en initialisant une instance de {@link Ui} si nécessaire.
   * @returns {Ui}
   */
  get #_ui() {
    return (this.#_uiCache ??= new Ui());
  }

  /**
   * Retourne l'interface DOM des filtres, en initialisant une instance de {@link FilterUi} si nécessaire.
   * @returns {FilterUi}
   */
  get #_filterUi() {
    return (this.#_filterUiCache ??= new FilterUi());
  }

  //#endregion
  // ─── Cycle de vie ──────────────────────────────────────────────────────────
  //#region Search/Cycle de vie
  /**
   * @param {*} parent - Module parent transmis à {@link ABaseSubModule}.
   */
  constructor(parent) {
    super(parent);
  }

  /**
   * Point d'entrée principal du module.
   * Orchestre dans l'ordre : action de filtre, initialisation des filtres,
   * patches Roundcube, listeners UI et listeners Roundcube.
   * @returns {void}
   */
  _p_main() {
    FilterAction.Start(this.#_ui);
    new SearchFiltersInitializer(this.#_filterUi).init();

    this.#_addOverrides().#_addListeners().#_addRcmailListeners();
  }
  //#endregion
  // ─── Overrides Roundcube ───────────────────────────────────────────────────
  //#region Search/Overrides Roundcube

  /**
   * Applique les patches nécessaires sur les méthodes Roundcube.
   * @returns {this}
   */
  #_addOverrides() {
    update_show_contentframe();
    return this;
  }
  //#endregion
  // ─── Listeners UI ──────────────────────────────────────────────────────────
  //#region Search/Listeners UI
  /**
   * Attache les écouteurs sur le champ de recherche et les boutons associés.
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
   * Gère l'affichage/masquage de la barre de recherche via le bouton dédié.
   * Synchronise l'état visuel entre le bouton de recherche, le bouton retour
   * et les éléments du header.
   * @param {HTMLElement} search - Composant de saisie de recherche.
   * @param {HTMLElement} searchButton - Bouton déclenchant l'affichage de la barre.
   * @returns {void}
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
      const isCurrentlyShown = [true, 'true'].includes(
        searchButton.dataset.show,
      );
      applyVisibility(!isCurrentlyShown);
    });

    backButton.addEventListener('click', () => searchButton.click());
  }

  //#endregion
  // ─── Listeners Roundcube ───────────────────────────────────────────────────
  //#region Search/Listeners Roundcube
  /**
   * Attache les écouteurs sur les événements Roundcube liés à la recherche.
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
  //#endregion
  // ─── Callbacks ─────────────────────────────────────────────────────────────
  //#region Search/Callbacks
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
  //#endregion
  // ─── Cycle de vie statique ─────────────────────────────────────────────────
  //#region Search/Cycle de vie statique
  /**
   * Déclare les cycles de vie ignorés par ce module.
   * @returns {import('../../core/ABaseModule.js').LifeCycle[]}
   */
  static _p_ignoreLifeCycles() {
    return ['init', 'after'];
  }
  //#endregion
}
//#endregion
