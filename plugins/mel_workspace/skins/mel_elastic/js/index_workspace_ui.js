import { HTMLBnumInputSearch } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum';
import { HTMLBnumSegmentedControl } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum';
import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object';
import { BnumPromise } from '../../../../mel_metapage/js/lib/BnumPromise';
import { BnumLog } from '../../../../mel_metapage/js/lib/classes/bnum_log';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants';
import { HTMLTabsElement } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/tabs/HTMLTabElement';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object';
import { AIndexWorkspaceUI } from '../../../js/lib/abstract_index_workspace_ui';
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

/**
 * Liste des différents type de d'onglets
 * @enum {string}
 * @package
 */
const EMode = {
  /**
   * Onglet qui contient les espaces de l'utilisateur
   * @type {string}
   * @constant
   * @default 'subscribed'
   */
  subscribed: 'subscribed',
  /**
   * Onglet qui contient les espaces archivés de l'utilisateur
   * @type {string}
   * @constant
   * @default 'archived'
   */
  archived: 'archived',
  /**
   * Onglet qui contient les espaces publics
   * @type {string}
   * @constant
   * @default 'publics'
   */
  publics: 'publics',
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
  onSearch = new BnumEvent();
  afterOnSearch = new BnumEvent();

  constructor() {
    super();
    this.onSearch.push((dest) => this.#_setElementLoading(dest));
    this.afterOnSearch.push(() => this.#_stopElementLoading());
  }

  /**
   * @type {?HTMLBnumInputSearch}
   */
  get #_searchInput() {
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
    return this.#_searchInput?.value ?? EMPTY_STRING;
  }

  setBusy({ busy = true } = {}) {
    if (this.#_lastBusyState === busy) return;

    this.#_lastBusyState = busy;
    if (busy) this.#_setSearchLoading();
    else this.#_stopSearchLoading();
  }

  #_setSearchLoading() {
    this.#_searchInput?.setLoading?.();
  }

  #_stopSearchLoading() {
    this.#_searchInput?.stopLoading?.();
  }

  resetSearch() {}

  search() {
    this.setBusy();

    if (this.value === EMPTY_STRING) return this.resetSearch();

    this.#_hideMainPanel();
    const mainTabs = this.#_switchTabIfIsArchived();
    this.#_reinitSearchPanel(mainTabs);
    this.#_focusSearchPanelContent();

    switch (mainTabs.currentTabText()) {
      case subscribed:
      case archived:
        this._mine_search(mainTabs, searchValue);
        break;

      default:
        this._public_search(searchValue);
        break;
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
  /**
   * @type {HTMLBnumSegmentedControl}
   */
  get #_segmentedControl() {
    return document.querySelector(
      `${HTMLBnumSegmentedControl.TAG}#control-view`,
    );
  }

  async _p_initVueMode() {
    await BnumPromise.Resolved();
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
