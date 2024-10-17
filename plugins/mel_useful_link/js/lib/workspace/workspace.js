import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { WorkspaceObject } from '../../../../mel_workspace/js/lib/WorkspaceObject.js';
import { LinkManager } from '../manager.js';

class ModuleLinks extends WorkspaceObject {
  get mainContainer() {
    return document.querySelector('#module-ul');
  }

  get header() {
    return this.mainContainer.querySelector('.module-block-header');
  }

  get contents() {
    return this.mainContainer.querySelector('.module-block-content');
  }

  constructor() {
    super();
  }

  main() {
    super.main();

    this.contents.classList.add('links-items');

    if (!this.loaded && this.workspace.app_loaded('useful-links')) {
      this.load();
    } else this.mainContainer.style.display = 'none';
  }

  load() {
    rcmail.env.mel_portal_ulink = true;
    this.mainContainer.style.display = EMPTY_STRING;
    this.contents.style.overflow = 'unset';
    this.contents.style.height = 'auto';

    let div = document.createElement('div');
    div.setAttribute('id', 'module-link-btn-container');
    this.header.appendChild(div);

    let $div = $(div);
    new LinkManager({ displayButtonElement: $div });

    div.querySelector('.mul_right_buttons').style.position = 'relative';

    div = null;
  }

  static Start() {
    return new ModuleLinks();
  }
}

ModuleLinks.Start();
