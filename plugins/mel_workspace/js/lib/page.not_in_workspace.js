import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { connectors } from './connectors.js';
import { WorkspaceObject } from './WorkspaceObject.js';

export class NotInWorkspacePage extends WorkspaceObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    top.history.replaceState(
      {},
      document.title,
      this.url('workspace', {
        action: 'workspace',
        params: {
          _uid: this.workspace.uid,
          _force_bnum: 1,
        },
        removeIsFromIframe: true,
      }),
    );

    if (this.workspace.isPublic) {
      if (
        confirm('Cet espace est publique, cliquez sur "Ok" pour le rejoindre.')
      ) {
        this._connect();
      } else {
        FramesManager.Instance.switch_frame('workspace', {
          args: { _action: 'index' },
        });
      }
    } else {
      alert(
        "Cet espace n'est pas publique, veuillez contactez un utilisateur pour vous ajouter. Redirection vers la liste des espaces....",
      );

      FramesManager.Instance.switch_frame('workspace', {
        args: { _action: 'index' },
      });
    }
  }

  async _connect() {
    let params = connectors.join_workspace.needed;
    params._uid = this.workspace.uid;
    await BnumConnector.connect(connectors.join_workspace, { params });
    //window.location.reload();
  }

  static Start() {
    return new NotInWorkspacePage();
  }
}

NotInWorkspacePage.Start();
