import { BnumLog } from '../../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { BnumConnector } from '../../../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { connectors } from '../../../../js/lib/connectors.js';
import { AIndexWorkspaceSearchStrategy } from './AIndexWorkspaceSearchStrategy.js';

/**
 * Stratégie de recherche dans les espaces de travail publics.
 *
 * Effectue une recherche côté serveur avec prise en charge de la pagination
 * via un composant de scroll infini. Contrairement à la stratégie locale,
 * cette implémentation ignore l'argument `mainTabs` — les résultats sont
 * injectés directement dans le panneau de recherche.
 *
 * @class
 * @extends AIndexWorkspaceSearchStrategy
 * @see {@link AIndexWorkspaceSearchStrategy}
 */
export class IndexWorkspacePublicSearchStrategy extends AIndexWorkspaceSearchStrategy {
  /**
   * Interface de communication avec le composant de recherche parent.
   * Utilisée pour déléguer l'état de chargement et les événements de cycle de vie.
   * @type {import("../index_workspace_ui.js").SearchInterface}
   * @internal
   */
  #_searchInterface;

  /**
   * @param {import("../index_workspace_ui.js").SearchInterface} searchInterface
   *   Interface de communication avec le composant de recherche parent
   */
  constructor(searchInterface) {
    super(searchInterface);
    this.#_searchInterface = searchInterface;
  }

  /**
   * Panneau de résultats de la recherche.
   * @returns {HTMLElement | null}
   * @internal
   */
  get #_searchPanel() {
    return document.getElementById('search-pannel');
  }

  /**
   * Conteneur de scroll infini situé dans le panneau de recherche.
   * Présent uniquement lorsque l'onglet actif est "publics".
   * @returns {HTMLElement | null}
   * @internal
   */
  get #_searchScrollContainer() {
    return document.querySelector(
      '#search-pannel bnum-infinite-scroll-container',
    );
  }

  //#region Search

  /**
   * Lance la recherche dans les espaces publics.
   *
   * Affiche un loader via {@link SearchInterface#onSearch}, effectue les appels
   * serveur en parallèle, injecte les résultats HTML, configure le scroll infini,
   * puis signale la fin du chargement via {@link SearchInterface#afterOnSearch}.
   *
   * @remarks
   * Le paramètre `mainTabs` n'est pas utilisé dans cette implémentation :
   * la recherche publique ne dépend pas de l'onglet actif.
   *
   * @param {HTMLTabsElement} _ - Onglets principaux (ignoré)
   * @param {string} value - Valeur saisie dans le champ de recherche
   * @returns {Promise<void>}
   * @example
   * const strategy = new IndexWorkspacePublicSearchStrategy(searchInterface);
   * await strategy.search(mainTabs, 'mon espace');
   */
  async search(_, value) {
    const dest = this.#_searchPanel;

    if (!dest) {
      BnumLog.error(
        'IndexWorkspacePublicSearchStrategy/search',
        'Impossible de trouver la destination !',
        dest,
        _,
        value,
        this,
      );
      return;
    }

    this.#_searchInterface.onSearch.call(dest);

    const data = await this.#_search(value);

    if (data && data.result) dest.innerHTML = data.result;

    this.#_setScroll(value, data?.count ?? 0);

    this.#_searchInterface.afterOnSearch.call(dest);
  }

  //#endregion Search

  /**
   * Effectue les appels serveur en parallèle pour récupérer les résultats
   * de la première page et le nombre total de pages disponibles.
   *
   * @param {string} value - Valeur de la recherche
   * @returns {Promise<{result: string, count: number}>}
   *   HTML des résultats et nombre total de pages
   * @internal
   */
  async #_search(value) {
    const promiseArr = await Promise.allSettled([
      this.#_public_search_data(value),
      this.#_get_count_max(value),
    ]);
    const [result, count] = promiseArr.map((x) => x.value);

    return { result, count };
  }

  /**
   * Récupère le HTML d'une page de résultats depuis le serveur.
   *
   * @param {string} searchValue - Valeur de la recherche
   * @param {number} [page=1] - Numéro de la page à charger
   * @returns {Promise<string>} HTML des résultats de la page
   * @throws {Error} Si le serveur retourne une erreur
   * @internal
   */
  async #_public_search_data(searchValue, page = 1) {
    const connector = connectors.publics_search;

    let params = connector.needed;
    params._search = searchValue;
    params._page = page;

    const data = await BnumConnector.connect(connector, {
      params,
    });

    if (!data.has_error) {
      return data.datas;
    } else throw new Error(data.error);
  }

  /**
   * Récupère le nombre total de pages disponibles pour une recherche donnée.
   * Utilise {@link BnumConnector.force_connect} avec une valeur de retour par défaut
   * à `0` en cas d'échec.
   *
   * @param {string} searchValue - Valeur de la recherche
   * @returns {Promise<number>} Nombre total de pages
   * @internal
   */
  async #_get_count_max(searchValue) {
    const connector = connectors.publics_search_count;

    let params = connector.needed;
    params._search = searchValue;

    return (
      await BnumConnector.force_connect(connector, {
        params,
        default_return: 0,
      })
    ).datas;
  }

  /**
   * Configure le composant de scroll infini : enregistre le gestionnaire
   * de chargement à la demande et définit le nombre total de pages.
   *
   * @param {string} value - Valeur de la recherche
   * @param {number} count - Nombre total de pages
   * @internal
   */
  #_setScroll(value, count) {
    const scroll = this.#_searchScrollContainer;

    if (!scroll) {
      BnumLog.error(
        'IndexWorkspacePublicSearchStrategy/#_setScroll',
        'Impossible de trouver le scroll container !',
      );
      return;
    }

    scroll.onscrolledtoend.push((e) =>
      this.#_handleScrollWrapper(e, value, count),
    );

    scroll.setPageCountMax(count);
  }

  /**
   * Délègue l'activation ou la désactivation de l'état occupé
   * à l'interface de recherche parente.
   *
   * @param {Object} params
   * @param {boolean} [params.busy=true] - `true` pour activer, `false` pour désactiver
   * @internal
   */
  #_setBusy({ busy = true }) {
    this.#_searchInterface.setBusy({ busy });
  }

  /**
   * Encapsule le chargement d'une page supplémentaire en gérant
   * l'état occupé avant et après l'appel.
   *
   * @param {Object} e - Événement de fin de scroll
   * @param {string} value - Valeur de la recherche
   * @param {number} count - Nombre total de pages
   * @returns {Promise<void>}
   * @internal
   */
  async #_handleScrollWrapper(e, value, count) {
    this.#_setBusy({ busy: true });
    await this.#_handleScroll(e, value, count);
    this.#_setBusy({ busy: false });
  }

  /**
   * Charge et injecte les résultats d'une page supplémentaire
   * lors du déclenchement du scroll infini.
   *
   * @param {Object} e - Événement de fin de scroll
   * @param {Object} e.post_data - Données POST associées à l'événement
   * @param {number} e.post_data._page - Numéro de la page à charger
   * @param {HTMLElement} e.caller - Élément déclencheur du scroll
   * @param {string} value - Valeur de la recherche
   * @param {number} count - Nombre total de pages (contexte de log uniquement)
   * @returns {Promise<void>}
   * @internal
   */
  async #_handleScroll(e, value, count) {
    const data = await this.#_public_search_data(value, e.post_data._page);
    const caller = e?.caller;

    if (!caller) {
      BnumLog.error(
        'IndexWorkspacePublicSearchStrategy/#_handleScroll',
        'Impossible de trouver le caller !',
        e,
        value,
        data,
        caller,
        count,
        this,
      );
      return;
    }

    if (data) {
      const container = this.#_searchScrollContainer;

      if (!container) {
        BnumLog.error(
          'IndexWorkspacePublicSearchStrategy/#_handleScroll',
          'Impossible de trouver le container !',
        );
        return;
      }
      const div = document.createElement('div');
      div.innerHTML = data;

      container.append(...div.childNodes);
    } else
      BnumLog.warning(
        'IndexWorkspacePublicSearchStrategy/#_handleScroll',
        "Il n'y a pas de données trouvés !",
        e,
        value,
        data,
        caller,
        count,
        this,
      );
  }
}
