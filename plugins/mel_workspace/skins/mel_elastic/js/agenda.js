// import { HTMLBnumCardItemAgenda } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { createAgendaItemFromEvent } from '../../../../bnum_agenda/skins/mel_elastic/js/helpers/agenda-item.js';
import { BnumMessage } from '../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
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
 * @default 'workspace_agenda'
 * @type {string}
 * @constant
 */
const KEY_LISTENER = 'workspace_agenda';

/**
 * @default 'calendar'
 * @type {string}
 * @constant
 */
const MODULE_NAME = 'calendar';

class WorkspaceListener extends MelObject {
  /**
   * Clé pour les mises à jour du calendrier.
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_CALENDAR_UPDATED() {
    return this.#_GetCalendarUpdatedEventListener().after;
  }

  /**
   * Clé pour charger les événements du calendrier.
   * @type {string}
   * @readonly
   * @static
   */
  static get KEY_LOAD_EVENT() {
    return this.#_GetCalendarUpdatedEventListener().get;
  }

  #_onCalendarUpdated;
  #_onStateToggle;

  /**
   * @type {BnumEvent<Function>}
   */
  get onCalendarUpdated() {
    return (this.#_onCalendarUpdated ??= new BnumEvent());
  }

  /**
   * @type {BnumEvent<Function>}
   */
  get onStateToggle() {
    return (this.#_onStateToggle ??= new BnumEvent());
  }

  constructor() {
    super();

    this.init = once(this.init.bind(this));
  }

  async init() {
    this.#_wireCalendarUpdated();
    await this.#_wireStateToggle();
  }

  #_wireCalendarUpdated() {
    this.add_event_listener(
      WorkspaceListener.KEY_CALENDAR_UPDATED,
      () => this.onCalendarUpdated.call(),
      { callback_key: KEY_LISTENER },
    );
  }

  async #_wireStateToggle() {
    await this.awaitNavBar();
    NavBarManager.currentNavBar.onstatetoggle.push((...args) =>
      this.onStateToggle.call(...args),
    );
  }

  async loadEvents() {
    await this.#_triggerTop(WorkspaceListener.KEY_LOAD_EVENT);
  }

  #_triggerTop(key) {
    const TOP = true;
    return this.rcmail(TOP).triggerEvent(key);
  }

  static #_GetCalendarUpdatedEventListener() {
    return MelMetapage.Instance.EventListeners.calendar_updated;
  }
}

class WorkspaceStorage extends MelObject {
  #_wspId;
  /**
   * @type {WorkspaceListener}
   */
  #_listener;

  constructor(wspId, listener) {
    super();
    this.#_wspId = wspId;
    this.#_listener = listener;
  }

  /**
   *
   * @returns {Promise<MelEnumerable>}
   */
  async get({ force = false } = {}) {
    let storage = force ? null : this.#_loadStorage();
    if (!storage || !storage.any()) storage = await this.#_loadEvents();

    return storage;
  }

  async #_loadEvents() {
    await this.#_listener.loadEvents();
    return this.#_loadStorage();
  }

  /**
   * Charge les données depuis le stockage local.
   * @returns {MelEnumerable}
   */
  #_loadStorage() {
    return MelEnumerable.from(
      this.load(WorkspaceAgenda.KEY_ALL_EVENT) ?? [],
    ).where((x) => x.categories && x.categories[0] === `ws#${this.#_wspId}`);
  }
}

class WorkspaceUI extends MelObject {
  /**
   * @type {HTMLBnumCardAgenda}
   */
  #_agenda;
  #_onClick;
  /**
   * @type {BnumEvent<Function>}
   */
  get onClick() {
    return (this.#_onClick ??= new BnumEvent());
  }

  constructor(agenda) {
    super();
    this.#_agenda = agenda;
  }

  /**
   *
   * @param {MelEnumerable} events
   */
  renderEvent(events) {
    this.#_clearAgenda();

    for (const event of events) {
      this.#_addEvent(event);
    }
  }

  #_clearAgenda() {
    this.#_agenda.clear();
  }

  #_addEvent(event) {
    const item = createAgendaItemFromEvent(event);
    this.#_agenda.add(item);
  }
}

export class WorkspaceAgenda extends WorkspaceObject {
  #_listenerCache;
  #_storageCache;
  #_uiCache;

  /**
   * @type {WorkspaceListener}
   */
  get #_listener() {
    return (this.#_listenerCache ??= new WorkspaceListener());
  }

  /**
   * @type {WorkspaceStorage}
   */
  get #_storage() {
    return (this.#_storageCache ??= new WorkspaceStorage(
      this.workspace.uid,
      this.#_listener,
    ));
  }

  /**
   * @type {WorkspaceUI}
   */
  get #_ui() {
    return (this.#_uiCache ??= new WorkspaceUI(
      document.getElementById('module-agenda'),
    ));
  }

  constructor() {
    super();
    debugger;
    this.#_main();
  }

  async #_main() {
    await this.#_setup();

    if (!this.#_isStartable()) await this.#_startup();
    else if (this.#_isDisabled()) this.hideBlock(MODULE_NAME);
  }

  async #_setup() {
    this.#_setupAgenda();
    this.#_setupListener();
    await this.#_listener.init();
  }

  async #_startup() {
    await this.#_render();

    setTimeout(() => {
      this.#_render({ force: true });
    }, 100);
  }

  #_isStartable() {
    return !this.loaded && !this.#_isDisabled();
  }

  #_isDisabled() {
    return this.isDisabled(MODULE_NAME);
  }

  #_setupListener() {
    this.#_listener.onCalendarUpdated.push(() => {
      this.#_render();
    });

    this.#_listener.onStateToggle.push((...args) => {
      this.#_handleStateToggle(...args);
    });
  }

  #_setupAgenda() {
    this.#_ui.onClick.push((...args) => {
      console.log('CLICKED', ...args);
    });
  }

  async #_render({ force = false } = {}) {
    if (this.#_render._started) return;
    else if (force) this.#_render._started = true;

    const events = this.#_storage.get({ force });

    this.#_ui.renderEvent(await events);

    if (this.#_render._started) this.#_render._started = false;
  }

  #_setLoading() {
    return BnumMessage.DisplayMessage(this.gettext('loading'), 'loading');
  }

  #_stopLoading(loadingId) {
    this.rcmail().hide_message(loadingId);
  }

  async #_handleStateToggle(...args) {
    const [task, state, caller] = args;
    const loading = this.#_setLoading();

    caller.classList.add('disabled');
    caller.setAttribute('disabled', 'disabled');

    if (task === MODULE_NAME) {
      await this.switchState(task, state.newState, this.moduleContainer);

      if (!state.newState && !this.loaded) {
        await this.#_startup();
      }
    }

    caller.classList.remove('disabled');
    caller.removeAttribute('disabled');

    this.#_stopLoading(loading);
  }
}
