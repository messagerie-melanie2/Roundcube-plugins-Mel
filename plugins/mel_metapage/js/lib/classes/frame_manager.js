import { EMPTY_STRING } from '../constants/constants.js';
import { MelHtml } from '../html/JsHtml/MelHtml.js';
import { BnumEvent } from '../mel_events.js';
import { MelObject } from '../mel_object.js';
import { Mel_Promise } from '../mel_promise.js';
import { BaseStorage } from './base_storage.js';
import { BnumLog } from './bnum_log.js';
import { BnumMessage, eMessageType } from './bnum_message.js';
import { MelEnumerable } from './enum.js';
import { MainNav } from './main_nav.js';

export {
  FramesManager,
  FrameManager,
  MODULE as FrameManger_ModuleName,
  MODULE_CUSTOM_FRAMES as FrameManger_ModuleName_custom,
};

const MODULE = 'FrameManager';
const MODULE_CUSTOM_FRAMES = `${MODULE}_custom_actions`;
const MAX_FRAME = rcmail.env['frames.max_multi_frame'];
export const MULTI_FRAME_FROM_NAV_BAR =
  rcmail.env['frames.multi_frame_enabled'];

class FrameData {
  constructor(task, parent) {
    /**
     * Tache de la frame
     * @type {string}
     * @readonly
     */
    this.task = EMPTY_STRING;
    /**
     * Nom de la frame
     * @type {string}
     * @readonly
     */
    this.name = EMPTY_STRING;
    /**
     * Frame de la tâche
     * @type {external:jQuery}
     * @readonly
     */
    this.$frame = null;
    /**
     * Id de la frame
     * @type {number}
     * @readonly
     */
    this.id = 0;
    /**
     * @type {Window}
     */
    this.parent = parent;
    this.onframecreated = new BnumEvent();
    this.onframecreatedafter = new BnumEvent();
    this.onload = new BnumEvent();
    Object.defineProperties(this, {
      task: {
        value: task,
        enumerable: true,
        configurable: false,
        writable: false,
      },
      name: {},
      $frame: {
        get: () => {
          return top.$(
            `#${this.parent.get_window_id()} .mm-frame.${this.task}-frame`,
          );
        },
      },
      id: {
        value: this.generate_id(),
        enumerable: true,
        configurable: false,
        writable: false,
      },
    });
  }

  create({ changepage = true, args = null, actions = [] }) {
    const close = false;
    const frameArg = {
      complete: '_is_from=iframe',
      key: '_is_from',
      value: 'iframe',
    };

    args[frameArg.key] = frameArg.value;

    let jFrame = MelHtml.start
      .iframe(
        {
          id: `frame-${this.id}`,
          allow: 'clipboard-read; clipboard-write',
          title: `Page : ${this.name}`,
          class: `mm-frame ${this.task}-frame`,
          src: FrameManager.Helper.url(this.task, {
            params: args,
          }),
          onload: this._onload.bind(this, { changepage, actions }),
          'data-frame-task': this.task,
        },
        close,
      )
      .css({
        width: '100%',
        height: '100%',
        border: 'none',
        'padding-left': 0,
      });

    if (!changepage) jFrame.css('display', 'none');

    jFrame =
      this.onframecreated.call(jFrame, { changepage, args, actions }, this) ||
      jFrame;

    jFrame = jFrame.end();

    return (
      this.onframecreatedafter.call(
        jFrame,
        { changepage, args, actions },
        this,
      ) || jFrame
    );
  }

  _onload({ changepage = true, actions = [] }) {
    this.onload.call({ changepage, actions });
  }

  generate_id() {
    if ($('.mm-frame').length)
      return (
        MelEnumerable.from($('.mm-frame'))
          .select((x) => +$(x).attr('id').split('-')[1])
          .max() + 1
      );
    else return 0;
  }

  update_src(args) {
    let url = FrameManager.Helper.url(this.task, { params: args });

    if (!url.includes('_is_from=iframe')) url += '&_is_from=iframe';

    this.$frame.attr('src', url);
    url = null;
    return this;
  }

  /**
   * Affiche la frame
   * @returns {FrameData} Chaînage
   */
  show() {
    this.$frame.parent().show();
    return this;
  }

  /**
   * Cache la frame
   * @returns {FrameData} Chaînage
   */
  hide() {
    this.$frame.parent().hide();
    return this;
  }
}

class HistoryManager {
  constructor() {
    this._history = [];
    this.$back = null;
    Object.defineProperties(this, {
      $back: {
        get() {
          return rcmail.env.menu_last_frame_enabled
            ? $('.menu-last-frame')
            : null;
        },
      },
    });
  }

  add(task) {
    this.update_button_back(task)._history.push(task);

    if (this._history.length > 10) this._history = this._history.slice(1);

    return this;
  }

  update_button_back(last_task) {
    if (this.back_enabled()) {
      let $back = this.$back;

      //Gestion du premier changement de frame
      if ($back.hasClass('disabled'))
        $back.removeClass('disabled').removeAttr('disabled');

      if (!$back.find('.menu-last-frame-item').length)
        $back.append($('<span>').addClass('menu-last-frame-item'));

      //Changement du css
      const css_key = 'm_mp_CreateOrUpdateIcon';

      let font;
      let content;

      try {
        content = window
          .getComputedStyle(
            document.querySelector(`#taskmenu [data-task="${last_task}"]`),
            ':before',
          )
          .getPropertyValue('content')
          .replace(/"/g, '')
          .charCodeAt(0)
          .toString(16);

        font = window
          .getComputedStyle(
            document.querySelector(`#taskmenu [data-task="${last_task}"]`),
            ':before',
          )
          .getPropertyValue('font-family');
      } catch (error) {
        content = EMPTY_STRING;
        font = 'DWP';
      }

      if (last_task === 'settings') {
        content = 'e926';
        font = 'DWP';
      }

      FrameManager.Helper.get_custom_rules().remove(css_key);
      FrameManager.Helper.get_custom_rules().addAdvanced(
        css_key,
        '.menu-last-frame-item:before',
        `content:"\\${content}"`,
        `font-family:${font}`,
      );

      //Changement du text
      const text = rcmail.gettext('last_frame_opened', 'mel_metapage');
      const down = $(`#layout-menu a[data-task="${last_task}"]`)
        .find('.inner')
        .html();

      $back = $back.find('.inner');

      if (!$back.find('.menu-last-frame-inner-up').length) {
        $back.html(
          MelHtml.start
            .span({ class: 'menu-last-frame-inner-up' })
            .text(text)
            .end()
            .span({ class: 'menu-last-frame-inner-down' })
            .text(down)
            .end()
            .generate(),
        );
      } else {
        $back.find('.menu-last-frame-inner-down').html(down);
      }
    }

    return this;
  }

  show_history() {
    const quit = () => {
      $('#frame-mel-history').remove();
      $('#black-frame-mel-history').remove();
      $('#layout-menu').css('left', '0');
    };

    if ($('#frame-mel-history').length > 0) {
      $('#frame-mel-history').remove();
      $('#black-frame-mel-history').remove();
    }

    let $history = $(
      '<div id="frame-mel-history"><div style="margin-top:5px"><center><h3>Historique</h3></center></div></div>',
    );
    let $buttons = $('<div id="frame-buttons-history"></div>').appendTo(
      $history,
    );

    for (let index = this._history.length - 1; index >= 0; --index) {
      const element = $(`#layout-menu a[data-task="${this._history[index]}"]`)
        .find('.inner')
        .text();
      $buttons.append(
        $(
          `<button class="history-button mel-button btn btn-secondary no-button-margin color-for-dark bckg true"><span class="history-text">${element}</span></button>`,
        ).click(
          function (task) {
            FramesManager.Helper.current.switch_frame(task, {});
            quit();
          }.bind(this, this._history[index]),
        ),
      );
    }

    $('#layout')
      .append($history)
      .append(
        $('<div id="black-frame-mel-history"></div>').click(() => {
          quit();
        }),
      );

    $('#layout-menu').css('left', '120px');

    return false;
  }

  back_enabled() {
    return !!this.$back;
  }

  back() {
    return FramesManager.Helper.current.switch_frame(
      this._history[this._history.length - 1],
      {},
    );
  }
}

class Window {
  constructor(uid) {
    this._init()._setup(uid);
  }

  _init() {
    /**
     * Historique des frames
     * @type {HistoryManager}
     * @package
     */
    this._history = new HistoryManager();
    /**
     * Liste des frames ouvertes
     * @type {BaseStorage<FrameData>}
     * @package
     */
    this._frames = new BaseStorage();
    /**
     * Frame en cours
     * @type {FrameData}
     */
    this._current_frame = null;
    this._id = 0;
    this._can_be_selected = true;
    return this;
  }

  _setup(uid) {
    this._id = uid;
    return this;
  }

  _create_frame(task, { changepage = true, args = null, actions = [] }) {
    return new Mel_Promise((promise) => {
      promise.start_resolving();

      if (!args) args = {};

      this._trigger_event('frame.create.before', {
        task,
        changepage,
        args,
        actions,
      });

      if (changepage) {
        this._trigger_event('frame.create.changepage.before', {
          task,
          changepage,
          args,
          actions,
        });
      }

      //Création de la frame qui contient les layouts si elle n'existe pas
      if (!$('#layout-frames').length)
        $('#layout').append(
          this._generate_layout_frames().generate_html({ joli_html: false }),
        );

      if (!this.get_window().length)
        $('#layout-frames').append(this._generate_window().generate());

      const frame_id = `frameid${this._id}`;

      if (changepage)
        MelObject.Empty()
          .generate_loader(frame_id, true)
          .generate()
          .appendTo(this.get_window());

      if (this._current_frame && changepage) {
        this._history.add(this._current_frame.task);
        this._current_frame.hide();
      }

      let current_frame = new FrameData(task, this);

      current_frame.onload.add(
        'resolve',
        this._first_load.bind(
          this,
          promise,
          frame_id,
          task,
          changepage,
          args,
          actions,
        ),
      );

      current_frame.onload.push(() => {
        let querry_content = this.get_frame()[0].contentWindow;
        const _$ = querry_content.$;

        _$('#layout-menu').remove();
        _$('.barup').remove();
        _$('html').addClass('framed');

        //Si on a Jquery
        if (this.get_frame()[0].contentWindow.$) {
          //pour tout les iframes de l'iframe
          for (let iterator of this.get_frame()[0].contentWindow.$('iframe')) {
            //on ajoute un listener sur chaque frames chargés
            iterator.contentWindow.document.addEventListener('click', () => {
              if (!this.is_selected()) {
                FramesManager.Helper.current.unselect_all();
                FramesManager.Helper.current.select_window(this._id);
              }
            });

            iterator.onload = (e) => {
              console.log('e', e);
              e = e.srcElement;
              e.contentWindow.document.addEventListener('click', () => {
                if (
                  FramesManager.Instance.manual_multi_frame_enabled() &&
                  !this.is_selected()
                ) {
                  FramesManager.Helper.current.unselect_all();
                  FramesManager.Helper.current.select_window(this._id);
                }
              });
            };
          }
        }

        this.get_frame()[0].contentWindow.document.addEventListener(
          'click',
          () => {
            if (
              FramesManager.Instance.manual_multi_frame_enabled() &&
              !this.is_selected()
            ) {
              FramesManager.Helper.current.unselect_all();
              FramesManager.Helper.current.select_window(this._id);
            }
          },
        );
      });

      let tmp_frame = current_frame.create({ changepage, args, actions });

      if (!changepage) tmp_frame.first().css('display', 'none');

      this.get_window()[0].add_frame(tmp_frame); //;.find('.mel-window-frame')[0].attach_frame(tmp_frame);
      this._frames.add(task, current_frame);

      if (changepage) {
        this._current_frame = current_frame;
        this.select();
      }

      if (this.has_other_window()) $('.mel-windows').addClass('multiple');
      else $('.mel-windows').removeClass('multiple');

      current_frame = null;
      tmp_frame = null;
    });
  }

  async _open_frame(task, { new_args = null }) {
    this._history.add(this._current_frame.task);
    this._current_frame.hide();
    this._current_frame = this._frames.get(task);

    if (new_args && Object.keys(new_args).length > 0) {
      await new Mel_Promise((promise) => {
        promise.start_resolving();
        this._current_frame.onload.add('src_updated', () => {
          this._current_frame.onload.remove('src_updated');
          promise.resolve(true);
        });
        this._current_frame.update_src(new_args);
      });
    }

    this._current_frame.show();

    this._trigger_event('frame.opened', {
      task,
      changepage: true,
      args: new_args,
      actions: [],
      manager: this,
      first: false,
    });

    return this;
  }

  /**
   *
   * @param {Mel_Promise} promise
   * @param {*} task
   * @param {*} changepage
   * @param {*} args
   * @param {*} actions
   */
  _first_load(promise, frame_id, task, changepage, args, actions) {
    let current = this._frames.get(task);

    current.onload.remove('resolve');
    if (changepage) $('#layout-frames').css('display', EMPTY_STRING);

    this._trigger_event('frame.loaded', {
      task,
      changepage,
      args,
      actions,
      manager: FramesManager.Helper.current,
      window: this,
    });
    this._trigger_event('frame.opened', {
      task,
      changepage,
      args,
      actions,
      manager: FramesManager.Helper.current,
      first: true,
      window: this,
    });

    if (changepage) {
      this._current_frame.show();
      this.get_window().find(`#${frame_id}`).remove();
    }

    promise.resolve(this);
  }

  _update_menu_button(task) {
    $('#taskmenu')
      .find('a')
      .each((i, e) => {
        e = $(e);
        if (e.data('task') === task) {
          if (!e.hasClass('selected')) e.addClass('selected');

          e.attr('aria-disabled', true)
            .attr('tabIndex', '-1')
            .attr('aria-current', true);
        } else {
          e.removeClass('selected')
            .attr('aria-disabled', false)
            .attr('tabIndex', '0')
            .attr('aria-current', false);
        }
      });

    $('#otherapps')
      .find('a')
      .each((i, e) => {
        e = $(e);
        if (e.data('task') === task) {
          if (!e.hasClass('selected')) e.addClass('selected');

          e.attr('aria-disabled', true).attr('tabIndex', '-1');
          $('#taskmenu a.more-options').addClass('selected');
        } else {
          e.removeClass('selected')
            .attr('aria-disabled', false)
            .attr('tabIndex', '0');
        }
      });

    if ($('#otherapps a.selected').length === 0)
      $('#taskmenu a.more-options').removeClass('selected');

    $('#otherapps').css('display', 'none');
  }

  static UpdateNavUrl(url, top_context = false) {
    (top_context ? top : window).history.replaceState({}, document.title, url);
  }

  static UpdateDocumentTitle(new_title, top_context = false) {
    (top_context ? top : window).document.title = new_title;
    $('.sr-document-title-focusable').text(document.title);
  }

  static UrlFromTask(task) {
    return rcmail.get_task_url(
      task,
      window.location.origin + window.location.pathname,
    );
  }

  static GetTaskTitle(task) {
    return $(
      `#layout-menu a[data-task="${task}"], #otherapps a[data-task="${task}"]`,
    )
      .find('.inner, .button-inner')
      .text();
  }

  async switch_frame(task, { changepage = true, args = null, actions = [] }) {
    if (changepage && this.is_hidden()) this.show();

    if (changepage) MainNav.select(task);

    const break_next =
      FramesManager.Instance.call_attach('before_url') === 'break';

    if (!break_next && changepage) {
      Window.UpdateNavUrl(Window.UrlFromTask(task));
      Window.UpdateDocumentTitle(Window.GetTaskTitle(task));
    }

    FramesManager.Instance.call_attach('url');

    if (this._frames.has(task)) {
      if (changepage) await this._open_frame(task, { new_args: args });
    } else await this._create_frame(task, { changepage, args, actions });

    if (!break_next) {
      this.get_window()
        .find('.mel-window-header .mel-window-title')
        .text(Window.GetTaskTitle(task));
    }

    if (changepage) {
      this._current_frame.$frame.focus();

      if (
        this._current_frame.$frame[0].contentWindow.$(
          '#sr-document-title-focusable',
        ).length
      ) {
        this._current_frame.$frame[0].contentWindow
          .$('#sr-document-title-focusable')
          .focus();
      } else {
        this._current_frame.$frame[0].contentWindow
          .$('body')
          .prepend(
            $('<div>')
              .attr('id', 'sr-document-title-focusable')
              .addClass('sr-only')
              .attr('tabindex', '-1')
              .text(document.title),
          )
          .find('.sr-document-title-focusable')
          .focus();
      }

      if (this.has_other_window()) $('.mel-windows').addClass('multiple');
      else $('.mel-windows').removeClass('multiple');
    }
  }

  select() {
    if (this._can_be_selected) {
      this.get_window()
        .addClass('selected')
        .find('.mel-window-header .mel-window-title')
        .text(Window.GetTaskTitle(this._current_frame.task));
    }
    return this;
  }

  unselect() {
    this.get_window().removeClass('selected');
    return this;
  }

  is_selected() {
    return this.get_window().hasClass('selected');
  }

  set_remove_on_change() {
    this._remove_on_change = true;
    return this;
  }

  unset_remove_on_change() {
    this._remove_on_change = false;
    return this;
  }

  is_remove_on_change() {
    return this._remove_on_change;
  }

  set_cannot_be_select() {
    this._can_be_selected = false;
    return this;
  }

  set_can_be_select() {
    this._can_be_selected = true;
    return this;
  }

  can_be_selected() {
    return this._can_be_selected ?? true;
  }

  has_other_window() {
    return $('#layout-frames .mel-windows').length > 1;
  }

  get_window_id() {
    return `mel-window-${this._id}`;
  }

  get_window() {
    return $(`#${this.get_window_id()}`);
  }

  get_frame(task = null) {
    const frame = !task ? this._current_frame : this._frames.get(task);
    return frame.$frame;
  }

  remove_frame(task) {
    let frame = this._frames.get(task);
    this._frames.remove(task);

    frame.$frame.remove();
    return this;
  }

  delete() {
    this.get_window().remove();
    return this;
  }

  update_id(new_id) {
    this.get_window().attr('id', `mel-window-${new_id}`);
    this._id = new_id;
    return this;
  }

  has_frame(task) {
    return this._frames.has(task);
  }

  hide() {
    this.get_window().css('display', 'none');

    return this;
  }

  show() {
    this.get_window().css('display', EMPTY_STRING);

    return this;
  }

  is_hidden() {
    return this.get_window().css('display') === 'none';
  }

  add_tag(tag_name) {
    this.get_window().attr(`data-ftag-${tag_name}`, true);

    return this;
  }

  remove_tag(tag_name) {
    this.get_window().removeAttr(`data-ftag-${tag_name}`);

    return this;
  }

  has_tag(tag_name) {
    return this.get_window().attr(`data-ftag-${tag_name}`) ?? false;
  }

  _generate_window() {
    return MelHtml.start.mel_window(this._id).end();
  }

  _generate_layout_frames() {
    return (
      MelHtml.start
        .div({ id: 'layout-frames' })
        //.css('display', 'none')
        .end()
    );
  }

  _trigger_event(key, args) {
    FrameManager.Helper.trigger_event(key, args);
    rcmail.triggerEvent(key, args);
    return this;
  }
}

class FrameManager {
  constructor() {
    this._init()._main();
  }

  _init() {
    /**
     * Liste des fenêtres
     *
     * @type {BaseStorage<Window>}
     */
    this._windows = new BaseStorage();
    /**
     * Fenêtre en cours
     * @private
     * @type {Window}
     */
    this._selected_window = null;

    this._manual_multi_frame_enabled = true;

    this._modes = {}; //new BaseStorage();

    this._attaches = {};

    this.$layout_frames = null;

    Object.defineProperties(this, {
      $layout_frames: {
        get: () => $('#layout-frames'),
      },
    });

    return this;
  }

  _main() {
    if (rcmail.env.task === 'bnum')
      $('#layout-content').addClass('hidden').css('display', 'none');
  }

  add_tag(tag) {
    let $layout = $('#layout-frames');
    if ($layout.length) {
      $layout.attr(`data-tag-${tag}`, 1);
    }
  }

  remove_tag(tag) {
    let $layout = $('#layout-frames');
    if ($layout.length) {
      $layout.removeAttr(`data-tag-${tag}`);
    }
  }

  async switch_frame(
    task,
    { changepage = true, args = null, actions = [], wind = null },
  ) {
    let quit =
      this.call_attach(
        'switch_frame',
        task,
        changepage,
        args,
        actions,
        wind,
      ) === 'break';

    if (quit) return;

    quit = rcmail.triggerEvent('switch_frame', {
      task,
      changepage,
      args,
      actions,
      wind,
    });

    if (quit) return;
    else quit = null;

    if (wind !== null) {
      if (rcmail.busy) return;
      else if (changepage) BnumMessage.SetBusyLoading();

      if (changepage) this.close_windows_to_remove_on_change();

      if (!this._windows.has(wind)) {
        this._windows.add(wind, new Window(wind));
      }

      if (this._selected_window?._id !== wind) {
        this._selected_window?.unselect?.();
        this._selected_window = this._windows.get(wind);
      }

      await this._selected_window.switch_frame(task, {
        changepage,
        args,
        actions,
      });
      this._selected_window.select();

      if (changepage) BnumMessage.StopBusyLoading();

      return this._selected_window;
    } else
      return await this.switch_frame(task, {
        changepage,
        args,
        actions,
        wind: this._selected_window?._id ?? 0,
      });
  }

  has_multiples_windows() {
    return this._selected_window.has_other_window();
  }

  add_buttons_actions() {
    let $it;

    $('#otherapps').css('z-index', 1);

    for (const iterator of $('#taskmenu a, #otherapps a')) {
      $it = $(iterator);

      $it
        .attr('data-task', $it.attr('href').split('=')[1])
        .attr('href', '#')
        .attr('onclick', EMPTY_STRING);

      if ($it.hasClass('menu-last-frame'))
        $it
          .click(() => {
            this._selected_window._history.back();
          })
          .on('mousedown', (e) => {
            if (e.button === 1) {
              e.preventDefault();
              return this._selected_window._history.show_history();
            }
          })
          .on('contextmenu', () => {
            this._selected_window._history.show_history();
          });
      else if ($it.hasClass('more-options')) {
        $it.click(() => {
          rcmail.command('more_options');
        });
      } else {
        $it.click(this.button_action.bind(this));

        if (MULTI_FRAME_FROM_NAV_BAR) {
          $it
            .popover({
              trigger: 'manual',
              content: this._generate_menu.bind(this, $it),
              html: true,
            })
            .on('contextmenu', (e) => {
              e.preventDefault();
              $(e.currentTarget).popover('show');
            });
        }
      }
    }
  }

  unselect_all() {
    for (const iterator of this._windows) {
      iterator.value.unselect();
    }

    return this;
  }

  select_window(id) {
    {
      const tmp_window = this._windows.get(id).select();

      if (!tmp_window.can_be_selected()) return this;

      this._selected_window = tmp_window;
    }

    const task = this._selected_window._current_frame.task;

    MainNav.select(task);
    Window.UpdateNavUrl(Window.UrlFromTask(task));
    Window.UpdateDocumentTitle(Window.GetTaskTitle(task));

    return this;
  }

  delete_window(id) {
    this._windows.get(id).delete();
    this._windows.remove(id);

    let array = MelEnumerable.from(this._windows)
      .where((x) => !!x?.value)
      .select((x) => x.value)
      .toArray();

    this._windows.clear();

    for (let index = 0, len = array.length; index < len; ++index) {
      array[index].update_id(index);
      this._windows.add(index, array[index]);
    }

    this.select_window(array.length - 1);

    array.length = 0;
    array = null;

    if (!this.has_multiples_windows())
      $('.mel-windows').removeClass('multiple');

    return this;
  }

  add_mode(name, callback) {
    this._modes[name] = callback; //.add(name, callback);

    return this;
  }

  start_mode(name, ...args) {
    const func = this._modes[name]; //.get(name);

    if (func) {
      return func(...args);
    }
    //return this._modes.get(name, () => {})(...args);
  }

  create_window(uid, $parent = null) {
    let win = new Window(uid);

    if ($parent === null) {
      $parent = $('<div>').class('fixed-window').appendTo($('#layout'));
    }

    win._generate_window().generate().appendTo($parent);

    return {
      win,
      $parent,
    };
  }

  _generate_menu($element) {
    const task = $element.data('task');
    const max_frame_goal = this._windows.length >= MAX_FRAME;
    const button_disabled = !this._manual_multi_frame_enabled || max_frame_goal;
    return MelHtml.start
      .div({
        class: 'btn-group-vertical',
        role: 'group',
        'aria-label': 'Actions supplémentaires',
      })
      .button({ class: 'btn btn-secondary' })
      .attr(
        'onclick',
        function onclick(task_to_open) {
          open(FrameManager.Helper.url(task_to_open, {}));
        }.bind(this, task),
      )
      .text('Ouvrir dans un nouvel onglet')
      .end()
      .button({ class: 'btn btn-secondary' })
      .attr('onclick', this.open_another_window.bind(this, task))
      .addClass(button_disabled ? 'disabled' : 'not-disabled')
      .attr(
        button_disabled ? 'disabled' : 'not-disabled',
        button_disabled ? 'disabled' : true,
      )
      .text('Ouvrir dans une nouvelle colonne')
      .end()
      .end()
      .generate()
      .get(0);
  }

  async open_another_window(task, args = null) {
    if (this._windows.length >= MAX_FRAME) {
      BnumMessage.DisplayMessage(
        `Vous ne pouvez pas avoir au dessus de ${MAX_FRAME} pages dans le Bnum.`,
        eMessageType.Error,
      );
    } else {
      return await this.switch_frame(task, {
        args,
        wind:
          MelEnumerable.from(this._windows.keys)
            .select((x) => +x)
            .max() + 1,
      });
    }
  }

  attach(action, callback) {
    this._attaches[action] = callback;

    return this;
  }

  detach(action) {
    return this.attach(action, null);
  }

  call_attach(action, ...args) {
    return this._attaches[action]?.(...args);
  }

  has_frame(task) {
    return this._selected_window.has_frame(task);
  }

  disable_manual_multiframe() {
    this._manual_multi_frame_enabled = false;
    return this;
  }

  enable_manual_multiframe() {
    this._manual_multi_frame_enabled = true;
    return this;
  }

  manual_multi_frame_enabled() {
    return this._manual_multi_frame_enabled;
  }

  start_custom_multi_frame() {
    $('body').addClass('multiframe-header-disabled');
    return this;
  }

  stop_custom_multi_frame() {
    $('body').removeClass('multiframe-header-disabled');
    return this;
  }

  hide_except_selected() {
    for (const { key, value } of this._windows) {
      if (this._selected_window._id !== value._id) value.hide();

      BnumLog.debug('hide_except_selected', key, value);
    }

    return this;
  }

  close_except_selected() {
    let uid;
    while (this._windows.length > 1) {
      uid = +this._windows.keys[0];

      if (uid === this._selected_window._id) uid += 1;

      this.delete_window(uid);
    }

    return this;
  }

  close_windows_to_remove_on_change() {
    while (
      MelEnumerable.from(this._windows)
        .where((x) => x.value.is_remove_on_change())
        .any()
    ) {
      this.delete_window(
        MelEnumerable.from(this._windows)
          .where((x) => x.value.is_remove_on_change())
          .first().value._id,
      );
    }

    return this;
  }

  get_window() {
    return this._selected_window;
  }

  get_frame(task = null) {
    return this._selected_window.get_frame(task);
  }

  current_frame() {
    return this.get_window()._current_frame;
  }

  /**
   *
   * @param {Event} e
   */
  button_action(e) {
    event.preventDefault();
    this.switch_frame($(e.currentTarget).data('task'), {});
  }

  /**
   * @yield {Window}
   */
  *[Symbol.iterator]() {
    for (const element of this._windows) {
      yield element.value;
    }
  }
}

FrameManager._helper = null;
/**
 * @static
 * @readonly
 * @type {MelObject}
 */
FrameManager.Helper = null;
Object.defineProperty(FrameManager, 'Helper', {
  get() {
    if (!FrameManager._helper) FrameManager._helper = MelObject.Empty();

    return FrameManager._helper;
  },
});

/**
 * @typedef FrameManagerWrapperHelper
 * @property {FrameManager} current Récupère le frame manager de la frame courante
 * @property {typeof Window} window_object
 */

/**
 * @class
 * @classdesc
 */
class FrameManagerWrapper {
  constructor() {
    /**
     * Récupère l'instance du FrameManager le plus haut
     * @readonly
     * @type {FrameManager}
     */
    this.Instance = null;
    let _instance = null;

    /**
     * Contient divers fonction d'aide
     * @type {FrameManagerWrapperHelper}
     */
    this.Helper = null;
    let _helper = {};

    Object.defineProperties(_helper, {
      current: {
        get() {
          if (!_instance) _instance = new FrameManager();

          return _instance;
        },
      },
      window_object: {
        get: () => Window,
      },
    });

    Object.defineProperties(this, {
      Instance: {
        get() {
          if (window !== parent && !!parent)
            return parent.mel_modules[MODULE].Instance;
          else if (!_instance) _instance = new FrameManager();

          return _instance;
        },
      },
      Helper: {
        get() {
          return _helper;
        },
      },
    });
  }
}

/**
 * Gère les différentes frames du Bnum
 * @type {FrameManagerWrapper}
 */
const FramesManager =
  window?.mel_modules?.[MODULE] || new FrameManagerWrapper();

window.mm_st_OpenOrCreateFrame = function (
  eClass,
  changepage = true,
  args = null,
  actions = [],
) {
  return FramesManager.Instance.switch_frame(eClass, {
    changepage,
    args,
    actions,
  });
};

window.mm_st_CreateOrOpenModal = function (eclass, changepage = true) {
  return window.mm_st_OpenOrCreateFrame(eclass, changepage);
};

if (!window.mel_modules) window.mel_modules = {};
if (!window.mel_modules[MODULE]) window.mel_modules[MODULE] = FramesManager;
if (!window.mel_modules[MODULE_CUSTOM_FRAMES])
  window.mel_modules[MODULE_CUSTOM_FRAMES] = {};

FramesManager.Instance.add_mode('visio', async (...args) => {
  const [page, params] = args;
  if (!page) {
    if (params) params._page = 'index';

    await FramesManager.Instance.switch_frame('webconf', {
      args: params ?? { _page: 'index' },
    });
  } else if (page !== 'index') {
    params._page = page || 'init';
    FramesManager.Instance.close_except_selected()
      .disable_manual_multiframe()
      .start_custom_multi_frame()
      .get_window()
      .hide();
    window.current_visio = await FramesManager.Instance.open_another_window(
      'webconf',
      params,
    );
    FramesManager.Instance.get_window()
      .set_cannot_be_select()
      //.set_remove_on_change()
      .add_tag('dispo-visio');
    FramesManager.Instance.select_window(0);
  }
});

FramesManager.Instance.add_mode('stop_visio', function () {
  FramesManager.Instance.enable_manual_multiframe().stop_custom_multi_frame();
});

FramesManager.Instance.add_mode('reinit_visio', function () {
  FramesManager.Instance.close_except_selected().get_window().show();
  FramesManager.Instance.start_mode('stop_visio');
  FramesManager.Instance.start_mode('visio');
});
