/**
 * @module BnumNotification
 * @local BnumNotification
 * @local BnumNotificationAction
 * @local NotificationException
 */

import { BnumException } from "../../mel_metapage/js/lib/exceptions/bnum_base_exceptions.js";
export {BnumNotification, BnumNotificationAction}

/**
 * @class
 * @classdesc Représente une exception pour les notifications
 * @extends BnumException
 * @package
 * @frommodule Exceptions
 */
class NotificationException extends BnumException {
    /**
     * 
     * @param {*} notifications_datas 
     * @param {string} message 
     */
    constructor(notifications_datas, message) {
        super(notifications_datas, message);
    }
}

/**
 * @class 
 * @classdesc Représente une action à effectuer lorsqu'une notification est cliquée
 */
class BnumNotificationAction {
    /**
     * 
     * @param {string} command Commande à appeler
     * @param {string} text Texte de l'action
     * @param {string} title Titre au survol
     * @param {Object<string, string | number>} params Paramètres 
     */
    constructor(command, text, title, params = {}) {
        /**
         * Commande à appeler
         * @type {string}
         * @member
         */
        this.command = command;
        /**
         * Texte de l'action
         * @type {string}
         * @member
         */
        this.text = text;
        /**
         * Titre au survol
         * @type {string}
         * @member
         */
        this.title = title;
        /**
         * Paramètres de la commande
         * @type {Object<string, string | number>}
         * @member
         */
        this.params = params;
    }
}

/**
 * @class
 * @classdesc Représente un notification et contient les fonctions utiles liés aux notifications.
 */
class BnumNotification {
    /**
     * 
     * @param {string} uid Id de la notification
     * @param {string} title Titre de la notification
     * @param {string} category Catégorie de la notification
     * @param {Object} param3 Données facultatives
     * @param {?BnumNotificationAction} param3.action Action à effectuer lorsqu'on clique sur la notification
     * @frommoduleparam BnumNotification param3.action
     */
    constructor(uid, title, category, {action = null}) {
        this.init().setup(uid, title, category, action);
    }
    
    /**
     * Initialise le contenu de la notification
     * @private
     * @returns {BnumNotification}
     */
    init() {
        /**
         * Id de la notification
         * @type {string}
         * @member
         */
        this.uid = null;
        /**
         * Titre de la notification
         * @type {string}
         * @member
         */
        this.title = '';
        /**
         * Cétagorie de la notification
         * @type {string}
         * @member
         */
        this.category = '';
        /**
         * Quand la notification a été créée
         * @type {number}
         * @member
         */
        this.created = Math.floor(Date.now() / 1000);
        /**
         * Quand la notification a été modifiée
         * @type {number}
         * @member
         */
        this.modified = this.created;
        /**
         * Si la notification a été lue
         * @type {boolean}
         * @member
         */
        this.isread = false;
        /**
         * Notification locale ou non
         * @type {boolean}
         * @member
         */
        this.local = false;
        /**
         * Action de la notification
         * @type {?BnumNotificationAction}
         * @member
         */
        this.action = null;
        return this;
    }

    /**
     * Assigne le contenu de la notification
     * @private
     * @param {string} uid 
     * @param {string} title 
     * @param {string} category 
     * @param {?BnumNotificationAction} action 
     * @returns 
     */
    setup(uid, title, category, action) {
        this.uid = uid;
        this.title = title;
        this.category = category;
        this.action = action;
        return this;
    }

    /**
     * Ajoute la notification à la stack des notifications
     */
    notify() {
        BnumNotification.Notify(this);
    }

    /**
     * Affiche une notification
     * @static
     * @param {BnumNotification} notification Notification à afficher 
     */
    static Notify(notification) {
        rcmail.triggerEvent('plugin.push_notification', notification);
    }

    /**
     * Lance une exception liés aux notifications.
     * @param {*} datas 
     * @param {string} message
     * @return {NotificationException} 
     */
    static throw_exception(datas, message) {
        throw new NotificationException(datas, message);
    }

    /**
     * 
     * @param {string} what 
     * @returns {NotificationException | null}
     */
    static _____GET____(what) {
        switch (what) {
            case 'NotificationException':
                return NotificationException;
        
            default:
                break;
        }
    }
}