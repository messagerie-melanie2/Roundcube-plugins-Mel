import { HTMLBnumCardElement } from '../../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { HTMLBnumIcon } from '../../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { BnumLog } from '../../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { MelEnumerable } from '../../../../../mel_metapage/js/lib/classes/enum.js';
import { Pipe, pipe } from '../../../../../mel_metapage/js/lib/helpers/pipe.js';
import { HTMLTabsElement } from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/tab_web_element.js';
import { AIndexWorkspaceSearchStrategy } from './AIndexWorkspaceSearchStrategy.js';
import { EMode } from './EMode.js';

/**
 * Stratégie de recherche dans les espaces de travail de l'utilisateur.
 *
 * Effectue un filtrage local sur les éléments déjà présents dans le DOM,
 * sans appel serveur. Couvre les onglets "Mes espaces" et "Archivés".
 *
 * @remarks
 * Contrairement à {@link IndexWorkspacePublicSearchStrategy}, cette stratégie
 * n'effectue aucun appel réseau et ne gère pas d'état "occupé" — la recherche
 * étant synchrone, aucun retour visuel de chargement n'est nécessaire.
 *
 * @class
 * @extends AIndexWorkspaceSearchStrategy
 * @see {@link AIndexWorkspaceSearchStrategy}
 * @see {@link IndexWorkspacePublicSearchStrategy} Stratégie pour les espaces publics (avec appel serveur)
 */
export class IndexWorkspacePrivateSearchStrategy extends AIndexWorkspaceSearchStrategy {
  /**
   * Panneau de résultats de la recherche.
   * @returns {?HTMLTabsElement}
   * @internal
   */
  get #_searchPanel() {
    return document.getElementById('search-pannel');
  }

  /**
   * Filtre localement les espaces de travail correspondant à la valeur de recherche.
   *
   * Agrège les espaces de l'onglet courant et les espaces archivés, filtre
   * par titre (insensible à la casse), clone les éléments correspondants
   * dans le panneau de recherche, puis retire les icônes "keep" des clones.
   *
   * /!\ La fonction est asynchrone pour respecter la signature de la classe parente.
   *
   * @param {HTMLTabsElement} mainTabs - Onglets principaux de la page d'index
   * @param {string} value - Valeur saisie dans le champ de recherche
   * @returns {Promise<void>}
   * @example
   * const strategy = new IndexWorkspacePrivateSearchStrategy();
   * await strategy.search(mainTabs, 'mon espace');
   */
  async search(mainTabs, value) {
    const searchPanel = this.#_searchPanel;

    if (!searchPanel) {
      BnumLog.error(
        'IndexWorkspacePrivateSearchStrategy/search',
        'Impossible de trouver search-pannel !',
        searchPanel,
        mainTabs,
        value,
        this,
      );
      return;
    }

    const workspaces = this.#_findContainer(mainTabs);
    const archived = this.#_findContainer(mainTabs, { fromArchived: true });

    const upperValue = value.toUpperCase();
    const enumerable = MelEnumerable.from(workspaces)
      .aggregate(archived)
      .where((x) => x.title().toUpperCase().includes(upperValue));

    const dest = this.#_getCurrenPanel(searchPanel);

    if (!dest) {
      BnumLog.error(
        'IndexWorkspacePrivateSearchStrategy/search',
        'Impossible de trouver le container de search-pannel !',
        searchPanel,
        mainTabs,
        value,
        this,
      );
      return;
    }

    Pipe.Start(dest)
      .pipe((x) => this.#_append(x, enumerable))
      .pipe(this.#_addListeners.bind(this))
      .pipe(this.#_removeKeep.bind(this))
      .pipe(this.#_removeDuplicateIcons.bind(this));
  }

  /**
   * Ajoute un tableau d'élément html à un enfant
   * @param {HTMLElement} dest
   * @param {HTMLElement[]} arr
   * @private
   */
  #_append(dest, arr) {
    dest.append(...arr);
    return dest;
  }

  /**
   * Récupère la liste des composants d'espace de travail dans un panneau donné.
   *
   * Retourne un tableau vide si le panneau est introuvable.
   *
   * @param {HTMLTabsElement} mainTabs - Onglets principaux
   * @param {Object} [options={}]
   * @param {boolean} [options.fromArchived=false]
   *   `true` pour cibler le panneau archivé, `false` pour le panneau courant
   * @returns {NodeList | []} Liste des éléments `bnum-workspace-block-item` trouvés
   * @internal
   */
  #_findContainer(mainTabs, { fromArchived = false } = {}) {
    return (
      this.#_getCurrenPanel(
        mainTabs,
        fromArchived ? EMode.archived : null,
      )?.querySelectorAll?.('bnum-workspace-block-item') ?? []
    );
  }

  /**
   * Retourne le panneau courant ou un panneau spécifique sous forme d'`HTMLElement`.
   *
   * Normalise le retour de `currentPannel()` qui peut être un objet jQuery
   * ou un `HTMLElement` selon le contexte d'appel.
   *
   * @param {HTMLTabsElement} bnumTab - Onglets principaux
   * @param {string | null} [id=null]
   *   Identifiant du panneau cible, `null` pour le panneau courant
   * @returns {HTMLElement | null}
   * @internal
   */
  #_getCurrenPanel(bnumTab, id = null) {
    const panel = bnumTab.currentPannel(id);

    if (this.#_isJquery(panel)) return panel.length > 0 ? panel[0] : null;
    else if (panel instanceof HTMLElement) return panel;
    else {
      BnumLog.error(
        'IndexWorkspacePrivateSearchStrategy/#_getCurrenPanel',
        'Le panel doit être un HTMLElement !',
        panel,
        bnumTab,
        id,
      );
      return null;
    }
  }

  /**
   * Vérifie si un élément est un objet jQuery.
   *
   * Se base sur la propriété `.jquery` présente sur tous les objets jQuery,
   * y compris les collections vides — contrairement à une vérification
   * par `.length` qui retournerait `0` (falsy) pour une collection vide.
   *
   * @param {*} element - Élément à tester
   * @returns {boolean}
   * @internal
   */
  #_isJquery(element) {
    return typeof element?.jquery === 'string';
  }

  /**
   * Supprime les icônes "keep" (favoris) des clones injectés dans le panneau de recherche.
   *
   * Ces icônes sont présentes sur les espaces de l'utilisateur mais non
   * pertinentes dans le contexte d'un résultat de recherche.
   *
   * @param {HTMLElement} dest - Conteneur dans lequel chercher et supprimer les icônes
   * @internal
   */
  #_removeKeep(dest) {
    const icons = dest.querySelectorAll(HTMLBnumIcon.TAG);

    for (const icon of icons) {
      if (icon.textContent.includes('keep')) icon.remove();
    }

    return dest;
  }

  /**
   *
   * @param {HTMLElement} dest
   */
  #_removeDuplicateIcons(dest) {
    const ELEMENTS_TO_CHECK = 'bnum-favorite-button';
    const ICONS_TO_CHECK = 'old-bnum-icon';

    const elements = dest.querySelectorAll(ELEMENTS_TO_CHECK);

    for (const element of elements) {
      let alreadyExist = false;

      for (const icon of element.querySelectorAll(ICONS_TO_CHECK)) {
        if (alreadyExist) icon?.remove?.();
        else alreadyExist = true;
      }
    }
  }

  /**
   * Ajoute le listener perdu à la copie.
   * @param {HTMLElement} dest
   * @private
   */
  #_addListeners(dest) {
    /**
     * @type {NodeListOf<HTMLBnumCardElement>}
     */
    const cards = dest.querySelectorAll(HTMLBnumCardElement.TAG);
    for (const card of cards) {
      if (!card.hasAttribute('clickable')) continue;

      const id = this.#_getWspId(card);

      if (!id) continue;

      card.addEventListener(
        'bnum-card:click',
        this.#_handleWorkspaceClick.bind(this, id),
      );
    }

    return dest;
  }

  /**
   *
   * @param {HTMLBnumCardElement} card
   * @returns
   */
  #_getWspId(card) {
    return card?.parentElement?.getAttribute?.('data-id');
  }

  #_handleWorkspaceClick(id) {
    const original = this.#_getOriginalWorkspace(id);

    if (original) original.click();
    else {
      const textError = `Impossible de trouver l'edt original lié à l'id ${id}`;
      BnumLog.error('public/#_handleWorkspaceClick', textError);
    }
  }

  #_getOriginalWorkspace(id) {
    const workspace = document.querySelector(`#main-pannel [data-id="${id}"]`);

    return workspace?.querySelector?.(HTMLBnumCardElement.TAG);
  }
}
