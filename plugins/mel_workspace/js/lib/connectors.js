import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { Connector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/connector.js';

export { connectors };

/**
 * @module Workspace/Connectors
 */

/**
 * @enum {Connector<any, any>}
 * @readonly
 */
const connectors = {
  /**
   * Récupère les espaces public suite à une recherche
   * @type {Connector<{_search:string, _page:number}, string>}
   */
  publics_search: Connector.Create('workspace', 'search', {
    type: Connector.enums.type.post,
    params: {
      _type: 'public',
    },
    needed: {
      _search: EMPTY_STRING,
      _page: 1,
    },
  }),
  ////////////////////////////////////////////////////////////////
  /**
   * Récupère le nombre d'espace public trouvé suite à une recherche
   * @type {Connector<{_search:string}, number>}
   */
  publics_search_count: Connector.Create('workspace', 'search', {
    type: Connector.enums.type.post,
    params: {
      _type: 'count_public',
    },
    needed: {
      _search: EMPTY_STRING,
    },
  }),
  ////////////////////////////////////////////////////////////////
  /**
   * Enlève/met un espace en favori
   * @type {Connector<{_id:string}, {newState:boolean}>}
   */
  toggle_favorite: Connector.Create('workspace', 'toggle_favorite', {
    type: Connector.enums.type.post,
    needed: {
      _id: EMPTY_STRING,
    },
  }),
  ////////////////////////////////////////////////////////////////
  /**
   * Change le mode de visualisation d'un espace
   * @type {Connector<{_mode:string}, string>}
   */
  set_visu_mode: Connector.Create('workspace', 'set_visu_mode', {
    type: Connector.enums.type.post,
    needed: {
      _mode: EMPTY_STRING,
    },
  }),
  ////////////////////////////////////////////////////////////////
  /**
   * Connecteur pour rejoindre un espace de travail
   * @type {Connector<{_uid: string}, string | null>}
   */
  join_workspace: Connector.Create('workspace', 'join_user', {
    type: Connector.enums.type.post,
    needed: {
      _uid: EMPTY_STRING,
    },
  }),
  ///////////////////////////////////////////////////////////////
  params_get: Connector.Create('workspace', 'PARAMS_get', {
    type: Connector.enums.type.post,
    needed: {
      _uid: EMPTY_STRING,
      _key: EMPTY_STRING,
    },
  }),
  ///////////////////////////////////////////////////////////////
  params_set: Connector.Create('workspace', 'PARAMS_save', {
    type: Connector.enums.type.post,
    needed: {
      _uid: EMPTY_STRING,
      _key: EMPTY_STRING,
      _value: EMPTY_STRING,
    },
  }),
};
