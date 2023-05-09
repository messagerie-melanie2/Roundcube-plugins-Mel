import { ChatManager } from "../../../mel_metapage/js/lib/chat/chatManager";
import { MelObject } from "../../../mel_metapage/js/lib/mel_object";
import { RocketChatRoomConnector } from "./connectors/room_connector";
import { RocketChatStatusConnector } from "./connectors/status_connector";
import { RocketChatUnreadConnector } from "./connectors/unread_connector";

export class MelRocketChat extends MelObject {
    constructor() {
        super();
    }

    main() {
        //debugger;
        super.main();
        this._set_connectors()
            ._set_listeners();

        if (ChatManager.Instance().get_frame().length > 0 && ChatManager.Instance().get_frame().attr('src') === EMPTY_STRING) {
            ChatManager.Instance().get_frame().attr('src', rcmail.env.rocket_chat_url);
            this.trigger_event('init_rocket_chat', ChatManager.Instance().get_frame().attr('id'), {});
        }
    }

    _set_connectors() {
        ChatManager.Instance()
                   .setRoomConnector(new RocketChatRoomConnector())
                   .setStatusConnector(new RocketChatStatusConnector())
                   .setUnreadsConnector(new RocketChatUnreadConnector());
        return this;
    }

    _set_listeners() {
        this.add_event_listener('rocket.chat.event.unread-changed', (args) => this.unread_change(args), {});
        this.add_event_listener('rocket.chat.event.room-opened', (args) => this.room_opened(args), {});
        this.add_event_listener('rocket.chat.event.status-changed', (args) => this.status_changed(args), {});
        this.add_event_listener('rocket.chat.event.startup', function (args) {
            ChatManager.Instance().goLastRoom();
        }, {});
        this.on_frame_loaded((eClass, changepage, isAriane, querry, id, first_load) => {
            if (first_load) {
                //rcmail.env.rocket_chat_url
                ChatManager.Instance().get_frame().attr('src', rcmail.env.rocket_chat_url);
                this.trigger_event('init_rocket_chat', ChatManager.Instance().get_frame().attr('id'), {});
            }
        }, {frame:'discussion'});
        return this;
    }

    unread_change(args) {
        let {do_base_action, datas} = args;

        if (!datas.eventName && !!datas.data.eventName) datas = datas.data;

        if (datas.eventName === 'unread-changed-by-subscription')
        {
            ChatManager.Instance().updateMention(datas.data.name, datas.data.unread);
        }
        else {
            ChatManager.Instance().updateUnreads(datas.data === '•');
        }
        return args;
    }

    room_opened(args) {
        let {datas} = args;

        if (!datas.eventName && !!datas.data.eventName) datas = datas.data;

        ChatManager.Instance().updateLastRoom(datas.data);
        return args;
    }

    status_changed(args) {
        let {datas} = args;

        if (!datas.eventName && !!datas.data.eventName) datas = datas.data;

        ChatManager.Instance().updateStatus(datas.data);
        return args;
    }
}