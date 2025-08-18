import { MelEnumerable } from '../../../../../mel_metapage/js/lib/classes/enum.js';
import { FramesManager } from '../../../../../mel_metapage/js/lib/classes/frame_manager.js';
import { MelCurrentUser } from '../../../../../mel_metapage/js/lib/classes/user.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { Top } from '../../../../../mel_metapage/js/lib/top.js';
import { NavBarManager } from '../navbar.generator.js';
import { WorkspaceObject } from '../WorkspaceObject.js';

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
    if (!FramesManager.Instance.has_frame('stockage')) {
      console.info(
        '(!)[Workspace/Index] Chargement des documents en arrière plan...',
      );
      FramesManager.Instance.switch_frame('stockage', { changepage: false });
    }

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
    this.save('current_wsp', this.workspace.uid);
    NavBarManager.nav.$('html').addClass('mwsp');
    NavBarManager.Generate(this.workspace).currentNavBar.select(
      this.get_env('start_app') || 'home',
      { background: !this.get_env('start_app') },
    );

    NavBarManager.currentNavBar.onquitbuttonclick.push(WorkspacePage.OnQuit);

    //Tâche
    NavBarManager.AddEventListener().OnBeforeSwitch((args) => {
      const { task } = args;

      if (task === 'tasks' && !FramesManager.Instance.has_frame('tasks')) {
        return {
          source: this.workspace.uid,
          askedTask: 'tasks',
        };
      } else if (task === 'tasks') {
        FramesManager.Instance.get_frame('tasks', {
          jquery: false,
        })?.contentWindow?.rcmail?.triggerEvent?.('wsp.on.task.showed');
      }
    }, 'tasks');

    if (FramesManager.Instance.get_window()._history.back_enabled()) {
      NavBarManager.AddEventListener().OnAfterSwitch(() => {
        FramesManager.Instance.get_window().history.removeLast();
        FramesManager.Instance.get_window().history.update_button_back(
          FramesManager.Instance.get_window().history.last,
        );

        if (FramesManager.Instance.get_window().history.count === 0) {
          FramesManager.Instance.get_window()
            .history.$back.addClass('disabled')
            .attr('disabled', 'disabled');
        }
      }, '/');
    }

    NavBarManager.currentNavBar.onactionclicked.push((type) => {
      switch (type) {
        case 'more':
        case 'settings':
          $('.wsp-params').css('display', EMPTY_STRING);
          $('#main-content').css('display', 'none');
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

        case 'send':
          if (this.workspace.users.emails.length >= 300) {
            if (
              !confirm(
                // eslint-disable-next-line quotes
                "Attention, la limite d'envoi est de 300 destinataires, vous pourrez envoyer un mail seulement aux 300 premiers membres.",
              )
            )
              return;
          }

          // eslint-disable-next-line no-case-declarations
          const mails = MelEnumerable.from(this.workspace.users.emails)
            .where(
              (x) =>
                x &&
                x !== null &&
                x !== 'null' &&
                x !== MelCurrentUser.main_email,
            )
            .take(300)
            .join(',');

          if (
            this.workspace.users.get(this.get_env('current_user').email)
              .external
          ) {
            window.open(`mailto:${mails}`, '_blank');
          } else {
            this.open_compose_step({
              to: mails,
            });
          }
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
        NavBarManager.Hide().nav.$('#layout-frames').css('margin-left', '60px');

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
                  'bnum-wsp-navigation bnum-pressed-button.left-button[aria-pressed="true"]',
                )
                .parentElement.getAttribute('data-task'),
              { background: false },
            );
          }
        }
      },
    );

    top.rcmail.add_event_listener_ex(
      'workspace.hide_adduser_modale',
      'workspace',
      this._hide_add_user_modal.bind(this, top.document),
    );
    rcmail.add_event_listener_ex(
      'workspace.hide_adduser_modale',
      'workspace',
      this._hide_add_user_modal.bind(this, document),
    );
    top.rcmail.add_event_listener_ex(
      'workspace.display_adduser_modale',
      'workspace',
      this._display_add_user_modal.bind(this, top.document),
    );
    rcmail.add_event_listener_ex(
      'workspace.display_adduser_modale',
      'workspace',
      this._display_add_user_modal.bind(this, document),
    );

    FramesManager.Helper.window_object.UpdateDocumentTitle(
      this.getLocalization('page_title', {
        plugin: 'mel_workspace',
        variables: {
          name: this.workspace.title,
        },
      }),
    );

    this.listen(
      'frame.refresh.manual',
      () => {
        let return_data = null;
        if (
          Top.top().document.querySelector('html').classList.contains('mwsp')
        ) {
          const currentTask = FramesManager.Instance.currentTask;
          if (currentTask !== 'workspace') {
            FramesManager.Instance.get_window().remove_frame(currentTask);
            NavBarManager.currentNavBar.select('home');
            NavBarManager.currentNavBar.select(currentTask, {
              background: false,
            });
            return_data = { stop: true };
          }
        }

        return return_data;
      },
      {
        callbackKey: 'wsp.refresh',
        topRcmail: true,
      },
    );

    NavBarManager.currentNavBar.onquitbuttonclick.push(() => {
      const useTop = true;
      this.rcmail(useTop).remove_handler_ex(
        'frame.refresh.manual',
        'wsp.refresh',
      );
    });

    if (this.get_env('start_page')) {
      //Si le document est chargé, on l'applique
      if (document.readyState === 'complete') this._setStartupPage();
      //Sinon, on attend que toute les dépendances soient chargées
      else window.addEventListener('load', this._setStartupPage.bind(this));
    }
  }

  /**
   * cache la modale d'ajout d'utilisateur pour que la modale annuaire fonctionne
   * @param {Window} context
   */
  _hide_add_user_modal(context) {
    context.getElementById('add-user-modal').style.display = 'none';
  }

  /**
   * réaffiche la modale d'ajout d'utilisateur
   * @param {Window} context
   */
  _display_add_user_modal(context) {
    context.getElementById('add-user-modal').style.display = 'block';
  }

  /**
   * Ouvre la page de démarrage. Si _post_uid est présent,on ouvre directement l’article.
   */
  async _setStartupPage() {
    await NavBarManager.WaitLoading();

    const startPage = this.get_env('start_page');

    if (startPage) this.switch_workspace_page(startPage);
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
    let $html;
    for (const frame of FramesManager.Instance.get_window()) {
      if (frame) {
        $html = frame.$frame[0].contentWindow.$('html').removeClass('mwsp');

        if ($html.attr('data-added'))
          $html.removeClass($html.attr('data-added')).removeAttr('data-added');
      }
    }

    $html = null;

    if (FramesManager.Instance.has_frame('calendar')) {
      FramesManager.Instance.get_frame('calendar')[0]
        .contentWindow.$('#calendar')
        .fullCalendar('refetchEvents');
    }
  }
}
