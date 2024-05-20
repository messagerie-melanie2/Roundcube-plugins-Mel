/**
 * @module EventView/Parts/Guests/FreeBusy
 */

import { MelEnumerable } from '../../../classes/enum.js';
import {
  DATE_FORMAT,
  DATE_HOUR_FORMAT,
  DATE_TIME_FORMAT,
} from '../../../constants/constants.dates.js';
import { ____JsHtml } from '../../../html/JsHtml/JsHtml.js';
import { MelHtml } from '../../../html/JsHtml/MelHtml.js';
import { GuestsPart } from './guestspart.js';
import { MAX_SLOT, ROLE_ATTENDEE_OPTIONNAL } from './parts.constants.js';
import { TimePartManager } from './timepart.js';

/**
 * @typedef FreeBusyTimesData
 * @property {string} email Email du participant
 * @property {string} start Date de début
 * @property {string} end Date de fin
 * @property {number} interval Interval entre chaque créneaux horaires
 * @property {string} slots Liste des différents crénaux avec leurs disponibilités
 */

/**
 * Un jour en millisecondes
 * @constant
 * @type {number}
 * @package
 */
const DAY_MS = 86400000;
/**
 * Une heure en millisecondes
 * @constant
 * @type {number}
 * @package
 */
const HOUR_MS = 3600000;

/**
 * Gère les informations de disponibilité des invités
 * @class
 * @classdesc Gère les informations de disponibilité des invités, récupère les X premiers créneaux disponibles pour chaque invité
 */
export class FreeBusyGuests {
  constructor() {
    const allday = $('#edit-allday');
    /**
     * Interval de temps entre chaque créneaux
     * @readonly
     * @type {number}
     */
    this.interval = allday.checked ? 1440 : 60 / (cal.settings.timeslots || 1);
    Object.defineProperty(this, 'interval', {
      value: this.interval,
      writable: false,
      configurable: false,
    });
  }

  /**
   * Récupère les 3 prochains crénaux disponibles en prenant en compte chaque invités.
   * @async
   * @param {*} event Evènement du plugin `calendar`
   * @returns {Promise<Slot[]>}
   */
  async load_freebusy_data(event) {
    if (!FreeBusyGuests.can) return [];

    const interval = this.interval;
    const event_attendees = event.attendees;
    const date2servertime = cal.date2ISO8601;
    const fix_date = FreeBusyGuests.FixDate;
    const clone_date = FreeBusyGuests.CloneDate;

    let from = new Date();
    from.setTime(event.start);
    from.setHours(0);
    from.setMinutes(0);
    from.setSeconds(0);
    from.setMilliseconds(0);

    let start = new Date(from.getTime() - DAY_MS * 2); // start 2 days before event
    fix_date(start);
    let end = new Date(start.getTime() + DAY_MS * 14); // load min. 14 days

    let valid_slots = [];
    let promises = [];

    // load free-busy information for every attendee
    let domid, email, tmp;
    for (var i = 0; i < event_attendees.length; i++) {
      if ((email = event_attendees[i].email)) {
        domid = String(email).replace(rcmail.identifier_expr, '');

        tmp = $.ajax({
          type: 'GET',
          dataType: 'json',
          url: rcmail.get_task_url('calendar&_action=freebusy-times'), // rcmail.url('freebusy-times'),
          data: {
            email,
            interval,
            start: date2servertime(clone_date(start, 1)),
            end: date2servertime(clone_date(end, 2)),
            _remote: 1,
          },
          success: function (data) {
            // find attendee
            var i,
              attendee = null;
            for (i = 0; i < event_attendees.length; i++) {
              if (event_attendees[i].email == data.email) {
                attendee = event_attendees[i];
                break;
              }
            }

            if (attendee.role !== ROLE_ATTENDEE_OPTIONNAL) {
              let slots = new Slots(data);
              valid_slots.push(slots);
            }
          },
        });

        promises.push(tmp);
        tmp = null;
      }
    }
    await Promise.allSettled(promises);

    if (valid_slots.length > 0) {
      let next;
      let nexts = [];
      for (
        let index = MelEnumerable.from(valid_slots[0].slots)
            .select((x, index) => {
              return { start: x.start, index };
            })
            .where((x) => x.start >= moment(event.start))
            .select((item) => item.index)
            .first(),
          len = MelEnumerable.from(valid_slots)
            .select((x) => x.slots.length)
            .min();
        index < len;
        ++index
      ) {
        if (nexts.length >= MAX_SLOT) break;

        next = MelEnumerable.from(valid_slots).select((x) => x.slots[index]);

        if (next.any() && !next.any((x) => !x.isFree || x._is_in_working_hour))
          nexts.push(next.first());
      }

      valid_slots = nexts;
    }

    return valid_slots;
  }

  /**
   * fix date if jumped over a DST change
   * @static
   * @param {Date} date
   */
  static FixDate(date) {
    if (date.getHours() == 23) date.setTime(date.getTime() + HOUR_MS);
    else if (date.getHours() > 0) date.setHours(0);
  }

  /**
   * clone the given date object and optionally adjust time
   * @param {Date} date
   * @param {1 | 2} adjust 1 => set time to 00:00, 2 => set time to 23:59
   * @static
   * @returns {Date}
   */
  static CloneDate(date, adjust) {
    var d = 'toDate' in date ? date.toDate() : new Date(date.getTime());

    // set time to 00:00
    if (adjust == 1) {
      d.setHours(0);
      d.setMinutes(0);
    }
    // set time to 23:59
    else if (adjust == 2) {
      d.setHours(23);
      d.setMinutes(59);
    }

    return d;
  }

  /**
   * Récupère les 3 premiers créneaux disponibles
   * @param {external:moment} start
   * @param {external:moment} end
   * @param {*} attendees
   * @returns {Promise<Slot[]>}
   */
  static async Get(start, end, attendees) {
    return await new FreeBusyGuests().load_freebusy_data({
      start,
      end,
      attendees,
    });
  }
}

/**
 * Si on peut effectuer une requête pour récupérer les créneaux disponibles ou non
 * @static
 * @type {boolean}
 */
FreeBusyGuests.can = true;

/**
 * Contient les slots horaires d'un utilisateur.
 * @class
 * @classdesc Contient les slots horaires d'un utilisateur.
 */
export class Slots {
  /**
   *
   * @param {FreeBusyTimesData} data Données récupérer par le serveur
   */
  constructor(data) {
    /**
     * Email de l'utilisateur
     * @type {string}
     */
    this.email = data.email;
    /**
     * Date de début
     * @type {string}
     */
    this.start = data.start;
    /**
     * Date de fin
     * @type {string}
     */
    this.end = data.end;
    /**
     * Interval de temps entre chaque créneaux
     * @type {number}
     */
    this.interval = data.interval;
    /**
     * Liste des créneaux horaires avec leurs disponibilités
     * @type {Slot[]}
     */
    this.slots = [];

    for (let index = 0, len = data.slots.length; index < len; ++index) {
      const slot = data.slots[index];
      this.slots.push(new Slot(this.start, this.interval, index, slot));
    }
  }

  /**
   * @deprecated
   * @param {*} how_many
   * @param {*} start_date_corrector
   * @returns {Slot[]}
   */
  getNextFreeSlots(how_many, start_date_corrector = null) {
    let array = [];

    if (this.slots.length > 0) {
      array = MelEnumerable.from(this.slots);

      if (start_date_corrector)
        array = array.where((x) => x.start >= start_date_corrector);

      array = array
        .where((x) => x.isFree && !x._is_in_working_hour)
        .take(how_many)
        .toArray();
    }

    return array;
  }

  *[Symbol.iterator]() {
    let slot;
    let next_slot;
    let current_slot;
    for (let index = 0, len = this.slots.length; index < len; ++index) {
      current_slot = this.slots[index];
      next_slot = this.slots[index + 1];
      if (!slot) {
        if (this._is_same(current_slot, next_slot)) {
          slot = current_slot;
        } else yield current_slot;
      } else {
        if (!this._is_same(current_slot, next_slot)) {
          slot = this._extend_slot(slot, current_slot);
          yield slot;
          slot = null;
        }
      }
    }
  }

  _is_same(slot, next_slot) {
    return (
      next_slot &&
      slot.end.format(DATE_TIME_FORMAT) ===
        next_slot.start.format(DATE_TIME_FORMAT) &&
      slot.state === next_slot.state
    );
  }

  _extend_slot(slot, next_slot) {
    return new Slot(
      slot.start,
      moment.duration(next_slot.end.diff(slot.start)).as('minutes'),
      0,
      slot.state,
    );
  }

  serialize() {
    return {
      email: this.email,
      start: this.start,
      end: this.end,
      interval: this.interval,
      slots: MelEnumerable.from(this.slots)
        .select((x) => x.serialize())
        .toArray(),
    };
  }

  static Deserialize(data) {
    const tmp = JSON.parse(JSON.stringify(data.slots));
    data.slots.length = 0;
    let slots = new Slots(data);
    slots.slots = MelEnumerable.from(tmp)
      .select((x) => Slot.Deserialize(x))
      .toArray();

    return slots;
  }
}

/**
 * Représentation d'un créneau horraire
 * @class
 * @classdesc Représentation d'un créneau horraire avec l'information de sa disponibilitée ou non
 */
export class Slot {
  /**
   *
   * @param {string | external:moment | date | number} start Date de début
   * @param {number} interval Interval entre chaque créneau
   * @param {number} index Index du créneau
   * @param {string} state Etat du créneau
   */
  constructor(start, interval, index, state) {
    /**
     * Date de début du créneaux
     * @type {external:moment}
     */
    this.start = moment(start).add(interval * index, 'm');
    /**
     * Date de fin du créneau
     * @type {external:moment}
     * @readonly
     */
    this.end;
    /**
     * Si le créneau est libre ou non
     * @type {boolean}
     * @readonly
     */
    this.isFree = false;
    Object.defineProperty(this, 'isFree', {
      value: [
        Slot.STATES.free,
        Slot.STATES.telework,
        Slot.STATES.unknown,
      ].includes(state),
      writable: false,
      configurable: false,
    });
    Object.defineProperty(this, 'end', {
      get: () => {
        let end = moment(this.start).add(interval, 'm');

        if (this.start.format(DATE_FORMAT) !== end.format(DATE_FORMAT)) {
          end = moment(this.start).endOf('d');
        }

        return end;
      },
    });
    /**
     * Etat du créneau
     * @type {Slot.STATES}
     * @readonly
     */
    this.state = null;
    Object.defineProperty(this, 'state', {
      get: () => state,
    });
    /**
     * Si le créneau est en jour travaillé ou non
     * @type {boolean}
     * @readonly
     */
    this._is_in_working_hour;
    Object.defineProperty(this, '_is_in_working_hour', {
      get: () =>
        (!!cal.settings.work_start &&
          !!cal.settings.work_end &&
          !(
            this.start >=
              moment(this.start)
                .startOf('d')
                .add(cal.settings.work_start, 'h') &&
            this.start <
              moment(this.start).startOf('d').add(cal.settings.work_end, 'h')
          )) ||
        this.start.format('d') === '0' ||
        this.start.format('d') === '6',
    });
  }

  /**
   * Génère le HTML du créneau
   * @param {TimePartManager} timePart
   * @returns {____JsHtml}
   */
  generate(timePart) {
    return this.start.format(DATE_FORMAT) === this.end.format(DATE_FORMAT)
      ? this._generate_same_date(timePart)
      : this._generate_different_date(timePart);
  }

  /**
   * Génère le HTML du créneau si la date de début et de fin sont les mêmes
   * @private
   * @param {TimePartManager} timePart
   * @returns {____JsHtml}
   */
  _generate_same_date(timePart) {
    return MelHtml.start
      .button({
        class: 'slot',
        type: 'button',
        onclick: this._onclick.bind(this, timePart),
      })
      .div({ class: 'slot-date d-flex' })
      .icon('calendar_month')
      .end()
      .span()
      .text(this.start.format(DATE_FORMAT))
      .end()
      .end()
      .div({ class: 'slot-date d-flex' })
      .icon('schedule')
      .end()
      .span()
      .text(
        `${this.start.format(DATE_HOUR_FORMAT)} - ${this.end.format(DATE_HOUR_FORMAT)}`,
      )
      .end()
      .end()
      .end();
  }

  /**
   * Génère le HTML du créneau si la date de début et de fin sont différentes
   * @param {TimePartManager} timePart
   * @returns {____JsHtml}
   */
  _generate_different_date(timePart) {
    return MelHtml.start
      .button({
        class: 'slot',
        type: 'button',
        onclick: this._onclick.bind(this, timePart),
      })
      .div({ class: 'slot-date d-flex' })
      .icon('date_range')
      .end()
      .span()
      .text(this.start.format(DATE_TIME_FORMAT))
      .end()
      .end()
      .div({ class: 'slot-date d-flex' })
      .icon('remove')
      .end()
      .span()
      .text(this.end.format(DATE_TIME_FORMAT))
      .end()
      .end()
      .end();
  }

  /**
   * Action à effectuer lors du clique sur le créneau
   * @param {TimePartManager} timePart
   */
  _onclick(timePart) {
    GuestsPart.can = false;
    timePart.start._$fakeField
      .val(this.start.format(DATE_HOUR_FORMAT))
      .change();
    timePart.end._$fakeField.val(this.end.format(DATE_HOUR_FORMAT)).change();
    timePart._$start_date.val(this.start.format(DATE_FORMAT)).change();
    timePart._$end_date.val(this.start.format(DATE_FORMAT)).change();
    GuestsPart.can = true;
    GuestsPart.INSTANCE.update_free_busy();
  }

  serialize() {
    return {
      start: this.start.format(DATE_TIME_FORMAT),
      interval: moment.duration(this.end.diff(this.start)).as('minutes'),
      state: this.state,
    };
  }

  static Deserialize(data) {
    return new Slot(
      moment(data.start, DATE_TIME_FORMAT),
      data.interval,
      0,
      data.state,
    );
  }
}

/**
 * Liste des disponibilités
 * @static
 * @enum {string}
 */
Slot.STATES = {
  unknown: '0',
  free: '1',
  busy: '2',
  tentative: '3',
  oof: '4',
  telework: '5',
  leave: '6',
};

/**
 * @static
 * @enum {string}
 */
Slot.TEXTES = {
  [Slot.STATES.unknown]: 'Inconnu',
  [Slot.STATES.free]: 'Disponible',
  [Slot.STATES.busy]: 'Occupé',
  [Slot.STATES.tentative]: 'Provisoire',
  [Slot.STATES.oof]: 'Absent',
  [Slot.STATES.telework]: 'Télétravail',
  [Slot.STATES.leave]: 'Congé',
};

/**
 * @static
 * @enum {string}
 */
Slot.COLORS = {
  [Slot.STATES.unknown]: 'grey',
  [Slot.STATES.free]: '#1ac01a',
  [Slot.STATES.busy]: 'red',
  [Slot.STATES.tentative]: 'grey',
  [Slot.STATES.oof]: '#e0a80c',
  [Slot.STATES.telework]: '#0f9cfa',
  [Slot.STATES.leave]: '#fa7900',
};
