import { ChatCallback, ChatManager } from "../../../mel_metapage/js/lib/chat/chatManager";
import { MelObject } from "../../../mel_metapage/js/lib/mel_object"
import { GetChannelValue, GetWspChannel, GetWspNotifChat, SetNotifChatState } from "./helpers";

export class MainWorkspace extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
        this._add_listener()._start();
    }

    _add_listener() {
        const KEY = 'WSP_INDEX';

        ChatManager.Instance().on_mentions_update.add(KEY, ChatCallback.create((helper, key, value, unread) => {
            if (typeof _on_mention_update !== 'undefined') _on_mention_update(helper, key, value, unread);
        }));
        
        return this;
    }

    _start() {
        const helper = new ChatCallback(null);

        let channel;
        GetWspNotifChat().each((i, e) => {
            channel = GetWspChannel(e);
            _on_mention_update(helper, channel, GetChannelValue(channel));
        });
        channel = null;

        return this;
    }
}

/**
* 
* @param {ChatCallback} helper 
* @param {string} key 
* @param {number} value 
* @param {*} unread 
*/
function _on_mention_update(helper, key, value, unread) {
   let $notif = helper.select(`[data-channel='${key}']`);

   if ($notif.length > 0) SetNotifChatState($notif.parent(), value);

   $notif = null;
}