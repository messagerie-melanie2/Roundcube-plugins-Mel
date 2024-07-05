import { EMPTY_STRING } from '../constants/constants.js';
import { MelHtml } from '../html/JsHtml/MelHtml.js';
import { BnumEvent } from '../mel_events.js';
import { MelObject, WrapperObject } from '../mel_object.js';
import { Mel_Promise } from '../mel_promise.js';
import { BaseStorage } from './base_storage.js';
import { MelEnumerable } from './enum.js';

export { FramesManager, FrameManager };

class FrameData {
  constructor(task) {
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
          return top.$(`.mm-frame.${this.task}-frame`);
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
    let querry_content = $('.' + this.task + '-frame')[0].contentWindow;
    const _$ = querry_content.$;

    _$('#layout-menu').remove();
    _$('.barup').remove();
    _$('html').addClass('framed');

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
    this.$frame.attr(
      'src',
      FrameManager.Helper.url(this.task, { params: args }),
    );
    return this;
  }

  /**
   * Affiche la frame
   * @returns {FrameData} Chaînage
   */
  show() {
    this.$frame.show();
    return this;
  }

  /**
   * Cache la frame
   * @returns {FrameData} Chaînage
   */
  hide() {
    this.$frame.hide();
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
            FramesManager.Instance.switch_frame(task, {});
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
    return FramesManager.Instance.switch_frame(
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

      if (this._current_frame) {
        this._history.add(this._current_frame.task);
        this._current_frame.hide();
      }

      this._current_frame = new FrameData(task);

      this._current_frame.onload.add('resolve', () => {
        this._current_frame.onload.remove('resolve');
        $('#layout-frames').css('display', EMPTY_STRING);
        this._trigger_event('frame.loaded', {
          task,
          changepage,
          args,
          actions,
          manager: this,
        });
        this._trigger_event('frame.opened', {
          task,
          changepage,
          args,
          actions,
          manager: this,
          first: true,
        });
        this._current_frame.show();
        promise.resolve(this);
      });

      this._current_frame
        .create({ changepage, args, actions })
        .generate()
        .appendTo(this.get_window().find('.mel-'));

      this._frames.add(task, this._current_frame);
    });
  }

  _open_frame(task, { new_args = null }) {
    this._history.add(this._current_frame.task);
    this._current_frame.hide();
    this._current_frame = this._frames.get(task);

    if (new_args) {
      this._current_frame.update_src(new_args);
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

  async switch_frame(task, { changepage = true, args = null, actions = [] }) {
    this._update_menu_button(task);

    if (this._frames.has(task)) this._open_frame(task, { new_args: args });
    else await this._create_frame(task, { changepage, args, actions });

    const url = rcmail.get_task_url(
      task,
      window.location.origin + window.location.pathname,
    );

    window.history.replaceState({}, document.title, url);
    document.title = $(`#layout-menu a[data-task="${task}"]`)
      .find('.inner')
      .html();

    $('.sr-document-title-focusable').text(document.title);

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
  }

  has_other_window() {
    return $('.mel-windows').length > 0;
  }

  get_window() {
    return $(`mel-window-${this._id}`);
  }

  _generate_window() {
    return MelHtml.start
      .div({ id: `mel-window-${this._id}`, class: 'mel-windows' })
      .div({ class: 'mel-window-header' })
      .css('display', 'none')
      .button()
      .icon('delete')
      .end()
      .div({ class: 'mel-window-frame' })
      .end()
      .end();
  }

  _generate_layout_frames() {
    return MelHtml.start
      .div({ id: 'layout-frames' })
      .css('display', 'none')
      .end();
  }

  _trigger_event(key, args) {
    FrameManager.Helper.trigger_event(key, args);
    rcmail.triggerEvent(key, args);
    return this;
  }
}

class FrameManager {
  constructor() {
    this._init();
  }

  _init() {
    /**
     * Liste des fenêtres
     * @private
     * @type {BaseStorage<Window>}
     */
    this._windows = new BaseStorage();
    /**
     * Fenêtre en cours
     * @private
     * @type {Window}
     */
    this._selected_window = null;
  }

  switch_frame(
    task,
    { changepage = true, args = null, actions = [], wind = null },
  ) {
    if (wind !== null) {
      if (!this._windows.has(wind)) {
        this._windows.add(wind, new Window(wind));
      }

      if (this._selected_window?._id !== wind) {
        this._selected_window = this._windows.get(wind);
      }

      this._selected_window.switch_frame(task, { changepage, args, actions });
    } else
      return this.switch_frame(task, {
        changepage,
        args,
        actions,
        wind: this._windows.keys?.[0] ?? 0,
      });
  }

  add_buttons_actions() {
    let $it;
    for (const iterator of $('#taskmenu a')) {
      $it = $(iterator);

      $it
        .attr('data-task', $it.attr('href').split('=')[1])
        .attr('href', '#')
        .attr('onclick', EMPTY_STRING);

      if (false && $it.hasClass('menu-last-frame'))
        $it
          .click(this._history.back.bind(this._history))
          .on('mousedown', (e) => {
            if (e.button === 1) {
              e.preventDefault();
              return this._history.show_history();
            }
          })
          .on('contextmenu', this._history.show_history.bind(this._history));
      else
        $it
          .click(this.button_action.bind(this))
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

  _generate_menu($element) {
    return MelHtml.start
      .div({
        class: 'btn-group-vertical',
        role: 'group',
        'aria-label': 'Actions supplémentaires',
      })
      .button({ class: 'btn btn-secondary' })
      .attr(
        'onclick',
        function onclick(task) {
          open(FrameManager.Helper.url(task, {}));
        }.bind(this, $element.data('task')),
      )
      .text('Ouvrir dans un nouvel onglet')
      .end()
      .button({ class: 'btn btn-secondary' })
      .text('Ouvrir dans une nouvelle colonne')
      .end()
      .end()
      .generate()
      .get(0);
  }

  /**
   *
   * @param {Event} e
   */
  button_action(e) {
    event.preventDefault();
    this.switch_frame($(e.currentTarget).data('task'), {});
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
 * Gère les différentes frames du Bnum
 * @type {WrapperObject<FrameManager>}
 */
const FramesManager = new WrapperObject(FrameManager);

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
