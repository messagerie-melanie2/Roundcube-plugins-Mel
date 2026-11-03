import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { Connector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/connector.js';

export { connectors as VisioRoomsConnectors };

/**
 * Connecteurs AJAX du plugin visio, pour les endpoints "Rooms" de l'API
 * de visioconférence "La Suite Numérique" (actions de visio.php) :
 * - list_rooms    : liste des salles de l'utilisateur (GET)
 * - retrieve_room : détail d'une salle (GET, `id`)
 * - create_room   : création d'une salle (POST, `access_level`, `configuration` JSON)
 * @type {Readonly<Object<string, Connector>>}
 */
const connectors = Object.freeze({
  list_rooms: Connector.Create('visio', 'list_rooms', {
    type: Connector.enums.type.get,
  }),
  retrieve_room: Connector.Create('visio', 'retrieve_room', {
    type: Connector.enums.type.get,
    needed: { id: EMPTY_STRING },
  }),
  create_room: Connector.Create('visio', 'create_room', {
    type: Connector.enums.type.post,
    needed: { access_level: EMPTY_STRING, configuration: EMPTY_STRING },
  }),
});
