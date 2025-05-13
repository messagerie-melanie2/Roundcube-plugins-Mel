import { Connector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/connector.js';

const AGENDA_CONNECTORS = {
  /**
   * Connecteur pour récupérer les catégories de l'agenda.
   * @type {Connector<{}, Object<string, string>>}
   */
  get_categories: Connector.Create('calendar', 'get_categories', {
    type: Connector.enums.type.get,
  }),
};

export default AGENDA_CONNECTORS;
