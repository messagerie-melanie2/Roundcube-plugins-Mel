import { createAgendaItemFromEvent } from '../../../../bnum_agenda/skins/mel_elastic/js/helpers/agenda-item.js';
import { BnumMessage } from '../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelMetapage } from '../../../../mel_metapage/js/lib/helpers/mel_metapage.js';
import { once } from '../../../../mel_metapage/js/lib/mel.js';
import { BnumEvent } from '../../../../mel_metapage/js/lib/mel_events.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { NavBarManager } from '../../../js/lib/program/navbar.generator.js';
import { WorkspaceObject } from '../../../js/lib/program/WorkspaceObject.js';

/**
 * @typedef {import('../../../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumCardAgenda} HTMLBnumCardAgenda
 * @package
 */

/**
 * @typedef {Record<string, unknown>[]} Events
 * @package
 */

/**
 * Clé utilisée pour enregistrer l'écouteur de mise à jour du calendrier
 * auprès du système d'événements.
 *
 * @default 'workspace_agenda'
 * @type {string}
 * @constant
 */
const KEY_LISTENER = 'workspace_agenda';

/**
 * Nom du module utilisé pour vérifier l'état d'activation
 * (activé/désactivé) du bloc agenda dans l'espace de travail.
 *
 * @default 'calendar'
 * @type {string}
 * @constant
 */
const MODULE_NAME = 'calendar';

/**
 * Gère l'écoute des événements liés au calendrier (mise à jour, chargement)
 * ainsi que le basculement d'état (activé/désactivé) du module agenda
 * dans la barre de navigation.
 *
 * Sert d'intermédiaire entre le système d'événements global de Mélanie2
 * (`EventListenerDatas`) et les composants internes de l'agenda du
 * workspace.
 *
 * @package
 */
class WorkspaceListener extends MelObject {
  /**
   * Clé de l'événement déclenché après une mise à jour du calendrier.
   *
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_CALENDAR_UPDATED() {
    return this.#_GetCalendarUpdatedEventListener().after;
  }

  /**
   * Clé de l'événement permettant de déclencher le chargement
   * des événements du calendrier.
   *
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_LOAD_EVENT() {
    return this.#_GetCalendarUpdatedEventListener().get;
  }

  /**
   * Backing field de {@link WorkspaceListener#onCalendarUpdated}.
   *
   * @type {BnumEvent<Function>}
   */
  #_onCalendarUpdated;

  /**
   * Backing field de {@link WorkspaceListener#onStateToggle}.
   *
   * @type {BnumEvent<Function>}
   */
  #_onStateToggle;

  /**
   * Événement déclenché lorsque le calendrier a été mis à jour.
   *
   * @type {BnumEvent<Function>}
   */
  get onCalendarUpdated() {
    return (this.#_onCalendarUpdated ??= new BnumEvent());
  }

  /**
   * Événement déclenché lorsque l'état (activé/désactivé) du module
   * bascule depuis la barre de navigation.
   *
   * @type {BnumEvent<Function>}
   */
  get onStateToggle() {
    return (this.#_onStateToggle ??= new BnumEvent());
  }

  /**
   * Construit l'écouteur du workspace agenda.
   *
   * La méthode {@link WorkspaceListener#init} est enveloppée avec
   * `once()` afin de garantir qu'elle ne s'exécute qu'une seule fois,
   * même si elle est appelée plusieurs fois.
   */
  constructor() {
    super();

    this.init = once(this.init.bind(this));
  }

  /**
   * Initialise les écouteurs (mise à jour du calendrier et bascule d'état
   * depuis la barre de navigation).
   *
   * @returns {Promise<void>}
   */
  async init() {
    this.#_wireCalendarUpdated();
    await this.#_wireStateToggle();
  }

  /**
   * Enregistre l'écouteur sur l'événement de mise à jour du calendrier.
   *
   * @returns {void}
   */
  #_wireCalendarUpdated() {
    this.add_event_listener(
      WorkspaceListener.KEY_CALENDAR_UPDATED,
      () => this.onCalendarUpdated.call(),
      { callback_key: KEY_LISTENER },
    );
  }

  /**
   * Attend le chargement de la barre de navigation puis enregistre
   * l'écouteur de bascule d'état sur celle-ci.
   *
   * @returns {Promise<void>}
   */
  async #_wireStateToggle() {
    await this.awaitNavBar();
    NavBarManager.currentNavBar.onstatetoggle.push((...args) =>
      this.onStateToggle.call(...args),
    );
  }

  /**
   * Attend que la barre de navigation soit complètement chargée.
   *
   * @returns {Promise<void>}
   */
  async awaitNavBar() {
    await NavBarManager.WaitLoading();
  }

  /**
   * Déclenche le chargement des événements du calendrier depuis la fenêtre
   * de plus haut niveau (top).
   *
   * @returns {Promise<void>}
   */
  async loadEvents() {
    await this.#_triggerTop(WorkspaceListener.KEY_LOAD_EVENT);
  }

  /**
   * Déclenche un événement Roundcube sur la fenêtre de plus haut niveau.
   *
   * @param {string} key Clé de l'événement à déclencher.
   * @returns {*} Résultat du déclenchement de l'événement.
   */
  #_triggerTop(key) {
    const TOP = true;
    return this.rcmail(TOP).triggerEvent(key);
  }

  /**
   * Récupère et valide l'écouteur d'événement de mise à jour du calendrier
   * exposé par {@link MelMetapage.Instance}.
   *
   * @throws {Error} Si `EventListenerDatas` n'est pas défini globalement.
   * @throws {Error} Si le listener est introuvable dans `MelMetapage.Instance`.
   * @throws {Error} Si le listener trouvé n'est pas une instance de `EventListenerDatas`.
   * @returns {EventListenerDatas} L'écouteur de mise à jour du calendrier.
   * @static
   */
  static #_GetCalendarUpdatedEventListener() {
    if (typeof EventListenerDatas === 'undefined')
      throw new Error("EventListenerDatas n'existe pas !");

    const listener = MelMetapage.Instance?.EventListeners?.calendar_updated;

    if (!listener) throw new Error('Impossible de trouver le listener');
    if (!(listener instanceof EventListenerDatas))
      throw new Error("Listener n'est pas un EventListenerDatas");

    return listener;
  }
}

/**
 * Gère l'accès aux événements du calendrier stockés localement,
 * filtrés pour l'espace de travail courant, avec rechargement automatique
 * si le stockage est vide.
 *
 * @package
 */
class WorkspaceStorage extends MelObject {
  /**
   * Clé permettant d'accéder à l'ensemble des événements du calendrier
   * dans le stockage de {@link MelMetapage.Instance}.
   *
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_ALL_EVENT() {
    return this.#_GetConstCalendarAllEvent();
  }

  /**
   * Identifiant de l'espace de travail courant, utilisé pour filtrer
   * les événements du calendrier.
   *
   * @type {string}
   */
  #_wspId;

  /**
   * Écouteur utilisé pour déclencher le chargement des événements
   * lorsque le stockage local est vide.
   *
   * @type {WorkspaceListener}
   */
  #_listener;

  /**
   * Construit le gestionnaire de stockage des événements du calendrier.
   *
   * @param {string} wspId Identifiant de l'espace de travail.
   * @param {WorkspaceListener} listener Écouteur utilisé pour recharger les événements.
   */
  constructor(wspId, listener) {
    super();
    this.#_wspId = wspId;
    this.#_listener = listener;
  }

  /**
   * Récupère les événements du calendrier pour l'espace de travail courant.
   *
   * Si le stockage local est vide (ou si `force` est `true`), déclenche
   * un rechargement complet des événements avant de relire le stockage.
   *
   * @param {object} [options] Options de récupération.
   * @param {boolean} [options.force=false] Force le rechargement des événements
   * même si le stockage local n'est pas vide.
   * @returns {Promise<Events>} Liste des événements filtrés pour l'espace de travail.
   */
  async get({ force = false } = {}) {
    let storage = force ? null : this.#_loadStorage();

    if (!storage || storage.length === 0 || (storage.any && !storage.any()))
      storage = await this.#_loadEvents();

    return storage;
  }

  /**
   * Déclenche le chargement des événements via l'écouteur, puis relit
   * le stockage local mis à jour.
   *
   * @returns {Promise<Events>} Liste des événements filtrés pour l'espace de travail.
   */
  async #_loadEvents() {
    await this.#_listener.loadEvents();

    return this.#_loadStorage();
  }

  /**
   * Charge les événements du calendrier depuis le stockage local et
   * les filtre pour ne garder que ceux appartenant à l'espace de travail
   * courant.
   *
   * @returns {Events} Liste des événements filtrés pour l'espace de travail.
   */
  #_loadStorage() {
    return (this.load(WorkspaceStorage.KEY_ALL_EVENT) ?? []).filter(
      (x) => x.categories && x.categories[0] === `ws#${this.#_wspId}`,
    );
  }

  /**
   * Récupère et valide l'objet de stockage exposé par
   * {@link MelMetapage.Instance}.
   *
   * @throws {Error} Si le stockage n'est pas défini.
   * @returns {object} L'objet de stockage de `MelMetapage`.
   * @static
   */
  static #_GetStorage() {
    const storage = MelMetapage.Instance?.Storage;

    if (!storage) throw new Error("Storage n'existe pas !");
    return storage;
  }

  /**
   * Récupère et valide la clé de stockage `calendar_all_events`.
   *
   * @throws {Error} Si `calendar_all_events` n'est pas défini dans le stockage.
   * @returns {string} La clé de stockage des événements du calendrier.
   * @static
   */
  static #_GetConstCalendarAllEvent() {
    const value = this.#_GetStorage()?.calendar_all_events;

    if (!value) throw new Error("calendar_all_events n'est pas défini !");

    return value;
  }
}

/**
 * Gère l'affichage des événements du calendrier dans le composant
 * agenda de l'interface (`HTMLBnumCardAgenda`).
 *
 * @package
 */
class WorkspaceUI extends MelObject {
  /**
   * Composant d'interface représentant le bloc agenda.
   *
   * @type {HTMLBnumCardAgenda}
   */
  #_agenda;

  /**
   * Construit le gestionnaire d'interface de l'agenda.
   *
   * @param {HTMLBnumCardAgenda} agenda Composant d'interface du bloc agenda.
   */
  constructor(agenda) {
    super();
    this.#_agenda = agenda;
  }

  /**
   * Vide puis réaffiche l'ensemble des événements donnés dans le bloc agenda.
   *
   * @param {MelEnumerable} events Liste des événements à afficher.
   * @returns {void}
   */
  renderEvent(events) {
    this.#_clearAgenda();

    for (const event of events) {
      this.#_addEvent(event);
    }
  }

  /**
   * Vide le contenu actuel du bloc agenda.
   *
   * @returns {void}
   */
  #_clearAgenda() {
    this.#_agenda.clear();
  }

  /**
   * Convertit un événement de calendrier en élément d'agenda et l'ajoute
   * au bloc agenda.
   *
   * @param {object} event Événement du calendrier à ajouter.
   * @returns {void}
   */
  #_addEvent(event) {
    const item = createAgendaItemFromEvent(event);
    this.#_agenda.add(item);
  }
}

/**
 * Orchestrateur du module agenda d'un espace de travail (workspace).
 *
 * Coordonne les trois responsabilités déléguées aux classes internes :
 * - {@link WorkspaceListener} : écoute des événements calendrier et de la barre de navigation.
 * - {@link WorkspaceStorage} : accès et rechargement des événements du calendrier.
 * - {@link WorkspaceUI} : affichage des événements dans le bloc agenda.
 *
 * @package
 */
export class WorkspaceAgenda extends WorkspaceObject {
  /**
   * Backing field de {@link WorkspaceAgenda#_listener}.
   *
   * @type {WorkspaceListener}
   */
  #_listenerCache;

  /**
   * Backing field de {@link WorkspaceAgenda#_storage}.
   *
   * @type {WorkspaceStorage}
   */
  #_storageCache;

  /**
   * Backing field de {@link WorkspaceAgenda#_ui}.
   *
   * @type {WorkspaceUI}
   */
  #_uiCache;

  /**
   * Élément DOM représentant le bloc agenda du module.
   *
   * @type {HTMLBnumCardAgenda}
   * @readonly
   */
  get module() {
    return document.getElementById('module-agenda');
  }

  /**
   * Écouteur des événements calendrier et de bascule d'état,
   * initialisé de manière paresseuse.
   *
   * @type {WorkspaceListener}
   */
  get #_listener() {
    return (this.#_listenerCache ??= new WorkspaceListener());
  }

  /**
   * Gestionnaire de stockage des événements du calendrier,
   * initialisé de manière paresseuse.
   *
   * @type {WorkspaceStorage}
   */
  get #_storage() {
    return (this.#_storageCache ??= new WorkspaceStorage(
      this.workspace.uid,
      this.#_listener,
    ));
  }

  /**
   * Gestionnaire d'affichage de l'agenda, initialisé de manière paresseuse.
   *
   * @type {WorkspaceUI}
   */
  get #_ui() {
    return (this.#_uiCache ??= new WorkspaceUI(this.module));
  }

  /**
   * Construit l'orchestrateur du module agenda et déclenche
   * son initialisation.
   */
  constructor() {
    super();
    this.#_main();
  }

  /**
   * Point d'entrée principal : configure les écouteurs puis démarre
   * le module s'il est activable, ou masque le bloc s'il est désactivé.
   *
   * @returns {Promise<void>}
   */
  async #_main() {
    await this.#_setup();

    if (this.#_isStartable()) await this.#_startup();
    else if (this.#_isDisabled()) this.hideBlock(this.module);
  }

  /**
   * Configure les écouteurs internes et initialise
   * {@link WorkspaceListener}.
   *
   * @returns {Promise<void>}
   */
  async #_setup() {
    this.#_setupListener();
    await this.#_listener.init();
  }

  /**
   * Démarre le module agenda : effectue un premier rendu, marque
   * le chargement comme terminé, planifie un second rendu forcé
   * différé, puis marque le module comme chargé.
   *
   * @returns {Promise<void>}
   */
  async #_startup() {
    await this.#_render();
    this.module.loading = false;

    this.#_loadAfter();

    this.loadModule();
  }

  /**
   * Planifie un rendu forcé différé (après le rendu initial), afin
   * de s'assurer que les événements sont bien à jour une fois
   * l'interface stabilisée.
   *
   * @returns {void}
   */
  #_loadAfter() {
    this.#_fireAndForget(() => {
      this.#_render({ force: true });
    });
  }

  /**
   * Exécute une fonction de rappel de manière différée et non bloquante,
   * après un `queueMicrotask`, une `requestAnimationFrame` et un délai
   * supplémentaire.
   *
   * @param {Function} callback Fonction à exécuter de manière différée.
   * @param {object} [options] Options d'exécution.
   * @param {number} [options.timeout=100] Délai en millisecondes avant l'exécution.
   * @returns {void}
   */
  #_fireAndForget(callback, { timeout = 100 } = {}) {
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        setTimeout(callback, timeout);
      });
    });
  }

  /**
   * Indique si le module peut être démarré (non déjà chargé et non désactivé).
   *
   * @returns {boolean} `true` si le module est démarrable.
   */
  #_isStartable() {
    return !this.loaded && !this.#_isDisabled();
  }

  /**
   * Indique si le module agenda est désactivé pour l'espace de travail.
   *
   * @returns {boolean} `true` si le module est désactivé.
   */
  #_isDisabled() {
    return this.isDisabled(MODULE_NAME);
  }

  /**
   * Enregistre les écouteurs de mise à jour du calendrier et de bascule
   * d'état auprès de {@link WorkspaceListener}.
   *
   * @returns {void}
   */
  #_setupListener() {
    this.#_listener.onCalendarUpdated.push(() => {
      this.module.loading = true;
      this.#_render().finally(() => {
        this.module.loading = false;
      });
    });

    this.#_listener.onStateToggle.push((...args) => {
      this.#_handleStateToggle(...args);
    });
  }

  /**
   * Récupère les événements du calendrier et les affiche dans le bloc
   * agenda. Les erreurs sont interceptées et journalisées sans être
   * propagées.
   *
   * @param {object} [options] Options de rendu.
   * @param {boolean} [options.force=false] Force le rechargement des événements
   * avant l'affichage.
   * @returns {Promise<void>}
   */
  async #_render({ force = false } = {}) {
    try {
      const events = await this.#_storage.get({ force });

      this.#_ui.renderEvent(events);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Affiche un message de chargement.
   *
   * @returns {*} Identifiant du message affiché, utilisé pour le masquer ensuite.
   */
  #_setLoading() {
    return BnumMessage.DisplayMessage(this.gettext('loading'), 'loading');
  }

  /**
   * Masque le message de chargement correspondant à l'identifiant donné.
   *
   * @param {*} loadingId Identifiant du message de chargement à masquer.
   * @returns {void}
   */
  #_stopLoading(loadingId) {
    this.rcmail().hide_message(loadingId);
  }

  /**
   * Gère la bascule d'état (activé/désactivé) du module agenda déclenchée
   * depuis la barre de navigation. Désactive visuellement l'élément
   * déclencheur pendant le traitement, applique le changement d'état,
   * et redémarre le module si nécessaire.
   *
   * @param {...*} args Arguments transmis par l'événement de bascule d'état
   * (tâche concernée, nouvel état, élément déclencheur).
   * @returns {Promise<void>}
   */
  async #_handleStateToggle(...args) {
    const [task, state, caller] = args;
    const loading = this.#_setLoading();

    caller.classList.add('disabled');
    caller.setAttribute('disabled', 'disabled');

    if (task === MODULE_NAME) {
      await this.switchState(task, state.newState, this.module);

      if (!state.newState && !this.loaded) {
        await this.#_startup();
      }
    }

    caller.classList.remove('disabled');
    caller.removeAttribute('disabled');

    this.#_stopLoading(loading);
  }
}
