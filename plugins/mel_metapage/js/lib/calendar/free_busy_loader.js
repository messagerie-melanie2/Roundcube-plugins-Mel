import { MelEnumerable } from '../classes/enum.js';
import {
  DATE_FORMAT,
  DATE_SERVER_FORMAT,
  DATE_TIME_FORMAT,
} from '../constants/constants.dates.js';
import { EMPTY_STRING } from '../constants/constants.js';
import { MelObject } from '../mel_object.js';
import { CalendarLoader } from './calendar_loader.js';
import { Slots } from './event/parts/guestspart.free_busy.js';
export { wrapper as FreeBusyLoader };

/**
 * Clé qui permet de retrouver les dates des dernières mises à jour des status.
 * @constant
 * @package
 * @type {string}
 * @default 'wsp-freebusy-date-'
 */
const KEY_FREEBUSY_DATE = 'wsp-freebusy-date-';

class FreeBusyLoader extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this.interval = null;
    Object.defineProperty(this, 'interval', {
      get: () => {
        return (
          60 /
          (this.get_env('calendar_settings')?.timeslots ||
            this.rcmail(true).env.calendar_settings?.timeslots ||
            1)
        );
      },
    });
  }

  async *_load_free_busy(users, interval, sd, ed) {
    var promises = [];
    for (const user of users) {
      promises.push(
        new Promise((ok) => {
          this.http_call({
            url: this._call(user, interval, sd, ed),
            method: 'GET',
            on_success: (d) => {
              if (typeof d === 'string') d = JSON.parse(d);

              ok(new Slots(d));
            },
          });
        }),
      );
    }

    let results = await Promise.all(promises);

    for (const iterator of results) {
      yield iterator;
    }
  }

  _call(user, interval, sd, ed) {
    return this.url('calendar', {
      action: 'freebusy-times',
      params: {
        interval,
        email: user,
        start: sd
          .format(DATE_SERVER_FORMAT)
          .replaceAll('P', 'T')
          .replaceAll('M', 'T'),
        end: ed
          .format(DATE_SERVER_FORMAT)
          .replaceAll('P', 'T')
          .replaceAll('M', 'T'),
        _remote: 1,
      },
    });
  }

  /**
   *
   * @param {Slots[]} slots
   * @param {*} users
   * @param {*} interval
   */
  _save(slots, users, interval, start) {
    const key = 'free_busy';
    const current_key = `${users.join(EMPTY_STRING)}${interval}${start.format(DATE_FORMAT)}`;

    let data = this.load(key, {});
    data[current_key] = MelEnumerable.from(slots)
      .select((x) => x.serialize())
      .toArray();

    this._save_date(current_key);
    this.save(key, data);
  }

  _is_date_ok(key) {
    const date = this.load(`${KEY_FREEBUSY_DATE}${key}`);

    if (date) {
      const agenda_date = this.load(CalendarLoader.Class.KEY_LAST_REFRESH);

      if (agenda_date) {
        return (
          moment(agenda_date, DATE_TIME_FORMAT) > moment(date, DATE_TIME_FORMAT)
        );
      }
    }

    return false;
  }

  _save_date(key) {
    this.save(`${KEY_FREEBUSY_DATE}${key}`, moment().format(DATE_TIME_FORMAT));
  }

  _load(users, interval, start) {
    var return_data = {};

    const key = 'free_busy';
    const current_key = `${users.join(EMPTY_STRING)}${interval}${start.format(DATE_FORMAT)}`;

    if (this._is_date_ok(current_key)) {
      let data = this.load(key, {})[current_key] || [];

      for (const iterator of data) {
        return_data[iterator.email] = Slots.Deserialize(iterator);
      }
    }

    return return_data;
  }

  /**
   *
   * @param {*} users
   * @param {*} param1
   * @returns {AsyncGenerator<Slots>}
   */
  async *generate(
    users,
    { interval = 30, start = moment(), end = moment().add(7, 'days') },
  ) {
    yield* this._load_free_busy(users, interval, start, end);
  }

  async *generate_and_save(
    users,
    {
      interval = 30,
      start = moment(),
      end = moment().add(7, 'days'),
      save = true,
    },
  ) {
    let data = [];
    for await (const iterator of this.generate(users, {
      interval,
      start,
      end,
    })) {
      data.push(iterator);
      yield iterator;
    }

    if (save) this._save(data, users, interval, start);
  }

  async get(
    users,
    { interval = 30, start = moment(), end = moment().add(7, 'days') },
  ) {
    var iterator;
    let data = {};

    for await (iterator of this._load_free_busy(users, interval, start, end)) {
      data[iterator.email] = iterator;
    }

    this._save(
      MelEnumerable.from(data)
        .select((x) => x.value)
        .toArray(),
      users,
      interval,
      start,
    );

    return data;
  }

  load_from_memory(users, interval, start) {
    return this._load(users, interval, start);
  }

  clear_in_memory() {
    this.save('free_busy', {});
  }
}

let _fb_instance = null;

let wrapper = {
  /**
   * @type {FreeBusyLoader}
   */
  Instance: null,
};

Object.defineProperty(wrapper, 'Instance', {
  get() {
    if (!_fb_instance) _fb_instance = new FreeBusyLoader();

    return _fb_instance;
  },
});
