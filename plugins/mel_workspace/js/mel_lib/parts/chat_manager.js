import { PartManager } from "./part_manager.js";
import { ChatCallback, ChatManager } from "../../../../mel_metapage/js/lib/chat/chatManager.js";
import { GetChannelValue, GetWspChannel, GetWspNotifChat, SetNotifChatState } from "../helpers.js";

export class WspChatManager extends PartManager{
    static Start() {
        const helper = new ChatCallback(null);

        let channel;
        GetWspNotifChat().each((i, e) => {
            channel = GetWspChannel(e);
            _on_mention_update(helper, channel, GetChannelValue(channel));
        });
        channel = null;
    }

    static AddListeners() {
        const KEY = 'WSP_INDEX';

        ChatManager.Instance().on_mentions_update.add(KEY, ChatCallback.create((helper, key, value, unread) => {
            if (typeof this._on_mention_update !== 'undefined') this._on_mention_update(helper, key, value, unread);
        }));
    }

    static _on_mention_update(helper, key, value, unread) {
        let $notif = helper.select(`[data-channel='${key}']`);
     
        if ($notif.length > 0) SetNotifChatState($notif.parent(), value);
     
        $notif = null;
     }
}