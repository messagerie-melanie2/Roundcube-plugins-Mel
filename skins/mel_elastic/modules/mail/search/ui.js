/**
 * Interface DOM pour les éléments de recherche du module mail.
 * Fournit des accesseurs vers les éléments HTML utilisés par le module.
 */
export class Ui {
  constructor() {}

  /**
   * Retourne le composant de recherche Bnum utilisé dans la vue mail.
   * @returns {import('../../../design-system/ds-module-bnum.js').HTMLBnumInputSearch}
   */
  get search() {
    return document.getElementById('input-search-mail');
  }

  /**
   * Retourne le bouton de filtre associé au champ de recherche.
   * @returns {import('../../../design-system/ds-module-bnum.js').HTMLBnumButtonIcon}
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

  get searchButton() {
    return document.getElementById('search-menu-mini-switch');
  }
}
