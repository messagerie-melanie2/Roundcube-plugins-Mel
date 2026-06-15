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
 * Modes de visualisation disponibles pour les espaces de travail.
 *
 * @enum {string}
 * @package
 */
const EVisuMode = {
  /**
   * Les espaces sont affichés sous forme de cartes.
   *
   * @type {string}
   * @constant
   * @default 'cards'
   */
  cards: 'cards',
  /**
   * Les espaces sont affichés sous forme de liste.
   *
   * @type {string}
   * @constant
   * @default 'list'
   */
  list: 'list',
};

//#region Importants constants
/** @private */
const pluginText = 'mel_workspace';
//#endregion

//#region Utils Functions
/**
 * Récupère la traduction d'une clé de localisation dans le plugin `mel_workspace`.
 *
 * @param {string} keyText - Clé de localisation à traduire.
 * @returns {string} Texte traduit correspondant à la clé.
 * @private
 */
function getText(keyText) {
  const helper = ABaseMelObject.Empty();
  return helper.getLocalization(keyText, { plugin: pluginText });
}

/**
 * Retourne les textes traduits associés à chaque valeur de {@link EMode}.
 *
 * @returns {{subscribed: string, archived: string, publics: string}} Map clé/texte pour chaque mode.
 * @private
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
 * Active ou désactive le système d'overflow sur les panneaux de la liste d'espaces.
 *
 * @type {boolean}
 * @constant
 * @default true
 * @package
 */
const OVERFLOW_ENABLED = true;

/**
 * Valeur CSS appliquée à la propriété `overflow` des conteneurs de listes
 * lorsque {@link OVERFLOW_ENABLED} est actif.
 *
 * @type {string}
 * @constant
 * @private
 */
const OVERFLOW_CSS_PROP = 'var(--workspace-panel-overflow-system, auto)';
//#endregion

/**
 * Interface décrivant le contrat minimal d'un objet de recherche.
 *
 * @typedef {Object} SearchInterface
 * @property {(params: { busy: boolean }) => void} setBusy - Définit l'état occupé de la recherche.
 * @property {BnumEvent<(panel: HTMLElement) => void>} onSearch - Événement déclenché au lancement d'une recherche.
 * @property {BnumEvent<(panel: HTMLElement) => void>} afterOnSearch - Événement déclenché après la fin d'une recherche.
 */

/**
 * Gère la recherche d'espaces de travail dans l'index.
 *
 * Orchestre l'affichage du panneau de résultats, le cycle de chargement
 * du champ de saisie et la délégation aux stratégies par mode
 * ({@link IndexWorkspacePrivateSearchStrategy}, {@link IndexWorkspacePublicSearchStrategy}).
 *
 * @implements {SearchInterface}
 * @extends MelObject
 */
class Search extends MelObject {
  /**
   * Dernier état de chargement appliqué, pour éviter les appels redondants.
   * `null` avant le premier appel à {@link Search#setBusy}.
   *
   * @type {boolean|null}
   * @private
   */
  #_lastBusyState = null;

  /**
   * Cache des stratégies de recherche indexées par texte d'onglet traduit.
   * Les modes `subscribed` et `archived` partagent la même instance de stratégie privée.
   *
   * @type {{[key: string]: IndexWorkspacePrivateSearchStrategy|IndexWorkspacePublicSearchStrategy}|undefined}
   * @private
   */
  #_strategiesCache;

  /**
   * Événement déclenché au début d'une recherche, avec le panneau cible en argument.
   *
   * @type {BnumEvent<(panel: HTMLElement) => void>}
   */
  onSearch = new BnumEvent();

  /**
   * Événement déclenché après la fin d'une recherche.
   *
   * @type {BnumEvent<() => void>}
   */
  afterOnSearch = new BnumEvent();

  /**
   * Stratégies de recherche indexées par texte d'onglet.
   *
   * @type {{[subscribed]: IndexWorkspacePrivateSearchStrategy, [archived]: IndexWorkspacePrivateSearchStrategy, [publics]: IndexWorkspacePublicSearchStrategy}}
   * @private
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

  /**
   * Crée l'instance et abonne les gestionnaires de chargement
   * aux événements {@link Search#onSearch} et {@link Search#afterOnSearch}.
   */
  constructor() {
    super();
    this.onSearch.push((dest) => this.#_setElementLoading(dest));
    this.afterOnSearch.push(() => this.#_stopElementLoading());
  }

  /**
   * Champ de saisie de recherche dans le DOM.
   *
   * @type {HTMLBnumInputSearch|null}
   */
  get searchInput() {
    return document.querySelector(
      `${HTMLBnumInputSearch.TAG}#wsp-search-input`,
    );
  }

  /**
   * Panneau affichant les résultats de la recherche.
   *
   * @type {HTMLElement|null}
   * @private
   */
  get #_searchPanel() {
    return document.getElementById('search-pannel');
  }

  /**
   * Panneau principal de la liste des espaces.
   *
   * @type {HTMLElement|null}
   * @private
   */
  get #_mainPanel() {
    return document.getElementById('main-pannel');
  }

  /**
   * Composant `bnum-tabs` principal de la page.
   *
   * @type {HTMLElement|null}
   * @private
   */
  get #_mainTabs() {
    return document.querySelector('bnum-tabs#main-pannel');
  }

  /**
   * Valeur courante du champ de recherche.
   * Vaut {@link EMPTY_STRING} si le champ est absent du DOM.
   *
   * @type {string}
   */
  get value() {
    return this.searchInput?.value ?? EMPTY_STRING;
  }

  /**
   * Définit l'état occupé du champ de recherche.
   *
   * Sans effet si l'état demandé est identique au dernier état appliqué.
   *
   * @param {Object} [params]
   * @param {boolean} [params.busy=true] - `true` pour afficher le chargement, `false` pour l'arrêter.
   */
  setBusy({ busy = true } = {}) {
    if (this.#_lastBusyState === busy) return;

    this.#_lastBusyState = busy;
    if (busy) this.#_setSearchLoading();
    else this.#_stopSearchLoading();
  }

  /**
   * Active l'indicateur de chargement sur le champ de recherche.
   *
   * @private
   */
  #_setSearchLoading() {
    this.searchInput?.setLoading?.();
  }

  /**
   * Désactive l'indicateur de chargement sur le champ de recherche.
   *
   * @private
   */
  #_stopSearchLoading() {
    this.searchInput?.stopLoading?.();
  }

  /**
   * Réinitialise l'interface de recherche : supprime le panneau de résultats,
   * réaffiche le panneau principal et remet le focus sur le champ de saisie.
   */
  resetSearch() {
    this.#_removeSearchPanel();
    this.#_showMainPanel();

    if (this.searchInput) {
      this.searchInput.value = EMPTY_STRING;
      this.searchInput.focus();
    }
  }

  /**
   * Exécute la recherche pour la valeur courante du champ de saisie.
   *
   * Si la valeur est vide, appelle {@link Search#resetSearch}.
   * Délègue la logique de résultats à la stratégie correspondant à l'onglet actif.
   * L'état occupé est toujours désactivé en sortie, qu'une erreur survienne ou non.
   *
   * @returns {Promise<void>}
   */
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

  /**
   * Supprime le panneau de résultats de recherche du DOM s'il existe.
   *
   * @private
   */
  #_removeSearchPanel() {
    const searchPanel = this.#_searchPanel;
    if (searchPanel) searchPanel.remove();
  }

  /**
   * Réinitialise le panneau de résultats : supprime l'ancien et en crée un nouveau.
   *
   * Consigne une erreur via {@link BnumLog.error} si `fromTabs` est invalide.
   *
   * @param {HTMLElement|null} fromTabs - Composant onglets source pour la construction du panneau.
   * @returns {void}
   * @private
   */
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

  /**
   * Crée et insère le panneau de résultats dans le DOM.
   *
   * @param {HTMLElement} fromTabs - Composant onglets de référence.
   * @private
   */
  #_createSearchPanel(fromTabs) {
    const panel = this.#_generateTabs(fromTabs);
    this.#_appendSearchPanelToParentContainer(fromTabs, panel);
  }

  /**
   * Insère le panneau de résultats comme enfant du conteneur parent des onglets.
   *
   * @param {HTMLElement} fromTabs - Composant onglets de référence.
   * @param {HTMLElement} panel - Panneau de résultats à insérer.
   * @private
   */
  #_appendSearchPanelToParentContainer(fromTabs, panel) {
    fromTabs.parentElement.appendChild(panel);
  }

  /**
   * Génère l'élément `bnum-tabs` constituant le panneau de résultats.
   *
   * @param {HTMLElement} fromTabs - Composant onglets source pour récupérer l'onglet courant.
   * @returns {HTMLElement} L'élément `bnum-tabs` configuré.
   * @private
   */
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

  /**
   * Génère le conteneur de contenu du panneau de résultats.
   *
   * Utilise un `bnum-infinite-scroll-container` pour le mode public,
   * ou une `div` simple pour les autres modes.
   *
   * @param {HTMLElement} fromTabs - Composant onglets source pour détecter le mode actif.
   * @returns {HTMLElement} Le conteneur de contenu configuré.
   * @private
   */
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

  /**
   * Si l'onglet actif est `archived`, bascule vers `subscribed` avant la recherche.
   *
   * Le mode archivé ne supporte pas la recherche directe.
   * Consigne une erreur si le composant onglets est introuvable.
   *
   * @returns {HTMLElement|null} Le composant onglets après le basculement éventuel.
   * @private
   */
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

  /**
   * Applique une valeur CSS `display` au panneau principal.
   *
   * Consigne une erreur si le panneau est introuvable.
   *
   * @param {string} display - Valeur CSS à appliquer (ex. `'none'` ou `''`).
   * @private
   */
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

  /**
   * Déplace le focus sur le contenu du panneau de résultats.
   *
   * @private
   */
  #_focusSearchPanelContent() {
    this.#_searchPanel?.focus?.();
  }

  /**
   * Rend le panneau principal visible en réinitialisant son `display`.
   *
   * @private
   */
  #_showMainPanel() {
    const VISIBLE = EMPTY_STRING;
    this.#_setMainPanelDisplay(VISIBLE);
  }

  /**
   * Masque le panneau principal via `display: none`.
   *
   * @private
   */
  #_hideMainPanel() {
    const HIDDEN = 'none';
    this.#_setMainPanelDisplay(HIDDEN);
  }

  /**
   * Vide le contenu HTML d'un élément et y insère un nouveau nœud.
   *
   * @param {HTMLElement} dest - Élément cible à vider.
   * @param {HTMLElement} target - Nœud à insérer.
   * @private
   */
  #_clearAndSetHtml(dest, target) {
    dest.innerHTML = EMPTY_STRING;
    dest.appendChild(target);
  }

  /**
   * Insère un indicateur de chargement centré dans un élément cible.
   *
   * @param {HTMLElement} dest - Élément dans lequel afficher le chargement.
   * @private
   */
  #_setElementLoading(dest) {
    const LOADER_ID = 'generatedsearchwsp';
    const loader = this.#_generateLoader({
      id: LOADER_ID,
      absoluteCentered: true,
    });
    this.#_clearAndSetHtml(dest, loader);
  }

  /**
   * Supprime l'indicateur de chargement généré par {@link Search##_setElementLoading}.
   *
   * @private
   */
  #_stopElementLoading() {
    const LOADER_ID = 'generatedsearchwsp';
    const loader = document.getElementById(LOADER_ID);
    loader?.remove?.();
  }

  /**
   * Génère un indicateur de chargement et le retourne comme nœud DOM natif.
   *
   * @param {Object} param0
   * @param {string} param0.id - Identifiant HTML à attribuer au loader.
   * @param {boolean} param0.absoluteCentered - Si `true`, le loader est positionné en centrage absolu.
   * @returns {HTMLElement} L'élément DOM du loader.
   * @private
   */
  #_generateLoader({ id, absoluteCentered }) {
    const jqueryLoader = this.generate_loader(id, absoluteCentered).generate();
    const domLoader = jqueryLoader[0];

    return domLoader;
  }
}

/**
 * Implémentation de l'UI de l'index Workspace pour le skin bnum.
 *
 * Gère le contrôle segmenté de changement de mode de visualisation,
 * la recherche via {@link Search} et l'ajustement dynamique des hauteurs
 * des panneaux lors des redimensionnements de fenêtre.
 *
 * Se déclare auprès d'{@link IndexWorkspace} en répondant à l'événement
 * `mel_workspace.index.register_ui`.
 *
 * @extends AIndexWorkspaceUI
 */
class IndexWorkspaceUI extends AIndexWorkspaceUI {
  /**
   * Instance de gestion de la recherche.
   *
   * @type {Search}
   * @private
   */
  #_searchObject = new Search();

  /**
   * Contrôle segmenté permettant de basculer entre les modes de visualisation.
   *
   * @type {HTMLBnumSegmentedControl|null}
   * @private
   */
  get #_segmentedControl() {
    return document.querySelector(
      `${HTMLBnumSegmentedControl.TAG}#control-view`,
    );
  }

  /**
   * Ensemble des listes d'espaces présentes dans le DOM.
   *
   * @type {NodeListOf<HTMLElement>}
   * @private
   */
  get #_workspaceLists() {
    return document.querySelectorAll('.workspace-list');
  }

  get #_btnCreate() {
    return document.getElementById('create-edt');
  }

  //#region Actions

  /**
   * Initialisation du mode de visualisation pour le skin bnum.
   *
   * Aucune action requise : le mode initial est géré côté serveur.
   *
   * @returns {Promise<void>}
   * @override
   * @protected
   */
  async _p_initVueMode() {
    await BnumPromise.Resolved();
  }

  /**
   * Abonne le champ de recherche à l'événement `change`
   * pour déclencher {@link IndexWorkspaceUI##_search}.
   *
   * @override
   * @protected
   */
  _p_listenSearch() {
    this.#_searchObject.searchInput.addEventListener('change', () =>
      this.#_search(),
    );
  }

  /**
   * Abonne le champ de recherche à l'événement `bnum-input-search:clear`
   * pour déclencher {@link IndexWorkspaceUI##_resetSearch}.
   *
   * @override
   * @protected
   */
  _p_listenSearchReset() {
    this.#_searchObject.searchInput.addEventListener(
      'bnum-input-search:clear',
      () => this.#_resetSearch(),
    );
  }

  /**
   * Abonne le contrôle segmenté à l'événement `bnum-segmented-control:change`
   * pour déclencher {@link IndexWorkspaceUI##_handleModeChanged}.
   *
   * Consigne une erreur si le contrôle segmenté est introuvable dans le DOM.
   *
   * @param {object} connector - Connecteur à transmettre au gestionnaire de changement de mode.
   * @override
   * @protected
   */
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

  /**
   * Abonne le bouton, si il existe.
   *
   * @override
   * @protected
   */
  _p_listenCreateButton() {
    const btn = this.#_btnCreate;

    if (btn) btn.addEventListener('click', () => this.#_handleClick());
    else
      BnumLog.error(
        'IndexWorkspaceUI/_p_listenCreateButton',
        'Impossible de trouver le bouton !',
        btn,
        this,
      );
  }

  /**
   * Finalise le démarrage de l'UI : active le système d'overflow,
   * abonne le redimensionnement de fenêtre et applique un premier calcul de hauteur.
   *
   * @override
   * @protected
   */
  _p_afterStart() {
    this.#_setOverflowIfEnabled();

    window.addEventListener('resize', () => this.#_onResize());

    this.#_onResize();
  }

  //#endregion Actions

  /**
   * Déclenche la recherche, notifie l'événement `onAfterSearch`
   * et recalcule les hauteurs des panneaux.
   *
   * @private
   */
  #_search() {
    this.#_searchObject.search();
    this.onAfterSearch.call();
    this.#_onResize();
  }

  /**
   * Réinitialise la recherche, notifie l'événement `onAfterSearch`
   * et recalcule les hauteurs des panneaux.
   *
   * @private
   */
  #_resetSearch() {
    this.#_searchObject.resetSearch();
    this.onAfterSearch.call();
    this.#_onResize();
  }

  /**
   * Applique la valeur d'overflow CSS définie par {@link OVERFLOW_CSS_PROP}
   * au parent d'un élément de liste.
   *
   * @param {HTMLElement} element - Élément de liste dont le parent reçoit l'overflow.
   * @private
   */
  #_setOverflow(element) {
    element.parentElement.style.overflow = OVERFLOW_CSS_PROP;
  }

  /**
   * Applique l'overflow sur toutes les listes d'espaces
   * si {@link OVERFLOW_ENABLED} est actif.
   *
   * @private
   */
  #_setOverflowIfEnabled() {
    if (OVERFLOW_ENABLED) {
      for (const list of this.#_workspaceLists) {
        this.#_setOverflow(list);
      }
    }
  }

  /**
   * Action au click du bouton créer un espace
   *
   * @private
   */
  #_handleClick() {
    this.#_startCreateWorkspace();
  }

  /**
   * Démarre la modale de création d'un edt
   *
   * @private
   */
  #_startCreateWorkspace() {
    top?.m_mp_Create?.();
    top?.m_mp_createworkspace?.();
  }

  /**
   * Retourne la hauteur en pixels d'un élément ou de l'ensemble d'une liste d'éléments.
   *
   * Retourne `0` si l'argument est `null` ou `undefined` et consigne un avertissement.
   *
   * @param {NodeListOf<HTMLElement>|HTMLElement} listOrNode - Élément ou liste d'éléments à mesurer.
   * @returns {number} Hauteur totale en pixels.
   * @private
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
   * Retourne la hauteur en pixels d'un élément DOM via `getBoundingClientRect`.
   *
   * @param {HTMLElement} element - Élément à mesurer.
   * @returns {number} Hauteur en pixels.
   * @private
   */
  #_getElementHeight(element) {
    return element.getBoundingClientRect().height;
  }

  /**
   * Retourne la somme des hauteurs de tous les éléments d'une `NodeList`.
   *
   * @param {NodeListOf<HTMLElement>} elements - Liste d'éléments à mesurer.
   * @returns {number} Hauteur cumulée en pixels.
   * @private
   */
  #_getListOfElementsHeight(elements) {
    let numbers = 0;

    for (const element of elements) {
      numbers += this.#_getElementHeight(element);
    }

    return numbers;
  }

  /**
   * Recalcule et applique les hauteurs des panneaux de contenu
   * et des conteneurs d'onglets.
   *
   * @private
   */
  #_onResize() {
    this.#_bodiesResize();
    this.#_containerResize();
  }

  /**
   * Calcule la hauteur disponible pour les panneaux de contenu.
   *
   * Soustrait la hauteur cumulée des en-têtes `.wsp-header` à la hauteur
   * totale de `#layout-content`.
   *
   * @returns {number} Hauteur disponible en pixels.
   * @private
   */
  #_calulateHeight() {
    const CORRECTION = 0;
    const height = this.#_getHeight(document.getElementById('layout-content'));
    const headerHeight = this.#_getHeight(
      document.querySelectorAll('.wsp-header'),
    );
    return height - (headerHeight + CORRECTION);
  }

  /**
   * Applique une hauteur donnée à tous les éléments `.body` du DOM.
   *
   * @param {number} newSize - Hauteur en pixels à appliquer.
   * @private
   */
  #_updateBodiesSize(newSize) {
    const bodies = document.querySelectorAll('.body');

    for (const body of bodies) {
      body.style.height = `${newSize}px`;
    }
  }

  /**
   * Calcule la hauteur disponible et l'applique à tous les éléments `.body`.
   *
   * @private
   */
  #_bodiesResize() {
    const h = this.#_calulateHeight();
    this.#_updateBodiesSize(h);
  }

  /**
   * Recalcule et applique la hauteur des listes `.workspace-list`
   * pour chaque composant `bnum-tabs` présent dans le DOM.
   *
   * @private
   */
  #_containerResize() {
    for (const tab of document.querySelectorAll('bnum-tabs')) {
      const h = this.#_calculateTabHeigth(tab);

      if (this.#_hasContainer(tab)) this.#_updateContainerHeight(tab, h);
      else this.#_updateNotContainerHeight(tab, h);
    }
  }

  /**
   * Détermine si le premier enfant direct du composant onglets est une `DIV` conteneur.
   *
   * @param {HTMLElement} tab - Composant `bnum-tabs` à inspecter.
   * @returns {boolean} `true` si le premier enfant est une `DIV`.
   * @private
   */
  #_hasContainer(tab) {
    return tab.firstElementChild?.nodeName === 'DIV';
  }

  /**
   * Met à jour la hauteur des listes `.workspace-list` dans un onglet avec conteneur DIV.
   *
   * Réinitialise d'abord la hauteur de l'onglet lui-même avant d'appliquer
   * la hauteur calculée aux listes enfants.
   *
   * @param {HTMLElement} tab - Composant `bnum-tabs` cible.
   * @param {number} h - Hauteur en pixels à appliquer aux listes.
   * @private
   */
  #_updateContainerHeight(tab, h) {
    pipe(tab, (x) => {
      this.#_updateHeight(x, EMPTY_STRING);
      return x;
    })
      .pipe((x) => x.querySelectorAll('.workspace-list'))
      .pipe((lst) => this.#_updateHeight(lst, h));
  }

  /**
   * Met à jour la hauteur des listes `.workspace-list` dans un onglet sans conteneur DIV.
   *
   * @param {HTMLElement} tab - Composant `bnum-tabs` cible.
   * @param {number} h - Hauteur en pixels à appliquer aux listes.
   * @private
   */
  #_updateNotContainerHeight(tab, h) {
    const lst = tab.querySelectorAll('.workspace-list');
    this.#_updateHeight(lst, h);
  }

  /**
   * Applique une valeur de hauteur CSS à chaque élément d'une `NodeList`.
   *
   * @param {NodeListOf<HTMLElement>} elements - Éléments à redimensionner.
   * @param {number|string} h - Valeur CSS de hauteur à appliquer (pixels ou chaîne vide pour reset).
   * @private
   */
  #_updateHeight(elements, h) {
    for (const element of elements) {
      element.style.height = h;
    }
  }

  /**
   * Calcule la hauteur disponible pour les listes d'un composant `bnum-tabs`.
   *
   * Soustrait la hauteur des éléments `[role="tablist"]` et `.header-pannel`
   * à la hauteur totale de l'onglet.
   *
   * @param {HTMLElement} tab - Composant `bnum-tabs` à mesurer.
   * @returns {number} Hauteur disponible en pixels.
   * @private
   */
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

  /**
   * Retourne les éléments `[role="tablist"]` enfants d'un composant `bnum-tabs`.
   *
   * @param {HTMLElement} tab - Composant `bnum-tabs` à inspecter.
   * @returns {NodeListOf<HTMLElement>} Liste des éléments tablist.
   * @private
   */
  #_findtabLists(tab) {
    return tab.querySelectorAll('[role="tablist"]');
  }

  /**
   * Retourne les éléments `.header-pannel` enfants d'un composant `bnum-tabs`.
   *
   * @param {HTMLElement} tab - Composant `bnum-tabs` à inspecter.
   * @returns {NodeListOf<HTMLElement>} Liste des éléments d'en-tête de panneau.
   * @private
   */
  #_findHeaderPanel(tab) {
    return tab.querySelectorAll('.header-pannel');
  }

  /**
   * Extrait la valeur du mode de visualisation depuis un événement de changement.
   *
   * @param {CustomEvent} e - Événement `bnum-segmented-control:change`.
   * @returns {string} Valeur du mode sélectionné (cf. {@link EVisuMode}).
   * @private
   */
  #_getModeFromEvent(e) {
    return e.detail.value;
  }

  /**
   * Gère le changement de mode de visualisation déclenché par le contrôle segmenté.
   *
   * Notifie le serveur via le connecteur, puis applique ou retire la classe
   * `mode-list` sur le composant {@link HTMLTabsElement} pour piloter l'affichage CSS.
   * Consigne une erreur si le composant {@link HTMLTabsElement} est introuvable.
   *
   * @param {object} connector - Connecteur serveur pour persister le mode sélectionné.
   * @param {CustomEvent} e - Événement `bnum-segmented-control:change`.
   * @private
   */
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

/**
 * Déclare {@link IndexWorkspaceUI} comme implémentation active de l'UI Workspace
 * en répondant à l'événement `mel_workspace.index.register_ui`
 * émis par {@link IndexWorkspace}.
 */
ABaseMelObject.Empty().listen('mel_workspace.index.register_ui', (params) => {
  const { registerFunction } = params;
  registerFunction(IndexWorkspaceUI);
});
