export { ModuleMyDay };
import { html_events } from '../../../../mel_metapage/js/lib/html/html_events.js';
import { BaseStorage } from '../../../../mel_metapage/js/lib/classes/base_storage.js';
import { BnumLog } from '../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { BaseModule } from '../../../js/lib/module.js';
import { MelEnumerable } from '../../../../mel_metapage/js/lib/classes/enum.js';
import {
  ButtonVariation,
  HTMLBnumCardAgenda,
  HTMLBnumCardItemAgenda,
  HTMLBnumSecondaryButton,
} from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { EventLocation } from '../../../../mel_metapage/js/lib/calendar/event_location.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import {
  handleActionClick,
  handleActionMouseEnter,
  handleActionMouseLeave,
  handleEventClick,
} from './module_my_day.internal/callbacks.js';

const TOP_KEY = 'my_day_listeners';
const LISTENER_KEY = mel_metapage.EventListeners.calendar_updated.after;
const MODULE_ID = 'My_day';
const MAX_SIZE = 3;
class ModuleMyDay extends BaseModule {
  constructor(load_module = true) {
    super(load_module);
  }

  start() {
    super.start();
    this._init().set_listeners().set_title_action('calendar');
  }

  end() {
    super.end();
    this.generate();

    /**
     * @type {import('../../../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumCardAgenda}
     */
    const agenda = document.querySelector(HTMLBnumCardAgenda.TAG);
    agenda.loading = false;

    agenda.addEventListener(
      HTMLBnumCardAgenda.Events.TITLE_URL_CLICKED,
      (e) => {
        e.preventDefault();
        e.detail?.inner?.preventDefault?.();
        e.detail?.inner?.detail?.inner?.preventDefault?.();

        this.switch_frame('calendar');
      },
    );
  }

  _init() {
    this.max_size = MAX_SIZE;
    this._timeouts = new BaseStorage();
    return this;
  }

  set_listeners() {
    this.add_event_listener(
      LISTENER_KEY,
      () => {
        this.clear_timeout().generate();
      },
      { callback_key: TOP_KEY },
    );

    return this;
  }

  async check_storage_datas() {
    let storage = this.load(mel_metapage.Storage.calendar_all_events);
    if (!storage) {
      const top = true;
      await this.rcmail(top).triggerEvent(
        mel_metapage.EventListeners.calendar_updated.get,
      );
      storage = this.load(mel_metapage.Storage.calendar_all_events);
    }

    return storage;
  }

  async generate() {
    const now = moment();
    /**
     * @type {import('../../../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumCardAgenda}
     */
    const agenda = document.querySelector(HTMLBnumCardAgenda.TAG);
    const events = MelEnumerable.from(
      (await this.check_storage_datas()) ?? [],
    ).where((x) => moment(x.end) > now && x.free_busy !== 'free');

    agenda.clear();

    agenda.add(
      ...events.select((x) => {
        const startDate = moment(x.start).toDate();
        const endDate = moment(x.end).toDate();
        const baseDate = startDate;
        /**
         * @type {import('../../../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumCardItemAgenda}
         */
        const node = HTMLBnumCardItemAgenda.Create(
          baseDate,
          startDate,
          endDate,
          {
            allDay: x.allDay,
            title: this._get_title_formated(x),
            // location: x.location,
            isPrivate: x.sensitivity !== 'public',
            mode: x.free_busy,
          },
        );

        const location = new EventLocation(x);
        if (location.has()) {
          let icon = null;
          let mainLocation = null;
          let locationDesc = null;

          if (location.has_visio()) {
            icon = 'video_camera_front';
            mainLocation = location.visio.side_action.bind(location.visio);
            locationDesc = location.visio._get_description(
              location.locations.length,
            );
          } else if (location.has_audio()) {
            icon = 'phone_in_talk';
            mainLocation = location.audio.side_action.bind(location.audio);
            locationDesc = location.audio.desc;
          } else {
            locationDesc = location.locations[0].location;
          }

          if (location.locations.length > 1) {
            locationDesc += ' ...';
          }

          const haveLocations = locationDesc && locationDesc !== EMPTY_STRING;
          if (haveLocations) node.updateLocation(locationDesc);

          const modes = this._addSecondaryModes(x);

          if (modes.length > 0) {
            node.addOtherModes(...modes);
          }

          if (icon && mainLocation) {
            /**
             * @type {import('../../../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumSecondaryButton}
             */
            const action = HTMLBnumSecondaryButton.CreateOnlyIcon(icon, {
              variation: ButtonVariation.SECONDARY,
              rounded: true,
            });

            action.setAttribute('slot', 'action');
            action.addEventListeners({
              click: handleActionClick(mainLocation),
              mouseenter: handleActionMouseEnter(node),
              mouseleave: handleActionMouseLeave(node),
            });

            node.appendChild(action);
            node.addEventListener(
              'click',
              handleEventClick(
                x.calendar,
                moment(x.start).startOf().toDate().getTime() / 1000.0,
                x,
              ),
            );
          }
        }

        return node;
      }),
    );
  }

  _addSecondaryModes(event) {
    var modes = [];

    if (event.attendees !== undefined && event.attendees.length > 0) {
      const item = MelEnumerable.from(event.attendees)
        .where((x) => x.email === this.get_env('mel_metapage_user_emails')[0])
        .firstOrDefault(null);
      if (item !== null) {
        try {
          switch (item.status) {
            case 'NEEDS-ACTION':
            case 'ACCEPTED':
            case 'TENTATIVE':
            case 'CANCELLED':
              modes.push(item.status);
              break;

            default:
              break;
          }
        } catch (error) {
          BnumLog.warning('_addSecondaryModes', error);
        }
      }
    }

    return modes;
  }

  _get_title_formated(event) {
    let title = mel_metapage.Functions.updateRichText(event.title);

    if (event.free_busy === 'free') title = `(libre)${title}`;

    if (event.attendees !== undefined && event.attendees.length > 0) {
      const item = MelEnumerable.from(event.attendees)
        .where((x) => x.email === this.get_env('mel_metapage_user_emails')[0])
        .firstOrDefault(null);
      if (item !== null) {
        try {
          switch (item.status) {
            case 'NEEDS-ACTION':
              title += ' (En attente)';
              break;

            case 'ACCEPTED':
              title += ' (Accepté)';
              break;

            case 'TENTATIVE':
              title += ' (Peut-être)';
              break;

            case 'CANCELLED':
              title += ' (Annulé)';
              break;

            default:
              break;
          }
        } catch (error) {}
      }
    }

    return title;
  }

  clear_timeout() {
    const timeout = this._timeouts.get('timeout');
    clearTimeout(timeout);

    this._timeouts.clear();
    BnumLog.info('MyDay/clear_timeout', 'timeout cleared');
    return this;
  }

  async ontimeout() {
    BnumLog.info('MyDay/ontimeout', 'timeout touched');
    this.clear_timeout().generate();
  }

  module_id() {
    let id = super.module_id();

    if (id) id += `_${MODULE_ID}`;
    else id = MODULE_ID;

    return id;
  }
}
