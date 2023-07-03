import { MelObject } from "../mel_object.js";
import { Top } from "../top.js";
import { Chat, _Chat } from "./chat.js";

/**
 * @static
 * @extends MelObject
 * @classdesc
 * Gère les actions et affichages lié au Chat
 */
export class ChatManager extends MelObject {
    constructor() {
        super();
    }

    main() {
        this._init();
        super.main();
    }

    _init() {
        this.on_update = new ChatEvent();
        this.on_unreads_update = new ChatEvent();
        this.on_mentions_update = new ChatEvent();
        this.on_status_update = new ChatEvent();
        this.on_room_update = new ChatEvent();
        return this;
    }

    /**
     * Récupère la frame de chat
     * @returns {$}
     */
    get_frame() {
        return this.select_frame('discussion');
    }

    /**
     * Si la room en mémoire est valide, change le canal de chat
     */
    goLastRoom()
    {
        const lastRoom = this.chat().lastRoom;

        if (lastRoom.isValid())
        {
            this.get_frame()[0].contentWindow.postMessage({
                externalCommand: 'go',
                path: `/${(lastRoom.public ? "channel" : "group")}/${lastRoom.name}`
              }, '*');
        }
    }

    updateLastRoom(last_room_item) {
        this.chat().lastRoom = last_room_item;
        this.on_update.call('last_room', this.chat().lastRoom);
        this.on_room_update.call(this.chat().lastRoom);
        return this;
    }

    updateStatus(status) {
        this.chat().status = status;
        this.on_update.call('status', status);
        this.on_status_update.call(status);
        return this;
    }

    updateUnreads(have) {
        this.chat().unreads.setHaveUnreads(have);
        this.on_update.call('unreads', have, this.chat().unreads);
        this.on_unreads_update.call(have, this.chat().unreads);
        return this;
    }

    updateMention(key, value) {
        this.chat().unreads.update(key, value);
        this.on_update.call('mentions', key, value, this.chat().unreads);
        this.on_mentions_update.call(key, value, this.chat().unreads);
        return this;
    }

    /**
     * Envoie le nouveau status au serveur
     * @param {string} status 
     * @param {string} message
     * @returns {Promise} 
     */
    async setStatus(status, message) {
        await this.chat().set_status_to_server(status, message);
        this.updateStatus(status);
    }

    /**
     * Récupère le message depuis le serveur
     * @param {Object} options Options par défaut de la fonciton
     * @param {boolean} options.from_server_if_empty Faire un check serveur si le message est vide
     * @returns {Promise<string>}
     */
    async getChatStatusMessage({from_server_if_empty = true}) {
        let message = this.chat().message_status;

        if (from_server_if_empty && !(message || false)) {
            await this.chat().get_status_from_server();
            message = this.chat().message_status;
        }

        return message;
    }

    setStatusConnector(connector) {
        this.chat().setStatusConnector(connector);
        return this;
    }

    setUnreadsConnector(connector) {
        this.chat().setUnreadsConnector(connector);
        return this;
    }

    setRoomConnector(connector) {
        this.chat().setRoomConnector(connector);
        return this;
    }

    set_chat_url(url) {
        rcmail.env.chat_system_url = url;
        return this;
    }

    /**
     * Récupère l'instance du chat
     * @returns { _Chat }
     */
    chat() {
        return Chat.Instance;
    }

    /**
     * @static
     * Récupère l'instance du manager
     * @returns {ChatManager}
     */
    static Instance() {
        if (!Top.has('chat_manager')) Top.add('chat_manager', new ChatManager());

        return Top.get('chat_manager');
    }
}

export class ChatCallback extends MelObject {
    constructor(callback) {
        super();
        this._callback = callback;
    }

    main() {
        super.main();
    }

    call(...args) {
        return this._callback(this, ...args);
    }

    top_select(selector) {
        return Top.top().$(selector);
    }

    /**
     * Récupère l'instance du chat
     * @returns { _Chat }
     */
    chat() {
        return ChatManager.Instance().chat();
    }

    /**
     * Créer un callback avec des fonctions d'aide.
     * @param {(helper:ChatCallback, ...args) => {}} callback Helper permet de donner les fonctions utile de MelObject
     * @returns 
     */
    static create(callback) {
        return new ChatCallback(callback);
    }
}

class ChatEvent extends MelEvent {
    constructor() {
        super();
    }

    _call_callback(element, ...args) {
        return element.call(...args);
    }

}

