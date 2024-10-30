import { FramesManager } from '../../../../mel_metapage/js/lib/classes/frame_manager.js';
import { NavBarManager } from '../../../../mel_workspace/js/lib/navbar.generator.js';
import { WorkspaceObject } from '../../../../mel_workspace/js/lib/WorkspaceObject.js';

export { TchapWorkspace };

class TchapWorkspace extends WorkspaceObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    NavBarManager.AddEventListener().OnAfterSwitch((args) => {
      const { task } = args;

      if (task === 'tchap') {
        FramesManager.Instance.get_frame('tchap')[0]
          .contentWindow.$('#tchap_frame')
          .attr(
            'src',
            rcmail.env.tchap_url +
              '#/room/' +
              this.workspace.services['tchap-channel']?.id,
          );
      }
    }, 'tchap');
  }

  static Start() {
    return new TchapWorkspace();
  }
}

TchapWorkspace.Start();
