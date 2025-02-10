import { Random } from '../../../../classes/random.js';
import { EMPTY_STRING } from '../../../../constants/constants.js';
import { BnumEvent } from '../../../../mel_events.js';
import {
  BnumHtmlSrOnly,
  EWebComponentMode,
  HtmlCustomDataTag,
  HtmlCustomTag,
} from '../js_html_base_web_elements.js';
import { HTMLWrapperElement } from '../wrapper.js';
import {
  HTMLTabContainer,
  HTMLTabReceiver,
} from './HTMLTabContainerAndReceiver';

export { HTMLTabsElement };

/**
 * @class
 * @classdesc Représente et gère une navigation par onglet.
 * @extends HtmlCustomDataTag
 * */
class HTMLTabsElement extends HtmlCustomDataTag {
  #_initialized = false;
  /**
   * Utilise 3 data :
   *
   * navs => Liste des onglets, séparé par une virgule.
   *
   * ex-label => Informations supplémentaires de localisation
   *
   * description => Description brève de la liste d'onglet
   *
   * Pour le contenu, utilisez `data-linked-to=tab` avec tab qui est un des onglets défini dans `data-navs`.
   *
   * Il y a 1 évènement qui s'utilise soit en jquery soit en NodeElement.
   *
   * Lorsqu'un onglet change, implémentez en NodeElement : ontabswitched, il s'agit d'un `JsEvent`.
   *
   * En Jquery, `api:tabswitched`.
   *
   * @example <bnum-tabs data-navs="subscribed, publics, archived" data-ex-label="mel_workspace" data-description="Liste des différents espaces auquel on a souscris"></bnum-tabs>
   */
  constructor() {
    super({ mode: EWebComponentMode.div });

    this.#_init().#_setup();
  }

  //#region Readonly Variables
  /**
   * Récupère le ShadowRoot si il est activé, cet élément sinon.
   * @type {ShadowRoot | HTMLElement}
   * @readonly
   */
  get root() {
    if (this.#_initialized === false) {
      this._p_start_construct();
      this.#_initialized = true;
    }

    return this.shadowEnabled() ? this.shadowRoot : this;
  }

  /**
   * Récupère les différents onglets.
   * @type {string[]}
   * @readonly
   */
  get rawTabs() {
    return this._p_get_data('navs').replaceAll(' ', EMPTY_STRING).split(',');
  }

  /**
   * Récupère la description de la liste d'onglet
   * @type {string}
   * @readonly
   * @default HTMLTabsElement.DEFAUT_VOICE
   */
  get description() {
    return this._p_get_data('description') || HTMLTabsElement.DEFAUT_VOICE;
  }

  //#endregion
  //#region Init

  /**
   * Intialise les variables
   * @private
   * @returns {HTMLTabsElement} Chaîne
   */
  #_init() {
    /**
     * Liste des actions à faire lorsqu'un onglet est cliqué.
     * @type {BnumEvent<OnTabSwitched>}
     * @event
     */
    this.ontabswitched = new BnumEvent();
    return this;
  }

  /**
   * Assigne les variables
   * @private
   * @returns {HTMLTabsElement} Chaîne
   */
  #_setup() {
    this.ontabswitched.push((tab) => {
      this.dispatchEvent(new CustomEvent('api:tabswitched', { detail: tab }));
    });
    return this;
  }
  //#endregion
  //#region Main
  /**
   * Doit être surchargée par les classe fille.
   *
   * C'est ici que les instructions de setup doivent être mises.
   * @protected
   * @override
   * @returns {HTMLTabsElement} — Chaîne
   */
  _p_main() {
    super._p_main();

    let panelContents = this._p_createPanelContent();
    let tablist = this._p_createTablist();

    this._p_assignContents(panelContents);

    let sr = this.#_generate_label();
    this.root.appendChild(sr);

    tablist.setAttribute('aria-labelledby', sr.id);

    this._p_generateItems(tablist, panelContents);
    this._p_tryAppendToReceiver(panelContents, tablist);
    this.root.appendChild(panelContents);

    this.action_click_button_action(this.rawTabs[0]);

    this.addClass('tab-element');

    tablist = null;
    panelContents = null;
    sr = null;

    return this;
  }
  //#endregion
  //#region Private Functions
  /**
   * Génère le label qui sert à décrire la liste d'onglet.
   * @private
   * @returns {BnumHtmlSrOnly}
   */
  #_generate_label() {
    let sr = BnumHtmlSrOnly.Create();
    sr.append(document.createTextNode(this.description));
    sr.id = `${HTMLTabsElement.ID_SR_PREFIX}${this.#_generate_id(`${HTMLTabsElement.ID_SR_PREFIX}%0`)}`;

    return sr;
  }

  /**
   * Génère un id. Pour tester l'id dans le selecteur, mettez `%0`.
   * @param {string} [selector='[data-tab-namespace="%0"]'] `%0` sera remplacer par l'id générer.
   * @returns {string}
   * @private
   */
  #_generate_id(selector = '[data-tab-namespace="%0"]') {
    let id;
    do {
      id = Random.random_string(Random.range(5, 20));
    } while (
      document.querySelectorAll(selector.replaceAll('%0', id)).length > 0
    );

    return id;
  }

  /**
   * Génère un texte à partir d'un label ou non
   * @param {string} text
   * @returns {string}
   * @private
   */
  #_from_label(text) {
    if (
      !!this._p_get_data('ex-label') &&
      this._p_get_data('ex-label') !== EMPTY_STRING
    )
      text = `${this._p_get_data('ex-label')}.${text}`;

    if (HtmlCustomTag._p_text_callback)
      text = HtmlCustomTag._p_text_callback(text);

    return text;
  }
  //#endregion
  //#region Protected Functions
  /**
   * Créer la div qui contiendra le contenu lié aux onglets
   * @protected
   * @returns {HTMLWrapperElement}
   */
  _p_createPanelContent() {
    let panel = HTMLWrapperElement.CreateNode();
    panel.classList.add('pannels-contents');
    panel.setAttribute('role', 'tabpanel');

    return panel;
  }

  /**
   * Créer la div qui contiendra les onglets
   * @protected
   * @returns {HTMLWrapperElement}
   */
  _p_createTablist() {
    let tablist = HTMLWrapperElement.CreateNode();
    tablist.setAttribute('role', 'tablist');
    tablist.classList.add('mel-ui-tab-system');

    return tablist;
  }

  /**
   * Ajoute les contenus enfants au wrapper
   * @param {HTMLElement} panels Wrapper
   * @returns {HTMLTabsElement} Chaînage
   */
  _p_assignContents(panels) {
    let elements = [];
    for (let index = 0; index < this.children.length; ++index) {
      elements.push(this.children.item(index));
    }

    let element;
    for (element of elements) {
      panels.appendChild(element);
      element = null;
    }

    return this;
  }

  /**
   * Génère les onglets et ajoute les attributs nécéssaires aux contenus.
   * @param {HTMLElement} tablist Liste des onglets
   * @param {HTMLElement} panelContent Wrapper des panneaux
   * @returns {HTMLTabsElement} Chaînage
   * @protected
   */
  _p_generateItems(tablist, panelContent) {
    const tabs = this.rawTabs;

    /**
     * Id de l'onglet
     * @type {string}
     * @package
     */
    let pannel_id;
    /**
     * Onglet généré
     * @type {HTMLElement}
     * @package
     */
    let generated_tab;
    /**
     * Panel séléctionné
     * @type {HTMLElement}
     * @package
     */
    let element_selected;
    for (const tab of tabs) {
      pannel_id = `${HTMLTabsElement.ID_TABPANNEL_PREFIX}${this.#_generate_id(`${HTMLTabsElement.ID_TABPANNEL_PREFIX}%0`)}`;
      generated_tab = this._p_generateTab(tab, pannel_id);
      tablist.append(generated_tab);
      element_selected = panelContent.querySelector(
        `[data-linked-to="${tab}"]`,
      );

      if (element_selected) {
        element_selected.setAttribute('data-pannel-namespace', tab);
        element_selected.setAttribute('aria-labelledby', generated_tab.id);
        element_selected.setAttribute('tabindex', -1);
        element_selected.classList.add('mel-tab-content');
        element_selected.id = pannel_id;
      }

      element_selected = null;
    }

    pannel_id = null;
    generated_tab = null;

    return this;
  }

  /**
   * Génère un onglet
   * @protected
   * @param {string} tab Nom de l'onglet
   * @param {string} linked_id Id du pannel lié
   * @returns {HTMLElement}
   */
  _p_generateTab(tab, linked_id) {
    let generated = document.createElement('button');

    generated.id = `${HTMLTabsElement.ID_TAB_PREFIX}${this.#_generate_id(`#${HTMLTabsElement.ID_TAB_PREFIX}%0`)}`;
    generated.setAttribute('tabindex', -1);
    generated.setAttribute('role', 'tab');
    generated.setAttribute('aria-selected', false);
    generated.setAttribute('aria-controls', linked_id);
    generated.setAttribute('data-button-namespace', tab);
    generated.classList.add('mel-tab', 'mel-tabheader', 'mel-focus');
    generated.addEventListener('click', this.action_click.bind(this));
    generated.addEventListener(
      'keydown',
      this.action_keypress_action.bind(this),
    );
    generated.append(document.createTextNode(this.#_from_label(tab)));

    return generated;
  }

  /**
   * Ajoute les onglets à la div receveuse si elle existe.
   * @protected
   * @param {HTMLElement} panelContents Wrapper des panneaux
   * @param {HTMLElement} tablist Liste des onglets
   * @returns {HTMLTabsElement} Chaînage
   */
  _p_tryAppendToReceiver(panelContents, tablist) {
    let hasReceiver = false;
    let tabContainer = panelContents.querySelector(HTMLTabContainer.TAG);

    if (tabContainer) {
      let tabReceiver = tabContainer.querySelector(HTMLTabReceiver.TAG);

      if (tabReceiver) {
        hasReceiver = true;
        this.root.appendChild(tabContainer);
        tabReceiver.append(tablist);
        tabReceiver = null;
      }
      tabContainer = null;
    }

    if (!hasReceiver) this.root.append(tablist);

    return this;
  }

  /**
   * Selectionne le bouton de l'onglet.
   *
   * Désecltionne les autres.
   * @param {string} tab Onglet à séléctionné
   * @returns {HTMLTabsElement} Chaîne
   * @protected
   */
  _p_select_button(tab) {
    for (const element of this.navigator.querySelectorAll('.mel-tab')) {
      element.classList.remove('active');
      element.setAttribute('tabindex', -1);
      element.setAttribute('aria-selected', false);
    }

    let button = this.navigator.querySelector(`[data-button-namespace=${tab}]`);
    button.classList.add('active');
    button.setAttribute('tabindex', 0);
    button.setAttribute('aria-selected', true);

    button = null;
    return this;
  }

  /**
   * Affiche le pannel séléctionné, cache les autres.
   * @param {string} pannel
   * @returns {HTMLTabsElement} Chaîne
   * @protected
   */
  _p_show_pannel(pannel) {
    for (const element of this.navigator.querySelectorAll('.mel-tab-content')) {
      element.style.display = 'none';
      element.setAttribute('tabindex', -1);
    }

    let e_pannel = this.navigator.querySelector(
      `[data-pannel-namespace=${pannel}]`,
    );
    if (e_pannel) {
      e_pannel.style.display = null;
      e_pannel.setAttribute('tabindex', 0);
    }

    e_pannel = null;
    return this;
  }
  //#endregion
  //#region Actions
  /**
   * Appeler au clique d'un onglet
   * @param {Event} e
   * @fires HTMLTabElement.ontabswitched
   */
  action_click(e) {
    const namespace = e.currentTarget.dataset.buttonNamespace;
    this.action_click_button_action(namespace);

    this.ontabswitched.call(namespace);
  }

  /**
   * Action à faire à faire sur l'onglet séléctionné
   * @param {string} tab
   * @returns {HTMLTabsElement} Chaîne
   */
  action_click_button_action(tab) {
    return this._p_select_button(tab)._p_show_pannel(tab);
  }

  /**
   * Action lorsqu'une touche est appuyé.
   * @param {Event} e
   * @returns {void}
   * @fires HTMLTabElement.ontabswitched
   */
  action_keypress_action(e) {
    let item;

    switch (e.code) {
      case 'ArrowRight':
        item = e.currentTarget.nextElementSibling;
        break;

      case 'ArrowLeft':
        item = e.currentTarget.previousElementSibling;
        break;

      case 'End':
        item = e.currentTarget;
        while (item.nextElementSibling !== null) {
          item = item.nextElementSibling;
        }
        break;

      case 'Home':
        item = e.currentTarget;
        while (item.previousElementSibling !== null) {
          item = item.previousElementSibling;
        }
        break;

      default:
        return;
    }

    if (item) {
      item.click();
      item.focus();
    }
  }
  //#endregion
  //#region Public Functions
  /**
   * Séléctionne un onglet
   * @param {string} id Id de l'onglet
   * @returns {external:jQuery} Onglet choisi
   */
  selectTab(id) {
    return this.$.find(`[data-button-namespace="${id}"]`).click();
  }

  /**
   * Récupère les onglets
   * @returns {external:jQuery}
   */
  tabs() {
    return this.$.find('.mel-tabheader');
  }

  /**
   * Récupère l'id de l'onglet courant
   * @returns {string}
   */
  getCurrentTabId() {
    return this.currentTab().attr('data-button-namespace');
  }

  /**
   * Récupère l'onglet courant
   * @returns {external:jQuery}
   */
  currentTab() {
    return this.$.find('.mel-tabheader.active');
  }

  /**
   * Récupère le texte de l'onglet courant
   * @returns {string}
   */
  currentTabText() {
    return this.currentTab().text();
  }

  /**
   * Récupère un panel
   * @param {?string} [id=null] Id de l'onglet lié au panel.
   * @returns {external:jQuery} Panel choisi ou panel courrant si id vaut null.
   */
  currentPannel(id = null) {
    return this.$.find(
      `.mel-tab-content[data-pannel-namespace="${id || this.getCurrentTabId()}"]`,
    );
  }
  //#endregion
  //#region Statics
  /**
   * Génère un HTMLTabsElement
   * @returns {HTMLTabsElement}
   * @static
   */
  static Create() {
    return document.createElement(HTMLTabsElement.TAG);
  }
  //#endregion
}

//#region Statics Readonly
/**
 * Tag de l'élément. Cela défini la balise que l'on doit utiliser.
 *
 * @type {string}
 * @static
 * @readonly
 */
HTMLTabsElement.TAG = 'bnum-tabs';
/**
 * Prefix de l'id d'un onglet
 *
 * @type {string}
 * @static
 * @readonly
 * @default 'mel-tab-'
 */
HTMLTabsElement.ID_TAB_PREFIX = 'custom-tab-';
/**
 * Prefix de l'id d'un pannel
 *
 * @type {string}
 * @static
 * @readonly
 * @default 'mel-tabpannel-'
 */
HTMLTabsElement.ID_TABPANNEL_PREFIX = 'custom-tabpannel-';
/**
 * Prefix de l'i de la balise descriptive
 *
 * @type {string}
 * @static
 * @readonly
 * @default 'mel-tab-sr-'
 */
HTMLTabsElement.ID_SR_PREFIX = 'custom-tab-sr-';
/**
 * Description par défaut
 *
 * @type {string}
 * @static
 * @readonly
 */
HTMLTabsElement.DEFAUT_VOICE = "Liste d'onglets";
//#endregion
{
  const constants = [
    'TAG',
    'ID_TAB_PREFIX',
    'ID_TABPANNEL_PREFIX',
    'ID_SR_PREFIX',
    'DEFAUT_VOICE',
  ];

  for (const constant of constants) {
    Object.defineProperty(HTMLTabsElement, constant, {
      value: HTMLTabsElement[constant],
      writable: false,
      configurable: false,
      enumerable: true,
    });
  }
  //#region define
  const TAG = HTMLTabsElement.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, HTMLTabsElement);
  //#endregion
}
