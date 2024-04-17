/**
 * @module Cookies
 */

import { EMPTY_STRING } from "../constants/constants.js";

/**
 * Donnée qui peut être mis en argument d'un objet moment.
 * @typedef {moment | string | Date} ExpireDate
 */

/**
 * @class
 * @classdesc Représente et gère un cookie
 */
export class Cookie {
    /**
     * 
     * @param {!string} key Nom du cookie
     * @param {!*} value Valeur du cookie. 
     */
    constructor(key, value = EMPTY_STRING) {
        /**
         * Nom du cookie
         * @member
         * @type {string}
         * @readonly
         */
        this.key = EMPTY_STRING;
        /**
         * Valeur du cookie
         * @member
         * @type {!any}
         */
        this.value = EMPTY_STRING;
        let _key = key;
        let _value = value;
        Object.defineProperties(this, {
            key: {
                get: function() {
                    return _key;
                },
                configurable: true
            },
            value: {
                get: function() {
                    return _value;
                },
                set:(val) => {
                    this.update_value(val);
                },
                configurable: true
            },            
        });
    }

    /**
     * Met à jour la valeur du cookie
     * @param {!any} new_value Nouvelle valeur du cookie
     * @param {Date | boolean} expire Date d'expiration
     * @returns {Cookie} Chaînage
     */
    update_value(new_value, expire = false) {
        rcmail.set_cookie(this.key, new_value, expire);
        return this;
    }

    /**
     * Supprime le cookie.
     * 
     * Retourne le cookie supprimer.
     * @returns {Cookie}
     */
    remove() {
        this.update_value(EMPTY_STRING, moment());
        return new Cookie(key, null);
    }

    /**
     * Récupère l'objet qui représente l'expiration de la date
     * @param {ExpireDate} item Représentation à convertir
     * @returns {Date}
     */
    static get_expire(item) {
        return moment(item).toDate();
    }

    /**
     * Créer un cookie
     * @param {string} key Nom du cookie
     * @param {!*} value Valeur du cookie
     * @param {Date | boolean} expire Date d'expiration
     * @returns {Cookie}
     */
    static set_cookie(key, value, expire = false) {
        return new Cookie(key).update_value(value, expire);
    }

    /**
     * Récupère un cookie
     * @param {!string} key Nom du cookie
     * @returns {Cookie}
     */
    static get_cookie(key) {
        return new Cookie(key, rcmail.get_cookie(key));
    }

    /**
     * Supprime un cookie
     * @param {!string} key Nom du cookie
     * @returns {Cookie} Cookie supprimé
     */
    static remove_cookie(key) {
        return new Cookie(key).remove();
    }
}