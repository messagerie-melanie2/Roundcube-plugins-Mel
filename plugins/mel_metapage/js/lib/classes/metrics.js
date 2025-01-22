import { EMPTY_STRING } from '../constants/constants.js';
import { BnumLog } from './bnum_log.js';
import { MelEnumerable } from './enum.js';

export { BaseLookLabel, LookLabel, LookDatas, Look };

/**
 * @module Metrics
 * @local Serialize
 * @local BaseLookLabel
 * @local LookLabel
 * @local LookDatas
 * @local Look
 */

/**
 * @class
 * @classdesc Interface pour la serialisation
 * @interface
 * @hideconstructor
 */
class ISerialize {
  constructor() {}

  /**
   * Serialise la classe
   * @return {string}
   * @abstract
   */
  serialize() {}

  /**
   * Transforme la classe en chaîne de charactère
   * @returns {string}
   */
  toString() {
    return this.serialize();
  }
}

/**
 * @class
 * @classdesc Label de base d'une metric, contient le minimum de données
 * @implements {ISerialize}
 * @frommodule Metrics
 */
class BaseLookLabel extends ISerialize {
  /**
   * Assigne les données ou les récupère depuis rcmail.
   * @param {Object} [options={}]
   * @param {string} [options.userid=EMPTY_STRING] Id de l'utilisateur. Si vide, utilise `rcmail.env.username`
   * @param {string} [options.service=EMPTY_STRING] Service de l'utilisateur, si vide, utilise `rcmail.env.current_user.dn`
   */
  constructor({ userid = EMPTY_STRING, service = EMPTY_STRING } = {}) {
    super();
    /**
     * Id de l'utilisateur
     * @type {string}
     */
    this.userid = userid || rcmail.env.username;
    /**
     * Service de l'utilisateur
     * @type {string}
     */
    this.service =
      service ||
      this.#_get_full_user_service(rcmail.env.current_user.dn) ||
      this.#_get_user_service();
  }

  /**
   * @param {string} dn
   * @return {string}
   * @private
   */
  #_get_full_user_service(dn) {
    if (dn && dn.includes(',')) {
      dn = dn.split(',');
      dn = dn.slice(1, dn.length).join(',');
    }

    return dn;
  }

  #_get_user_service() {
    const max = rcmail.env.current_user.full.includes(' SG') ? 2 : 1;
    return MelEnumerable.from(
      rcmail.env.current_user.full.split('- ')[1].split('/'),
    )
      .where((x, i) => i < max)
      .join('/');
  }

  /**
   * Récupère les données sous forme de string
   * @returns {string}
   * @override
   */
  serialize() {
    return JSON.stringify(this);
  }
}

/**
 * @class
 * @classdesc Contient les données pour une métrics
 * @extends BaseLookLabel
 */
class LookLabel extends BaseLookLabel {
  /**
   * Assigne les données ou les récupère depuis rcmail.
   *
   * Récuppère les données du navigateur.
   * @param {Object} [options={}]
   * @param {string} [options.userid=EMPTY_STRING] Id de l'utilisateur. Si vide, utilise `rcmail.env.username`
   * @param {string} [options.service=EMPTY_STRING] Service de l'utilisateur, si vide, utilise `rcmail.env.current_user.dn`
   */
  constructor({ userid = EMPTY_STRING, service = EMPTY_STRING } = {}) {
    super({ userid, service });
    /**
     * Navigateur
     * @type {string}
     */
    this.browser = navigator.userAgent;
    /**
     * Nom du navigateur
     * @type {string}
     */
    this.bowserName = this.get_browser();
    /**
     * Vesrion du navigateur
     * @type {string}
     */
    this.browserVersion = navigator.appVersion;
    /**
     * Plateforme
     * @type {string}
     */
    this.platform = navigator.platform;
    /**
     * Language du navigateur
     * @type {string}
     */
    this.language = navigator.language;
    /**
     * Si on vient d'un téléphone
     * @type {string}
     */
    this.isMobile = (
      /Mobi/.test(navigator.userAgent) ||
      ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0)
    ).toString();

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const screenResolution = `${screenWidth}x${screenHeight}`;
    /**
     * Résolution de l'écran
     * @type {string}
     */
    this.screen_resolution = screenResolution;
  }

  /**
   * Récupère les données sous forme de string
   * @returns {string}
   */
  serialize() {
    return JSON.stringify(this);
  }

  /**
   * Récupère le nom du navigateur
   * @returns {string}
   */
  get_browser() {
    if (!LookLabel.browser) {
      // eslint-disable-next-line no-inner-declarations
      function getBrowserType() {
        const test = (regexp) => {
          return regexp.test(navigator.userAgent);
        };

        if (test(/opr\//i) || !!window.opr) {
          return 'Opera';
        } else if (test(/edg/i)) {
          return 'Microsoft Edge';
        } else if (test(/chrome|chromium|crios/i)) {
          return 'Google Chrome';
        } else if (test(/firefox|fxios/i)) {
          return 'Mozilla Firefox';
        } else if (test(/safari/i)) {
          return 'Apple Safari';
        } else if (test(/trident/i)) {
          return 'Microsoft Internet Explorer';
        } else if (test(/ucbrowser/i)) {
          return 'UC Browser';
        } else if (test(/samsungbrowser/i)) {
          return 'Samsung Browser';
        } else {
          return 'Unknown browser';
        }
      }

      LookLabel.browser = getBrowserType();
    }

    return LookLabel.browser;
  }
}

/**
 * @class
 * @classdesc Données des métrics
 * @implements {ISerialize}
 * @frommodule Metrics
 */
class LookDatas extends ISerialize {
  /**
   *
   * @param {Object} [options={}]
   * @param {string} [options.metric_name=EMPTY_STRING] Nom de la metrics
   * @param {number} [options.metric_value=1] Valeur de la metrics
   * @param {BaseLookLabel | null} [options.labels=null]  Label, si null, un {@link LookLabel} sera mis par défaut
   */
  constructor({
    metric_name = EMPTY_STRING,
    metric_value = 1,
    labels = null,
  } = {}) {
    super();

    /**
     * Nom de la metrics
     * @type {string}
     */
    this.metric_name = metric_name;
    /**
     * Valeur de la metrics
     * @type {number}
     */
    this.metric_value = metric_value;
    /**
     * Label de la metrics
     * @type {BaseLookLabel}
     */
    this.labels = labels || new LookLabel();
  }

  /**
   * Récupère les données sous forme de string
   * @returns {string}
   */
  serialize() {
    return JSON.stringify(this);
  }
}

/**
 * @class
 * @classdesc Permet d'envoyer des données
 * @abstract
 * @hideconstructor
 */
class Look {
  /**
   * Envoie des données au serveur
   * @param {string} name Nom de la valeur
   * @param {number} value Valeur de la metrics
   * @param {BaseLookLabel | null} [labels=null] Label de la données
   * @returns {Promise<void>}
   * @static
   * @async
   */
  static async Send(name, value, labels = null) {
    const lookData = new LookDatas({
      metric_name: name,
      metric_value: value,
      labels,
    });
    const config = {
      url: this.URL,
      type: 'POST',
      data: lookData.serialize(),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.TOKEN}`,
      },
      success(result) {
        BnumLog.info(`Résultat de la requête : ${JSON.stringify(result)}`);
      },
      error(result) {
        BnumLog.error("Erreur lors de l'envoi de la métrique :", result);
      },
    };

    await $.ajax(config);
  }

  /**
   * Envoie des metrics lié à la tâche au serveyr
   * @param {string} task Nom de la tâche
   * @param {BaseLookLabel} [labels=new BaseLookLabel()]
   * @returns {Promise<void>}
   * @static
   * @async
   */
  static async SendTask(task, labels = new BaseLookLabel()) {
    return await this.Send(`bnum_${task}`, 1, labels);
  }
}

/**
 * Url du serveur
 * @type {string}
 * @readonly
 * @static
 */
Look.URL = rcmail.env.mel_metrics_url;
/**
 * Token du serveur
 * @type {string}
 * @readonly
 * @static
 */
Look.TOKEN = rcmail.env.mel_metrics_token;
/**
 * Interval d'envoie de la tpache en cours
 * @type {number}
 * @readonly
 * @static
 */
Look.SEND_INTERVAL = rcmail.env.mel_metrics_send_interval;
