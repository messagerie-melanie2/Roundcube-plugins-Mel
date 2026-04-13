/**
 * @typedef {import('./ui.js').Ui} SearchUserInterface
 */

/**
 * Action de filtre pour basculer l'affichage du panneau de recherche.
 * Gère l'état du bouton et déclenche l'ouverture/fermeture du filtre Roundcube.
 */
export class FilterAction {
  /**
   * @type {SearchUserInterface}
   */
  #_ui;
  /**
   * @type {Readonly<{ show: string; hide: string }>} Icons for show and hide states
   * @readonly
   */
  static #_ICONS = {
    show: 'filter_list',
    hide: 'filter_list_off',
  };

  /**
   * @param {SearchUserInterface} ui L'interface DOM du module.
   */
  constructor(ui) {
    this.#_ui = ui;
  }

  /**
   * Affiche le panneau de filtre et met à jour l'icône du bouton.
   * @returns {void}
   */
  #_show() {
    const bnumInputButton = this.#_ui.filterButton;
    const rcFilterButton = this.#_ui.rcFilterButton;

    bnumInputButton.data('show', true);
    bnumInputButton.icon = FilterAction.#_ICONS.hide;

    rcFilterButton.click();
  }

  /**
   * Masque le panneau de filtre et met à jour l'icône du bouton.
   * @returns {void}
   */
  #_hide() {
    const bnumInputButton = this.#_ui.filterButton;
    const rcFilterButton = this.#_ui.rcFilterButton;

    bnumInputButton.data('show', false);
    bnumInputButton.icon = FilterAction.#_ICONS.show;

    rcFilterButton.click();
  }

  /**
   * Bascule l'état du panneau de filtre entre affiché et masqué.
   * @returns {void}
   */
  toggle() {
    const bnumInputButton = this.#_ui.filterButton;
    const isShown = bnumInputButton.data('show');

    if (isShown) {
      this.#_hide();
    } else {
      this.#_show();
    }
  }

  /**
   * Initialise l'action de filtre et attache l'écouteur de clic.
   * @param {SearchUserInterface} ui L'interface DOM du module.
   * @returns {?FilterAction}
   */
  static Start(ui) {
    const filterButton = ui.filterButton;

    if (filterButton) {
      const action = new FilterAction(ui);

      filterButton.addEventListener('click', action.toggle.bind(action));

      return action;
    }

    return null;
  }
}
