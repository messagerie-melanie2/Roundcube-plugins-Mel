import { FramesManager } from "../../../mel_metapage/js/lib/classes/frame_manager.js";
import { NavBarManager } from "../../../mel_workspace/js/lib/navbar.generator.js";
import { WorkspaceModuleBlock } from "../../../mel_workspace/js/lib/WebComponents/workspace_module_block.js";
import { WorkspaceObject } from "../../../mel_workspace/js/lib/WorkspaceObject.js";
import { BnumMessage } from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from "../../../mel_metapage/js/lib/constants/constants.js";

export class ModuleForum extends WorkspaceObject {
  constructor() {
    super();
  }

  get moduleId() {
    return 'module-forum-last';
  }

  /**
   * @type {WorkspaceModuleBlock}
   */
  get block() {
    return document.querySelector(`#${this.moduleId}`);
  }

  main() {
    super.main();

    // Vérifiez si le module est chargé ou désactivé
    if (!this.loaded && !this.isDisabled('forum')) {
      this._main();
    } else if (this.isDisabled('forum')) {
      this.block.style.display = 'none';
    }

    // Ajout de l'écouteur via addListener()
    this.addListener();
  }

  async addListener() {
    // Attendre que NavBarManager soit prêt
    await NavBarManager.WaitLoading();

    // Ajouter un écouteur sur le changement d'état
    NavBarManager.currentNavBar.onstatetoggle.push(async (...args) => {
      const [task, state, caller] = args;

      const loading = BnumMessage.DisplayMessage(
        this.gettext('loading'),
        'loading',
      );

      // Désactiver l'élément déclencheur pendant le traitement
      $(caller).addClass('disabled').attr('disabled', 'disabled');

      if (task === 'forum') {
        // Gestion des états
        await this.switchState(task, state.newState, this.block);

        if (!state.newState && !this.loaded) {
          this._main();
        }
      }

      // Réactiver l'élément déclencheur
      $(caller).removeClass('disabled').removeAttr('disabled');
      rcmail.hide_message(loading);
    });
  }

  _main() {
    this.block.style.display = EMPTY_STRING;
    this.block.content.style.overflow = 'hidden';
    this.block.content.style.position = 'relative';

    let iframe = this.block.setIframeFromTask('forum', {
      action: 'new_posts',
      args: {
        _uid: this.workspace.uid,
      },
    });

    //TODO : Faire + propre
    this.block.appendContentJQuery($('<div id="last-spinner" class="absolute-center"><span class="spinner-border"></span></div>'));
    iframe.onload = () => {
      $('#last-spinner').remove();
    };

    this.loadModule();
  }
}

new ModuleForum();
