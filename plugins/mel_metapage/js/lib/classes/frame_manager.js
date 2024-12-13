/**
 * Contient toute la logique et la gestion des frames
 * @module Frames
 */

import { EMPTY_STRING } from '../constants/constants.js';
import { HTMLButtonGroup } from '../html/JsHtml/CustomAttributes/HTMLButtonGroup.js';
import { MelHtml } from '../html/JsHtml/MelHtml.js';
import { isNullOrUndefined } from '../mel.js';
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
  MULTI_FRAME_FROM_NAV_BAR,
};

/**
 * Callback utilisé lors de la création des frames en jshtml.
 *
 * Permet de modifier la frame en jshtml à différents endroits de la création.
 * @callback OnFrameCreatedCallback
 * @param {____JsHtml} jFrame Frame créée en jshtml
 * @param {Object} options
 * @param {boolean} [options.changepage=true] Si la frame doit être chargée en arrière plan ou non.
 * @param {?Object<string, string>}  [options.args=null] Les autres arguments pour le changement d'url.
 * @param {FrameData} frame Référence vers la frame créatrice
 * @return {____JsHtml}
 */

/**
 * Ajoute des actions à faire lorsque la frame est chargée.
 * @callback OnLoadCallback
 * @param {Object} options
 * @param {boolean} [options.changepage=true] Si la frame doit être chargée en arrière plan ou non.
 * @param {?Object<string, string>}  [options.args=null] Les autres arguments pour le changement d'url.
 * @return {null}
 */

/**
 * Nom du module
 * @constant
 * @type {string}
 * @default 'FrameManager'
 */
const MODULE = 'FrameManager';
/**
 * Nom du module lié aux actions custom
 * @constant
 * @type {string}
 * @default 'FrameManager_custom_actions'
 * @deprecated
 */
const MODULE_CUSTOM_FRAMES = `${MODULE}_custom_actions`;
/**
 * Nombre de fenêtres maximal que l'on peut avoir.
 * @constant
 * @type {number}
 */
const MAX_FRAME = rcmail.env['frames.max_multi_frame'];
/**
 * Si le multi-fenêtre manuel est activé.
 *
 * Si c'est le cas, au clic droit sur un bouton de la barre de navigation, le choix d'ouvrir une nouvelle fenêtre ou non sera proposé.
 * @constant
 * @type {boolean}
 */
const MULTI_FRAME_FROM_NAV_BAR = rcmail.env['frames.multi_frame_enabled'];

/**
 * @class
 * @classdesc Contient les donénes d'une frame, un lien vers ça version html et quelque actions qui peuvent l'affecter.
 * @package
 */
class FrameData {
  /**
   * Initialise les variables
   * @param {string} task Tâche lié à la frame
   * @param {Window} parent Fenêtre parente
   */
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
     * Fenêtre parente
     * @type {Window}
     */
    this.parent = parent;

    /**
     * Actions à faire lorsque la frame est créée
     * @type {BnumEvent<OnFrameCreatedCallback>}
     */
    this.onframecreated = new BnumEvent();

    /**
     * Actions à faire après que la frame est créée
     * @type {BnumEvent<OnFrameCreatedCallback>}
     */
    this.onframecreatedafter = new BnumEvent();

    /**
     * Actions à faire lorsque la page est chargée
     * @type {BnumEvent<OnLoadCallback>}
     */
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

  /**
   * Créer une frame en JsHtml
   * @param {Object} param0
   * @param {boolean} [param0.changepage=true] Si la frame doit être chargée en arrière plan ou non.
   * @param {?Object<string, string>}  [param0.args=null] Les autres arguments pour le changement d'url.
   * @param {Array<any>} [param0.actions=[]] Ne pas utiliser
   * @returns {____JsHtml}
   */
  create({ changepage = true, args = null, actions = [] }) {
    //Si on ferme la balise iframe par défaut ou non
    const close = false;
    const frameArg = {
      complete: '_is_from=iframe',
      key: '_is_from',
      value: 'iframe',
    };

    //Passer en mode iframe
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

  /**
   * Est appelé au chargement de la frame.
   *
   * Appele `this.onload`.
   * @param {*} param0
   * @param {boolean} [param0.changepage=true] Si la frame doit être chargée en arrière plan ou non.
   * @param {Array<any>} [param0.actions=[]] Ne pas utiliser
   * @package
   * @event
   */
  _onload({ changepage = true, actions = [] }) {
    this.onload.call({ changepage, actions });
  }

  /**
   * Génère un id unique.
   * @returns {number}
   */
  generate_id() {
    if ($('.mm-frame').length)
      return (
        MelEnumerable.from($('.mm-frame'))
          .select((x) => +$(x).attr('id').split('-')[1])
          .max() + 1
      );
    else return 0;
  }

  /**
   * Met à jours la source de la frame
   * @param {Object<string, string>} args Arguments. Ne pas mettre la tâche.
   * @returns {FrameData} Chaîne
   */
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

  back({ defaultFrame = null } = {}) {
    return FramesManager.Helper.current.switch_frame(
      this._history?.[this._history.length - 1] ?? defaultFrame,
      {},
    );
  }
}

/**
 * @class
 * @classdesc Gère plusieurs frames
 * @package
 */
class Window {
  /**
   * Initialise les variables
   * @param {string | number} uid Id de la fenêtre
   */
  constructor(uid) {
    this._init()._setup(uid);
  }

  /**
   * Initialise les variables
   * @private
   * @returns {Window} Chaîne
   */
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
     * @package
     */
    this._current_frame = null;
    /**
     * Id de la fenêtre
     * @type {number}
     * @package
     */
    this._id = 0;
    /**
     * Si la fenêtre peut-être séléctionnée ou non
     * @type {boolean}
     * @package
     */
    this._can_be_selected = true;
    return this;
  }

  /**
   * Associe les variables
   * @param {number} uid
   * @returns {Window} Chaîne
   * @private
   */
  _setup(uid) {
    this._id = uid;
    return this;
  }

  /**
   * Créer une frame
   * @param {string} task Tâche à afficher
   * @param {Object} param1
   * @param {boolean} [param1.changepage=true] Si on charge la frame en arrière plan ou non
   * @param {?Object<string, string>} [param1.args=null] Arguments - sauf la tâche - de la l'url à ajouter à la source de la frame
   * @returns {Mel_Promise}
   * @package
   * @async
   */
  _create_frame(task, { changepage = true, args = null, actions = [] }) {
    return new Mel_Promise((promise) => {
      promise.start_resolving();

      if (!args) args = {};

      //Action externes à faire avant la création
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

      //Création de la fenêtre si elle n'éxiste pas
      if (!this.get_window().length)
        $('#layout-frames').append(this._generate_window().generate());

      /**
       * Id du loader
       * @type {string}
       * @constant
       * @default `frameid${this._id}`
       */
      const frame_id = `frameid${this._id}`;

      //Si on change de page, on affiche un loader
      if (changepage)
        MelObject.Empty()
          .generate_loader(frame_id, true)
          .generate()
          .appendTo(this.get_window());

      //Ajoute la frame à l'historique et cache l'ancienne frame
      if (this._current_frame && changepage) {
        this._history.add(this._current_frame.task);
        this._current_frame.hide();
      }

      //On créer une variable locale pour éviter les conflits suite à l'asynchrone
      let current_frame = new FrameData(task, this);

      // Voir _first_load
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

      /*
        Au chargement de la frame, vire les éléments indésirable, et 
        si le multi-fenêtre est activé, gérer la séléction de la fenêtre
      */
      current_frame.onload.push(() => {
        let querry_content = this.get_frame()?.[0]?.contentWindow;
        const _$ = querry_content?.$;

        if (_$) {
          _$('#layout-menu').remove();
          _$('.barup').remove();
          _$('html').addClass('framed');
        }

        //Pas besoin d'aller plus loin si le multi-frame est désactivé
        if (!MULTI_FRAME_FROM_NAV_BAR) return;

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

      //Création de la frame
      let tmp_frame = current_frame.create({ changepage, args, actions });

      //if (!changepage) tmp_frame.first().css('display', 'none');

      //La fenêtre est un webcomponent, on utilise les fonctions de celui-ci pour créer la frame
      //sinon, ça risque de ne pas ce comporter correctement
      this.get_window()[0].add_frame(tmp_frame);

      this._frames.add(task, current_frame);

      if (changepage) {
        this._current_frame = current_frame;
        this.select();
      } else current_frame.hide();

      //Gestion si il y a d'autres fenêtres
      if (this.has_other_window()) $('.mel-windows').addClass('multiple');
      else $('.mel-windows').removeClass('multiple');

      current_frame = null;
      tmp_frame = null;
    });
  }

  /**
   * Ouvre une frame déjà ouverte.
   * @param {string} task Frame à ouvrir
   * @param {Object} param1
   * @param {?Object<string, string>} [param1.new_args=null] Nouveau arguments à ajouter à la frame. Si ils éxistent, force le rechargement de la frame.
   * @returns {Promise<Window>}
   */
  async _open_frame(task, { new_args = null }) {
    //Ajoute à l'historique et cache l'ancienne frame
    this._history.add(this._current_frame.task);
    this._current_frame.hide();
    this._current_frame = this._frames.get(task);

    //Met à jour la source de la frame et attend qu'elle soit chargée
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

    //Affiche la frame
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
   * Premier chargement d'une frame. Est supprimé après la fin de l'éxécution de la fonction
   * @param {Mel_Promise} promise Promesse en cour d'éxécution
   * @param {string} frame_id Id de la frame en cours
   * @param {string} task Tâche en cours
   * @param {boolean} changepage Si on charge la frame seulement ou si on l'affiche aussi
   * @param {?Object<string, string>} args Arguments à ajouter en plus à l'url
   * @param {Array} actions Ne pas utiliser
   * @package
   * @event
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

  /**
   * Génère la fenêtre en jshtml
   * @package
   * @returns {____JsHtml}
   */
  _generate_window() {
    return MelHtml.start.mel_window(this._id).end();
  }

  /**
   * Génère la div qui contiendra les fenêtre en jshtml
   * @package
   * @returns {____JsHtml}
   */
  _generate_layout_frames() {
    return (
      MelHtml.start
        .div({ id: 'layout-frames' })
        //.css('display', 'none')
        .end()
    );
  }

  /**
   * Trigger un évènement rcmail et MelObject
   * @private
   * @param {string} key Clé du listener
   * @param {Array} args Arguments
   * @returns {Window} Chaînage
   */
  _trigger_event(key, args) {
    FrameManager.Helper.trigger_event(key, args);
    rcmail.triggerEvent(key, args);
    return this;
  }

  /**
   * Change de frame.
   *
   * Si la frame n'existe pas la créer, sinon l'ouvre.
   * @param {string} task Tâche à ouvrir
   * @param {Object} param1
   * @param {boolean} [param1.changepage=true] Si on charge la frame en arrière plan ou non
   * @param {?Object<string, string>} [param1.args=null] Arguments - sauf la tâche - de la l'url à ajouter à la source de la frame
   * @return {Promise}
   * @async
   */
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

    //Focus le titre de la frame, le cas échéant, le titre de la page
    if (changepage) {
      this._current_frame.$frame.focus();

      if (
        this._current_frame.$frame?.[0]?.contentWindow?.$?.(
          '#sr-document-title-focusable',
        )?.length
      ) {
        this._current_frame.$frame[0].contentWindow
          .$('#sr-document-title-focusable')
          .focus();
      } else {
        await Mel_Promise.wait(
          () => this._current_frame.$frame?.[0]?.contentWindow?.$,
        );

        if (this._current_frame.$frame?.[0]?.contentWindow?.$) {
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
        } else {
          this._current_frame.$frame.focus();
        }
      }

      //Gestion du multi-fenêtre
      if (this.has_other_window()) $('.mel-windows').addClass('multiple');
      else $('.mel-windows').removeClass('multiple');
    }
  }

  /**
   * Sélectionne la fenêtre
   * @returns {Window} Chaîne
   */
  select() {
    if (this._can_be_selected) {
      this.get_window()
        .addClass('selected')
        .find('.mel-window-header .mel-window-title')
        .text(Window.GetTaskTitle(this._current_frame.task));
    }
    return this;
  }

  /**
   * Déselectionne la fenêtre
   * @returns {Window} Chaîne
   */
  unselect() {
    this.get_window().removeClass('selected');
    return this;
  }

  /**
   * Vérifie si la fenêtre est séléctionnée ou non
   * @returns {Boolean}
   */
  is_selected() {
    return this.get_window().hasClass('selected');
  }

  /**
   * Active le tag "remove_on_change".
   *
   * Lorsque le tag est activé, si il y a un change de frame, on supprime les autres fenêtre ayant ce tag d'activé.
   * @returns {Window} Chaînage
   */
  set_remove_on_change() {
    this._remove_on_change = true;
    return this;
  }

  /**
   * Désactive le tag "remove_on_change".
   *
   * Lorsque le tag est activé, si il y a un change de frame, on supprime les autres fenêtre ayant ce tag d'activé.
   * @returns {Window} Chaînage
   */
  unset_remove_on_change() {
    this._remove_on_change = false;
    return this;
  }

  /**
   * Vérifie l'état du tag "remove_on_change".
   *
   * Lorsque le tag est activé, si il y a un change de frame, on supprime les autres fenêtre ayant ce tag d'activé.
   * @returns {boolean}
   */
  is_remove_on_change() {
    return this._remove_on_change;
  }

  /**
   * Active le fait que la feneêtre ne peut pas être séléctionnée
   * @returns {Window} Chaînage
   */
  set_cannot_be_select() {
    this._can_be_selected = false;
    return this;
  }

  /**
   * Active le fait que la fenêtre peut être séléctionnée
   * @returns {Window} Chaînage
   */
  set_can_be_select() {
    this._can_be_selected = true;
    return this;
  }

  /**
   * Vérifie si la fenêtre peut être séléctionnée
   * @returns {Boolean}
   */
  can_be_selected() {
    return this._can_be_selected ?? true;
  }

  /**
   * Vérifie si il y a d'autres fenêtres
   * @returns {boolean}
   */
  has_other_window() {
    return $('#layout-frames .mel-windows').length > 1;
  }

  /**
   * Récupère l'id de la fenêtre
   * @returns {string}
   */
  get_window_id() {
    return `mel-window-${this._id}`;
  }

  /**
   * Récupère la fenêtre
   * @returns {external:jQuery}
   */
  get_window() {
    return $(`#${this.get_window_id()}`);
  }

  /**
   * Récupère la frame
   * @param {string} task Une frame spécifique ou celle en cours.
   * @returns {external:jQuery}
   */
  get_frame(task = null) {
    const frame = !task ? this._current_frame : this._frames.get(task);
    return frame.$frame;
  }

  /**
   * Supprime une frame
   * @param {string} task Tâche à supprimer
   * @returns  {Window} Chaînage
   */
  remove_frame(task) {
    let frame = this._frames.get(task);
    this._frames.remove(task);

    frame.$frame.parent().remove();
    return this;
  }

  async refresh() {
    const plugin = rcmail.triggerEvent('frame.refresh.manual', {
      stop: false,
      caller: this,
    }) ?? { stop: false };

    if (plugin.stop) return this;

    const url = this.get_frame()[0].contentWindow.location.href;
    if (!url) this.get_frame()[0].contentWindow.location.reload();
    else {
      const task = this._current_frame.task;
      let args = {};

      for (const element of url.split('?_task=')[1].split('&')) {
        const [key, value] = element.split('=');

        if (!isNullOrUndefined(value) && !!key && !key.includes('_task'))
          args[key] = value;
      }

      this.remove_frame(task);

      await this.switch_frame(task, {
        args,
      });
    }

    return this;
  }

  /**
   * Supprime la fenêtre
   * @returns {Window} Chaîne
   */
  delete() {
    this.get_window().remove();
    return this;
  }

  /**
   * Change l'id de la feneêtre
   * @param {number | string} new_id Nouvelle id
   * @returns {Window} Chaînage
   */
  update_id(new_id) {
    this.get_window().attr('id', `mel-window-${new_id}`);
    this._id = new_id;
    return this;
  }

  /**
   * Vérifie si une frame lié à une tâche éxiste
   * @param {string} task  Tâche
   * @returns {boolean}
   */
  has_frame(task) {
    return this._frames.has(task);
  }

  /**
   * Cache la fenêtre
   * @returns {Window} Chaîne
   */
  hide() {
    this.get_window().css('display', 'none');

    return this;
  }

  /**
   * Affiche la fenêtre
   * @returns {Window} Chaîne
   */
  show() {
    this.get_window().css('display', EMPTY_STRING);

    return this;
  }

  /**
   * Vérifie si la fenêtre est affiché ou non
   * @returns {boolean} Chaîne
   */
  is_hidden() {
    return this.get_window().css('display') === 'none';
  }

  /**
   * Ajoute un tag à la fenêtre.
   *
   * Les tags sont des attributs `data` ajouté à la balise, il ont la forme :
   *
   * `data-ftag-${tag_name}=true`
   * @param {string} tag_name Nom du tag
   * @returns {Window}
   */
  add_tag(tag_name) {
    this.get_window().attr(`data-ftag-${tag_name}`, true);

    return this;
  }

  /**
   * Supprime un tag à la fenêtre
   * @param {string} tag_name Nom du tag
   * @returns {Window} Chaîne
   */
  remove_tag(tag_name) {
    this.get_window().removeAttr(`data-ftag-${tag_name}`);

    return this;
  }

  /**
   * Vérifie si un tag existe
   * @param {string} tag_name Nom du tag
   * @returns {boolean}
   */
  has_tag(tag_name) {
    return this.get_window().attr(`data-ftag-${tag_name}`) ?? false;
  }

  /**
   * Met à jours l'url
   * @param {string} url Nouvelle url
   * @param {boolean} [top_context=false] Si on change l'url du document en cours ou du document en top.
   * @static
   */
  static UpdateNavUrl(url, top_context = false) {
    (top_context ? top : window).history.replaceState({}, document.title, url);
  }

  /**
   * Met à jours le titre du document ou de l'onglet.
   *
   * Met aussi à jours le titre focusable.
   * @param {string} new_title Nouveau titre
   * @param {boolean} [top_context=false] Si on change l'url du document en cours ou du document en top.
   * @static
   */
  static UpdateDocumentTitle(new_title, top_context = false) {
    (top_context ? top : window).document.title = new_title;
    $('.sr-document-title-focusable').text(document.title);
  }

  /**
   * Créer une url depuis une tâche
   * @param {string} task Tâche
   * @returns {string} Nouvelle url
   * @static
   */
  static UrlFromTask(task) {
    return rcmail.get_task_url(
      task,
      window.location.origin + window.location.pathname,
    );
  }

  /**
   * Récupère le titre depuis une tâche
   * @param {string} task
   * @returns {external:jQuery}
   */
  static GetTaskTitle(task) {
    return $(
      `#layout-menu a[data-task="${task}"], #otherapps a[data-task="${task}"]`,
    )
      .find('.inner, .button-inner')
      .text();
  }
}

/**
 * @class
 * @classdesc Classe principale qui gère la gestion des frames. Contient une liste de fenêtres.
 */
class FrameManager {
  constructor() {
    this._init()._main();
  }

  /**
   * @private
   * @returns {FrameManager}
   */
  _init() {
    /**
     * Liste des fenêtres
     * @package
     * @type {BaseStorage<Window>}
     */
    this._windows = new BaseStorage();
    /**
     * Fenêtre en cours
     * @package
     * @type {Window}
     */
    this._selected_window = null;

    /**
     * Si le mutliframe gérer par l'utilisateur est actif ou non
     * @package
     * @type {string}
     */
    this._manual_multi_frame_enabled = true;

    /**
     * Liste des modes de fenêtrage
     * @type {Object<string, Function>}
     * @package
     */
    this._modes = {};

    /**
     * Liste des attaches.
     *
     * Les attaches sont des actions supplémentaires qui peuvent "parasiter" des actions du changement de frame.
     * @type {Object<string, Function>}
     * @package
     */
    this._attaches = {};

    /**
     * Raccourcis vers layout-frames
     * @readonly
     * @type {external:jQuery}
     */
    this.$layout_frames = null;

    Object.defineProperties(this, {
      $layout_frames: {
        get: () => $('#layout-frames'),
      },
    });

    return this;
  }

  /**
   * Cache le layout-content.
   * @private
   */
  _main() {
    if (rcmail.env.task === 'bnum')
      $('#layout-content').addClass('hidden').css('display', 'none');
  }

  /**
   * Génère le menu multifenêtre
   * @package
   * @param {external:jQuery} $element
   * @returns {any}
   */
  _generate_menu($element) {
    const task = $element.data('task');
    const max_frame_goal = this._windows.length >= MAX_FRAME;
    const button_disabled = !this._manual_multi_frame_enabled || max_frame_goal;
    let buttons = ['open', 'new'];

    if (MULTI_FRAME_FROM_NAV_BAR) {
      buttons.push('column');
    }

    let node = HTMLButtonGroup.CreateNode(buttons, {
      texts: [
        'Ouvrir',
        'Ouvrir dans un nouvel onglet',
        'Ouvrir dans une nouvelle colonne',
      ],
      voice: 'Actions supplémentaires',
    });

    if (MULTI_FRAME_FROM_NAV_BAR && button_disabled) {
      node
        .getButton(2)
        .addClass('disabled')
        .setAttribute('disabled', 'disabled');
    }

    node.addEventListener(
      'api:button.clicked',
      function (args, event) {
        $('#popoverback').remove();

        switch (event.id) {
          case 'open':
            $(`[data-task="${args.task}"]`).click();
            break;

          case 'new':
            open(FrameManager.Helper.url(args.task, {}));
            break;

          case 'column':
            this.open_another_window(args.task, {});
            break;

          default:
            break;
        }
      }.bind(this, { task, max_frame_goal, button_disabled }),
    );

    return node;
    // return MelHtml.start
    //   .div({
    //     class: 'btn-group-vertical',
    //     role: 'group',
    //     'aria-label': 'Actions supplémentaires',
    //   })
    //   .button({ class: 'btn btn-secondary' })
    //   .attr(
    //     'onclick',
    //     function onclick(task_to_open) {
    //       open(FrameManager.Helper.url(task_to_open, {}));
    //     }.bind(this, task),
    //   )
    //   .text('Ouvrir dans un nouvel onglet')
    //   .end()
    //   .button({ class: 'btn btn-secondary' })
    //   .attr('onclick', this.open_another_window.bind(this, task))
    //   .addClass(button_disabled ? 'disabled' : 'not-disabled')
    //   .attr(
    //     button_disabled ? 'disabled' : 'not-disabled',
    //     button_disabled ? 'disabled' : true,
    //   )
    //   .text('Ouvrir dans une nouvelle colonne')
    //   .end()
    //   .end()
    //   .generate()
    //   .get(0);
  }

  /**
   * Ajout un tag aux layout-frames.
   *
   * Les tags ont le format `data-tag-${tag}`.
   * @param {string} tag
   */
  add_tag(tag) {
    let $layout = this.$layout_frames;
    if ($layout.length) {
      $layout.attr(`data-tag-${tag}`, 1);
    }
  }

  /**
   * Supprime un tag aux layout-frames
   * @param {string} tag
   */
  remove_tag(tag) {
    let $layout = this.$layout_frames;
    if ($layout.length) {
      $layout.removeAttr(`data-tag-${tag}`);
    }
  }

  /**
   * Change de frame.
   *
   * Soit une fenêtre précise soit celle en cour.
   * @param {string} task Tâche à afficher
   * @param {Object} param1
   * @param {boolean} [param1.changepage=true] Si on charge la frame en arrière plan ou non
   * @param {?Object<string, string>} [param1.args=null] Arguments - sauf la tâche - de la l'url à ajouter à la source de la frame
   * @param {?number} [param1.wind=null] Id de la fenêtre à changer. Si null, celle en cours.
   * @returns {Promise}
   */
  async switch_frame(
    task,
    { changepage = true, args = null, actions = [], wind = null } = {},
  ) {
    //Action à faire avant le changement de frame
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

      rcmail.triggerEvent('switch_frame.after', {
        task,
        changepage,
        args,
        actions,
        wind,
      });

      return this._selected_window;
    } else
      return await this.switch_frame(task, {
        changepage,
        args,
        actions,
        wind: this._selected_window?._id ?? 0,
      });
  }

  /**
   * Vérifie si il y a plusieurs fenêtres
   * @returns {boolean}
   */
  has_multiples_windows() {
    return this._selected_window.has_other_window();
  }

  /**
   * Ajoute les actions sur les boutons de navigation principale
   */
  add_buttons_actions() {
    let $it;

    $('#otherapps').css('z-index', 80);

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
      } else if ($it.attr('data-command')) {
        $it.click((e) => {
          rcmail.command($(e.currentTarget).attr('data-command'));
        });
      } else {
        $it.click(this.button_action.bind(this));
      }

      // $it.click(() => {
      //   $('#popoverback').remove();
      // })

      if (!$it.hasClass('menu-last-frame') && !$it.attr('data-command')) {
        $it.on(
          'auxclick',
          function (args, e) {
            if (e.originalEvent.button === 1) {
              e.preventDefault();

              open(FrameManager.Helper.url(args.task, {}));
            }
          }.bind(this, { task: $it.attr('data-task') }),
        );
        // $it
        // .popover({
        //   trigger: 'manual',
        //   content: this._generate_menu.bind(this, $it),
        //   html: true,
        // })
        // // .on('hide.bs.popover', () => {
        // //   $('#popoverback').remove();
        // // })
        // .on('contextmenu', (e) => {
        //   e.preventDefault();
        //   $('#layout-menu [aria-describedby], #otherapps [aria-describedby]').each((i, e) => {
        //     $(e).popover('hide');
        //   });
        //    $('#popoverback').remove();
        //   $(e.currentTarget).popover('show');
        //   //console.log('$(e.currentTarget)', $(e.currentTarget));
        //   $('body').prepend($('<div>').click(() => $('#popoverback').remove()).attr('id', 'popoverback').css({width:'100%', height:'100%', position:'absolute', top:0, left:0, 'z-index':1, 'background-color':'var(--ui-widget-overlay)'}));
        // });
      }
    }

    // if (!window.fmbodyoptionsa) {
    //   $('.barup, #layout-menu').click(() => {
    //     $('#popoverback').remove();
    //   });

    //   window.fmbodyoptionsa = true;
    // }
  }

  /**
   * Désélectionne toute les fenêtres
   * @returns {FrameManager} Chaînage
   */
  unselect_all() {
    for (const iterator of this._windows) {
      iterator.value.unselect();
    }

    return this;
  }

  /**
   * Sélectionne une fenêtre
   * @param {number} id Id de la fenêtre
   * @returns {FrameManager} Chaînage
   */
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

  /**
   * Supprime une fenâtre
   * @param {number} id id de la fenêtre à supprimer
   * @returns {FrameManager} Chaînage
   */
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

  /**
   * Ajoute un mode.
   * @param {string} name Nom du mode
   * @param {function} callback Callback du mode
   * @returns {FrameManager} Chaînage
   */
  add_mode(name, callback) {
    this._modes[name] = callback;
    return this;
  }

  /**
   * Démarre un mode
   * @param {string} name Nom du mode
   * @param  {...any} args
   * @returns {any}
   */
  start_mode(name, ...args) {
    const func = this._modes[name];

    if (func) return func(...args);
  }

  /**
   * Créer une fenêtre
   * @param {string | number} uid Id de la fenêtre
   * @param {?external:jQuery} $parent Element parent
   * @returns {{win:external:jQuery, $parent:external:jQuery}}
   */
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

  /**
   * Ouvre une nouvelle fenêtre
   * @param {string} task
   * @param {?Object<string, string>} [args=null]
   * @returns {Promise}
   */
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

  /**
   * Attache une action
   * @param {string} action Nom de l'action
   * @param {Function} callback
   * @returns {Window} Chaînage
   */
  attach(action, callback) {
    this._attaches[action] = callback;

    return this;
  }

  /**
   * Supprime une action
   * @param {string} action Action à supprimer
   * @returns {Window} Chaînage
   */
  detach(action) {
    return this.attach(action, null);
  }

  /**
   * Appèle une action
   * @param {string} action Action à appeller
   * @param  {...any} args
   * @returns {*}
   */
  call_attach(action, ...args) {
    return this._attaches[action]?.(...args);
  }

  /**
   * Vérifie si une frame de la fenêtre séléctionnée éxiste
   * @param {string} task
   * @returns {boolean}
   */
  has_frame(task) {
    return this._selected_window.has_frame(task);
  }

  /**
   * Désactive le fait qu'un utilisateur puisse lancer plusieurs fenêtres
   * @returns {Window} Chaînage
   */
  disable_manual_multiframe() {
    this._manual_multi_frame_enabled = false;
    return this;
  }

  /**
   * Active le fait qu'un utilisateur puisse lancer plusieurs fenêtres
   * @returns {Window} Chaînage
   */
  enable_manual_multiframe() {
    this._manual_multi_frame_enabled = true;
    return this;
  }

  /**
   * Vérifie le fait qu'un utilisateur puisse lancer plusieurs fenêtres
   * @returns {boolean}
   */
  manual_multi_frame_enabled() {
    return this._manual_multi_frame_enabled;
  }

  /**
   * Démarre un multi-fenêtre custom. CAD que la barre au dessus de la fenêtre ne va pas s'afficher.
   * @returns {Window} Chaînage
   */
  start_custom_multi_frame() {
    $('body').addClass('multiframe-header-disabled');
    return this;
  }

  /**
   * Arrête un multi-fenêtre custom.
   * @returns {Window} Chaînage
   */
  stop_custom_multi_frame() {
    $('body').removeClass('multiframe-header-disabled');
    return this;
  }

  /**
   * Cache toute les fenêtres sauf celle qui est séléctionnée
   * @returns {Window} Chaînage
   */
  hide_except_selected() {
    for (const { key, value } of this._windows) {
      if (this._selected_window._id !== value._id) value.hide();

      BnumLog.debug('hide_except_selected', key, value);
    }

    return this;
  }

  /**
   * Supprime toute les fenêtres sauf celle qui est séléctionnée
   * @returns {Window} Chaînage
   */
  close_except_selected() {
    let uid;
    while (this._windows.length > 1) {
      uid = +this._windows.keys[0];

      if (uid === this._selected_window._id) uid += 1;

      this.delete_window(uid);
    }

    return this;
  }

  /**
   * Supprime toute les fenêtres aux changement de frame
   * @returns {Window} Chaînage
   */
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

  /**
   * Récupère la fenêtre courante
   * @returns {Window}
   */
  get_window() {
    return this._selected_window;
  }

  /**
   * Récupère la frame courante
   * @param {?string} task
   * @returns {external:jQuery}
   */
  get_frame(task = null, { jquery = true } = {}) {
    const frame = this._selected_window.get_frame(task);

    if (frame) return jquery ? frame : frame[0];
    else return frame;
  }

  /**
   * Récupère la frame courante
   * @returns {FrameData}
   */
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
 * @type {FrameManagerWrapperHelper}
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
 * @classdesc Wrapper d'instance
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
