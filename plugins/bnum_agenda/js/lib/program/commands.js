import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { AgendaHelper } from './helper.js';

export class AgendaCommands extends MelObject {
  constructor() {
    super();
  }

  main() {
    this.rcmail().register_command(
      'event-self-copy',
      this.command_self_copy.bind(this),
      true,
    );
  }

  async command_self_copy() {
    let event = $.extend(true, {}, ui_cal.selected_event);

    if (event.master_start) {
      if (
        !confirm(
          "Attention, vous allez copier la série complète de la récurrence, la copie d'une seule occurrence n'est pas possible. \r\nVoulez-vous quand même continuer ?",
        )
      )
        return;

      const result = await AgendaHelper.Instance.getMasterEvent(event);

      if (result.has_error) {
        console.error(
          "Erreur lors de la récupération de l'événement maître",
          result.error,
        );
      } else {
        event = result.datas;
      }
    }

    delete event.attendees;
    ui_cal.event_copy(event);
  }
}
