/**
 * @module NcWspConnectors
 * Ce module exporte les connecteurs utilisés pour interagir avec les fonctionnalités de Nextcloud.
 */

import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { Connector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/connector.js';

export { connectors as NcWspConnectors };

/**
 * Objet contenant les connecteurs pour les fonctionnalités favorites et corbeilles.
 * @typedef WorkspaceConnectors
 * @property {Connector<{_directory: string}, string>} favorites - Connecteur pour récupérer les favoris.
 * @property {Connector<{_directory: string}, string>} trashes - Connecteur pour récupérer les éléments dans la corbeille.
 */

/**
 * Objet contenant les connecteurs pour les fonctionnalités favorites et corbeilles.
 * @type {WorkspaceConnectors}
 * @constant
 */
const connectors = {
  /**
   * Connecteur pour récupérer les favoris.
   * @type {Connector<{_directory: string}, string>}
   * @property {string} type - Type de requête (POST).
   * @property {Object} needed - Paramètres nécessaires pour la requête.
   * @property {string} needed._directory - Répertoire cible (vide par défaut).
   */
  favorites: Connector.Create('roundrive', 'get_favorites', {
    type: Connector.enums.type.post,
    needed: { _directory: EMPTY_STRING },
  }),

  /**
   * Connecteur pour récupérer les éléments dans la corbeille.
   * @type {Connector<{_directory: string}, string>}
   * @property {string} type - Type de requête (POST).
   * @property {Object} needed - Paramètres nécessaires pour la requête.
   * @property {string} needed._directory - Répertoire cible (vide par défaut).
   */
  trashes: Connector.Create('roundrive', 'get_trashes', {
    type: Connector.enums.type.post,
    needed: { _directory: EMPTY_STRING },
  }),
};
