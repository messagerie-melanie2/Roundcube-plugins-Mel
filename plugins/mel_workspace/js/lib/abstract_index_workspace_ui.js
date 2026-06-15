import ABaseMelObject from '../../../mel_metapage/js/lib/base_mel_object.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { Connector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/connector.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';

/**
 * Classe abstraite de base pour les interfaces utilisateur de l'index Workspace.
 *
 * Définit le contrat que toute implémentation d'UI doit respecter :
 * initialisation du mode de visualisation, écoute des changements de mode,
 * gestion de la recherche et déclenchement des connecteurs serveur.
 *
 * @abstract
 * @extends ABaseMelObject
 *
 * @remarks
 * Cette classe ne peut pas être instanciée directement.
 * Les implémentations concrètes existent selon le skin actif :
 *
 * | Implémentation                   | Skin         | Fichier                        |
 * |----------------------------------|--------------|--------------------------------|
 * | `IndexWorkspaceUI`               | bnum         | `workspace_ui_bnum.js`         |
 * | (exemple)`IndexWorkspaceLegacyUI`| legacy       | `workspace_ui_legacy.js`       |
 *
 * Chaque implémentation se déclare via l'événement `mel_workspace.index.register_ui`
 * au chargement du skin.
 *
 * @example
 * // Implémentation minimale
 * class MyWorkspaceUI extends AIndexWorkspaceUI {
 *   async _p_initVueMode() { ... }
 *   _p_listenModeChanged(connector) { ... }
 *   _p_listenSearch() { ... }
 *   _p_listenSearchReset() { ... }
 *   _p_afterStart() { ... }
 * }
 */
export class AIndexWorkspaceUI extends ABaseMelObject {
  /**
   * Cache interne de l'instance {@link BnumEvent} pour l'événement `onAfterSearch`.
   * Initialisé paresseusement via le getter {@link AIndexWorkspaceUI#onAfterSearch}.
   *
   * @type {BnumEvent|undefined}
   * @internal
   */
  #_onAfterSearchCache;

  /**
   * Événement déclenché après l'exécution d'une recherche.
   *
   * L'instance est créée lors du premier accès (initialisation paresseuse).
   *
   * @type {BnumEvent}
   * @readonly
   *
   * @example
   * ui.onAfterSearch.push(() => console.log('Recherche terminée'));
   */
  get onAfterSearch() {
    return (this.#_onAfterSearchCache ??= new BnumEvent());
  }

  /**
   * Crée une instance de la classe abstraite.
   *
   * @throws {Error} Si instancié directement (i.e. `new AIndexWorkspaceUI()`).
   */
  constructor() {
    super();

    if (this.constructor.name === 'AIndexWorkspaceUI')
      throw new Error("Can't implement abstract class !");
  }

  /**
   * Initialise le mode de visualisation courant (liste, grille, etc.).
   *
   * Délègue à {@link AIndexWorkspaceUI#_p_initVueMode} qui doit être
   * implémentée par la classe concrète.
   *
   * @returns {Promise<void>}
   *
   * @example
   * await ui.initVueMode();
   */
  async initVueMode() {
    await this._p_initVueMode();
  }

  /**
   * Implémentation abstraite de l'initialisation du mode de visualisation.
   *
   * @returns {Promise<void>}
   * @abstract
   * @protected
   * @throws {Error} Si non surchargée par la classe concrète.
   */
  async _p_initVueMode() {
    throw new Error("Can't implement abstract class !");
  }

  /**
   * Enregistre les écouteurs d'événements de l'UI.
   *
   * Active l'écoute du changement de mode, de la recherche et de la
   * réinitialisation de la recherche. Le connecteur `set_visu_mode` est
   * extrait depuis `params.connectors` et transmis à
   * {@link AIndexWorkspaceUI#_p_listenModeChanged}.
   *
   * @param {object} params - Paramètres d'initialisation.
   * @param {object} params.connectors - Table des connecteurs disponibles.
   * @param {Connector<{_mode: string}, string>} params.connectors.set_visu_mode - Connecteur de changement de mode de visualisation.
   *
   * @throws {Error} Si `params.connectors.set_visu_mode` est absent.
   *
   * @example
   * ui.addListeners({ connectors: { set_visu_mode: connectors.set_visu_mode } });
   */
  addListeners(params) {
    this._p_listenModeChanged(this.#_getConnectorSetVisuMode(params));
    this._p_listenSearch();
    this._p_listenSearchReset();
  }

  /**
   * Extrait le connecteur `set_visu_mode` depuis les paramètres.
   *
   * @param {{connectors: {set_visu_mode:Connector<{_mode: string}, string>}}} params - Paramètres passés à {@link AIndexWorkspaceUI#addListeners}.
   * @returns {Connector<{_mode: string}, string>} Le connecteur de changement de mode.
   * @throws {Error} Si le connecteur est absent ou indéfini.
   * @internal
   */
  #_getConnectorSetVisuMode(params) {
    const connector = params?.connectors?.set_visu_mode;

    if (!connector) throw new Error('Connecteur non implémenté !');

    return connector;
  }

  /**
   * Implémentation abstraite de l'écoute du changement de mode de visualisation.
   *
   * Appelé par {@link AIndexWorkspaceUI#addListeners} avec le connecteur
   * `set_visu_mode` déjà résolu.
   *
   * @param {Connector<{_mode: string}, string>} connector - Connecteur à utiliser pour notifier le serveur du changement.
   * @abstract
   * @protected
   * @throws {Error} Si non surchargée par la classe concrète.
   */
  _p_listenModeChanged(connector) {
    throw new Error("Can't implement abstract class !");
  }

  /**
   * Implémentation abstraite de l'écoute du déclenchement d'une recherche.
   *
   * @abstract
   * @protected
   * @throws {Error} Si non surchargée par la classe concrète.
   */
  _p_listenSearch() {
    throw new Error("Can't implement abstract class !");
  }

  /**
   * Implémentation abstraite de l'écoute de la réinitialisation de la recherche.
   *
   * @abstract
   * @protected
   * @throws {Error} Si non surchargée par la classe concrète.
   */
  _p_listenSearchReset() {
    throw new Error("Can't implement abstract class !");
  }

  /**
   * Implémentation abstraite du démarrage de l'UI après initialisation complète.
   *
   * @abstract
   * @protected
   * @throws {Error} Si non surchargée par la classe concrète.
   */
  _p_afterStart() {
    throw new Error("Can't implement abstract class !");
  }

  /**
   * Déclenche un appel serveur via {@link BnumConnector}.
   *
   * @param {object} connector - Connecteur décrivant l'action à exécuter côté serveur.
   * @param {object[]} params  - Paramètres transmis au connecteur.
   * @returns {Promise<void>}
   * @protected
   *
   * @example
   * await this._p_startConnector(connectors.set_visu_mode, { mode: EVisuMode.LIST });
   */
  async _p_startConnector(connector, params) {
    await BnumConnector.connect(connector, { params });
  }
}
