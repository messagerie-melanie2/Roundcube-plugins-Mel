import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { WspNavBar } from './WebComponents/navbar.js';
// import { WspNavBar } from './WebComponents/navbar.js';
import { CurrentWorkspaceData } from './WorkspaceObject.js';

export class NavBarManager {
  constructor() {}

  static get nav() {
    let nav = window;

    {
      let secu = 0;

      while (nav !== parent && ++secu <= 6) {
        nav = parent;
      }
    }

    return nav;
  }

  /**
   *
   * @param {CurrentWorkspaceData} workspace
   */
  static async Generate(workspace) {
    let nav = this.nav;

    if (!nav.document.querySelector(`#navbar-${workspace.uid}`)) {
      /**
       * @type {WspNavBar}
       */
      let navbar = nav.$(rcmail.env.navbar)[0];

      navbar.setAttribute('id', `navbar-${workspace.uid}`);
      navbar.style.marginTop = '60px';
      navbar.style.marginLeft = '60px';
      navbar.style.marginRight = '5px';
      navbar.onbuttonclicked.push((task, event) => {
        switch (task) {
          case 'home':
            FramesManager.Instance.switch_frame('workspace');
            break;

          default:
            FramesManager.Instance.switch_frame(task).then(() => {
              rcmail.env.triggerEvent('workspace.navbar.onclick', {
                task,
                caller: event,
              });
            });
            break;
        }
      });

      nav.$('#layout-frames').before(navbar).css('margin-left', '5px');
      navbar = null;
    }
  }

  static Kill(uid) {
    let nav = this.nav;

    nav.$('#layout-frames').css('margin-left', EMPTY_STRING);
    let navbar = nav.document.querySelector(`#navbar-${uid}`);

    if (navbar) {
      navbar.remove();
      navbar = null;
    }
  }
}
