import { BnumMessage } from '../../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../../../../mel_metapage/js/lib/classes/enum.js';
import { FramesManager } from '../../../../../mel_metapage/js/lib/classes/frame_manager.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import HTMLEventVisualiser from '../../../../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/calendar/HTMLEventVisualiser.js';
import { WorkspaceModuleBlock } from '../../WebComponents/workspace_module_block.js';
import { NavBarManager } from '../navbar.generator.js';
import { WorkspaceObject } from '../WorkspaceObject.js';

const MODULE_NAME = 'calendar';
/**
 * @default 'workspace_agenda'
 * @type {string}
 * @constant
 */
const KEY_LISTENER = 'workspace_agenda';

export class WorkspaceAgenda extends WorkspaceObject {
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
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_ALL_EVENT() {
    return mel_metapage.Storage.calendar_all_events;
  }

  /**
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_LOAD_EVENT() {
    return mel_metapage.EventListeners.calendar_updated.get;
  }

  /**
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_CALENDAR_UPDATED() {
    return mel_metapage.EventListeners.calendar_updated.after;
  }

  /**
   * @type {import('../../WebComponents/workspace_module_block.js').WorkspaceModuleBlock}
   * @readonly
   */
  get moduleContainer() {
    return document.querySelector('#module-agenda');
  }

  /**
   * @type {HTMLElement}
   * @readonly
   */
  get content() {
    return this.moduleContainer.querySelector('.module-block-content');
  }

  /**
   * Appelé au démarrage du module
   */
  startup() {
    //Action à faire lorsque l'on clique sur le bouton "Créer"
    WorkspaceModuleBlock.AddListenerAction(this.moduleContainer, (e) => {
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

      return this.rcmail().commands['add-event-from-shortcut']
        ? this.rcmail().command(
            'add-event-from-shortcut',
            EMPTY_STRING,
            e.target,
            e,
          )
        : this.rcmail().command('addevent', EMPTY_STRING, e.target, e);
    });

    //Action à faire lorsque l'agenda est mis à jours
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
   * Actions princiapales asynchrones
   * @private
   */
  async #_main() {
    await this.#_load_content();
    await NavBarManager.WaitLoading();
    NavBarManager.currentNavBar.onquitbuttonclick.push(() => {
      this.remove_listener(WorkspaceAgenda.KEY_CALENDAR_UPDATED, KEY_LISTENER);
    });
  }

  /**
   * Récupère les donnée depuis le stockage local, si elles n'existent pas, les charge depuis le serveur
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
   * Met en place l'action du bouton afficher/cacher
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
      $(caller).addClass('disabled').attr('disabled', 'disabled');
      if (task === MODULE_NAME) {
        await this.switchState(task, state.newState, this.moduleContainer);

        if (!state.newState && !this.loaded) {
          this.startup();
        }
      }
      $(caller).removeClass('disabled').removeAttr('disabled');
      rcmail.hide_message(loading);
    });
  }

  /**
   * Charge le contenu de l'agenda
   * @private
   * @returns {Promise<void>}
   */
  async #_load_content() {
    this.content.textContent = EMPTY_STRING;
    let has = false;
    for await (const calEvent of this.check_storage_datas()) {
      if (!has) has = true;

      this.content.appendChild(
        HTMLEventVisualiser.CreateNode(calEvent, {
          customClick: async (e) => {
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

    if (!has) {
      this.content.textContent = EMPTY_STRING;
      this.content.appendChild(
        document.createTextNode(
          this.gettext('no_event_in_agenda', 'mel_workspace'),
        ),
      );
    }
  }

  /**
   * Charge les données depuis le stockage local
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
