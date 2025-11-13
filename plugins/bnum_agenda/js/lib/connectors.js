import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { Connector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/connector.js';

const AGENDA_CONNECTORS = {
  /**
   * Connecteur pour récupérer les catégories de l'agenda.
   * @type {Connector<{}, Object<string, string>>}
   */
  get_categories: Connector.Create('calendar', 'get_categories', {
    type: Connector.enums.type.get,
  }),
  get_master_event: Connector.Create('calendar', 'get_master_event', {
    type: Connector.enums.type.get,
    params: {
      event_id: EMPTY_STRING,
    },
  }),
};

export default AGENDA_CONNECTORS;
