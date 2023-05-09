import { MelObject } from "../mel_object";
import { Top } from "../top";
import { Chat, _Chat } from "./chat";

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

    get_frame() {
        return this.select_frame('discussion');
    }

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
        this.on_update.call('unreads', have);
        this.on_unreads_update.call(have);
        return this;
    }

    updateMention(key, value) {
        this.chat().unreads.update(key, value);
        this.on_update.call('mentions', key, value);
        this.on_mentions_update.call(key, value);
        return this;
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

    /**
     * 
     * @returns { _Chat }
     */
    chat() {
        return Chat.Instance;
    }

    /**
     * 
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
     * 
     * @returns { _Chat }
     */
    chat() {
        return Chat.Instance();
    }

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

