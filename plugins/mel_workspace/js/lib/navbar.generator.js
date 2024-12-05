import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { MainNav } from '../../../mel_metapage/js/lib/classes/main_nav.js';
import { Random } from '../../../mel_metapage/js/lib/classes/random.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../../mel_metapage/js/lib/mel_promise.js';
import { WspNavBar } from './WebComponents/navbar.js';
// import { WspNavBar } from './WebComponents/navbar.js';
import { CurrentWorkspaceData, WorkspaceObject } from './WorkspaceObject.js';

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
      navbar.onquitbuttonclick.push(() => {
        // this.currentNavBar.remove();
        // nav.$('#layout-frames').css('margin-left', EMPTY_STRING);
        top.history.replaceState(
          {},
          document.title,
          MelObject.Empty()
            .url('workspace', {})
            .replace('&_is_from=iframe', EMPTY_STRING),
        );

        MelObject.Empty()
          .generate_loader('deleting', true)
          .generate()
          .appendTo($('body').html(EMPTY_STRING));
        // window.location.href = MelObject.Empty().url('workspace', {});
        this.Kill(workspace.uid);
        FramesManager.Instance.switch_frame('workspace', {
          args: { _action: 'index' },
        });
      });
      navbar.onbuttonclicked.push((task, event) => {
        this.SwitchPage(task, { event, workspace });
      });

      nav.$('#layout-frames').before(navbar).css('margin-left', '5px');
      navbar = null;
    }

    return this;
  }

  static async SwitchPage(
    task,
    { event = null, workspace = null, manualConfig = null } = {},
  ) {
    const raw_config =
      rcmail.triggerEvent('workspace.nav.beforeswitch', { task, event }) || {};

    const config =
      manualConfig || (Array.isArray(raw_config) ? raw_config[0] : raw_config);
    this.currentNavBar.select(task, { background: true });

    workspace ??= WorkspaceObject.GetWorkspaceData();

    switch (task) {
      case 'home':
        $('.wsp-params').css('display', 'none');
        $('.wsp-row').css('display', EMPTY_STRING);
        await FramesManager.Instance.switch_frame('workspace', {
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

      case 'settings':
      case 'workspace_params':
        this.currentNavBar.onactionclicked.call('settings');
        await FramesManager.Instance.switch_frame('workspace', {
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
              _page: 'settings',
              _force_bnum: 1,
            },
            removeIsFromIframe: true,
          }),
        );
        break;

      case 'more':
      case 'workspace_user':
        this.currentNavBar.onactionclicked.call('more');
        await FramesManager.Instance.switch_frame('workspace', {
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
              _page: 'more',
              _force_bnum: 1,
            },
            removeIsFromIframe: true,
          }),
        );
        break;

      default:
        await FramesManager.Instance.switch_frame(task, {
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
  }

  static Kill(uid) {
    let nav = this.nav;

    nav.$('#layout-frames').css('margin-left', EMPTY_STRING);
    let navbar = nav.document.querySelector(`#navbar-${uid}`);

    for (const key of Object.keys(
      rcmail._handlers_ex?.['workspace.nav.beforeswitch'] || {},
    )) {
      rcmail.remove_handler_ex('workspace.nav.beforeswitch', key);
    }

    for (const key of Object.keys(
      rcmail._handlers_ex?.['workspace.navbar.onclick'] || {},
    )) {
      rcmail.remove_handler_ex('workspace.navbar.onclick', key);
    }

    top.rcmail.add_event_listener_ex('switch_frame', 'workspace', () => {});

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

  /**
   * Attend que la barre de navigation soit chargée
   * @param {Object} [param0={}] Paramètre optionnel
   * @param {number} [param0.waiting_time=5] Temps d'attente en seconde. Mettez `Infinity` pour un temps d'attente infinie
   * @returns {Promise<boolean>} Si la barre de navigation est chargée ou non
   * @async
   */
  static async WaitLoading({ waiting_time = 5 } = {}) {
    if (!NavBarManager.currentNavBar)
      await Mel_Promise.wait(() => !!NavBarManager.currentNavBar, waiting_time);

    return !!NavBarManager.currentNavBar;
  }
}
