import { BnumLog } from "../../classes/bnum_log.js";
import { EMPTY_STRING } from "../../constants/constants.js";
import { MelObject } from "../../mel_object";
import { Mel_Promise } from "../../mel_promise";
export {Connector};

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
    constructor(task, action, {
        type = Connector.enums.type.get,
        params = null,
        moulinette = null,
        needed = {}
    }){
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
                get: function() {
                    return task;
                },
                configurable: false
            },
            action: {
                get: function() {
                    return action;
                },
                configurable: false
            },
            type: {
                get: function() {
                    return type;
                },
                configurable: false
            },
            params: {
                get: function() {
                    return params;
                },
                configurable: false
            },
            on_success: {
                get: function() {
                    return moulinette;
                },
                configurable: false
            },
            needed: {
                get: function() {
                    return JSON.parse(JSON.stringify(needed));
                },
                configurable: false
            }
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
    async connect({
        params = null,
        default_return = null
    }) {
        let return_datas = null;
        let error_datas = {
            has_error: false,
            error: null
        };

        if (Connector.constants.in_progress_task === this.task && Connector.constants.in_progress === this.action) {
            error_datas.has_error = true;
            error_datas.error = 'Connector is in progress';
        }
        else {
            let url_parameters = this.params ?? {};
            if (null !== params) {
                const keys = Object.keys(params);
                for (let index = 0, key; index < keys.length; ++index) {
                    key = keys[index];
                    url_parameters[key] = params[key];
                }
            }
    
            switch (type) {
                case Connector.enums.type.get:
                    await new Mel_Promise(() => {}).create_ajax_get_request({
                        url:MelObject.Empty().url(this.task, {action:this.action, params:url_parameters}),
                        success:(datas) => {
                            try {
                                if ('string' === typeof datas) datas = JSON.parse(datas);
                            } catch (error) {
                                BnumLog.debug('connect', 'datas', datas, error);
                            }
    
                            if (null !== this.on_success) return_datas = this.on_success(datas);
                            else return_datas = datas;
                        },
                        failed:(...args) => {
                            error_datas.has_error = true;
                            error_datas.error = args;
                        }
                    });
                    break;
                case Connector.enums.type.post:
                    await new Mel_Promise(() => {}).create_ajax_post_request({
                        url:MelObject.Empty().url(this.task, {action:this.action, params:url_parameters}),
                        success:(datas) => {
                            try {
                                if ('string' === typeof datas) datas = JSON.parse(datas);
                            } catch (error) {
                                BnumLog.debug('connect', 'datas', datas, error);
                            }
    
                            if (null !== this.on_success) return_datas = this.on_success(datas);
                            else return_datas = datas;
                        },
                        failed:(...args) => {
                            error_datas.has_error = true;
                            error_datas.error = args;
                        }
                    });
                    break;
                default:
                    throw new Error('Unknown connector type');
            }
        }


        return {
            datas: return_datas ?? default_return,
            has_error: error_datas.has_error,
            error: error_datas.error
        };
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
    async force_connect({
        params = null,
        default_return = null
    }) {
        return (await this.connect({params, default_return})).datas ?? default_return;
    }

    /**
     * Représente un connecteur qui n'éxiste pas encore
     * @returns {Connector}
     */
    static in_work() {
        return new Connector(Connector.constants.in_progress_task, Connector.constants.in_progress, {});
    }
}

Connector.enums = {};
Connector.enums.type = new MelEnum({
    get: Symbol(),
    post: Symbol()
});
Connector.constants = {
    in_progress: 'in_progress',
    in_progress_task: 'mel_metapage'
} ;