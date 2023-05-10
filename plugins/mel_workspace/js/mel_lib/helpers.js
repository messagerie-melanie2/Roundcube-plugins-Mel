import { ChatManager } from "../../../mel_metapage/js/lib/chat/chatManager";
import { MelObject } from "../../../mel_metapage/js/lib/mel_object";


export function GetWspNotifChat() {
    return MelObject.Empty().select('div.wsp-chat-notif-block');
}

export function SetNotifChatState($notif, value) {
    if (value > 0) {
        $notif.css('display', '');
        $notif = $notif.find('.channel-notif');

        if (value > 99) $notif.html('99+')
        else $notif.html(value);
    } else $notif.css('display', 'none');
}

export function GetWspChannel($item) {
    $item = $($item);
    return $item.find('.channel').data('channel');
}

export function GetChannelValue(channel) {
    return ChatManager.Instance().chat().unreads.datas[channel] ?? 0;
}
