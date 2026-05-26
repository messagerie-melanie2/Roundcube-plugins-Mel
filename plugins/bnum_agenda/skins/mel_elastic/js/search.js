import ABaseMelObject from '../../../../mel_metapage/js/lib/base_mel_object.js';
import { BnumLog } from '../../../../mel_metapage/js/lib/classes/bnum_log.js';

export { SearchModule };

/**
 * Identifiant de repli pour l'input miroir lorsque l'attribut `data-mirror`
 * n'est pas défini sur le composant de recherche.
 *
 * @constant {string}
 */
const MIRROR_FALLBACK_ID = 'searchform';

/**
 * Module de recherche de l'agenda Bnum.
 *
 * Fait le pont entre le web composant `#bnum-calendar-search` (design system) et l'input natif du plugin `calendar` en propageant les
 * changements de valeur vers un élément miroir.
 *
 * Le miroir est résolu dans cet ordre de priorité :
 * 1. L'élément dont l'id correspond à l'attribut `data-mirror` du composant.
 * 2. En repli, l'élément `#searchform`.
 *
 * @extends {ABaseMelObject}
 */
class SearchModule extends ABaseMelObject {
  /**
   * Référence mise en cache vers le composant de recherche.
   * Initialisée une seule fois à la construction pour éviter
   * des requêtes DOM répétées.
   *
   * @type {?import('../../../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumInputSearch}
   */
  #_searchInput;

  constructor() {
    super();
    this.#_setup();
  }

  /**
   * Composant web de recherche de l'agenda (lecture seule).
   *
   * @returns {?import('../../../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumInputSearch}
   */
  get bnumSearchInput() {
    return (this.#_searchInput ??= document.getElementById(
      'bnum-calendar-search',
    ));
  }

  // -------------------------------------------------------------------------
  // Privé
  // -------------------------------------------------------------------------

  /**
   * Attache les écouteurs d'événements sur le composant de recherche.
   * Journalise une erreur si le composant est absent du DOM au moment
   * de l'initialisation.
   *
   * @returns {void}
   */
  #_setup() {
    const input = this.bnumSearchInput;

    if (!input) {
      BnumLog.error(
        'SearchModule/#setup',
        // eslint-disable-next-line quotes
        "Le composant '#bnum-calendar-search' est introuvable dans le DOM.",
      );
      return;
    }

    const onSearch = () => this.#_syncMirror();
    input.addEventListener('change', onSearch);
    input.addEventListener('bnum-input-search:search', onSearch);
  }

  /**
   * Synchronise la valeur de l'input miroir avec celle du composant
   * de recherche, puis déclenche un événement `change` sur le miroir
   * afin de notifier le plugin `calendar`.
   *
   * @returns {void}
   */
  #_syncMirror() {
    const input = this.#_searchInput;
    const mirror = this.#_getMirror();

    if (!input) {
      BnumLog.error(
        'SearchModule/#syncMirror',
        'Le composant de recherche est introuvable.',
      );
      return;
    }

    if (!mirror) {
      BnumLog.error(
        'SearchModule/#syncMirror',
        `L'input miroir est introuvable (fallback attendu : '#${MIRROR_FALLBACK_ID}').`,
      );
      return;
    }

    mirror.value = input.val();
    mirror.dispatchEvent(new Event('change'));
  }

  /**
   * Résout l'input miroir dans le DOM selon l'ordre de priorité décrit
   * en en-tête de classe.
   *
   * @returns {?HTMLInputElement} L'input miroir résolu, ou `null` si aucun
   *   élément correspondant n'existe dans le DOM.
   */
  #_getMirror() {
    const mirrorId = this.#_searchInput?.getAttribute('data-mirror');
    return (
      (mirrorId && document.getElementById(mirrorId)) ||
      document.getElementById(MIRROR_FALLBACK_ID)
    );
  }
}
