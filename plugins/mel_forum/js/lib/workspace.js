import { FramesManager } from "../../../mel_metapage/js/lib/classes/frame_manager";
import { NavBarManager } from "../../../mel_workspace/js/lib/navbar.generator";
import { WorkspaceObject } from "../../../mel_workspace/js/lib/WorkspaceObject";

export class ModuleForum extends WorkspaceObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    NavBarManager.AddEventListener().OnBeforeSwitch((args) =>{
      const { task } = args;

      if (task === 'forum') {
        FramesManager.Instance.get_frame('forum')[0].contentWindow.$(
          '#forum-iframe',
        )[0].src = `https://bnum.local/?_task=forum`;

      }
    });
  }
}