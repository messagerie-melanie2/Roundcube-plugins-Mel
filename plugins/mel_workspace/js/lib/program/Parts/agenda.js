import { BnumMessage } from '../../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../../../../mel_metapage/js/lib/classes/enum.js';
import { FramesManager } from '../../../../../mel_metapage/js/lib/classes/frame_manager.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import HTMLEventVisualiser from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/calendar/HTMLEventVisualiser.js';
import { WorkspaceModuleBlock } from '../../WebComponents/workspace_module_block.js';
import { NavBarManager } from '../navbar.generator.js';
import { WorkspaceObject } from '../WorkspaceObject.js';

/**
 * @default 'calendar'
 * @type {string}
 * @constant
 */
const MODULE_NAME = 'calendar';

/**
 * @default 'workspace_agenda'
 * @type {string}
 * @constant
 */
const KEY_LISTENER = 'workspace_agenda';

/**
 * Classe représentant le module d'agenda dans l'espace de travail.
 * @extends WorkspaceObject
 */
export class WorkspaceAgenda extends WorkspaceObject {
  /**
   * Initialise une nouvelle instance de WorkspaceAgenda.
   * Vérifie si le module est chargé ou désactivé, et configure son affichage en conséquence.
   */
  constructor() {
    super();

    if (!this.loaded && !this.isDisabled(MODULE_NAME)) {
      this.moduleContainer.style.display = EMPTY_STRING;
      this.startup();
    } else if (this.isDisabled(MODULE_NAME)) {
      this.hideBlock(this.moduleContainer);
    }

    this.#_setup_hidden();
  }

  /**
   * Clé pour accéder à tous les événements du calendrier.
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_ALL_EVENT() {
    return mel_metapage.Storage.calendar_all_events;
  }

  /**
   * Clé pour charger les événements du calendrier.
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_LOAD_EVENT() {
    return mel_metapage.EventListeners.calendar_updated.get;
  }

  /**
   * Clé pour les mises à jour du calendrier.
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_CALENDAR_UPDATED() {
    return mel_metapage.EventListeners.calendar_updated.after;
  }

  /**
   * Conteneur du module d'agenda.
   * @type {import('../../WebComponents/workspace_module_block.js').WorkspaceModuleBlock}
   * @readonly
   */
  get moduleContainer() {
    return document.querySelector('#module-agenda');
  }

  /**
   * Contenu du module d'agenda.
   * @type {HTMLElement}
   * @readonly
   */
  get content() {
    return this.moduleContainer.querySelector('.module-block-content');
  }

  /**
   * Méthode appelée au démarrage du module.
   * Configure les actions des boutons et les écouteurs d'événements pour le module.
   */
  startup() {
    // Action à effectuer lors du clic sur le bouton "Créer"
    WorkspaceModuleBlock.AddListenerAction(this.moduleContainer, (e) => {
      // Création d'un événement temporaire avec des données par défaut
      const event = {
        categories: ['ws#' + this.workspace.uid],
        calendar_blocked: true,
        start: moment(),
        end: moment().add(1, 'h'),
        url_data: {
          _wsp_uid: this.workspace.uid,
        },
      };
      this.rcmail().local_storage_set_item('tmp_calendar_event', event);

      // Exécution de la commande pour ajouter un événement
      return this.rcmail().commands['add-event-from-shortcut']
        ? this.rcmail().command(
            'add-event-from-shortcut',
            EMPTY_STRING,
            e.target,
            e,
          )
        : this.rcmail().command('addevent', EMPTY_STRING, e.target, e);
    });

    // Action à effectuer lorsque l'agenda est mis à jour
    this.add_event_listener(
      WorkspaceAgenda.KEY_CALENDAR_UPDATED,
      () => {
        this.#_load_content();
      },
      { callback_key: KEY_LISTENER },
    );

    this.#_main();
  }

  /**
   * Actions principales asynchrones.
   * Configure les actions à effectuer lors du chargement et de la navigation.
   * @private
   */
  async #_main() {
    await this.#_load_content();
    await NavBarManager.WaitLoading();
    NavBarManager.currentNavBar.onquitbuttonclick.push(() => {
      // Supprime l'écouteur d'événements lors de la fermeture de la barre de navigation
      this.remove_listener(WorkspaceAgenda.KEY_CALENDAR_UPDATED, KEY_LISTENER);
    });
  }

  /**
   * Vérifie les données dans le stockage local, les charge depuis le serveur si elles n'existent pas.
   * @returns {AsyncGenerator<*, void, *>}
   */
  async *check_storage_datas() {
    let storage = this.#_load_storage();
    if (!storage.any()) {
      const top = true;
      await this.rcmail(top).triggerEvent(WorkspaceAgenda.KEY_LOAD_EVENT);
      storage = this.#_load_storage();
    }

    yield* storage;
  }

  /**
   * Configure l'action du bouton afficher/cacher.
   * @private
   */
  async #_setup_hidden() {
    await NavBarManager.WaitLoading();
    NavBarManager.currentNavBar.onstatetoggle.push(async (...args) => {
      const [task, state, caller] = args;
      const loading = BnumMessage.DisplayMessage(
        this.gettext('loading'),
        'loading',
      );
      caller.classList.add('disabled');
      caller.setAttribute('disabled', 'disabled');
      if (task === MODULE_NAME) {
        await this.switchState(task, state.newState, this.moduleContainer);

        if (!state.newState && !this.loaded) {
          this.startup();
        }
      }
      caller.classList.remove('disabled');
      caller.removeAttribute('disabled');
      this.rcmail().hide_message(loading);
    });
  }

  /**
   * Charge le contenu de l'agenda.
   * Vérifie les données dans le stockage local et les affiche dans le module.
   * @private
   * @returns {Promise<void>}
   */
  async #_load_content() {
    this.content.textContent = EMPTY_STRING;
    let has = false;

    // Parcourt les événements du stockage local et les affiche
    for await (const calEvent of this.check_storage_datas()) {
      if (!has) has = true;

      this.content.appendChild(
        HTMLEventVisualiser.CreateNode(calEvent, {
          customClick: async (e) => {
            // Gestion du clic personnalisé sur un événement
            const currentFrame = null;
            const { date, event } = e.detail;

            await NavBarManager.SwitchPage('calendar', {
              event: e,
              workspace: this.workspace,
            });
            NavBarManager.currentNavBar.select('calendar');

            let context = FramesManager.Instance.get_frame(currentFrame, {
              jquery: false,
            }).contentWindow;
            context.$('#calendar').fullCalendar('gotoDate', date);
            context.ui_cal.event_show_dialog(event);
          },
        }),
      );
    }

    // Si aucun événement n'est trouvé, affiche un message par défaut
    if (!has) {
      this.content.textContent = EMPTY_STRING;
      this.content.appendChild(
        document.createTextNode(
          this.getLocalization('no_event_in_agenda', {
            plugin: 'mel_workspace',
          }),
        ),
      );
    }
  }

  /**
   * Charge les données depuis le stockage local.
   * @returns {MelEnumerable}
   */
  #_load_storage() {
    return MelEnumerable.from(
      this.load(WorkspaceAgenda.KEY_ALL_EVENT) ?? [],
    ).where(
      (x) => x.categories && x.categories[0] === `ws#${this.workspace.uid}`,
    );
  }
}

new WorkspaceAgenda();
