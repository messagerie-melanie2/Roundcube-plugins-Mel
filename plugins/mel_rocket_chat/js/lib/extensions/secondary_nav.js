import { ChatManager } from "../../../../mel_metapage/js/lib/chat/chatManager";
import { Top } from "../../../../mel_metapage/js/lib/top";
import { IExt } from "../IExt";

let already = false;
export class SecondaryNav extends IExt {
  constructor () {
    super();
    this._add_listener();
  }

  get_text(key, plugin = 'rocket_chat') {
    return this.rcmail().gettext(key, plugin);
  }

  select_menu_info() {
    return this.select('.user-menu-info');
  }

  _add_listener() {
    const KEY = 'USER-STATUS';
    if (!Top.has(KEY)) {
      this.select('#user-up-panel').on('show.bs.dropdown', () => {
        if (!already) {
          already = true;
          this._bind_clicks();
          this._on_shown_bs();
        }
      })
      Top.add(KEY, true);
    }

  }

  _bind_clicks(){
    this.select('.user-menu-items a.dropdown-item').click((event) => {
      event = $(event.currentTarget);
      this.status_click(event.data('status'))
    })

  }

  async _on_shown_bs() {
    const message = await ChatManager.Instance().getChatStatusMessage({}) || this.get_text(this.chat().status);
    this.select_menu_info().text(message);
  }

  async status_click(status) {
    await this.manager().setStatus(status);

    // Translation dictionary
    const translations = {
      online: this.get_text('online'),
      away: this.get_text('away'),
      busy: this.get_text('busy'),
      offline: this.get_text('offline')
    };

    const translatedStatus = translations[status] || status; 

    this.select_menu_info().text(translatedStatus);
  }
}
