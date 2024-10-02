import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { Connector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/connector.js';

export const connectors = {
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
  toggle_favorite: Connector.Create('workspace', 'toggle_favorite', {
    type: Connector.enums.type.post,
    needed: {
      _id: EMPTY_STRING,
    },
  }),
  ////////////////////////////////////////////////////////////////
  set_visu_mode: Connector.Create('workspace', 'set_visu_mode', {
    type: Connector.enums.type.post,
    needed: {
      _mode: EMPTY_STRING,
    },
  }),
};
