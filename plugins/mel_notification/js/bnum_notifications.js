import { BnumException } from "../../mel_metapage/js/lib/exceptions/bnum_base_exceptions.js";

class NotificationException extends BnumException {
    constructor(notifications_datas, message) {
        super(notifications_datas, message);
    }
}

export class BnumNotificationAction {
    constructor(command, text, title, params = {}) {
        this.command = command;
        this.text = text;
        this.title = title;
        this.params = params;
    }
}

export class BnumNotification {
    constructor(uid, title, category, {action = null}) {
        this.init().setup(uid, title, category, action);
    }
    
    init() {
        this.uid = null;
        this.title = '';
        this.category = '';
        this.created = Math.floor(Date.now() / 1000);
        this.modified = this.created;
        this.isread = false;
        this.local = false;
        this.action = null;
        return this;
    }

    setup(uid, title, category, action) {
        this.uid = uid;
        this.title = title;
        this.category = category;
        this.action = action;
        return this;
    }

    notify() {
        BnumNotification.Notify(this);
    }

    static Notify(notification) {
        rcmail.triggerEvent('plugin.push_notification', notification);
    }

    /**
     * Lance une exception liés aux notifications.
     * @param {*} datas 
     * @param {*} message 
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