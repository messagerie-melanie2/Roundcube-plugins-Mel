/**
 * @module CalendarEvent
 */

import { RcmailDialogButton } from '../../classes/modal.js';
import { EventView } from './event_view.js';

/**
 * Classe qui génère la fenêtre de dialogue pour la création ou la modification d'un événement.
 * @class
 * @classdesc Met en forme les données utiles à la fenêtre de dialog avant d'ouvrir la dialog. Mettre le code lié dans la fonction `_main`.
 * @see {@link CalendarEvent~_main}
 */
export class CalendarEvent {
  /**
   *
   * @param {*} event Objet évènement du plugin calendar
   * @param {external:jQuery | GlobalModal} dialog Dialog jquery ou GlobalModal
   */
  constructor(event, dialog) {
    /**
     * @member
     * @type {EventView} Vue de l'évènement
     */
    this.view = this._main(event, dialog);
  }

  /**
   * C'est ici que l'on va éffectuer toute les actions nécessaires à la création de la fenêtre de dialog.
   * @private
   * @param {*} calEvent Objet évènement du plugin calendar
   * @param {external:jQuery | GlobalModal} $dialog Dialog jquery ou GlobalModal
   * @returns {EventView} Vue créée
   */
  _main(calEvent, $dialog) {
    if (!calEvent) calEvent = cal.selected_event;
    if (!$dialog)
      $dialog =
        window.kolab_event_dialog_element ??
        parent.kolab_event_dialog_element ??
        top.kolab_event_dialog_element;

    const args = rcmail.triggerEvent('on.calendar-event.before', {
      calEvent,
      $dialog,
      caller: this,
      eventView: EventView,
    });

    return (args?.eventView ?? EventView).Start(calEvent, $dialog);
  }

  /**
   * Lance une dialogue d'évènement
   * @static
   * @param {*} event Objet évènement du plugin calendar
   * @param {external:jQuery | GlobalModal} dialog Dialog jquery ou GlobalModal
   * @returns {CalendarEvent}
   */
  static Start(event, dialog) {
    return new CalendarEvent(event, dialog);
  }
}
