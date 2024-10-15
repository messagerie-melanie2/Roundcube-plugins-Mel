import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { WorkspaceObject } from '../../../mel_workspace/js/lib/WorkspaceObject.js';
import { Roundrive } from '../../../roundrive/roundrive_module.js';

export class NextcloudModule extends WorkspaceObject {
  constructor() {
    super();
  }

  main() {
    super.main();
    //debugger;
    const folder = `/dossiers-${this.workspace.uid}`;
    let roundrive = new Roundrive(folder);
    roundrive.load();

    //roundrive = new Roundrive(folder.replace('/', EMPTY_STRING));
    //roundrive.load();
  }
}
