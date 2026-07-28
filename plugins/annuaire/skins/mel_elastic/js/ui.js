import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object.js';
import { BnumLog } from '../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';

// ================== CORRECTION VISUELS ============== //
// A supprimer quand corrigé                            //
// ==================================================== //
const ENABLE_CORRECTION = true;
const CORRECTION = 30;
// =====================================================//

const FRONT_SEARCH_BAR_UID = 'quicksearchbarfront';
const FRONT_SEARCH_OPTIONS_UID = 'quicksearchbarfront-options';
const ACTION_SEARCH_BAR_UID = 'quicksearchbox';

const ANNUAIRE_SELECTOR = '#annuaireselector';
const POPOVER_SHOWN_SELECTOR = '.popover.show';
const CLEAR_ACTION_SELECTOR = '#quicksearchbar .button.reset';

const CHANGE_EVENT = 'change';
const CLEAR_EVENT = 'bnum-input-search:clear';

/**
 * @typedef {import('../../../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumInput} HTMLBnumInput
 */

/**
 * @typedef {import('../../../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumButtonIcon} HTMLBnumButtonIcon
 */

/**
 * Pont entre la barre de recherche visuelle (design system, skin `mel_elastic`)
 * et la barre de recherche fonctionnelle native de Roundcube.
 *
 * Répercute la saisie et l'effacement de l'input visuel vers l'input d'action
 * réel, et pilote l'ouverture du sélecteur d'annuaire depuis le bouton
 * d'options.
 *
 * Deux points de variation permettent d'adapter la classe à une autre page
 * sans dupliquer le comportement :
 * - les identifiants ciblés dans le DOM, exposés via des getters `_p_*` ;
 * - l'ouverture des options, déléguée à {@link Ui#_p_handleOptionsClick}.
 *
 * @augments ABaseMelObject
 */
export class Ui extends ABaseMelObject {
  /**
   * Initialise le pont et branche les écouteurs.
   */
  constructor() {
    super();

    this.#_copyActions();
  }

  /**
   * Identifiant de l'input visuel de recherche.
   *
   * À surcharger dans une sous-classe pour cibler une autre page.
   *
   * @type {string}
   *
   * @protected
   */
  get _p_searchBarUid() {
    return FRONT_SEARCH_BAR_UID;
  }

  /**
   * Identifiant du bouton d'options de la barre visuelle.
   *
   * À surcharger dans une sous-classe pour cibler une autre page.
   *
   * @type {string}
   *
   * @protected
   */
  get _p_searchOptionsUid() {
    return FRONT_SEARCH_OPTIONS_UID;
  }

  /**
   * Identifiant de l'input de recherche fonctionnel natif.
   *
   * À surcharger dans une sous-classe pour cibler une autre page.
   *
   * @type {string}
   *
   * @protected
   */
  get _p_actionBarUid() {
    return ACTION_SEARCH_BAR_UID;
  }

  /**
   * Sélecteur du bouton d'effacement natif.
   *
   * À surcharger dans une sous-classe pour cibler une autre page.
   *
   * @type {string}
   *
   * @protected
   */
  get _p_clearActionSelector() {
    return CLEAR_ACTION_SELECTOR;
  }

  /**
   * Input visuel de recherche (composant du design system).
   *
   * @type {?HTMLBnumInput}
   */
  get searchVisual() {
    return document.getElementById(this._p_searchBarUid);
  }

  /**
   * Bouton d'options de la barre de recherche visuelle.
   *
   * @type {?HTMLBnumButtonIcon}
   */
  get searchOptions() {
    return document.getElementById(this._p_searchOptionsUid);
  }

  /**
   * Input de recherche fonctionnel natif de Roundcube.
   *
   * @type {?HTMLInputElement}
   */
  get searchActions() {
    return document.getElementById(this._p_actionBarUid);
  }

  /**
   * Bouton d'effacement natif de Roundcube.
   *
   * @type {?HTMLAnchorElement}
   */
  get clearAction() {
    return document.querySelector(this._p_clearActionSelector);
  }

  /**
   * Ouvre le sélecteur d'annuaire et positionne le popover sous le bouton
   * d'options.
   *
   * Le positionnement se base sur la géométrie du bouton déclencheur
   * (et non sur les coordonnées de la souris) afin que le popover reste
   * correctement placé quel que soit le mode d'activation (souris ou clavier),
   * conformément au RGAA.
   *
   * Point de variation : une sous-classe peut redéfinir cette méthode pour
   * piloter un autre mécanisme d'ouverture des options.
   *
   * @returns {Promise<void>}
   *
   * @protected
   */
  async _p_handleOptionsClick() {
    const selector = document.querySelector(ANNUAIRE_SELECTOR);
    selector?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    await this.wait_something(
      () => document.querySelector(POPOVER_SHOWN_SELECTOR) !== null,
    );

    const popover = document.querySelector(POPOVER_SHOWN_SELECTOR);
    if (!popover) {
      BnumLog.error(
        'Ui/_p_handleOptionsClick',
        'Impossible de trouver le popover !',
        selector,
        popover,
        this,
      );
      return;
    }

    const rect = this.searchOptions.getBoundingClientRect();
    Object.assign(popover.style, {
      top: `${ENABLE_CORRECTION ? rect.bottom - CORRECTION : rect.bottom}px`,
      left: `${rect.left}px`,
    });
  }

  /**
   * Branche les écouteurs de l'input visuel et du bouton d'options.
   *
   * @private
   */
  #_copyActions() {
    this.searchVisual.addEventListeners({
      [CHANGE_EVENT]: this.#_handleChange.bind(this),
      [CLEAR_EVENT]: this.#_handleClear.bind(this),
    });

    this.searchOptions.addEventListener(
      'click',
      this.#_handleOptionsClick.bind(this),
    );
  }

  /**
   * Délègue l'ouverture des options au point de variation protégé et remonte
   * toute erreur asynchrone.
   *
   * @returns {Promise<void>}
   *
   * @private
   */
  async #_handleOptionsClick() {
    await this._p_handleOptionsClick();
  }

  /**
   * Répercute la valeur saisie vers l'input d'action et déclenche la recherche.
   *
   * @private
   */
  #_handleChange() {
    this.#_changeAction(this.searchVisual.value);
  }

  /**
   * Vide les deux inputs et déclenche l'effacement natif.
   *
   * @private
   */
  #_handleClear() {
    this.#_updateSearchVisualValue(EMPTY_STRING);
    this.#_updateActionValue(EMPTY_STRING);
    this.clearAction.click();
  }

  /**
   * Met à jour la valeur de l'input visuel.
   *
   * @param {string} value - Nouvelle valeur
   *
   * @private
   */
  #_updateSearchVisualValue(value) {
    this.searchVisual.value = value;
  }

  /**
   * Applique une valeur à l'input d'action puis déclenche la recherche.
   *
   * @param {string} value - Valeur à appliquer
   *
   * @private
   */
  #_changeAction(value) {
    this.#_updateActionValue(value);
    this.#_triggerAction();
  }

  /**
   * Met à jour la valeur de l'input d'action natif.
   *
   * @param {string} value - Nouvelle valeur
   *
   * @private
   */
  #_updateActionValue(value) {
    this.searchActions.value = value;
  }

  /**
   * Déclenche l'événement `change` natif sur l'input d'action.
   *
   * @private
   */
  #_triggerAction() {
    this.searchActions.dispatchEvent(new Event(CHANGE_EVENT));
  }
}
