import { Unreads } from "../../../mel_metapage/js/lib/chat/chat.js";
import { ChatCallback, ChatManager } from "../../../mel_metapage/js/lib/chat/chatManager.js";
import { MelObject } from "../../../mel_metapage/js/lib/mel_object.js";
import { IExt } from "./IExt.js";
import { RocketChatRoomConnector } from "./connectors/room_connector.js";
import { RocketChatStatusConnector } from "./connectors/status_connector.js";
import { RocketChatUnreadConnector } from "./connectors/unread_connector.js";

export class MelRocketChat extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();

        ChatManager.Instance().set_chat_url(rcmail.env.rocket_chat_url);
        
        this._set_connectors()
            ._set_listeners()
            ._set_actions_listeners()
            ._start();

        let $frame = ChatManager.Instance().get_frame();
        if ($frame.length > 0 &&  [EMPTY_STRING, (undefined + '')].includes($frame.attr('src'))) {
            $frame.attr('src', rcmail.env.rocket_chat_url);
            const result = this.rcmail().triggerEvent('init_rocket_chat', ChatManager.Instance().get_frame().attr('id'), {});
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
        this.rcmail().addEventListener('rocket.chat.event.unread-changed', (args) => this.unread_change(args), {});
        this.rcmail().addEventListener('rocket.chat.event.room-opened', (args) => this.room_opened(args), {});
        this.rcmail().addEventListener('rocket.chat.event.status-changed', (args) => this.status_changed(args), {});
        this.rcmail().addEventListener('rocket.chat.event.startup', function (args) {
            ChatManager.Instance().goLastRoom();
        }, {});

        let loaded = false;
        this.on_frame_loaded((args) => {
            if (!loaded) {
                const {eClass, changepage, isAriane, querry, id, first_load} = args;

                if (first_load && isAriane) {
                    const result = this.rcmail().triggerEvent('init_rocket_chat', ChatManager.Instance().get_frame().attr('id'), {});
                    if (!!result.then) {
                        result.then(() => {
                            ChatManager.Instance().goLastRoom();
                            loaded = true;
                        });
                    }
                    else loaded = true;
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
        this.on_unread_updated(helper, ChatManager.Instance().chat().unreads);

        if (this.launch_at_startup()) {
            this.on_status_updated(helper, ChatManager.Instance().chat().status);
        }
        
        return this;
    }

    launch_at_startup() {
        return rcmail?.env?.launch_chat_frame_at_startup ?? false;
    }

    unread_change(args) {
        const top = true;
        let {do_base_action, datas} = args;

        if (!datas.eventName && !!datas.data.eventName) datas = datas.data;

        if (datas.eventName === 'unread-changed-by-subscription' && !ChatManager.Instance().chat().isBusy())
        {
            ChatManager.Instance().updateMention(datas.data.name, datas.data.unread);
            if ('discussion' !== this.rcmail(top).env.current_frame_name && datas.data.unread > 0) {
                const url = 'd' === datas.data.t ? 'direct' : ('c' === datas.data.t ? 'channel' : 'group')
                const text_mention = 1 === datas.data.unread ? 'une nouvelle mention' : 'des nouvelles mentions';
                const text_direct = 1 === datas.data.unread ? 'un nouveau message' : 'des nouveaux messages';
                const text = `Vous avez ${'d' === datas.data.t ? text_direct : text_mention} ${('d' === datas.data.t ? 'de' : 'dans le canal')} ${datas.data.fname} !`;
                this.send_notification({
                    uid: `unread-${datas.data.rid}`,
                    title: text,
                    content: text,
                    category: 'chat',
                    action: [
                      {
                        href: '#',
                        title: "Cliquez ici pour ouvrir pour aller voir !",
                        text: "Ouvrir le canal",
                        command: 'chat-notification-action',
                        params: {
                            url,
                            id:datas.data.rid
                        }
                      }
                    ],
                    created: Math.floor(Date.now() / 1000),
                    modified: Math.floor(Date.now() / 1000),
                    isread: false,
                    local: true,
                  });
            }
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

        if (!!datas.data?.id) datas.data = datas.data.id;

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