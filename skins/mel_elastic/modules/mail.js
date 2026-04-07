import { EMPTY_STRING } from '../../../plugins/mel_metapage/js/lib/constants/constants.js';
import { ABaseModule } from './ABaseModule.js';

/**
 * Arguments transmis lors de la réinitialisation du champ de recherche.
 * @typedef OnClearEventArgs
 * @property {import('../design-system/ds-module-bnum.js').HTMLBnumInputSearch} caller Le composant de saisie qui déclenche l'effacement.
 * @property {boolean} ignoreOriginal Indique s'il faut ignorer le comportement par défaut.
 * @property {Readonly<(e: Event) => Result<void>>} inputValueChangedFunction Fonction à appeler pour notifier le changement de valeur.
 * @property {?() => void | undefined} after Fonction optionnelle à exécuter après l'effacement.
 */

/**
 * Interface DOM pour les éléments de recherche du module mail.
 * Fournit des accesseurs vers les éléments HTML utilisés par le module.
 */
class Ui {
  constructor() {}

  /**
   * Retourne le composant de recherche Bnum utilisé dans la vue mail.
   * @returns {import('../design-system/ds-module-bnum.js').HTMLBnumInputSearch}
   */
  get search() {
    return document.getElementById('input-search-mail');
  }

  /**
   * Retourne le bouton de filtre associé au champ de recherche.
   * @returns {import('../design-system/ds-module-bnum.js').HTMLBnumButtonIcon}
   */
  get filterButton() {
    return document.getElementById('input-search-filter-button');
  }
  /**
   * Retourne le bouton de filtre de Roundcube utilisé pour basculer l'affichage du panneau de recherche.
   * @returns {HTMLAnchorElement}
   */
  get rcFilterButton() {
    return document.querySelector('#mailsearchlist .searchbar a.options');
  }
  /**
   * Retourne le champ de saisie de recherche.
   * @returns {HTMLInputElement}
   */
  get input() {
    return document.getElementById('mailsearchform');
  }
}

/**
 * Action de filtre pour basculer l'affichage du panneau de recherche.
 * Gère l'état du bouton et déclenche l'ouverture/fermeture du filtre Roundcube.
 */
class FilterAction {
  /**
   * @type {Ui}
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
   * @param {Ui} ui L'interface DOM du module.
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
   * @param {Ui} ui L'interface DOM du module.
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

/**
 * Module de recherche mail pour ElasticUi.
 * Gère l'interaction avec le champ de recherche et les filtres associés.
 * @extends ABaseModule
 */
export class ElasticUiMail extends ABaseModule {
  #__ui;

  /**
   * Retourne l'interface DOM du module, en initialisant une instance de Ui si nécessaire.
   * @returns {Ui}
   */
  get #_ui() {
    return (this.#__ui ??= new Ui());
  }

  /**
   * Module de recherche mail pour ElasticUi.
   * @extends ABaseModule
   */
  constructor() {
    super();
  }

  /**
   * Point d'entrée principal du module.
   * Initialise les actions de filtre et les écouteurs d'événements.
   * @returns {void}
   */
  _p_main() {
    FilterAction.Start(this.#_ui);
    this.#_addListeners().#_addRcmailListeners();
  }

  /**
   * Ajoute les gestionnaires d'événements sur le champ de recherche.
   * @returns {this}
   */
  #_addListeners() {
    const search = this.#_ui.search;

    if (search) {
      search.addEventListener('bnum-input-search:search', (e) =>
        this.#_onInputSubmit(e),
      );

      search.onclear.push((params) => this.#_onInputClear(params));
    }

    return this;
  }

  /**
   * Ajoute les écouteurs Roundcube pour les réponses de recherche et de liste.
   * @returns {this}
   */
  #_addRcmailListeners() {
    this.listen('responseaftersearch', () => this.#_afterSearch()).listen(
      'responseafterlist',
      () => this.#_afterList(),
    );

    return this;
  }

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

    setTimeout(() => {
      this.execCommand('search');
    }, 1);
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
  }
}
