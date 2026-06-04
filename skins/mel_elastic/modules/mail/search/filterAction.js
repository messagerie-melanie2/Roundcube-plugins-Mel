/**
 * @typedef {import('./ui.js').Ui} SearchUserInterface
 */

import { pipe } from '../../../../../plugins/mel_metapage/js/lib/helpers/pipe.js';

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

  #_setVisibility({ visible, button = this.#_ui.filterButton }) {
    const bnumInputButton = button ?? this.#_ui.filterButton;

    if (!bnumInputButton) throw new Error("Le bouton n'existe pas !");

    bnumInputButton.data('show', visible);

    return bnumInputButton;
  }

  #_updateIconButtonFromVisibility(button = this.#_ui.filterButton) {
    button ??= this.#_ui.filterButton;

    button.icon = button.data('show')
      ? FilterAction.#_ICONS.hide
      : FilterAction.#_ICONS.show;

    return button;
  }

  #_clickRcFilterButton() {
    const rcFilterButton = this.#_ui.rcFilterButton;

    if (!rcFilterButton)
      throw new Error('Impossible de trouver le bouton ref !');

    rcFilterButton.click();
  }

  #_toggleButtonState({ visible }) {
    pipe(visible, (x) => {
      return this.#_setVisibility({ visible: x });
    })
      .pipe(this.#_updateIconButtonFromVisibility.bind(this))
      .pipe(this.#_clickRcFilterButton.bind(this));
  }

  /**
   * Bascule l'état du panneau de filtre entre affiché et masqué.
   * @returns {void}
   */
  toggle() {
    const bnumInputButton = this.#_ui.filterButton;
    const isShown = !bnumInputButton.data('show');

    this.#_toggleButtonState({ visible: isShown });
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
