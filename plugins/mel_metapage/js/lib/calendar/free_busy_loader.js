import { MelEnumerable } from '../classes/enum.js';
import {
  DATE_FORMAT,
  DATE_SERVER_FORMAT,
  DATE_TIME_FORMAT,
} from '../constants/constants.dates.js';
import { EMPTY_STRING } from '../constants/constants.js';
import { MelObject, WrapperObject } from '../mel_object.js';
import { CalendarLoader } from './calendar_loader.js';
import { Slots } from './event/parts/guestspart.free_busy.js';
export { wrapper as FreeBusyLoader };

/**
 * Contient la classe qui permet de récupérer les informations de status de participants
 * @module FreeBusy
 */

/**
 * Clé qui permet de retrouver les dates des dernières mises à jour des status.
 * @constant
 * @package
 * @type {string}
 * @default 'wsp-freebusy-date-'
 */
const KEY_FREEBUSY_DATE = 'wsp-freebusy-date-';

/**
 * @class
 * @classdesc Gère, sauvegarder et récupère les données de status de participants entre deux dates.
 * @package
 * @extends MelObject
 */
class FreeBusyClassLoader extends MelObject {
  constructor() {
    super();
  }

  /**
   * Fonction principale de la classe
   */
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

  /**
   * Charge les statuts des utilisateurs
   * @generator
   * @async
   * @param {string[]} users Utilisateurs que l'on souhaite récupérer le statut
   * @param {number} interval Interval en minute
   * @param {external:moment} sd Date de début
   * @param {external:moment} ed Date de fin
   * @yields {module:EventView/Parts/Guests/FreeBusy.Slots}
   * @returns {AsyncGenerator<Slots>}
   * @frommodulereturn EventView/Parts/Guests/FreeBusy {@linkto Slots} {@membertype .}
   * @package
   */
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

  /**
   * Récupère la bonne url pour récupérer le status
   * @param {string} user Email de l'utilisateur
   * @param {number} interval Interval en minute
   * @param {external:moment} sd Date de début
   * @param {external:moment} ed Date de fin
   * @returns {string}
   * @package
   */
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
   * Sauvegarde les données en mémoire pour un interval, des utilisateurs et une date donnée
   * @param {Slots[]} slots Données à sauvegarder
   * @param {string[]} users Emails des utilisateurs que l'on souhaite sauvegarder
   * @param {number} interval Interval en minute
   * @param {external:moment} start Date de départ
   * @frommoduleparam EventView/Parts/Guests/FreeBusy slots {@linkto Slots} {@membertype .}
   * @package
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

  /**
   * Vérifie si la date en mémoire est antérieur à la dernière date de chargement de l'agenda
   * @param {string} key Clé de la données
   * @returns {boolean}
   * @package
   */
  _is_date_ok(key) {
    const date = this.load(`${KEY_FREEBUSY_DATE}${key}`);

    if (date) {
      const agenda_date = this.load(CalendarLoader.Class.KEY_LAST_REFRESH);

      if (agenda_date) {
        const isok =
          moment(agenda_date, DATE_TIME_FORMAT) >
          moment(date, DATE_TIME_FORMAT);

        this.unload(key);
        return isok;
      }
    }

    return false;
  }

  /**
   * Sauvegarde la date actuelle pour une clé donnée
   * @param {string} key Clé de la donnée à sauvegardée
   * @package
   */
  _save_date(key) {
    this.save(`${KEY_FREEBUSY_DATE}${key}`, moment().format(DATE_TIME_FORMAT));
  }

  /**
   * Charge les données en mémoire pour des utilisateurs, une date et un interval donnée.
   * @param {string[]} users Adresse email des utilisateurs à charger
   * @param {number} interval Interval en minutes
   * @param {external:moment} start Date de départ
   * @returns {Object<string, Slots>} string => Email de l'utilisateur
   * @frommodulereturn EventView/Parts/Guests/FreeBusy {@linkto Slots} {@membertype .}
   * @package
   */
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
   * Génère et récupère les données de statuts par utilisateurs
   * @param {string[]} users Adresse email des utilisateurs
   * @param {Object} param1
   * @param {number} param1.interval Interval en minutes (30 minutes par défaut)
   * @param {external:moment} param1.start Date de départ (Date de maintenant par défaut)
   * @param {external:moment} param1.end Date de fin (Date de maintenant + 7 jours par défaut)
   * @returns {AsyncGenerator<Slots>}
   * @frommodulereturn EventView/Parts/Guests/FreeBusy {@linkto Slots} {@membertype .}
   */
  async *generate(
    users,
    { interval = 30, start = moment(), end = moment().add(7, 'days') },
  ) {
    yield* this._load_free_busy(users, interval, start, end);
  }

  /**
   * Génère et récupère les données de statuts par utilisateurs.
   *
   * Sauvegarde en mémoire les données récupérés.
   * @param {string[]} users Adresse email des utilisateurs
   * @param {Object} param1
   * @param {number} param1.interval Interval en minutes (30 minutes par défaut)
   * @param {external:moment} param1.start Date de départ (Date de maintenant par défaut)
   * @param {external:moment} param1.end Date de fin (Date de maintenant + 7 jours par défaut)
   * @param {boolean} param1.save true par défaut
   * @returns {AsyncGenerator<Slots>}
   * @frommodulereturn EventView/Parts/Guests/FreeBusy {@linkto Slots} {@membertype .}
   */
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

  /**
   * Récupère les données de status d'utilisateurs
   * @param {string[]} users Emails des utilisateurs
   * @param {Object} param1
   * @param {number} param1.interval Interval en minutes (30 minutes par défaut)
   * @param {external:moment} param1.start Date de départ (Date de maintenant par défaut)
   * @param {external:moment} param1.end Date de fin (Date de maintenant + 7 jours par défaut)
   * @returns {Promise<Object<string, Slots>>}
   * @frommodulereturn EventView/Parts/Guests/FreeBusy {@linkto Slots} {@membertype .}
   */
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

  /**
   * Charge les données en mémoire d'utilisateurs.
   * @param {string[]} users Email des utilisateurs
   * @param {number} interval Interval en minute
   * @param {external:moment} start Date de début
   * @returns {Object<string, Slots>}
   * @frommodulereturn EventView/Parts/Guests/FreeBusy {@linkto Slots} {@membertype .}
   */
  load_from_memory(users, interval, start) {
    return this._load(users, interval, start);
  }

  /**
   * Supprime les données dans le stockages local lié aux status
   */
  clear_in_memory() {
    this.save('free_busy', {});
  }
}

// /**
//  * Instance de FreeBusyClassLoader
//  * @package
//  * @type {FreeBusyClassLoader}
//  * @frommodule FreeBusy
//  */
// let _fb_instance = null;

/**
 * Contient une instance de FreeBusyClassLoader
 * @alias FreeBusyLoader
 * @type {WrapperObject<FreeBusyClassLoader>}
 * @frommodule FreeBusy {@linkto FreeBusyClassLoader}
 * @member FreeBusy
 * @public
 */
let wrapper = WrapperObject.Create(FreeBusyClassLoader);
// let wrapper = {
//   /**
//    * @type {FreeBusyLoader}
//    * @readonly
//    * @frommodule FreeBusy
//    */
//   Instance: null,
// };

// Object.defineProperty(wrapper, 'Instance', {
//   get() {
//     if (!_fb_instance) _fb_instance = new FreeBusyClassLoader();

//     return _fb_instance;
//   },
// });
