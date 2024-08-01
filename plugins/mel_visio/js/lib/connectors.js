import { Connector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/connector';

export { connectors as VisioConnectors };
const connectors = {
  jwt: new Connector('mel_visio', 'jwt', {}),
};
