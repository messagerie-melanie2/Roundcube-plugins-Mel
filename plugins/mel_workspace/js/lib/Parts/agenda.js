import { Planning } from '../WebComponents/planning.js';
import { WorkspaceObject } from '../WorkspaceObject.js';

class WorkspaceAgenda extends WorkspaceObject {
  constructor() {
    super();
  }

  main() {
    super.main();
    $('#module-agenda .module-block-content').html(Planning.CreateNode());
  }
}

new WorkspaceAgenda();
