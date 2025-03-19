import { isNullOrUndefined } from '../../../../../mel_metapage/js/lib/mel.js';
import { Locks } from '../locks.js';

export { VisioData, ConfigVisioData, IntegratedVisioData };

/**
 * Contient les structures de données utile à la visio
 * @module Visio/Structures/Data
 * @local VisioData
 * @local ConfigVisioData
 * @local IntegratedVisioData
 * @local RawVisioData
 * @local RawVisioData2
 * @local RawConfigVisioData
 * @local RawConfigVisioData2
 * @local RawConfigData
 */

/**
 * Données brutes récupérer par le php
 * @typedef RawVisioData
 * @property {?string} key
 * @property {?string} wsp
 * @property {?string} channel
 * @property {?string} pass
 */

/**
 * Données brutes récupérer par le php avec "password" au lieu de "pass"
 * @typedef RawVisioData2
 * @property {?string} key
 * @property {?string} wsp
 * @property {?string} channel
 * @property {?string} password
 */

/**
 * Données brutes récupérer par le php
 * @typedef RawConfigVisioData
 * @property {?string} key
 * @property {?string} wsp
 * @property {?string} channel
 * @property {?string} pass
 * @property {boolean} need_config
 * @property {Locks} locks
 */

/**
 * Données brutes récupérer par le php avec "password" au lieu de "pass"
 * @typedef RawConfigVisioData2
 * @property {?string} key
 * @property {?string} wsp
 * @property {?string} channel
 * @property {?string} password
 * @property {boolean} need_config
 * @property {Locks} locks
 */

/**
 * (RawVisioData | RawVisioData2 | RawConfigVisioData | RawConfigVisioData2)
 * @typedef {RawVisioData | RawVisioData2 | RawConfigVisioData | RawConfigVisioData2} RawConfigData
 */

/**
 * @class
 * @classdesc Contient les données de la visio
 */
class VisioData {
  /**
   * Initalise la classe à partir de données brutes
   * @param {RawVisioData | RawVisioData2} data Données brutes
   * @frommoduleparam  Visio/Structures/Data data {@linkto RawVisioData2}
   */
  constructor(data) {
    this._init()._setup(data);
  }

  /**
   * Initialise la classe
   * @returns {VisioData}
   * @private
   */
  _init() {
    /**
     * Clé de la visioconférence
     * @type {?string}
     */
    this.key = null;
    /**
     * Espace de travail lié à la visio
     * @type {?string}
     */
    this.wsp = null;
    /**
     * Tchat lié à la visio
     * @type {?string}
     * @deprecated
     */
    this.channel = null;
    /**
     * Mot de passe lié à la visio
     * @type {?string}
     */
    this.pass = null;

    return this;
  }

  /**
   * Assigne les données
   * @param {RawVisioData | RawVisioData2} data
   * @private
   */
  _setup(data) {
    this.key = data.key;
    this.room = data.room;
    this.channel = data.channel;
    this.pass = data.password || data.pass;
  }

  /**
   * Transform en config pour un appel ajax
   * @returns {Object<string, string>}
   */
  to_ajax_params() {
    let config = {};
    for (const key in this) {
      if (Object.hasOwnProperty.call(this, key)) {
        const element = this[key];
        if (!isNullOrUndefined(element)) config[`_${key}`] = element;
      }
    }

    return config;
  }
}

/**
 * @class
 * @classdesc Contient le données de la page de configuration de la visio
 * @extends VisioData
 *
 */
class ConfigVisioData extends VisioData {
  /**
   * Initalise la classe à partir de données brutes
   * @param {RawConfigData} data Données brutes
   */
  constructor(data) {
    super(data);
  }

  /**
   * @private
   * @returns {this}
   */
  _init() {
    super._init();
    this.need_config = null;
    this.locks = null;
    return this;
  }

  /**
   * @private
   * @returns {void}
   */
  _setup(data) {
    super._setup();
    const locks = new Locks();
    Object.defineProperties(this, {
      locks: {
        get() {
          return locks;
        },
      },
    });

    this.need_config = data.need_config;
  }

  /**
   * Transform en config pour un appel ajax
   * @returns {Object<string, string>}
   * @override
   */
  to_ajax_params() {
    let config = super.to_ajax_params();

    config['_locks'] = rcmail.env['webconf.locks'];

    return config;
  }
}

/**
 * @class
 * @classdesc
 * @extends VisioData
 */
class IntegratedVisioData extends VisioData {
  /**
   * Initalise la classe à partir de données brutes
   * @param {RawConfigData} data Données brutes
   */
  constructor(data) {
    super(data);
  }

  /**
   * @private
   * @returns {this}
   */
  _init() {
    super._init();
    this.from_config = null;
    return this;
  }

  /**
   * @private
   * @returns {void}
   */
  _setup(data) {
    super._setup();
    this.from_config = data.from_config;
  }
}
