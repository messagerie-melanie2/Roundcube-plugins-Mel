import { FramesManager } from "../../../mel_metapage/js/lib/classes/frame_manager.js";
import { NavBarManager } from "../../../mel_workspace/js/lib/navbar.generator.js";
import { WorkspaceModuleBlock } from "../../../mel_workspace/js/lib/WebComponents/workspace_module_block.js";
import { WorkspaceObject } from "../../../mel_workspace/js/lib/WorkspaceObject.js";

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

    this.loaded //Dit si main est fini ou non 
    this.isDisabled('forum'); //Si l'oeil est barré ou non

    this.block.content.style.overflow = 'hidden';

    this.block.setIframeFromTask('forum', {
      action: 'new_posts',
      args: {
        _uid:this.workspace.uid
      }
    });

    NavBarManager.AddEventListener().OnBeforeSwitch((args) =>{
      const { task } = args;
 
      if (task === 'forum' &&         
        (!FramesManager.Instance.has_frame('forum') ||
      !FramesManager.Instance.get_frame('forum', {
        jquery: false,
      }).contentWindow.location.href.includes(this.workspace.uid))) {
        return {_workspace_uid:this.workspace.uid};
      }
    }, 'forum');

    this.loadModule();
  }
}

new ModuleForum();