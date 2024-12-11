import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

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
    $('#return_to_workspaces_list')
      .attr('href', this.url('workspace', {}))
      .click((e) => {
        e.preventDefault();
        FramesManager.Instance.switch_frame('workspace', {
          args: { _action: 'index' },
        });
      });
  }
}
