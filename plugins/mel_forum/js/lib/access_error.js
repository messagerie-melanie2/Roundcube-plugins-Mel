import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { BnumConnector } from '../../../mel_metapage/js/lib/helpers/bnum_connections/bnum_connections.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { connectors } from '../../../mel_workspace/js/lib/connectors.js';

export class New_posts extends MelObject {
  constructor() {
    super();
  }

  /**
   * Point d'entrée principal de l'application.
   * Appelle la méthode principale de la classe parente,
   * initialise les propriétés et configure les éléments de l'interface utilisateur.
   *
   * @method main
   * @returns {void}
   */
  main() {
    super.main();
    debugger;
    this.workspace_uid = this.get_env('workspace_uid');
    if(this.get_env('workspace_uid')){
      $('#join-workspace').click(() =>
        {
          this.joinWorkspace()
      });
    } else {
      $('#join-workspace').hide();
    }
    $('#return_to_workspaces_list')
      .attr('href', this.url('workspace', {}))
      .click((e) => {
        e.preventDefault();
        FramesManager.Instance.switch_frame('workspace', {
          args: { _action: 'index' },
        });
      });
    
  }

  async joinWorkspace(){
    await BnumConnector.connect(connectors.join_workspace, {params:{_uid:this.workspace_uid}});
  }
}
