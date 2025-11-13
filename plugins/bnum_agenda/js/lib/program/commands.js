import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { AgendaHelper } from './helper.js';

/**
 * Classe de gestion des commandes liées à l'agenda.
 * Fournit des méthodes pour manipuler les événements de l'agenda.
 */
export class AgendaCommands extends MelObject {
  constructor() {
    super();
  }

  /**
   * Commande permettant de copier l'événement sélectionné.
   * Si l'événement est récurrent, il est modifié avant la copie.
   * Les participants (attendees) sont supprimés de la copie.
   */
  async command_self_copy() {
    let event = $.extend(true, {}, ui_cal.selected_event);

    event = await AgendaHelper.Instance.modifieEventCopyIfRecurrent(event);

    delete event.attendees;
    ui_cal.event_copy(event);
  }

  /**
   * Retourne l'instance unique de la classe AgendaCommands (singleton).
   */
  static get Instance() {
    if (!this._instance) {
      this._instance = new AgendaCommands();
    }
    return this._instance;
  }
}
