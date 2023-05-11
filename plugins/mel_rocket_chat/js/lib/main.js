import { Unreads } from "../../../mel_metapage/js/lib/chat/chat";
import { ChatCallback, ChatManager } from "../../../mel_metapage/js/lib/chat/chatManager";
import { MelObject } from "../../../mel_metapage/js/lib/mel_object";
import { IExt } from "./IExt";
import { RocketChatRoomConnector } from "./connectors/room_connector";
import { RocketChatStatusConnector } from "./connectors/status_connector";
import { RocketChatUnreadConnector } from "./connectors/unread_connector";

export class MelRocketChat extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
        this._set_connectors()
            ._set_listeners()
            ._set_actions_listeners()
            ._start();

        if (ChatManager.Instance().get_frame().length > 0 && ChatManager.Instance().get_frame().attr('src') === EMPTY_STRING) {
            ChatManager.Instance().get_frame().attr('src', rcmail.env.rocket_chat_url);
            const result = this.trigger_event('init_rocket_chat', ChatManager.Instance().get_frame().attr('id'), {});
            if (!!result.then) result.then(() => ChatManager.Instance().goLastRoom());

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
        
        let loaded = false;
        this.on_frame_loaded((args) => {
            if (!loaded) {
                const {eClass, changepage, isAriane, querry, id, first_load} = args;

                if (first_load && isAriane) {
                    ChatManager.Instance().get_frame().attr('src', rcmail.env.rocket_chat_url);
                    this.trigger_event('init_rocket_chat',id, {});
                    loaded = true;
                }
            }
        }, {});
        return this;
    }

    _set_actions_listeners() {
        ChatManager.Instance().on_status_update.push(ChatCallback.create((helper, status) => {
            this.on_status_updated(helper, status);
        }));
        ChatManager.Instance().on_unreads_update.push(ChatCallback.create((helper, have, unread) => this.on_unread_updated(helper, unread)));
        ChatManager.Instance().on_mentions_update.push(ChatCallback.create((helper, key, value, unread) => this.on_unread_updated(helper, unread)));
        return this;
    }

    _start() {
        const helper = new ChatCallback(null);
        this.on_status_updated(helper, ChatManager.Instance().chat().status);
        this.on_unread_updated(helper, ChatManager.Instance().chat().unreads);
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

    /**
     * 
     * @param {ChatCallback} helper 
     * @param {string} status 
     */
    on_status_updated(helper, status) {
        const online = 'ok';
        const away =  'nothere';
        const busy = 'busy';
        const offline = 'logout';
        const class_to_remove = [online, away, busy, offline];
        let querry = helper.top_select('.chat-user-dispo');
        
        for (const class1 of class_to_remove) {
            querry.removeClass(class1);
        }

        switch (status) {
            case "online":
                querry.addClass(online);
                break;
            case "away":
                querry.addClass(away);
                break;
            case "busy":
                querry.addClass(busy);
                break;
            case "offline":
                querry.addClass(offline);
                break;
            default:
                break;
        }

        this.trigger_event('mel_rocket_chat.on_status_updated', {
            class_to_remove,
            status
        }, {});

        IExt.call_status(status, class_to_remove);
    }

    /**
     * 
     * @param {ChatCallback} helper 
     * @param {Unreads} unread 
     */
    on_unread_updated(helper, unread) {
        let $querry = helper.top_select('#menu-badge-ariane').css("font-size", "").css("display", "");

        const size = Enumerable.from(unread.getHaveMentions_generator()).sum(x => x.value);

        if (size === 0) {
            if (unread.haveUnreads()) $querry.html('•');
            else $querry.css("display", "none");
        } else {
            if (size > 999) {
                size = "999+";
                $querry.css("font-size", "6px");
            } else $querry.html(size);
        }

        IExt.call_unread(unread);
    }
}