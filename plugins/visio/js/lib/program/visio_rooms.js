import { BnumConnector } from '../../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { BnumLog } from '../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { VisioRoomsConnectors } from '../connectors.js';

/** Code HTTP renvoyé par l'API lorsqu'une salle est créée. */
const HTTP_CREATED = 201;

/**
 * @typedef {Object} ConnectorResult
 * @property {?{httpCode: number, content: ?Object}} datas - Réponse du serveur
 * @property {boolean} has_error - Si l'appel AJAX a échoué
 * @property {*} error - Erreur éventuelle
 */

/**
 * @typedef {Object} VisioRoom
 * @property {string} url - Url de la salle
 * @property {string} name - Nom de la salle
 * @property {{phone_number?: string, pin_code?: string}} [telephony] - Accès téléphonique
 */

/**
 * Accès aux salles de visioconférence exposées par le plugin visio.
 */
export class VisioRooms {
  /**
   * Liste les salles accessibles à l'utilisateur courant.
   *
   * @returns {Promise<ConnectorResult>} Résultat de l'appel
   */
  listRooms() {
    return BnumConnector.connect(VisioRoomsConnectors.list_rooms, {});
  }

  /**
   * Récupère le détail d'une salle.
   *
   * @param {string} id - Identifiant UUID de la salle
   * @returns {Promise<ConnectorResult>} Résultat de l'appel
   */
  retrieveRoom(id) {
    return BnumConnector.connect(VisioRoomsConnectors.retrieve_room, {
      params: { id },
    });
  }

  /**
   * Crée une nouvelle salle et renvoie le résultat brut de l'appel.
   * Préférer {@link VisioRooms#tryCreateRoom} pour obtenir directement la salle.
   *
   * @param {Object} [options]
   * @param {string} [options.accessLevel] - Niveau d'accès souhaité ('public'|'trusted'|'restricted')
   * @param {Object} [options.configuration] - Configuration optionnelle de la salle
   * @returns {Promise<ConnectorResult>} Résultat de l'appel
   *
   * @example
   * const result = await rooms.createRoom({ accessLevel: 'trusted' });
   */
  createRoom({ accessLevel = EMPTY_STRING, configuration = null } = {}) {
    return BnumConnector.connect(VisioRoomsConnectors.create_room, {
      params: {
        access_level: accessLevel,
        configuration: configuration
          ? JSON.stringify(configuration)
          : EMPTY_STRING,
      },
    });
  }

  /**
   * Crée une nouvelle salle et renvoie ses données, ou `null` en cas
   * d'échec (l'échec est journalisé).
   *
   * @param {Object} [options] - Voir {@link VisioRooms#createRoom}
   * @returns {Promise<?VisioRoom>} Salle créée, ou `null` si la création a échoué
   *
   * @example
   * const room = await new VisioRooms().tryCreateRoom();
   * if (room) console.log(room.url);
   */
  async tryCreateRoom(options = {}) {
    const result = await this.createRoom(options);

    if (result.has_error || result.datas?.httpCode !== HTTP_CREATED) {
      BnumLog.error(
        'VisioRooms::tryCreateRoom',
        'Impossible de créer une salle !',
        result,
      );
      return null;
    }

    return result.datas.content;
  }
}
