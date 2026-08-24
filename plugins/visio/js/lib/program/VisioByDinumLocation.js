import { HTMLBnumButton } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { EventView } from '../../../../mel_metapage/js/lib/calendar/event/event_view.js';
import { AVisio } from '../../../../mel_metapage/js/lib/calendar/event/parts/location_part.js';
import { BnumMessage } from '../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { VisioRooms } from './visio_rooms.js';

const ENABLE_SECURE = true;

export class VisioByDinumLocation extends AVisio {
  #_createButton({ secure }) {
    const { name: cacheName, location: cacheLocation } =
      VisioByDinumLocation._visioData || {};
    const location = secure ? cacheLocation || this.location : this.location;
    const name = secure ? cacheName || this._name : this._name;
    const btn = HTMLBnumButton.Create({
      text: name ? `Room : ${name}` : EMPTY_STRING,
      loading: !location,
      iconMargin: 0,
    });
    btn.setAttribute('disabled', 'disabled');

    return btn;
  }

  generate($parent) {
    const { location: cacheLocation } = VisioByDinumLocation._visioData || {};

    const btn = this.#_createButton({ secure: ENABLE_SECURE });

    this.btn = btn;
    const center = document.createElement('center');
    center.appendChild(btn);
    const div = document.createElement('div');
    div.classList.add('location-mode');
    div.setAttribute('data-locationmode', this.option_value());
    div.appendChild(center);

    $parent.append(div);

    let dialog = EventView.INSTANCE.get_dialog();
    if (EventView.INSTANCE.is_jquery_dialog()) {
      dialog
        .parent()
        .find('.ui-dialog-buttonset .mainaction')
        .attr('disabled', 'disabled')
        .addClass('disabled');
    } else {
      dialog.footer.buttons.save
        .attr('disabled', 'disabled')
        .addClass('disabled');
    }

    if (ENABLE_SECURE && cacheLocation) {
      this.location = cacheLocation;
      queueMicrotask(() => this.onchange.call());
      return;
    }

    const loading = BnumMessage.DisplayLoadingMessage();
    const rooms = new VisioRooms();
    this.promise = rooms.createRoom().then((val) => {
      const { datas } = val;
      const { content } = datas;
      const { url, name, telephony } = content;
      const { phone_number, pin_code } = telephony;

      this._name = name;
      this.location = `${url} (${phone_number} | #${pin_code})`;

      if (ENABLE_SECURE)
        VisioByDinumLocation._visioData = { name, location: this.location };

      this.btn.innerText = `Room : ${this._name}`;
      this.btn.stopLoading();

      if (EventView.INSTANCE.is_jquery_dialog()) {
        dialog
          .parent()
          .find('.ui-dialog-buttonset .mainaction')
          .removeAttr('disabled')
          .removeClass('disabled');
      } else {
        dialog.footer.buttons.save
          .removeAttr('disabled')
          .removeClass('disabled');
      }

      BnumMessage.ClearMessage(loading);
      queueMicrotask(() => this.onchange.call());
    });
  }

  is_valid() {
    return true;
  }

  async wait() {
    await (this.promise || Promise.resolve());
  }

  destroy() {
    super.destroy();

    VisioByDinumLocation._visioData = null;
    this.promise = null;
  }

  static OptionValue() {
    return 'dinum';
  }

  static PluginName() {
    return 'visio';
  }
}
