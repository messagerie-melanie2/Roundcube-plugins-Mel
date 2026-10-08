import { HTMLBnumButton } from '../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { VisioManager } from '../../../mel_metapage/js/lib/calendar/event/parts/location_part.js';
import { ActionLocation } from '../../../mel_metapage/js/lib/calendar/event_location.js';
import { BnumLog } from '../../../mel_metapage/js/lib/classes/bnum_log.js';
import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { VisioRooms } from './program/visio_rooms.js';
import { VisioByDinumLocation } from './program/VisioByDinumLocation.js';
import { VisioWebconfLink } from './program/VisioWebconfLink.js';

/** Identifiant du champ contenant l'URL de la salle dans la prise de rendez-vous. */
const APPOINTMENT_ROOM_ID = 'visio-room';

class VisioDinumLocation extends ActionLocation {
  constructor(location) {
    super(location);
  }

  side_action() {
    const link = this.location.includes('http')
      ? this.location
      : `https://${this.location}`;
    window.open(link, '_blank');
    return this;
  }

  _get_icon() {
    return 'open_in_new';
  }

  _get_description({ length = 0 }) {
    return length > 1
      ? 'Visio'
      : `Visio : ${new VisioWebconfLink(this.location).roomName}`;
  }

  static is_dinum_visio(txt) {
    return txt.includes(MelObject.Empty().get_env('visio_gouv_base_url'));
  }
}

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
    })
      .listen('event.show.location', (args) => {
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
      })
      .listen('event.location.generate', (data) => {
        const { generated, current } = data;

        if (!VisioDinumLocation.is_dinum_visio(current)) return data;

        generated.visio = new VisioDinumLocation(current);

        return data;
      })
      .listen('calendar.appointment.toggle_fields', (args) => {
        if (args.field === 'visio') this.#_onAppointmentVisioToggled();

        return args;
      })
      .listen('calendar.appointment.save_place', (args) => {
        const { id, form, place } = args;

        if (id === 'visio')
          place.push({
            type: 'visio',
            value: form.find(`#${APPOINTMENT_ROOM_ID}`).val(),
            text: form.find('#visio_text').text(),
          });

        return args;
      })
      .listen('calendar.appointment.load_place', (args) => {
        const { element, form } = args;

        if (element.type === 'visio') {
          form.find('#visio').prop('checked', true);
          form.find('#visio_fields').show();
          form.find(`#${APPOINTMENT_ROOM_ID}`).val(element.value);
        }

        return args;
      });

    if (!this.#_can()) return;
    VisioManager.PrependVisioType(VisioByDinumLocation);
  }

  /**
   * Crée une salle de visio lorsque l'option « Visio » de la prise de
   * rendez-vous est activée et qu'aucune salle n'est encore associée.
   *
   * @returns {Promise<void>}
   * @private
   */
  async #_onAppointmentVisioToggled() {
    const form = this.get_env('appointment_form');
    const checkbox = form.find('#visio');
    const input = form.find(`#${APPOINTMENT_ROOM_ID}`);

    if (!checkbox.prop('checked') || input.val()) return;

    const controls = form
      .closest('.ui-dialog')
      .find('.ui-dialog-buttonpane button')
      .add(checkbox);
    const loader = BnumMessage.DisplayLoadingMessage();

    // Évite une sauvegarde ou une fermeture pendant la création de la salle.
    controls.prop('disabled', true);

    try {
      const room = await new VisioRooms().createRoom();

      if (room.has_error || room.datas?.httpCode !== 201) {
        BnumMessage.DisplayMessage(
          'Impossible de créer une salle de visio.',
          eMessageType.Error,
        );
        BnumLog.error(
          'VisioByDinum::#_onAppointmentVisioToggled',
          'Impossible de créer une salle !',
          room,
        );
        return;
      }

      input.val(room.datas.content.url);
    } finally {
      controls.prop('disabled', false);
      BnumMessage.ClearMessage(loader);
    }
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
