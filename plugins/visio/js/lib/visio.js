import { HTMLBnumButton } from '../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { VisioManager } from '../../../mel_metapage/js/lib/calendar/event/parts/location_part.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { VisioByDinumLocation } from './program/VisioByDinumLocation.js';
import { VisioWebconfLink } from './program/VisioWebconfLink.js';

export class VisioByDinum extends MelObject {
  constructor() {
    super();
    this.#_init();
  }

  #_init() {
    this.listen('webconflink.create', (args) => {
      const { event, created } = args;

      if (created) return args;

      const location = event.location;

      if (VisioWebconfLink && VisioWebconfLink.IsVisioUrl(location))
        args.created = new VisioWebconfLink(location);

      return args;
    }).listen('event.show.location', (args) => {
      const { location, audioFunction } = args;
      let { html } = args;

      if (VisioWebconfLink && VisioWebconfLink.IsVisioUrl(location)) {
        const iconStyle =
          'display:inline-block; vertical-align:top; margin-top:5px';
        const rowStyle = 'margin-top:15px';
        const colStyle =
          'overflow:hidden; display:flex; text-overflow:ellipsis';
        const link = new VisioWebconfLink(location);
        html += `
          <div id="location-mel-edited-calendar" class="row" style="${rowStyle}">
            <div class="col-12" style="${colStyle}">
              <span style="${iconStyle}" class="icon-mel-pin-location mel-cal-icon"></span>
              <${HTMLBnumButton.TAG} style="display:inline-block" onclick="window.VisioDinumClickAction('${link.url}')" data-icon="open_in_new">Rejoindre la Visio : ${link.roomName}</${HTMLBnumButton.TAG}>
            </div>
          </div>`;

        if (!window.VisioDinumClickAction)
          window.VisioDinumClickAction = this.#_onClick.bind(this);

        if (link.havePhoneData())
          html += audioFunction(
            link.phone.number,
            link.phone.pin,
            'Rejoindre la Visio par téléphone',
            'video_chat',
          );

        args.html = html;
      }

      return args;
    });

    if (!this.#_can()) return;
    VisioManager.PrependVisioType(VisioByDinumLocation);
  }

  #_onClick(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  #_can() {
    return this.#_isCalendar() || this.#_isFromCreateButton();
  }

  #_isCalendar() {
    return this.get_env('task') === 'calendar';
  }
  #_isFromCreateButton() {
    return (
      this.get_env('task') === 'mel_metapage' &&
      this.get_env('action') === 'dialog-ui'
    );
  }
}

new VisioByDinum();
