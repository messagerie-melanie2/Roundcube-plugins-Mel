import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants';
import { Connector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/connector';

export { connectors as VisioConnectors };
const connectors = {
  jwt: new Connector('webconf', 'jwt', { needed: { _room: EMPTY_STRING } }),
};
