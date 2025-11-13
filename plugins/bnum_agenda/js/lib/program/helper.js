import { BnumConnector } from '../../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import AGENDA_CONNECTORS from '../connectors.js';

export class AgendaHelper extends MelObject {
  constructor() {
    super();
  }

  #_check_and_format_field(event, field) {
    if (event && event[field] && typeof event[field] === 'string') {
      event[field] = moment(event[field]);
    }

    return this;
  }

  #_check_and_format_fields(event, fields) {
    for (const field of fields) {
      this.#_check_and_format_field(event, field);
    }

    return this;
  }

  /**
   * Récupère un évènement maître à partir de son ID.
   * @param {any} event
   * @returns {Promise<{datas: any, has_error: boolean, error: any | null}>} L'évènement maître
   */
  async getMasterEvent(selected_event) {
    let result = { datas: null, has_error: false, error: null };

    if (!selected_event.isexception && !selected_event.master_start) {
      result.has_error = true;
      result.error =
        //prettier-ignore
        'L\'évènement sélectionné n\'est pas une exception ou récurrent.';
      result.datas = selected_event;
    }

    if (!result.has_error) {
      result = await this.getMasterEventFromId(
        selected_event.recurrence_id || selected_event.uid,
      );
    }

    this.#_check_and_format_fields(result.datas, [
      'start',
      'end',
      'created',
      'modified',
    ]);

    return result;
  }

  /**
   * Récupère un évènement maître à partir de son ID.
   * @param {string} eventId
   * @returns {Promise<{datas: any, has_error: boolean, error: any | null}>} L'évènement maître
   */
  async getMasterEventFromId(eventId) {
    return await BnumConnector.connect(AGENDA_CONNECTORS.get_master_event, {
      params: { event_id: eventId },
    });
  }

  static get Instance() {
    return new AgendaHelper();
  }
}
