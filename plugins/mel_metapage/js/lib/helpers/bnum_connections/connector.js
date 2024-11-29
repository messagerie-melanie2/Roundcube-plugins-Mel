import { BnumLog } from '../../classes/bnum_log.js';
import { EMPTY_STRING } from '../../constants/constants.js';
import { MelObject } from '../../mel_object.js';
import { Mel_Promise } from '../../mel_promise.js';
export { Connector };

/**
 * Représente un connecteur avec le back-end
 */
class Connector {
  /**
   * Constructeur de la classe
   * @param {string} task Nom de la tâche qui permet de récupérer les données
   * @param {string} action Nom de l'action qui permet de récupérer les données
   * @param {Object} param2
   * @param {Symbol} param2.type Type de la requête (Connector.enums.type)
   * @param {any | {} | null} param2.params Paramètres de la requête
   * @param {null | function} param2.moulinette Action à faire une fois les données récupérés
   * @param {{} | JSON} param2.needed Paramètres à mettre dans `connect` et à compléter pour que ça fonctionne
   */
  constructor(
    task,
    action,
    {
      type = Connector.enums.type.get,
      params = null,
      moulinette = null,
      needed = {},
    },
  ) {
    //Init pour inteliscense
    this.task = EMPTY_STRING;
    this.action = EMPTY_STRING;
    this.type = Connector.enums.type.get;
    this.params = null;
    this.on_success = null;
    this.needed = null;
    //Getter des variables privés
    Object.defineProperties(this, {
      task: {
        get: function () {
          return task;
        },
        configurable: false,
      },
      action: {
        get: function () {
          return action;
        },
        configurable: false,
      },
      type: {
        get: function () {
          return type;
        },
        configurable: false,
      },
      params: {
        get: function () {
          return params;
        },
        configurable: false,
      },
      on_success: {
        get: function () {
          return moulinette;
        },
        configurable: false,
      },
      needed: {
        get: function () {
          return JSON.parse(JSON.stringify(needed));
        },
        configurable: false,
      },
    });
  }

  /**
   * Connecte le front avec le back
   *
   * Récupère ou envoi des données au serveur
   * @param {Object} param0
   * @param {*} param0.params Paramètres additionnels
   * @param {*} param0.default_return Valeur de retour par défaut
   * @returns {Promise<{datas: any | null, has_error: boolean, error: any | null}>} Retourne les données récupérés ou null si il y a une erreur
   */
  async connect({ params = null, default_return = null }) {
    let return_datas = null;
    let error_datas = {
      has_error: false,
      error: null,
    };

    BnumLog.info('connect', `Connecting to ${this.task}/${this.action}`);

    if (
      Connector.constants.in_progress_task === this.task &&
      Connector.constants.in_progress === this.action
    ) {
      error_datas.has_error = true;
      error_datas.error = 'Connector is in progress';
      BnumLog.warning(
        'connect',
        `${this.task}/${this.action}`,
        'Connector is in progress !',
      );
    } else {
      let url_parameters = this.params ?? {};
      if (params !== null) {
        const keys = Object.keys(params);
        for (let index = 0, key; index < keys.length; ++index) {
          key = keys[index];
          url_parameters[key] = params[key];
        }
      }

      let promise;
      switch (this.type) {
        case Connector.enums.type.get:
          promise = new Mel_Promise(() => {}).create_ajax_get_request({
            url: MelObject.Empty().url(this.task, {
              action: this.action,
              params: url_parameters,
            }),
            success: (datas) => {
              try {
                if (typeof datas === 'string') datas = JSON.parse(datas);
              } catch (error) {
                BnumLog.debug('connect', 'datas', datas, error);
              }

              return_datas = datas;

              BnumLog.info('connect', 'Connected !');
            },
            failed: (...args) => {
              error_datas.has_error = true;
              error_datas.error = args;
              BnumLog.error(
                'connect',
                `${this.task}/${this.action}`,
                'Connexion failed !',
                ...args,
              );
            },
          });
          break;
        case Connector.enums.type.post:
          promise = new Mel_Promise(() => {}).create_ajax_post_request({
            url: MelObject.Empty().url(this.task, { action: this.action }),
            datas: url_parameters,
            success: (datas) => {
              try {
                if (typeof datas === 'string') datas = JSON.parse(datas);
              } catch (error) {
                BnumLog.debug('connect', 'datas', datas, error);
              }

              return_datas = datas;
              BnumLog.info('connect', 'Connected !');
            },
            failed: (...args) => {
              error_datas.has_error = true;
              error_datas.error = args;
              BnumLog.error(
                'connect',
                `${this.task}/${this.action}`,
                'Connexion failed !',
                ...args,
              );
            },
          });
          break;
        default:
          throw new Error('Unknown connector type');
      }

      await promise;
    }

    return_datas = {
      datas: return_datas ?? default_return,
      has_error: error_datas.has_error,
      error: error_datas.error,
      params,
    };

    if (!error_datas.has_error) {
      if (
        !!this.on_success &&
        this.on_success.constructor.name === 'AsyncFunction'
      )
        return_datas = await this.on_success(return_datas, this);
      else return_datas = this.on_success?.(return_datas, this) ?? return_datas;
    }

    BnumLog.info(
      'connect',
      `${this.task}/${this.action}`,
      'Connection ended !',
    );

    return return_datas;
  }

  /**
   * Connecte le front avec le back
   *
   * Récupère ou envoi des données au serveur, ignore les erreurs.
   * @param {Object} param0
   * @param {*} param0.params Paramètres additionnels
   * @param {*} param0.default_return Valeur de retour par défaut
   * @returns {Promise<{datas: any | null, has_error: boolean, error: any | null}>} Retourne les données récupérés
   */
  async force_connect({ params = null, default_return = null }) {
    return (
      (await this.connect({ params, default_return })).datas ?? default_return
    );
  }

  /**
   * Représente un connecteur qui n'éxiste pas encore
   * @returns {Connector}
   */
  static in_work() {
    return new Connector(
      Connector.constants.in_progress_task,
      Connector.constants.in_progress,
      {},
    );
  }

  static Create(
    task,
    action,
    {
      type = Connector.enums.type.get,
      params = null,
      moulinette = null,
      needed = {},
    },
  ) {
    return new Connector(task, action, { type, params, moulinette, needed });
  }
}

Connector.enums = {};
/**
 * @enum {Symbol}
 */
Connector.enums.type = {
  get: Symbol('get'),
  post: Symbol('post'),
};
Connector.constants = {
  in_progress: 'in_progress',
  in_progress_task: 'mel_metapage',
};
