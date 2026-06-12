import ABaseMelObject from '../../../mel_metapage/js/lib/base_mel_object.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { BnumEvent } from '../../../mel_metapage/js/lib/mel_events.js';

export class AIndexWorkspaceUI extends ABaseMelObject {
  #_onAfterSearchCache;

  get onAfterSearch() {
    return (this.#_onAfterSearchCache ??= new BnumEvent());
  }

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
    this._p_listenSearch();
    this._p_listenSearchReset();
  }

  #_getConnectorSetVisuMode(params) {
    const connector = params?.connectors?.set_visu_mode;

    if (!connector) throw new Error('Connecteur non implémenté !');

    return connector;
  }

  _p_listenModeChanged(connector) {}

  _p_listenSearch() {}

  _p_listenSearchReset() {}

  _p_afterStart() {}

  async _p_startConnector(connector, params) {
    await BnumConnector.connect(connector, { params });
  }
}
