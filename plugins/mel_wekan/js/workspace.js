import { FramesManager } from '../../mel_metapage/js/lib/classes/frame_manager.js';
import { NavBarManager } from '../../mel_workspace/js/lib/navbar.generator.js';
import { WorkspaceObject } from '../../mel_workspace/js/lib/WorkspaceObject.js';

export class ModuleWekan extends WorkspaceObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    NavBarManager.AddEventListener().OnAfterSwitch((args) => {
      const { task } = args;

      if (
        !!this.workspace.services.wekan?.id &&
        task === 'wekan' &&
        (!FramesManager.Instance.has_frame('wekan') ||
          !FramesManager.Instance.get_frame('wekan')[0]
            .contentWindow.$('#wekan-iframe')[0]
            .contentWindow.location.href.includes(
              this.workspace.services.wekan?.id,
            ))
      ) {
        FramesManager.Instance.get_frame('wekan')[0].contentWindow.$(
          '#wekan-iframe',
        )[0].src =
          `${this.get_env('wekan_base_url')}/b/${this.workspace.services.wekan?.id}/null`;
      }
    }, 'wekan');
  }

  static Start() {
    return new ModuleWekan();
  }
}

ModuleWekan.Start();
