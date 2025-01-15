import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { Connector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/connector.js';

export { connectors as VisioConnectors };

/**
 * Contient les différents connecteurs de la visio
 * @module Visio/Connectors
 */

/**
 * Liste des connecteurs de la visio
 * @type {Object<string, Connector>}
 * @constant
 */
const connectors = {
  jwt: new Connector('webconf', 'jwt', { needed: { _room: EMPTY_STRING } }),
};
