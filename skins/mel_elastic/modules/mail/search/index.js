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
// ─── SearchModsMemory ─────────────────────────────────────────────────────────
//#region SearchModsMemory
/**
 * @typedef SearchMemoryOptions
 * @property {string} scope - Valeur du select `s_scope`.
 * @property {string} filter - Valeur du select `searchfilter`.
 * @property {string} interval - Valeur du select `s_interval`.
 */

/**
 * Gère la case « Mémoriser ces options de recherche pour ce dossier » du panneau de filtres.
 *
 * L'état de la case et les champs cochés sont ajoutés aux paramètres de chaque
 * recherche (`_bnum_remember`, `_bnum_mods`) ; le plugin `bnum_mail` enregistre
 * ou supprime alors, pour le dossier courant, les champs et les selects
 * (`_scope`, `_filter`, `_interval`, déjà envoyés par le core).
 *
 * Au chargement et à chaque changement de dossier, la case et les selects
 * sont restaurés depuis `env.bnum_search_memory` ; les champs, eux, sont
 * restaurés par le serveur via `env.search_mods`.
 */
class SearchModsMemory {
  static #_SWITCH_ID = 's_mods_remember';
  static #_RESET_ID = 's_reset_filters';
  static #_ENV_KEY = 'bnum_search_memory';
  static #_ENV_DEFAULTS_KEY = 'bnum_search_defaults';

  /**
   * Dossier pour lequel l'état de la case a été chargé.
   * @type {?string}
   */
  #_switchMbox = null;

  /**
   * Dossier pour lequel les selects ont été restaurés.
   * @type {?string}
   */
  #_restoredMbox = null;

  /**
   * @returns {?HTMLElement & { checked: boolean }}
   */
  get #_switch() {
    return document.getElementById(SearchModsMemory.#_SWITCH_ID);
  }

  /**
   * @returns {this}
   */
  init() {
    if (!this.#_switch) return this;

    this.sync();
    this.#_patchSearchParams();

    document
      .getElementById(SearchModsMemory.#_RESET_ID)
      ?.addEventListener('click', () => this.reset());

    return this;
  }

  /**
   * Remet les champs et les selects du panneau à leurs valeurs par défaut
   * (configuration, sans la mémorisation) et met à jour la mémorisation du
   * dossier tout de suite, sans lancer de recherche. Ne touche pas à la case
   * « Mémoriser ».
   * @returns {void}
   */
  reset() {
    const defaults = rcmail.env[SearchModsMemory.#_ENV_DEFAULTS_KEY] ?? {};
    const mbox = rcmail.env.mailbox;
    const defaultMods = defaults.mods?.[mbox] ?? defaults.mods?.['*'];

    if (defaultMods) {
      rcmail.env.search_mods ??= {};
      rcmail.env.search_mods[mbox] = { ...defaultMods };
    }

    this.#_applySelects({
      scope: defaults.scope ?? 'base',
      filter: 'ALL',
      interval: '',
    });

    // Recoche les cases natives depuis env.search_mods / env.search_scope ;
    // CheckboxSync répercute sur les interrupteurs.
    const menu = document.getElementById('searchmenu');

    if (menu && typeof window.UI?.searchmenu === 'function') window.UI.searchmenu(menu);

    this.#_persistReset(mbox, defaults.scope ?? 'base');
  }

  /**
   * Met à jour la mémorisation du dossier sans attendre une recherche : valeurs par défaut
   * enregistrées si « Mémoriser » est coché, mémorisation supprimée sinon.
   * @param {string} mbox
   * @param {string} scope - Portée par défaut
   * @returns {void}
   */
  #_persistReset(mbox, scope) {
    // Case pas encore chargée pour ce dossier : son état ne le concerne pas
    if (mbox !== this.#_switchMbox) return;

    const remember = !!this.#_switch?.checked;

    rcmail.http_post('plugin.bnum_mail.reset_search', {
      _mbox: mbox,
      _bnum_remember: remember ? '1' : '0',
    });

    this.#_updateMemory(
      { _mbox: mbox, _scope: scope, _filter: 'ALL', _interval: '' },
      remember,
    );
  }

  /**
   * Met la case et les selects à l'état mémorisé si le dossier courant a changé
   * depuis la dernière synchronisation. Sans effet sinon, pour ne pas écraser
   * ce que l'utilisateur a modifié dans la page.
   * @returns {void}
   */
  sync() {
    const mbox = rcmail.env.mailbox;

    if (mbox !== this.#_switchMbox) this.#_syncSwitch(mbox);

    if (mbox !== this.#_restoredMbox) {
      this.#_restoredMbox = mbox;

      // Une recherche est déjà active (ex. rechargement avec `_search`) : ne pas la contredire
      if (!rcmail.env.search_request) this.#_restoreSelects(mbox);
    }
  }

  /**
   * @param {string} mbox
   * @returns {void}
   */
  #_syncSwitch(mbox) {
    const toggle = this.#_switch;

    if (!toggle) return;

    this.#_whenUpgraded(toggle, () => {
      toggle.checked = !!this.#_memory()[mbox];
      this.#_switchMbox = mbox;
    });
  }

  /**
   * Exécute `callback` une fois l'élément upgradé s'il s'agit d'un web component.
   * Affecter une propriété (`checked`, `value`) avant l'upgrade créerait une propriété
   * propre qui masquerait l'accesseur du composant.
   * @param {HTMLElement} element
   * @param {() => void} callback
   * @returns {void}
   */
  #_whenUpgraded(element, callback) {
    const name = element.localName;

    if (!name.includes('-') || customElements.get(name)) callback();
    else customElements.whenDefined(name).then(callback);
  }

  /**
   * @param {string} mbox
   * @returns {void}
   */
  #_restoreSelects(mbox) {
    const options = this.#_memory()[mbox];

    if (options) this.#_applySelects(options);
  }

  /**
   * Applique des valeurs aux selects du panneau (natifs et web components).
   * @param {SearchMemoryOptions} options
   * @returns {void}
   */
  #_applySelects(options) {
    const scope = document.getElementById('s_scope');

    if (scope && options.scope) {
      this.#_whenUpgraded(scope, () => {
        scope.value = options.scope;
      });
      // Relu par UI.searchmenu() à chaque ouverture du panneau et par search_params()
      rcmail.env.search_scope = options.scope;
    }

    /** @type {?HTMLSelectElement} */
    const filter = rcmail.gui_objects.search_filter
      ? $(rcmail.gui_objects.search_filter)[0]
      : null;

    if (filter && this.#_hasOption(filter, options.filter)) {
      filter.value = options.filter;
      // Synchronise le select web component (SearchFiltersInitializer)
      filter.dispatchEvent(new Event('change'));
    }

    /** @type {?HTMLSelectElement} */
    const interval = document.getElementById('s_interval');
    const intervalDummy = document.getElementById('s-date-dummy');

    if (interval && this.#_hasOption(interval, options.interval)) {
      interval.value = options.interval;
      // Différé comme pour le select de type (SearchFiltersInitializer) : le web component
      // n'applique pas une valeur affectée juste après son initialisation
      if (intervalDummy)
        this.#_whenUpgraded(intervalDummy, () => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              intervalDummy.value = options.interval;
            }, 0);
          });
        });
    }
  }

  /**
   * @param {HTMLSelectElement} select
   * @param {string | undefined} value
   * @returns {boolean}
   */
  #_hasOption(select, value) {
    return (
      typeof value === 'string' &&
      Array.from(select.options).some((option) => option.value === value)
    );
  }

  /**
   * @returns {Record<string, SearchMemoryOptions>}
   */
  #_memory() {
    const memory = rcmail.env[SearchModsMemory.#_ENV_KEY];

    return memory && typeof memory === 'object' && !Array.isArray(memory)
      ? memory
      : {};
  }

  /**
   * Ajoute l'état de la case et les champs cochés aux paramètres de recherche.
   * Ajoutés même sans texte saisi : le core n'envoie `_headers` que si un texte est présent.
   * @returns {void}
   */
  #_patchSearchParams() {
    const original = rcmail.search_params;

    rcmail.search_params = (...args) => {
      // Changement de dossier sans réouverture du panneau : restaurer avant de lire les selects
      if (rcmail.message_list) this.sync();

      const url = original.apply(rcmail, args);

      // Case pas encore chargée pour ce dossier : son état ne le concerne pas, on n'envoie rien.
      if (!rcmail.message_list || url._mbox !== this.#_switchMbox) return url;

      const remember = !!this.#_switch?.checked;
      const mods = rcmail.env.search_mods ?? {};

      url._bnum_remember = remember ? '1' : '0';
      url._bnum_mods = Object.keys(
        mods[rcmail.env.mailbox] ?? mods['*'] ?? {},
      ).join(',');

      this.#_updateMemory(url, remember);

      return url;
    };
  }

  /**
   * Tient à jour `env.bnum_search_memory` sans rechargement.
   * @param {Record<string, string>} url
   * @param {boolean} remember
   * @returns {void}
   */
  #_updateMemory(url, remember) {
    const memory = { ...this.#_memory() };

    if (remember)
      memory[url._mbox] = {
        scope: url._scope,
        filter: url._filter,
        interval: url._interval ?? '',
      };
    else delete memory[url._mbox];

    rcmail.env[SearchModsMemory.#_ENV_KEY] = memory;
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
  /** @type {SearchModsMemory | undefined} */
  #_searchModsMemory;

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
    this.#_searchModsMemory = new SearchModsMemory().init();

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
    const { search, searchButton, filterButton } = this.#_ui;

    if (!search) return this;

    search.addEventListener('bnum-input-search:search', (e) =>
      this.#_onInputSubmit(e),
    );
    search.onclear.push((params) => this.#_onInputClear(params));

    if (searchButton) {
      this.#_bindSearchToggle(search, searchButton);
    }

    filterButton.addEventListener('click', () => this.#_onButtonFilterClick());

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
    if (!this.rcmail().env.search_request) {
      this.#_ui.search.value = '';
      this.#_ui.search.dispatchEvent(new Event('input'));
    }
  }

  #_onButtonFilterClick() {
    // Le dossier courant a pu changer depuis la dernière ouverture du panneau
    this.#_searchModsMemory?.sync?.();

    const currentMbox = this.get_env('mailbox');
    let mboxUid = null;

    if (currentMbox.includes('/')) mboxUid = currentMbox.split('/')[1];
    else mboxUid = this.get_env('username');

    if (typeof mceToRcId === 'function')
      mboxUid = mceToRcId(mboxUid).toLowerCase();

    for (const option of this.#_filterUi.searchFilterDummy.options) {
      if (!option.classList.contains('labels')) continue;

      if (option.classList.contains(mboxUid))
        option.style.display = EMPTY_STRING;
      else option.style.display = 'none';
    }
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
