import { ChatManager } from '../../../mel_metapage/js/lib/chat/chatManager.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

/**
 * @module WspHelper
 */
export class WspHelper {
  static GetWspNotifChat() {
    return MelObject.Empty().select('div.wsp-chat-notif-block');
  }

  static SetNotifChatState($notif, value) {
    if (value > 0) {
      $notif.css('display', '');
      $notif = $notif.find('.channel-notif');

      if (value > 99) $notif.html('99+');
      else $notif.html(value);
    } else $notif.css('display', 'none');
  }

  static GetWspChannel($item) {
    $item = $($item);
    return $item.find('.channel').data('channel');
  }

  static GetChannelValue(channel) {
    return ChatManager.Instance().chat().unreads.datas[channel] ?? 0;
  }

  static GetUrl() {
    mel_metapage.Functions.url('workspace', 'workspace', {
      _uid: rcmail.env.current_workspace_uid,
    }) +
      `&${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}` +
      +'&_force_bnum=1';
  }

  static GetWorkspaceTitle() {
    return $('.header-wsp').text();
  }

  static GetWspPrefix() {
    return 'ws#';
  }
}
