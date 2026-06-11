import ABaseMelObject from '../../../mel_metapage/js/lib/base_mel_object.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';

export class AIndexWorkspaceUI extends ABaseMelObject {
  constructor() {
    super();

    if (this.constructor.name === 'AIndexWorkspaceUI')
      throw new Error("Can't implement abstract class !");
  }

  async initVueMode() {
    await this._p_initVueMode();
  }

  async _p_initVueMode() {}

  addListeners(params) {
    this._p_listenModeChanged(this.#_getConnectorSetVisuMode(params));
  }

  #_getConnectorSetVisuMode(params) {
    const connector = params?.connectors?.set_visu_mode;

    if (!connector) throw new Error('Connecteur non implémenté !');

    return connector;
  }

  _p_listenModeChanged(connector) {}

  _p_listenSearch(connector) {}

  _p_listenSearchReset(connector) {}

  async _p_startConnector(connector, params) {
    await BnumConnector.connect(connector, { params });
  }
}
