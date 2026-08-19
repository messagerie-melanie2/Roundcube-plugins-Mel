import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { BnumConnector } from '../../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { VisioRoomsConnectors } from '../connectors.js';

/**
 * Accès aux salles de visioconférence exposées par le plugin visio.
 */
export class VisioRooms extends MelObject {
  /**
   * Liste les salles accessibles à l'utilisateur courant.
   *
   * @returns {Promise<{datas: Object|null, has_error: boolean, error: any|null}>} Résultat de l'appel
   */
  async listRooms() {
    return await BnumConnector.connect(VisioRoomsConnectors.list_rooms, {});
  }

  /**
   * Récupère le détail d'une salle.
   *
   * @param {string} id - Identifiant UUID de la salle.
   * @returns {Promise<{datas: Object|null, has_error: boolean, error: any|null}>} Résultat de l'appel
   */
  async retrieveRoom(id) {
    return await BnumConnector.connect(VisioRoomsConnectors.retrieve_room, {
      params: { id },
    });
  }

  /**
   * Crée une nouvelle salle.
   *
   * @param {Object} [options]
   * @param {string} [options.accessLevel] - Niveau d'accès souhaité ('public'|'trusted'|'restricted').
   * @param {Object} [options.configuration] - Configuration optionnelle de la salle.
   * @returns {Promise<{datas: Object|null, has_error: boolean, error: any|null}>} Résultat de l'appel
   *
   * @example
   * const result = await rooms.createRoom({ accessLevel: 'trusted' });
   */
  async createRoom({ accessLevel = EMPTY_STRING, configuration = null } = {}) {
    return await BnumConnector.connect(VisioRoomsConnectors.create_room, {
      params: {
        access_level: accessLevel,
        configuration: configuration ? JSON.stringify(configuration) : EMPTY_STRING,
      },
    });
  }
}
