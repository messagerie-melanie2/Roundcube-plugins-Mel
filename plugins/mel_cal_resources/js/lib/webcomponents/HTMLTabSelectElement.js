import { Random } from '../../../../mel_metapage/js/lib/classes/random.js';
import { HtmlCustomTag } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/js_html_base_web_elements.js';
import { HTMLTabsElement } from '../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/tabs/HTMLTabElement.js';
export { HTMLTabSelectElement };

class HTMLTabSelectElement extends HTMLTabsElement {
  constructor() {
    super();
  }

  /**
   * @type {HTMLSelectElement}
   * @readonly
   */
  get select() {
    return this.root.querySelector('.mel-ui-tab-system select');
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

  /**
   * Génère les onglets et ajoute les attributs nécéssaires aux contenus.
   * @param {HTMLElement} tablist Liste des onglets
   * @param {HTMLElement} panelContent Wrapper des panneaux
   * @returns {HTMLTabsElement} Chaînage
   * @protected
   * @override
   */
  _p_generateItems(tablist, panelContent) {
    const tabs = this.rawTabs;

    //Generate select
    let select = document.createElement('select');
    select.classList.add('form-control', 'input-mel', 'mel-input');
    select.setAttribute(
      'id',
      `${HTMLTabsElement.ID_TAB_PREFIX}${this.#_generate_id(`${HTMLTabsElement.ID_TAB_PREFIX}%0`)}`,
    );
    select.addEventListener('change', () => {
      const value = this.select.value;
      this._p_select_button(value)._p_show_pannel(value);
      this.ontabswitched.call(value);
    });

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
      select.appendChild(generated_tab);
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

    tablist.appendChild(select);

    pannel_id = null;
    generated_tab = null;
    select = null;

    return this;
  }

  /**
   * Génère un onglet
   * @protected
   * @param {string} tab Nom de l'onglet
   * @param {string} linked_id Id du pannel lié
   * @returns {HTMLOptionElement}
   */
  _p_generateTab(tab, linked_id) {
    let generated = document.createElement('option');

    generated.setAttribute('value', tab);
    generated.setAttribute('data-panel-link', linked_id);
    // generated.id = `${HTMLTabsElement.ID_TAB_PREFIX}${this.#_generate_id(`#${HTMLTabsElement.ID_TAB_PREFIX}%0`)}`;
    // generated.setAttribute('tabindex', -1);
    // generated.setAttribute('role', 'tab');
    // generated.setAttribute('aria-selected', false);
    // generated.setAttribute('aria-controls', linked_id);
    // generated.setAttribute('data-button-namespace', tab);
    // generated.classList.add('mel-tab', 'mel-tabheader', 'mel-focus');
    // generated.addEventListener('click', this.action_click.bind(this));
    // generated.addEventListener(
    //   'keydown',
    //   this.action_keypress_action.bind(this),
    // );
    generated.append(document.createTextNode(this.#_from_label(tab)));

    return generated;
  }

  /**
   * Selectionne le bouton de l'onglet.
   *
   * Désecltionne les autres.
   * @param {string} tab Onglet à séléctionné
   * @returns {HTMLTabSelectElement} Chaîne
   * @protected
   * @override
   */
  _p_select_button(tab) {
    this.select.value = tab;
    return this;
  }

  //#region Actions
  /**
   * Appeler au clique d'un onglet
   * @param {Event} e
   * @override
   */
  action_click(e) {
    return null;
  }

  /**
   * Action lorsqu'une touche est appuyé.
   * @param {Event} e
   * @returns {void}
   * @override
   */
  action_keypress_action(e) {
    return null;
  }
  //#endregion
  /**
   * Séléctionne un onglet
   * @param {string} id Id de l'onglet
   * @returns {external:jQuery} Onglet choisi
   */
  selectTab(id) {
    this.select.value = id;
    $(this.select).change();

    return this.getTab(id);
  }

  getTab(id) {
    return $(this.select).find(`option[value="${id}"}`);
  }

  /**
   * Récupère les onglets
   * @returns {external:jQuery}
   */
  tabs() {
    return $(this.select).childs();
  }

  /**
   * Récupère l'id de l'onglet courant
   * @returns {string}
   */
  getCurrentTabId() {
    return this.currentTab().attr('value');
  }

  /**
   * Récupère l'onglet courant
   * @returns {external:jQuery}
   */
  currentTab() {
    return $(this.select).find(`option[value="${this.select.value}"}`);
  }

  /**
   * Récupère le texte de l'onglet courant
   * @returns {string}
   */
  currentTabText() {
    return this.currentTab().text();
  }

  /**
   * @type {string}
   * @readonly
   * @static
   */
  static get TAG() {
    return super.TAG + '-select';
  }
}

{
  const TAG = HTMLTabSelectElement.TAG;
  if (!customElements.get(TAG))
    customElements.define(TAG, HTMLTabSelectElement);
}
