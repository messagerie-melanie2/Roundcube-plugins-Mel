import { BnumPromise } from '../../../mel_metapage/js/lib/BnumPromise.js';
import { BnumLog } from '../../../mel_metapage/js/lib/classes/bnum_log.js';
import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { AIndexWorkspaceUI } from './abstract_index_workspace_ui.js';
import { connectors } from './connectors.js';

/**
 * Implémentation d'UI actuellement enregistrée.
 *
 * Vaut {@link AIndexWorkspaceUI} tant qu'aucun skin n'a appelé
 * {@link registerWorkspaceUI}. Remplacée lors de l'émission de
 * l'événement `mel_workspace.index.register_ui`.
 *
 * @type {typeof AIndexWorkspaceUI}
 * @package
 */
let _registeredUI = AIndexWorkspaceUI;

/**
 * Enregistre une implémentation concrète d'UI pour l'index Workspace.
 *
 * Doit être appelé en réponse à l'événement `mel_workspace.index.register_ui`
 * émis par {@link IndexWorkspace}. Chaque skin fournit sa propre implémentation
 * de {@link AIndexWorkspaceUI} et la déclare via cette fonction.
 *
 * Le registre est un singleton module : un seul skin peut être actif à la fois.
 *
 * @param {typeof AIndexWorkspaceUI} impl - Classe concrète à instancier comme UI.
 *
 * @example
 * // Dans workspace_ui_bnum.js
 * rcmail.addEventListener('mel_workspace.index.register_ui', ({ registerFunction }) => {
 *   registerFunction(IndexWorkspaceUIBnum);
 * });
 */
export function registerWorkspaceUI(impl) {
  _registeredUI = impl;
}

/**
 * Point d'entrée de la page index du plugin `mel_workspace`.
 *
 * Orchestre l'initialisation complète de l'interface :
 * - Émet `mel_workspace.index.register_ui` pour permettre au skin actif de s'enregistrer.
 * - Lance le chargement en arrière-plan de la page `stockage`.
 * - Branche les écouteurs d'événements sur l'UI.
 * - Initialise le mode de visualisation courant.
 * - Délègue le démarrage final à l'UI via `_p_afterStart`.
 *
 * @extends MelObject
 */
export class IndexWorkspace extends MelObject {
  /**
   * Cache de l'instance d'UI active.
   * Initialisé paresseusement via le getter `#_ui`.
   *
   * @type {AIndexWorkspaceUI|undefined}
   * @private
   */
  #_uiCache;

  /**
   * Instance de l'UI active, construite à partir de {@link _registeredUI}.
   *
   * L'accès doit avoir lieu après l'enregistrement du skin dans `#_start`.
   *
   * @type {AIndexWorkspaceUI}
   * @private
   */
  get #_ui() {
    return (this.#_uiCache ??= new _registeredUI());
  }

  /**
   * Crée l'instance et lance le cycle d'initialisation.
   */
  constructor() {
    super();
    this.#_main();
  }

  /**
   * Détermine le moment opportun pour démarrer l'initialisation.
   *
   * Exécute `#_start` immédiatement si le DOM est prêt,
   * ou l'abonne à `DOMContentLoaded` dans le cas contraire.
   *
   * @private
   */
  #_main() {
    if (document.readyState !== 'loading') this.#_start();
    else document.addEventListener('DOMContentLoaded', this.#_start.bind(this));
  }

  /**
   * Initialise l'ensemble de l'interface Workspace.
   *
   * Attend via {@link BnumPromise.Wait} qu'une implémentation concrète
   * de {@link AIndexWorkspaceUI} soit enregistrée. En cas d'échec du polling,
   * une erreur est consignée mais l'initialisation se poursuit.
   *
   * @returns {Promise<void>}
   * @private
   */
  async #_start() {
    const result = await BnumPromise.Wait(() => {
      this.trigger('mel_workspace.index.register_ui', {
        registerFunction: registerWorkspaceUI,
      });

      return _registeredUI !== AIndexWorkspaceUI;
    });

    if (!result.resolved)
      BnumLog.error(
        'IndexWorkspace/#_start',
        'Impossible de trouver une implémentation de AIndexWorkspaceUI',
        result.msg,
      );

    this.#_loadDocumentsInBackground();
    this.#_setListeners();
    this.#_initMode();
    this.#_afterStart();
  }

  /**
   * Délègue l'initialisation du mode de visualisation à l'UI active.
   *
   * @see {@link AIndexWorkspaceUI#initVueMode}
   * @private
   */
  #_initMode() {
    this.#_ui.initVueMode();
  }

  /**
   * Branche les écouteurs d'événements sur l'UI active
   * en lui transmettant les connecteurs nécessaires.
   *
   * @see {@link AIndexWorkspaceUI#addListeners}
   * @private
   */
  #_setListeners() {
    this.#_ui.addListeners({
      connectors: {
        set_visu_mode: connectors.set_visu_mode,
      },
    });
  }

  /**
   * Bascule vers une page dans un iframe sans modifier la navigation principale.
   *
   * @param {string} page - Identifiant de la page à charger dans le gestionnaire de frames.
   * @see {@link FramesManager#switch_frame}
   * @private
   */
  #_switchPageInBackground(page) {
    FramesManager.Instance.switch_frame(page, { changepage: false });
  }

  /**
   * Précharge la page `stockage` en arrière-plan si elle n'est pas déjà en mémoire.
   *
   * Évite un temps de latence perceptible lorsque l'utilisateur navigue vers
   * les documents. Un message d'information est consigné via {@link BnumLog.info}
   * au déclenchement du chargement.
   *
   * @private
   */
  #_loadDocumentsInBackground() {
    const page = 'stockage';

    if (!this.#_hasFrame(page)) {
      BnumLog.info(
        'Workspace/Index',
        'Chargement des documents en arrière plan...',
      );
      this.#_switchPageInBackground(page);
    }
  }

  /**
   * Vérifie si une frame est déjà chargée dans le {@link FramesManager}.
   *
   * @param {string} page - Identifiant de la page à vérifier.
   * @returns {boolean} `true` si la frame existe déjà, `false` sinon.
   * @private
   */
  #_hasFrame(page) {
    return FramesManager.Instance.has_frame(page);
  }

  /**
   * Délègue la finalisation du démarrage à l'UI active.
   *
   * @see {@link AIndexWorkspaceUI#_p_afterStart}
   * @private
   */
  #_afterStart() {
    this.#_ui._p_afterStart();
  }
}
