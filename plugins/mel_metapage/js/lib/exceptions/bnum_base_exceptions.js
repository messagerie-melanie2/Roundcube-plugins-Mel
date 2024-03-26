/**
 * @module Exceptions
 */

import { BnumLog } from "../classes/bnum_log.js";
export {BnumException}

/**
 * @class
 * @classdesc Exception qui contient diverses informations en plus qu'une erreur classique ainsi que de fonctionnalités en plus.
 * @extends Error
 */
class BnumException extends Error {
    /**
     * Constructeur de la classe
     * @param {*} errored_item Objet qui a causé l'exception 
     * @param {string} message Message qui indique ce qui a causé l'exception 
     * @param  {...any} args Données supplémentaires qui aideront à comprendre l'erreur 
     */
    constructor(errored_item, message, ...args) {
        super(message);
        /**
         * Objet qui a causé l'exception
         * @type {!any}
         * @readonly
         * @member
         */
        this.errored_item = null;
        /**
         * Données supplémentaires qui aideront à comprendre l'erreur
         * @type {Array}
         * @member
         * @readonly
         */
        this.args = [];
        Object.defineProperties(this, {
            errored_item: {
                get() {
                    return errored_item;
                }
            },
            args: {
                get() {
                    return args;
                }
            }
        });
    }

    /**
     * Permet de log l'exception
     * @private
     * @param {!string} function_name Nom de la fonction qui à lancer ce log
     * @param {Object} param1 Paramètre optionnels
     * @param {import("../classes/bnum_log.js").LogLevel} param1.type Niveau de log de l'erreur. Doit être `fatal` ou `error`. `BnumLog.LogLevels.error` par défaut.
     * @param {boolean} param1.force Force l'affichage du log, même si il n'a pas été configurer sur ce niveau par défaut. `false` par défaut.
     * @param {boolean} param1.debug Si vrai, lance un point d'arrêt. `false` par défaut.
     * @returns {void}
     */
    _log(function_name, {type = BnumLog.LogLevels.error, force = false, debug = false}) {
        const class_name = this.constructor.name;

        if (force) {
            var loglevel = BnumLog.log_level;
            BnumLog.set_log_level(BnumLog.LogLevels.trace);
        }

        switch (type) {
            case BnumLog.LogLevels.error:
                BnumLog.error(function_name, `{${class_name}}`, this.message, ...this.items());
                break;

            case BnumLog.LogLevels.fatal:
                BnumLog.fatal(function_name, `{${class_name}}`, this.message, ...this.items());
                break;

            default:
                BnumLog.warning('BnumException/_log', 'Le log level ne peut être que "error" ou "fatal".', 'loglevel : ', type,  'force traces ? : ', force, 'enabled debugger ? :', debug);
                
                if (force) {
                    BnumLog.set_log_level(loglevel);
                }

                return this._log(function_name, {force, debug, type:BnumLog.LogLevels.error});
        }

        if (debug) BnumLog.debugger(function_name, `{${class_name}}`, ...this.args);
        else BnumLog.debug(function_name, `{${class_name}}`, ...this.args);

        if (force) {
            BnumLog.set_log_level(loglevel);
        }
    }

    /**
     * Parcour les objets qui ont causé l'érreur.
     * @generator
     * @yield {any}
     */
    * items() {
        yield this.errored_item;
    }

    /**
     * Affiche l'erreur
     * @param {!string} function_name Nom de la fonction qui à appeler ce log.
     */
    log(function_name) {
        this._log(function_name, {});
    } 

    /**
     * Affiche l'erreur sous forme d'erreur fatale.
     * @param {!string} function_name Nom de la fonction qui à appeler ce log.
     * @param {Object} destructured
     * @param {boolean}  destructured.enable_debugging Si vrai, met un point d'arrêt. `false` par défaut.
     */
    log_fatal(function_name, {enable_debugging = false}) {
        this._log(function_name, {type: BnumLog.LogLevels.fatal, force:true, debug:enable_debugging});
    }

    /**
     * Affiche l'erreur, même si il n'a pas été configurer sur le niveau "erreur" par défaut.
     * @param {!string} function_name Nom de la fonction qui à appeler ce log.
     */
    complete_logs(function_name) {
        this._log(function_name, {force:true});
    }

    /**
     * Check si l'erreur hérite de `BnumException` ou non.
     * @static
     * @param {Error | BnumException} error Erreur à vérifier 
     * @returns {boolean}
     */
    static IsBnumError(error) {
        return error instanceof BnumException;
    }
}