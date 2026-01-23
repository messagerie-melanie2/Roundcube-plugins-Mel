import { BnumConnector } from '../../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import AGENDA_CONNECTORS from '../connectors.js';

const FIELDS_TO_CHECK_DATE = ['start', 'end', 'created', 'modified'];
const PLUGIN = 'bnum_agenda';
const TEXT_KEY_EVENT_IS_RECUR = 'event-is-recur';
const TEXT_KEY_EVENT_ERROR = 'event-get-error';
const TEXT_KEY_EVENT_NOT_RECUR = 'event-not-recur';

/**
 * Classe utilitaire pour la gestion des événements d'agenda.
 */
export class AgendaHelper extends MelObject {
  constructor() {
    super();
  }

  /**
   * Vérifie et formate un champ de date d'un événement.
   * @param {Object} event - L'événement à traiter.
   * @param {string} field - Le nom du champ à vérifier et formater.
   * @returns {AgendaHelper} L'instance courante pour chaînage.
   */
  #_check_and_format_field(event, field) {
    if (event && event[field] && typeof event[field] === 'string') {
      event[field] = moment(event[field]);
    }

    return this;
  }

  /**
   * Vérifie et formate plusieurs champs de date d'un événement.
   * @param {Object} event - L'événement à traiter.
   * @param {string[]} fields - Les noms des champs à vérifier et formater.
   * @returns {AgendaHelper} L'instance courante pour chaînage.
   */
  #_check_and_format_fields(event, fields) {
    for (const field of fields) {
      this.#_check_and_format_field(event, field);
    }

    return this;
  }

  #_gettext(msgid, { variables = null } = {}) {
    return this.getLocalization(msgid, { plugin: PLUGIN, variables });
  }

  /**
   * Copie un événement récurrent après confirmation utilisateur.
   * @param {Object} event - L'événement à copier.
   * @returns {Promise<Object>} L'événement copié ou original.
   */
  async modifieEventCopyIfRecurrent(event) {
    if (event.master_start) {
      if (!confirm(this.#_gettext(TEXT_KEY_EVENT_IS_RECUR))) return;

      const result = await this.getMasterEvent(event);

      if (result.has_error) {
        console.error(this.#_gettext(TEXT_KEY_EVENT_ERROR), result.error);
      } else {
        event = result.datas;
      }
    }

    return event;
  }

  /**
   * Récupère un évènement maître à partir de son ID ou de ses propriétés.
   * @param {any} event - L'événement sélectionné.
   * @returns {Promise<{datas: any, has_error: boolean, error: any | null}>} L'évènement maître.
   */
  async getMasterEvent(selected_event) {
    let result = { datas: null, has_error: false, error: null };

    if (!selected_event.isexception && !selected_event.master_start) {
      result.has_error = true;
      result.error = this.#_gettext(TEXT_KEY_EVENT_NOT_RECUR);
      result.datas = selected_event;
    }

    if (!result.has_error) {
      result = await this.getMasterEventFromId(
        selected_event.recurrence_id || selected_event.uid,
      );
    }

    this.#_check_and_format_fields(result.datas, FIELDS_TO_CHECK_DATE);

    return result;
  }

  /**
   * Récupère un évènement maître à partir de son ID.
   * @param {string} eventId - L'identifiant de l'événement maître.
   * @returns {Promise<{datas: any, has_error: boolean, error: any | null}>} L'évènement maître.
   */
  async getMasterEventFromId(eventId) {
    return await BnumConnector.connect(AGENDA_CONNECTORS.get_master_event, {
      params: { event_id: eventId },
    });
  }

  /**
   * Retourne une nouvelle instance d'AgendaHelper.
   * @returns {AgendaHelper} Une instance d'AgendaHelper.
   */
  static get Instance() {
    return new AgendaHelper();
  }
}
