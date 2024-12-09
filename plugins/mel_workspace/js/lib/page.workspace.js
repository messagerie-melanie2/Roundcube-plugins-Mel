import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { NavBarManager } from './navbar.generator.js';
import { WorkspaceObject } from './WorkspaceObject.js';

export class WorkspacePage extends WorkspaceObject {
  get firstRow() {
    return this.#_get_row(1);
  }

  get secondRow() {
    return this.#_get_row(2);
  }

  get thirdRow() {
    return this.#_get_row(3);
  }

  get fourthRow() {
    return this.#_get_row(4);
  }

  get otherRow() {
    return this.#_get_row();
  }

  constructor() {
    super();
  }

  main() {
    super.main();

    $('#layout-content').css({ overflow: 'hidden auto', height: '100%' });

    top.history.replaceState(
      {},
      document.title,
      this.url('workspace', {
        action: 'workspace',
        params: {
          _uid: this.workspace.uid,
          _force_bnum: 1,
        },
        removeIsFromIframe: true,
      }),
    );
    // debugger;
    this.save('current_wsp', this.workspace.uid);
    NavBarManager.nav.$('html').addClass('mwsp');
    // debugger;
    NavBarManager.Generate(this.workspace).currentNavBar.select(
      this.get_env('start_app') || 'home',
      { background: !this.get_env('start_app') },
    );

    //Tâche
    NavBarManager.AddEventListener().OnBeforeSwitch((args) => {
      const { task } = args;

      if (task === 'tasks' && !FramesManager.Instance.has_frame('tasks')) {
        return {
          source: this.workspace.uid,
        };
      }
      else if (task === 'tasks') {
        FramesManager.Instance.get_frame('tasks', { jquery:false })?.contentWindow?.rcmail?.triggerEvent?.('wsp.on.task.showed');
      }
    }, 'tasks');

    NavBarManager.currentNavBar.onactionclicked.push((type) => {
      switch (type) {
        case 'more':
        case 'settings':
          $('.wsp-params').css('display', EMPTY_STRING);
          $('.wsp-row').css('display', 'none');
          break;

        case 'invitation':
          NavBarManager.nav
            .loadJsModule(
              'mel_metapage',
              'wrapper',
              '/js/lib/html/JsHtml/CustomAttributes/',
            )
            .then(() => {
              rcmail.env.WSP_Param.add_user({ context: NavBarManager.nav });
            });
          break;

        case 'visio':
          this.rcmail(true).triggerEvent('visio.start', {
            workspace: this.workspace.uid,
            room: '¤random¤',
          });
          break;

        case 'leave':
          rcmail.env.WSP_Param.leave();
          break;

        default:
          break;
      }
    });

    top.rcmail.add_event_listener_ex('visio.back', 'workspace', () => {
      if (NavBarManager.currentNavBar) {
        NavBarManager.Hide()
          .nav.$('#layout-frames')
          .css('margin-left', '60px');
          
        NavBarManager.nav.$('html').removeClass('mwsp');
      }
    });

    top.rcmail.add_event_listener_ex('switch_frame', 'workspace', (args) => {
      const { actions, task } = args;
      if (!actions.includes('workspace')) {
        if (task !== 'workspace') {
          NavBarManager.Hide()
            .nav.$('#layout-frames')
            .css('margin-left', '60px');
          NavBarManager.nav.$('html').removeClass('mwsp');

          WorkspacePage.OnQuit();
        } else {
          NavBarManager.Show()
            .nav.$('#layout-frames')
            .css('margin-left', '5px');
          NavBarManager.nav.$('html').addClass('mwsp');
        }
      }
    });

    top.rcmail.add_event_listener_ex(
      'switch_frame.after',
      'workspace',
      (args) => {
        const { actions, task } = args;
        if (!actions.includes('workspace')) {
          if (task === 'workspace' && NavBarManager.currentNavBar) {
            NavBarManager.currentNavBar.select(
              NavBarManager.currentNavBar.mainDiv
                .querySelector(
                  'bnum-wsp-navigation bnum-pressed-button[aria-pressed="true"]',
                )
                .parentElement.getAttribute('data-task'),
              { background: false },
            );
          }
        }
      },
    );

    if (this.get_env('start_page')) {
      NavBarManager.WaitLoading().then(() => {
        NavBarManager.currentNavBar.select(this.get_env('start_page'), {
          background: false,
        });
      });
    }
  }

  #_get_row(number = 0) {
    switch (number) {
      case 1:
        number = 'first';
        break;

      case 2:
        number = 'second';
        break;

      case 3:
        number = 'third';
        break;

      case 4:
        number = 'fourth';
        break;

      default:
        number = 'other';
        break;
    }

    return this.select(`#${number}-row`);
  }

  static OnQuit() {
    var context = null;
    if (FramesManager.Instance.has_frame('calendar')) {
      FramesManager.Instance.get_frame('calendar')[0]
        .contentWindow.$('#calendar')
        .fullCalendar('rerenderEvents');
      // context = FramesManager.Instance.get_frame('calendar')[0].contentWindow;
      // for (const key in context.cal.calendars) {
      //   if (Object.prototype.hasOwnProperty.call(context.cal.calendars, key)) {
      //     const element = context.cal.calendars[key];

      //     if (element.active) context.cal.calendar_refresh_source(element.id);
      //   }
      // }
    }
  }
}
