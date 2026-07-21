import { Ui } from './ui.js';

const OPTIONS_BUTTON_SELECTOR = '.searchbar.menu .button.options';
const SEARCH_MENU_UID = 'searchmenu';
const HIDDEN_CLASS = 'hidden';

const ARIA_EXPANDED = 'aria-expanded';

const ICON_OPENED = 'keyboard_arrow_up';
const ICON_CLOSED = 'keyboard_arrow_down';

/**
 * Variante de {@link Ui} pour la page carnet d'adresses.
 *
 * Ne redéfinit que ce qui diffère de la page d'origine :
 * - l'identifiant de l'input d'action et le sélecteur d'effacement ;
 * - l'ouverture des options, qui bascule le menu natif de recherche et
 *   synchronise l'icône ainsi que l'état ARIA du bouton.
 *
 * Contrairement à {@link Ui}, cette page suit réellement l'état ouvert/fermé
 * des options ; c'est donc ici — et non dans la classe mère — qu'est gérée
 * l'exposition de cet état aux technologies d'assistance (`aria-expanded`).
 *
 * Les identifiants de la barre visuelle et du bouton d'options sont identiques
 * à ceux de {@link Ui} et sont donc hérités tels quels.
 *
 * @augments Ui
 */
export class UIAdressBook extends Ui {
  /**
   * Initialise la variante et pose l'état ARIA initial d'après l'état courant
   * du menu.
   */
  constructor() {
    super();

    this.#_setOptionsExpanded(this.#_isExpanded());
  }

  /**
   * @type {string}
   *
   * @override
   * @protected
   */
  get _p_actionBarUid() {
    return 'searchform';
  }

  /**
   * @type {string}
   *
   * @override
   * @protected
   */
  get _p_clearActionSelector() {
    return '.searchbar.menu .button.reset';
  }

  /**
   * Bascule le menu de recherche natif, puis synchronise l'icône du bouton et
   * son état ARIA sur l'état résultant du menu.
   *
   * @override
   * @protected
   */
  _p_handleOptionsClick() {
    document.querySelector(OPTIONS_BUTTON_SELECTOR)?.click();

    const opened = this.#_isExpanded();

    this.searchOptions.icon = opened ? ICON_OPENED : ICON_CLOSED;
    this.#_setOptionsExpanded(opened);
  }

  /**
   * Indique si le menu de recherche natif est actuellement ouvert.
   *
   * Renvoie `false` si le menu est absent du DOM.
   *
   * @returns {boolean} `true` si le menu est ouvert
   *
   * @private
   */
  #_isExpanded() {
    const searchMenu = document.getElementById(SEARCH_MENU_UID);

    if (!searchMenu) return false;

    return !searchMenu.classList.contains(HIDDEN_CLASS);
  }

  /**
   * Reflète l'état ouvert/fermé des options sur le bouton, pour les
   * technologies d'assistance (RGAA).
   *
   * @param {boolean} expanded - `true` si les options sont ouvertes
   *
   * @private
   */
  #_setOptionsExpanded(expanded) {
    this.searchOptions.setAttribute(ARIA_EXPANDED, String(expanded));
  }
}
