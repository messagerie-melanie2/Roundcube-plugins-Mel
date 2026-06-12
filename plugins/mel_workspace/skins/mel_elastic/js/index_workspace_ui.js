import { HTMLBnumInputSearch } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { HTMLBnumSegmentedControl } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object.js';
import { BnumPromise } from '../../../../mel_metapage/js/lib/BnumPromise.js';
import { BnumLog } from '../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { pipe } from '../../../../mel_metapage/js/lib/helpers/pipe.js';
import { HTMLTabsElement } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/tabs/HTMLTabElement.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { AIndexWorkspaceUI } from '../../../js/lib/abstract_index_workspace_ui.js';
import { EMode } from './index_workspace_ui.internal/EMode.js';
import { IndexWorkspacePrivateSearchStrategy } from './index_workspace_ui.internal/strategy-private.js';
import { IndexWorkspacePublicSearchStrategy } from './index_workspace_ui.internal/strategy-public.js';
/**
 * Liste des modes de visualisations
 * @enum {string}
 * @package
 */
const EVisuMode = {
  /**
   * Les espaces seront représenter sous forme de cards
   * @type {string}
   * @constant
   * @default 'cards'
   */
  cards: 'cards',
  /**
   * Les espaces seront représenter sous forme de liste
   * @type {string}
   * @constant
   * @default 'list'
   */
  list: 'list',
};

//#region Importants constants
const pluginText = 'mel_workspace';
//#endregion

//#region Utils Functions
function getText(keyText) {
  const helper = ABaseMelObject.Empty();
  return helper.getLocalization(keyText, { plugin: pluginText });
}

/**
 *
 * @returns {{subscribed: string, archived:string, publics: string}}
 */
function getTextsFromModes() {
  const values = {};

  for (const [key, value] of Object.entries(EMode)) {
    values[key] = getText(value);
  }

  return values;
}
//#endregion

//#region constants
const { subscribed, archived, publics } = getTextsFromModes();
/**
 * Si le système d'overflow est actif ou non pour les paneaux
 * @default true
 * @type {boolean}
 * @constant
 * @package
 */
const OVERFLOW_ENABLED = true;
const OVERFLOW_CSS_PROP = 'var(--workspace-panel-overflow-system, auto)';
//#endregion

/**
 * @typedef SearchInterface
 * @property {(params: { busy:boolean }) => void} setBusy
 * @property {BnumEvent<(panel: HTMLElement) => void>} onSearch
 * @property {BnumEvent<(panel: HTMLElement) => void>} afterOnSearch
 */

/**
 * @implements {SearchInterface}
 */
class Search extends MelObject {
  #_lastBusyState = null;
  #_strategiesCache;
  onSearch = new BnumEvent();
  afterOnSearch = new BnumEvent();

  /**
   * @type {{[subscribed]: IndexWorkspacePrivateSearchStrategy, [archived]: IndexWorkspacePrivateSearchStrategy, [publics]: IndexWorkspacePublicSearchStrategy}}
   */
  get #_strategies() {
    if (!this.#_strategiesCache) {
      const strat = {
        [subscribed]: new IndexWorkspacePrivateSearchStrategy(),
        [publics]: new IndexWorkspacePublicSearchStrategy(this),
      };
      strat[archived] = strat[subscribed];
      this.#_strategiesCache = strat;
    }

    return this.#_strategiesCache;
  }

  constructor() {
    super();
    this.onSearch.push((dest) => this.#_setElementLoading(dest));
    this.afterOnSearch.push(() => this.#_stopElementLoading());
  }

  /**
   * @type {?HTMLBnumInputSearch}
   */
  get searchInput() {
    return document.querySelector(
      `${HTMLBnumInputSearch.TAG}#wsp-search-input`,
    );
  }

  get #_searchPanel() {
    return document.getElementById('search-pannel');
  }

  get #_mainPanel() {
    return document.getElementById('main-pannel');
  }

  get #_mainTabs() {
    return document.querySelector('bnum-tabs#main-pannel');
  }

  get value() {
    return this.searchInput?.value ?? EMPTY_STRING;
  }

  setBusy({ busy = true } = {}) {
    if (this.#_lastBusyState === busy) return;

    this.#_lastBusyState = busy;
    if (busy) this.#_setSearchLoading();
    else this.#_stopSearchLoading();
  }

  #_setSearchLoading() {
    this.searchInput?.setLoading?.();
  }

  #_stopSearchLoading() {
    this.searchInput?.stopLoading?.();
  }

  resetSearch() {
    this.#_removeSearchPanel();
    this.#_showMainPanel();

    if (this.searchInput) {
      this.searchInput.value = EMPTY_STRING;
      this.searchInput.focus();
    }
  }

  async search() {
    this.setBusy();

    try {
      if (this.value === EMPTY_STRING) return this.resetSearch();

      this.#_hideMainPanel();
      const mainTabs = this.#_switchTabIfIsArchived();
      this.#_reinitSearchPanel(mainTabs);
      this.#_focusSearchPanelContent();

      const strategy = mainTabs.currentTabText();
      await this.#_strategies[strategy].search(mainTabs, this.value);
    } finally {
      this.setBusy({ busy: false });
    }
  }

  #_removeSearchPanel() {
    const searchPanel = this.#_searchPanel;
    if (searchPanel) searchPanel.remove();
  }

  #_reinitSearchPanel(fromTabs) {
    if (!fromTabs) {
      BnumLog.error(
        'Search/#_reinitSearchPanel',
        'Impossible de trouver les onglets principaux !',
        fromTabs,
        this,
      );
      return null;
    }
    this.#_removeSearchPanel();
    this.#_createSearchPanel(fromTabs);
  }

  #_createSearchPanel(fromTabs) {
    const panel = this.#_generateTabs(fromTabs);
    this.#_appendSearchPanelToParentContainer(fromTabs, panel);
  }

  #_appendSearchPanelToParentContainer(fromTabs, panel) {
    fromTabs.parentElement.appendChild(panel);
  }

  #_generateTabs(fromTabs) {
    const tab = document.createElement('bnum-tabs');

    tab.setAttribute('data-navs', fromTabs.getCurrentTabId());
    tab.setAttribute('data-ex-label', 'mel_workspace');
    tab.setAttribute(
      'data-description',
      'Contient le résultat de la recherche',
    );
    tab.setAttribute('data-shadow', false);
    tab.setAttribute('id', 'search-pannel');

    tab.appendChild(this.#_generateTabContainer(fromTabs));

    return tab;
  }

  #_generateTabContainer(fromTabs) {
    const isPublics = fromTabs.currentTabText() === publics;
    const div = document.createElement(
      isPublics ? 'bnum-infinite-scroll-container' : 'div',
    );

    div.classList.add('workspace-list', 'mel-focus');
    div.setAttribute('data-linked-to', fromTabs.getCurrentTabId());

    if (isPublics) div.setAttribute('data-pagecount', 0);

    return div;
  }

  #_switchTabIfIsArchived() {
    const mainTabs = this.#_mainTabs;
    if (!mainTabs) {
      BnumLog.error(
        'Search/#_switchTabIfIsArchived',
        'Impossible de trouver les onglets principaux !',
        mainTabs,
        this,
      );
      return null;
    }

    if (mainTabs.currentTabText() === archived)
      mainTabs.selectTab(EMode.subscribed);

    return mainTabs;
  }

  #_setMainPanelDisplay(display) {
    if (this.#_mainPanel) this.#_mainPanel.style.display = display;
    else
      BnumLog.error(
        'Search/#_setMainPanelDisplay',
        'Impossible de trouver le panneau principal !',
        this.#_mainPanel,
        display,
        this,
      );
  }

  #_focusSearchPanelContent() {
    this.#_searchPanel?.focus?.();
  }

  #_showMainPanel() {
    const VISIBLE = EMPTY_STRING;
    this.#_setMainPanelDisplay(VISIBLE);
  }

  #_hideMainPanel() {
    const HIDDEN = 'none';
    this.#_setMainPanelDisplay(HIDDEN);
  }

  #_clearAndSetHtml(dest, target) {
    dest.innerHTML = EMPTY_STRING;
    dest.appendChild(target);
  }

  /**
   *
   * @param {HTMLElement} dest
   */
  #_setElementLoading(dest) {
    const LOADER_ID = 'generatedsearchwsp';
    const loader = this.#_generateLoader({
      id: LOADER_ID,
      absoluteCentered: true,
    });
    this.#_clearAndSetHtml(dest, loader);
  }

  #_stopElementLoading() {
    const LOADER_ID = 'generatedsearchwsp';
    const loader = document.getElementById(LOADER_ID);
    loader?.remove?.();
  }

  /**
   *
   * @param {Object} param0
   * @param {string} param0.id
   * @param {boolean} param0.absoluteCentered
   * @returns {HTMLElement}
   */
  #_generateLoader({ id, absoluteCentered }) {
    const jqueryLoader = this.generate_loader(id, absoluteCentered).generate();
    const domLoader = jqueryLoader[0];

    return domLoader;
  }
}

class IndexWorkspaceUI extends AIndexWorkspaceUI {
  #_searchObject = new Search();

  /**
   * @type {HTMLBnumSegmentedControl}
   */
  get #_segmentedControl() {
    return document.querySelector(
      `${HTMLBnumSegmentedControl.TAG}#control-view`,
    );
  }

  get #_workspaceLists() {
    return document.querySelectorAll('.workspace-list');
  }

  //#region Actions
  async _p_initVueMode() {
    await BnumPromise.Resolved();
  }

  _p_listenSearch() {
    this.#_searchObject.searchInput.addEventListener('change', () =>
      this.#_search(),
    );
  }

  _p_listenSearchReset() {
    this.#_searchObject.searchInput.addEventListener(
      'bnum-input-search:clear',
      () => this.#_resetSearch(),
    );
  }

  _p_listenModeChanged(connector) {
    if (this.#_segmentedControl)
      this.#_segmentedControl.addEventListener(
        'bnum-segmented-control:change',
        this.#_handleModeChanged.bind(this, connector),
      );
    else
      BnumLog.error(
        'IndexWorkspaceUI/_p_listenModeChanged',
        'Impossible de trouver le control !',
        this.#_segmentedControl,
        connector,
        this,
      );
  }

  _p_afterStart() {
    this.#_setOverflowIfEnabled();

    window.addEventListener('resize', () => this.#_onResize());

    this.#_onResize();
  }
  //#endregion Actions

  #_search() {
    this.#_searchObject.search();
    this.onAfterSearch.call();
    this.#_onResize();
  }

  #_resetSearch() {
    this.#_searchObject.resetSearch();
    this.onAfterSearch.call();
    this.#_onResize();
  }

  /**
   *
   * @param {HTMLElement} element
   */
  #_setOverflow(element) {
    element.parentElement.style.overflow = OVERFLOW_CSS_PROP;
  }

  #_setOverflowIfEnabled() {
    if (OVERFLOW_ENABLED) {
      for (const list of this.#_workspaceLists) {
        this.#_setOverflow(list);
      }
    }
  }

  /**
   * @param {NodeListOf<HTMLElement> | HTMLElement} listOfElements
   */
  #_getHeight(listOrNode) {
    if (!listOrNode) {
      BnumLog.warning(
        '#_getHeight',
        "La node n'éxiste pas ! La hauteur sera donc 0 !",
      );
      return 0;
    }

    if (listOrNode instanceof HTMLElement)
      return this.#_getElementHeight(listOrNode);
    else return this.#_getListOfElementsHeight(listOrNode);
  }

  /**
   *
   * @param {HTMLElement} element
   */
  #_getElementHeight(element) {
    return element.getBoundingClientRect().height;
  }

  /**
   *
   * @param {NodeListOf<HTMLElement>} elements
   */
  #_getListOfElementsHeight(elements) {
    let numbers = 0;

    for (const element of elements) {
      numbers += this.#_getElementHeight(element);
    }

    return numbers;
  }

  #_onResize() {
    this.#_bodiesResize();
    this.#_containerResize();
  }

  #_calulateHeight() {
    const CORRECTION = 0;
    const height = this.#_getHeight(document.getElementById('layout-content')); //$('#layout-content').height();
    const headerHeight = this.#_getHeight(
      document.querySelectorAll('.wsp-header'),
    );
    return height - (headerHeight + CORRECTION);
  }

  #_updateBodiesSize(newSize) {
    const bodies = document.querySelectorAll('.body');

    for (const body of bodies) {
      body.style.height = `${newSize}px`;
    }
  }

  #_bodiesResize() {
    const h = this.#_calulateHeight();
    this.#_updateBodiesSize(h);
  }

  #_containerResize() {
    for (const tab of document.querySelectorAll('bnum-tabs')) {
      const h = this.#_calculateTabHeigth(tab);

      if (this.#_hasContainer(tab)) this.#_updateContainerHeight(tab, h);
      else this.#_updateNotContainerHeight(tab, h);
    }
  }

  /**
   *
   * @param {HTMLElement} tab
   */
  #_hasContainer(tab) {
    return tab.firstElementChild?.nodeName === 'DIV';
  }

  /**
   *
   * @param {HTMLElement} tab
   */
  #_updateContainerHeight(tab, h) {
    pipe(tab, (x) => {
      this.#_updateHeight(x, EMPTY_STRING);
      return x;
    })
      .pipe((x) => x.querySelectorAll('.workspace-list'))
      .pipe((lst) => this.#_updateHeight(lst, h));
  }

  #_updateNotContainerHeight(tab, h) {
    const lst = tab.querySelectorAll('.workspace-list');
    this.#_updateHeight(lst, h);
  }

  /**
   *
   * @param {NodeListOf<HTMLElement>} elements
   */
  #_updateHeight(elements, h) {
    for (const element of elements) {
      element.style.height = h;
    }
  }

  #_calculateTabHeigth(tab) {
    const tabsH = pipe(tab, this.#_findtabLists.bind(this))
      .pipe(this.#_getHeight.bind(this))
      .unpipe();
    const panelH = pipe(tab, this.#_findHeaderPanel.bind(this))
      .pipe(this.#_getHeight.bind(this))
      .unpipe();
    const tabH = this.#_getHeight(tab);

    return tabH - tabsH - panelH;
  }

  #_findtabLists(tab) {
    return tab.querySelectorAll('[role="tablist"]');
  }

  #_findHeaderPanel(tab) {
    return tab.querySelectorAll('.header-pannel');
  }

  #_getModeFromEvent(e) {
    return e.detail.value;
  }
  #_handleModeChanged(connector, e) {
    const CLASS_MODE_LIST = 'mode-list';
    const mode = this.#_getModeFromEvent(e);
    this._p_startConnector(connector, { _mode: mode });

    const control = document.querySelector(HTMLTabsElement.TAG);

    if (control) {
      if (mode === EVisuMode.cards) control.classList.remove(CLASS_MODE_LIST);
      else control.classList.add(CLASS_MODE_LIST);
    } else
      BnumLog.error(
        'IndexWorkspaceUi/#_handleModeChanged',
        `Impossible de trouver ${HTMLTabsElement.TAG}`,
        control,
        mode,
        this,
      );
  }
}

ABaseMelObject.Empty().listen('mel_workspace.index.register_ui', (params) => {
  const { registerFunction } = params;
  registerFunction(IndexWorkspaceUI);
});
