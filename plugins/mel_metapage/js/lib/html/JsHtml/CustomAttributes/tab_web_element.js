import { Random } from '../../../classes/random.js';
import { EMPTY_STRING } from '../../../constants/constants.js';
import { BnumEvent as JsEvent } from '../../../mel_events.js';
import { HtmlCustomTag as HtmlCustomElement } from './js_html_base_web_elements.js';

/**
 * @class
 * @classdesc Représente et gère une navigation par onglet.
 * @extends HtmlCustomElement
 */
export class TabsElement extends HtmlCustomElement {
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
    super();

    this._init()._setup();
  }

  /**
   * Intialise les variables
   * @private
   * @returns {TabsElement} Chaîne
   */
  _init() {
    /**
     * Liste des actions à faire lorsqu'un onglet est cliqué.
     * @type {JsEvent<OnTabSwitched>}
     */
    this.ontabswitched = new JsEvent();
    return this;
  }

  /**
   * Assigne les variables
   * @private
   * @returns {TabsElement} Chaîne
   */
  _setup() {
    this.ontabswitched.push((tab) => {
      this.dispatchEvent(new CustomEvent('api:tabswitched', { detail: tab }));
    });
    return this;
  }

  /**
   * Instructions
   * @private
   * @returns {TabsElement} Chaîne
   */
  _main() {
    let tmp = document.createElement('div');
    tmp.classList.add('pannels-contents');
    tmp.setAttribute('role', 'tabpanel');

    let tablist = document.createElement('div');
    tablist.setAttribute('role', 'tablist');

    let elements = [];
    for (let index = 0; index < this.children.length; ++index) {
      elements.push(this.children.item(index));
    }

    let element;
    for (element of elements) {
      tmp.appendChild(element);
      element = null;
    }

    let shadow = this._p_start_construct();

    let sr = this._generate_label();
    shadow.append(sr);

    tablist.setAttribute('aria-labelledby', sr.id);

    const tabs = this.data('navs').replaceAll(' ', EMPTY_STRING).split(',');

    let pannel_id;
    let generated_tab;
    let element_selected;
    for (const tab of tabs) {
      pannel_id = `${TabsElement.ID_TABPANNEL_PREFIX}${this._generate_id(`${TabsElement.ID_TABPANNEL_PREFIX}%0`)}`;
      generated_tab = this._generate_tab(tab, pannel_id);
      tablist.append(generated_tab);
      element_selected = tmp.querySelector(`[data-linked-to="${tab}"]`);

      if (element_selected) {
        element_selected.setAttribute('data-pannel-namespace', tab);
        element_selected.setAttribute('aria-labelledby', generated_tab.id);
        element_selected.setAttribute('tabindex', -1);
        element_selected.classList.add('mel-tab-content');
        element_selected.id = pannel_id;
      }

      element_selected = null;
    }

    shadow.append(tablist);
    shadow.append(tmp);

    this._click_button_action(tabs[0]);

    this.addClass('tab-element');

    tablist = null;
    tmp = null;
    pannel_id = null;
    generated_tab = null;
    sr = null;
    element_selected = null;

    return this;
  }

  _p_main() {
    super._p_main();

    this._main();
  }

  selectTab(id) {
    return this.$.find(`[data-button-namespace="${id}"]`).click();
  }

  tabs() {
    return this.$.find('.mel-tabheader');
  }

  getCurrentTabId() {
    return this.$.find('.mel-tabheader.active').attr('data-button-namespace');
  }

  currentTab() {
    return this.$.find('.mel-tabheader.active');
  }

  currentTabText() {
    return this.currentTab().text();
  }

  currentPannel(id = null) {
    return this.$.find(
      `.mel-tab-content[data-pannel-namespace="${id || this.getCurrentTabId()}"]`,
    );
  }

  /**
   * Génère le label qui sert à décrire la liste d'onglet.
   * @private
   * @returns {HTMLElement}
   */
  _generate_label() {
    let sr = document.createElement('div');
    sr.classList.add('sr-only');
    sr.append(
      document.createTextNode(
        this.data('description') || TabsElement.DEFAUT_VOICE,
      ),
    );
    sr.id = `${TabsElement.ID_SR_PREFIX}${this._generate_id(`${TabsElement.ID_SR_PREFIX}%0`)}`;

    return sr;
  }

  /**
   * Génère un onglet
   * @private
   * @param {string} tab Nom de l'onglet
   * @param {string} linked_id Id du pannel lié
   * @returns {HTMLElement}
   */
  _generate_tab(tab, linked_id) {
    let generated = document.createElement('button');

    generated.id = `${TabsElement.ID_TAB_PREFIX}${this._generate_id(`#${TabsElement.ID_TAB_PREFIX}%0`)}`;
    generated.setAttribute('tabindex', -1);
    generated.setAttribute('role', 'tab');
    generated.setAttribute('aria-selected', false);
    generated.setAttribute('aria-controls', linked_id);
    generated.setAttribute('data-button-namespace', tab);
    generated.classList.add('mel-tab', 'mel-tabheader', 'mel-focus');
    generated.addEventListener('click', this._click.bind(this));
    generated.addEventListener('keydown', this._keypress_action.bind(this));
    generated.append(document.createTextNode(this._from_label(tab)));

    return generated;
  }

  /**
   * Génère un texte à partir d'un label ou non
   * @param {string} text
   * @returns {string}
   * @private
   */
  _from_label(text) {
    if (this.dataset.exLabel) text = `${this.dataset.exLabel}.${text}`;

    if (HtmlCustomElement._p_text_callback)
      text = HtmlCustomElement._p_text_callback(text);

    return text;
  }

  /**
   * Appeler au clique d'un onglet
   * @private
   * @event
   * @param {Event} e
   */
  _click(e) {
    const namespace = e.originalTarget.dataset.buttonNamespace;
    this._click_button_action(namespace);

    this.ontabswitched.call(namespace);
  }

  /**
   * Action à faire à faire sur l'onglet séléctionné
   * @param {string} tab
   * @returns {TabsElement} Chaîne
   */
  _click_button_action(tab) {
    return this._select_button(tab)._show_pannel(tab);
  }

  /**
   * Action éfféctué lorsqu'une touche est appuyé.
   * @param {Event} e
   * @returns {void}
   * @event
   * @private
   */
  _keypress_action(e) {
    let item;
    switch (e.code) {
      case 'ArrowRight':
        item = e.originalTarget.nextElementSibling;
        break;

      case 'ArrowLeft':
        item = e.originalTarget.previousElementSibling;
        break;

      case 'Home':
        while (item.nextElementSibling !== null) {
          item = item.nextElementSibling;
        }

        item = item.previousElementSibling;
        break;

      case 'End':
        while (item.previousElementSibling !== null) {
          item = item.previousElementSibling;
        }

        item = item.nextElementSibling;
        break;

      default:
        return;
    }

    if (item) {
      item.click();
      item.focus();
    }
  }

  /**
   * Selectionne le bouton de l'onglet.
   *
   * Désecltionne les autres.
   * @param {string} tab Onglet à séléctionné
   * @returns {TabsElement} Chaîne
   */
  _select_button(tab) {
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
   * @returns {TabsElement} Chaîne
   */
  _show_pannel(pannel) {
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

  /**
   * Génère un id. Pour tester l'id dans le selecteur, mettez `%0`.
   * @param {string} [selector='[data-tab-namespace="%0"]'] `%0` sera remplacer par l'id générer.
   * @returns {string}
   */
  _generate_id(selector = '[data-tab-namespace="%0"]') {
    let id;
    do {
      id = Random.random_string(Random.range(5, 20));
    } while (
      document.querySelectorAll(selector.replaceAll('%0', id)).length > 0
    );

    return id;
  }

  static Create() {
    return document.createElement(TabsElement.TAG);
  }
}

/**
 * Tag de l'élément. Cela défini la balise que l'on doit utiliser.
 *
 * @type {string}
 * @static
 * @readonly
 */
TabsElement.TAG = 'bnum-tabs';
/**
 * Prefix de l'id d'un onglet
 *
 * @type {string}
 * @static
 * @readonly
 * @default 'mel-tab-'
 */
TabsElement.ID_TAB_PREFIX = 'custom-tab-';
/**
 * Prefix de l'id d'un pannel
 *
 * @type {string}
 * @static
 * @readonly
 * @default 'mel-tabpannel-'
 */
TabsElement.ID_TABPANNEL_PREFIX = 'custom-tabpannel-';
/**
 * Prefix de l'i de la balise descriptive
 *
 * @type {string}
 * @static
 * @readonly
 * @default 'mel-tab-sr-'
 */
TabsElement.ID_SR_PREFIX = 'custom-tab-sr-';
/**
 * Description par défaut
 *
 * @type {string}
 * @static
 * @readonly
 */
TabsElement.DEFAUT_VOICE = "Liste d'onglets";

{
  const constants = [
    'TAG',
    'ID_TAB_PREFIX',
    'ID_TABPANNEL_PREFIX',
    'ID_SR_PREFIX',
    'DEFAUT_VOICE',
  ];

  for (const constant of constants) {
    Object.defineProperty(TabsElement, constant, {
      value: TabsElement[constant],
      writable: false,
      configurable: false,
      enumerable: true,
    });
  }

  const TAG = TabsElement.TAG;
  if (!customElements.get(TAG)) customElements.define(TAG, TabsElement);
}
