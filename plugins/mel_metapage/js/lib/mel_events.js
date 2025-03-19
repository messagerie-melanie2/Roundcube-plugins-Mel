import { MelEnumerable } from './classes/enum.js';

export {
  RotomecaEvent as BnumEvent,
  MelConditionnalEventItem,
  MelConditionnalEvent,
};

/**
 * @class
 * @classdesc Représente un évènement. On lui ajoute ou supprime des callbacks, et on les appelle les un après les autres.
 * @alias BnumEvent
 * @template T
 */
class RotomecaEvent {
  constructor() {
    /**
     * Liste des évènements à appeler
     * @type {Object<string, T>}
     * @member
     */
    this.events = {};
    /**
     *	Compteur d'évènements
     * @type {number}
     * @private
     */
    this._count = 0;
  }

  /**
   * Ajoute un callback
   * @param {T} event Callback qui sera appelé lors de l'appel de l'évènement
   * @param  {...any} args Liste des arguments qui seront passé aux callback
   * @returns {string} Clé créée
   */
  push(event, ...args) {
    const key = this._generateKey();
    this.events[key] = { args, callback: event };
    ++this._count;
    return key;
  }

  /**
   * Ajoute un callback avec un clé qui permet de le retrouver plus tard
   * @param {string} key Clé de l'évènement
   * @param {T} event Callback qui sera appelé lors de l'appel de l'évènement
   * @param  {...any} args Liste des arguments qui seront passé aux callback
   */
  add(key, event, ...args) {
    if (!this.events[key]) ++this._count;

    this.events[key] = { args, callback: event };
  }

  /**
   * Vérifie si une clé éxiste
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return !!this.events[key];
  }

  /**
   * Supprime un callback
   * @param {string} key Clé
   */
  remove(key) {
    this.events[key] = null;

    --this._count;
  }

  /**
   * Met les count à jours si il y a des modification directement via `events`
   * @returns {RotomecaEvent<T>}
   */
  rebase() {
    let rebased = MelEnumerable.from(this.events).where((x) => !!x?.value);

    this.events = rebased.toJsonDictionnary(
      (x) => x.key,
      (x) => x.value,
    );
    this._count = rebased.count();

    rebased = null;
    return this;
  }

  /**
   * Renvoie si il y a des évènements ou non.
   * @returns {boolean}
   */
  haveEvents() {
    return this.count() > 0;
  }

  /**
   * Affiche le nombre d'évènements
   * @returns {number}
   */
  count() {
    return this._count;
  }

  /**
   * Génère une clé pour l'évènement
   * @private
   * @returns {string}
   */
  _generateKey() {
    const g_key =
      window?.mel_metapage?.Functions?.generateWebconfRoomName?.() ||
      Math.random() * (this._count + 10);

    let ae = false;
    for (const key in this.events) {
      if (Object.hasOwnProperty.call(this.events, key)) {
        if (key === g_key) {
          ae = true;
          break;
        }
      }
    }

    if (ae) return this._generateKey();
    else return g_key;
  }

  /**
   * Appèle les callbacks
   * @param  {...any} params Paramètres à envoyer aux callbacks
   * @returns {null | any | Array}
   */
  call(...params) {
    let results = {};
    const keys = Object.keys(this.events);

    if (keys.length !== 0) {
      for (let index = 0, len = keys.length; index < len; ++index) {
        const key = keys[index];

        if (this.events[key]) {
          const { args, callback } = this.events[key];

          if (callback)
            results[key] = this._call_callback(
              callback,
              ...[...args, ...params],
            );
        }
      }
    }

    switch (Object.keys(results).length) {
      case 0:
        return null;
      case 1:
        return results[Object.keys(results)[0]];
      default:
        return results;
    }
  }

  /**
   * Lance un callback
   * @param {T} callback Callback à appeler
   * @param  {...any} args Paramètres à envoyer aux callbacks
   * @returns {*}
   */
  _call_callback(callback, ...args) {
    return callback(...args);
  }

  /**
   * Appèle les callbacks
   * @param  {...any} params Paramètres à envoyer aux callbacks
   * @returns {Promise<null | any | Array>}
   * @async
   */
  async asyncCall(...params) {
    let asyncs = [];
    for (const key in this.events) {
      if (Object.hasOwnProperty.call(this.events, key)) {
        const { args, callback } = this.events[key];
        if (callback)
          asyncs.push(this._call_callback(callback, ...[...args, ...params]));
      }
    }

    const results = (await Promise.allSettled(asyncs)).map((x) => x.value);

    switch (results.length) {
      case 0:
        return null;
      case 1:
        return results[Object.keys(results)[0]];
      default:
        return results;
    }
  }

  /**
   * Vide la classe
   */
  clear() {
    this.events = {};
    this._count = 0;
  }
}

class MelConditionnalEventItem {
  constructor({ action = (...args) => args, aditionnalDatas = null }) {
    this._init()._setup(action, aditionnalDatas);
  }

  _init() {
    this.action = (...args) => args;
    this.datas = null;
    return this;
  }

  _setup(...args) {
    const { action, datas } = args;
    this.action = action;
    this.datas = datas;
    return this;
  }
}

class MelConditionnalEvent extends RotomecaEvent {
  constructor() {
    super();
  }

  *yieldCall(validCondition, ...params) {
    const keys = Object.keys(this.events);

    if (keys.length !== 0) {
      for (let index = 0, len = keys.length; index < len; ++index) {
        const key = keys[index];
        const { args, callback } = this.events[key];

        if (!!callback && validCondition(key, callback.datas))
          yield callback.action(...[...args, ...params]);
      }
    }
  }

  call(validCondition, ...args) {
    [...this.yieldCall(validCondition, ...args)];
  }

  pushConditionnalItem({
    action = (...args) => args,
    additionnalDatas = null,
  }) {
    this.push(new MelConditionnalEventItem(action, additionnalDatas));
    return this;
  }
}
