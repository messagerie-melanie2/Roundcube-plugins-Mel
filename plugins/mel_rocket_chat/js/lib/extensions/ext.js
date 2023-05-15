import { Top } from "../../../../mel_metapage/js/lib/top";
import { IExt } from "../IExt";

let already = false;
export class Ext extends IExt {
  constructor () {
    super();
    this._add_listener();
  }

  _add_listener() {
    const KEY = 'USER-STATUS';
    if (!Top.has(KEY)) {
      this.select('#user-up-panel').on('show.bs.dropdown', () => {
        if (!already) {
          console.log("Show dropdown");
          already = true;
          this.mafun();
        }
      })
      Top.add(KEY, true);
    }

  }

  mafun = () => {
    this.select('.user-menu-items a.dropdown-item').click((event) => {
      event = $(event.currentTarget);
      // console.log(event.data('status'));
      this.status_click(event.data('status'))
    })

  }

  async status_click(status) {
    await this.manager().setStatus(status);

    // Translation dictionary
    const translations = {
      online: 'Disponible',
      away: 'Absent',
      busy: 'Ne pas déranger',
      offline: 'Hors ligne'
    };

    const translatedStatus = translations[status] || status; 

    this.select('.user-menu-info').text(translatedStatus);
  }
}
