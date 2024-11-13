import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { MainNav } from '../../../mel_metapage/js/lib/classes/main_nav.js';
import { Random } from '../../../mel_metapage/js/lib/classes/random.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { WspNavBar } from './WebComponents/navbar.js';
// import { WspNavBar } from './WebComponents/navbar.js';
import { CurrentWorkspaceData } from './WorkspaceObject.js';

/**
 * @callback OnBeforeSwitchCallback
 * @param {Object} args
 * @param {string} args.task
 * @param {Event} args.event
 * @returns {Object} config
 */

/**
 * @callback OnAfterSwitchCallback
 * @param {Object} args
 * @param {string} args.task
 * @param {Event} args.caller
 * @returns {void}
 */

/**
 * @callback ListenerSetterBeforeFunction
 * @param {OnBeforeSwitchCallback} callback
 * @param {string} task
 * @returns {ListenersSetter}
 */

/**
 * @callback ListenerSetterAfterFunction
 * @param {OnAfterSwitchCallback} callback
 * @param {string} task
 * @returns {ListenersSetter}
 */

/**
 * @typedef ListenersSetter
 * @property {ListenerSetterBeforeFunction} OnBeforeSwitch
 * @property {ListenerSetterAfterFunction} OnAfterSwitch
 * @property {typeof NavBarManager} parent
 */

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
   * @type {WspNavBar}
   */
  static get currentNavBar() {
    return this.nav.document.querySelector('bnum-wsp-nav');
  }

  /**
   *
   * @param {CurrentWorkspaceData} workspace
   */
  static Generate(workspace) {
    let nav = this.nav;

    if (!nav.document.querySelector(`#navbar-${workspace.uid}`)) {
      /**
       * @type {WspNavBar}
       */
      let navbar = nav.$(rcmail.env.navbar)[0];
      navbar.startingStates = rcmail.env['workspace_modules_visibility'] ?? {};
      navbar.setAttribute('id', `navbar-${workspace.uid}`);
      navbar.style.marginTop = '60px';
      navbar.style.marginLeft = '60px';
      navbar.style.marginRight = '5px';
      navbar.onbuttonclicked.push((task, event) => {
        const config =
          rcmail.triggerEvent('workspace.nav.beforeswitch', { task, event }) ||
          {};
        this.currentNavBar.unselect();
        switch (task) {
          case 'home':
            FramesManager.Instance.switch_frame('workspace', {
              args: config,
              actions: ['workspace'],
            });
            top.history.replaceState(
              {},
              document.title,
              MelObject.Empty().url('workspace', {
                action: 'workspace',
                params: {
                  _uid: workspace.uid,
                  _force_bnum: 1,
                },
                removeIsFromIframe: true,
              }),
            );
            break;

          default:
            FramesManager.Instance.switch_frame(task, {
              args: config,
              actions: ['workspace'],
            }).then(() => {
              // debugger;
              rcmail.triggerEvent('workspace.navbar.onclick', {
                task,
                caller: event,
              });

              if (task === 'calendar') {
                FramesManager.Instance.get_frame('calendar')[0]
                  .contentWindow.$('#calendar')
                  .fullCalendar('rerenderEvents');
              }

              MainNav.select('workspace', { context: this.nav });
              top.history.replaceState(
                {},
                document.title,
                MelObject.Empty().url('workspace', {
                  action: 'workspace',
                  params: {
                    _uid: workspace.uid,
                    _force_bnum: 1,
                    _page: task,
                  },
                  removeIsFromIframe: true,
                }),
              );
            });
            break;
        }
      });

      nav.$('#layout-frames').before(navbar).css('margin-left', '5px');
      navbar = null;
    }

    return this;
  }

  static Kill(uid) {
    let nav = this.nav;

    nav.$('#layout-frames').css('margin-left', EMPTY_STRING);
    let navbar = nav.document.querySelector(`#navbar-${uid}`);

    for (const key of Object.keys(
      rcmail._handlers_ex['workspace.nav.beforeswitch'],
    )) {
      rcmail.remove_handler_ex('workspace.nav.beforeswitch', key);
    }

    for (const key of Object.keys(
      rcmail._handlers_ex['workspace.navbar.onclick'],
    )) {
      rcmail.remove_handler_ex('workspace.navbar.onclick', key);
    }

    if (navbar) {
      navbar.remove();
      navbar = null;
    }
  }

  /**
   * @static
   * @returns {ListenersSetter}
   */
  static AddEventListener() {
    return {
      OnBeforeSwitch(callback, task) {
        rcmail.add_event_listener_ex(
          'workspace.nav.beforeswitch',
          task,
          callback,
        );
        return this;
      },
      OnAfterSwitch(callback, task) {
        rcmail.add_event_listener_ex(
          'workspace.navbar.onclick',
          task,
          callback,
        );
        return this;
      },
      parent: this,
    };
  }

  static Hide() {
    this.currentNavBar.hide();
    return this;
  }

  static Show() {
    this.currentNavBar.show();
    return this;
  }
}
