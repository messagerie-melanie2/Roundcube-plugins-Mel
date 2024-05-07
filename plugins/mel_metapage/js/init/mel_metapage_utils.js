/* eslint-disable no-shadow */
/**
 * Met en pause une fonction asynchrone.
 * @param {number} ms
 */
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Vérifie si une fonction est asynchrone
 * @param {Function} myFunction
 * @returns {boolean}
 */
const isAsync = (myFunction) => myFunction.constructor.name === 'AsyncFunction';

/**
 * Attend que la fonction soit vrai
 * @param {Function} func
 * @param {number} waitTime ms
 */
const wait = async function (func, waitTime = 500) {
  while (isAsync(func) ? await func() : func()) {
    await delay(waitTime);
  }
};

const ping = async function (url, useSSL = true) {
  // //let ip = url;

  // var _that = this;

  // let img = new Image();

  // img.onload = function() {_that.ok = true;};
  // img.onerror = function(e) {_that.ok = false; console.error(e);};

  // //let start = new Date().getTime();
  let ssl = useSSL ? 'https' : 'http';
  // img.src = !url.includes("https") && !url.includes("http") ? (ssl + "://" + url) : url;
  // console.log(img.src);
  // let timer = setTimeout(function() { _that.ok = false;}, waitTime*1000);
  // await wait(() => _that.ok === undefined);
  // clearTimeout(timer)
  // return _that.ok;
  let ok;
  try {
    await $.ajax({
      type: 'GET',
      url:
        !url.includes('https') && !url.includes('http')
          ? ssl + '://' + url
          : url,
      success: function (result) {
        ok = true;
      },
      error: function (result) {
        ok = false;
      },
    });
  } catch (error) {
    console.error(error);
    ok = false;
  }
  return ok;
};

const mceToRcId = function (txt = '') {
  return txt
    .replaceAll('.', '_-P-_')
    .replaceAll('@', "'_-A-_'")
    .replaceAll('%', '_-C-_');
};

(() => {
  function ureplacer(pmatch) {
    var ret = '';
    pmatch = pmatch.replace(/\,/g, '/');
    var ix = pmatch.substr(1, pmatch.length - 2);

    if (ix.length % 4 != 0)
      ix = ix.padEnd(ix.length + 4 - (ix.length % 4), '=');
    try {
      var dx = atob(ix);
      for (var j = 0; j < dx.length; j = j + 2) {
        ret =
          ret +
          String.fromCharCode((dx.charCodeAt(j) << 8) + dx.charCodeAt(j + 1));
      }
    } catch (err) {
      console.log(
        'Error in decoding foldername IMAP UTF7, sending empty string back',
      );
      console.log(err);
      ret = '';
    }
    return ret;
  }

  function breplacer(umatch) {
    var bst = '';
    for (var i = 0; i < umatch.length; i++) {
      var f = umatch.charCodeAt(i);
      bst = bst + String.fromCharCode(f >> 8) + String.fromCharCode(f & 255);
    }

    try {
      bst = '&' + btoa(bst).replace(/\//g, ',').replace(/=+/, '') + '-';
    } catch (err) {
      console.log(
        'Error in encoding foldername IMAP UTF7, sending empty string back',
      );
      console.log(err);
      bst = '';
    }
    return bst;
  }

  function decode_imap_utf7(mstring) {
    var stm = new RegExp(/(\&[A-Za-z0-9\+\,]+\-)/, 'g');
    return mstring.replace(stm, ureplacer).replace('&-', '&');
  }

  function encode_imap_utf7(ustring) {
    ustring = ustring.replace(/\/|\~|\\/g, '');
    var vgm = new RegExp(/([^\x20-\x7e]+)/, 'g');
    return ustring.replace('&', '&-').replace(vgm, breplacer);
  }

  function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    let expires = 'expires=' + d.toUTCString();
    document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
  }

  window.decode_imap_utf7 = decode_imap_utf7;

  window.melSetCookie = setCookie;

  window.getCookie = (name) => {
    return rcmail.get_cookie(name);
  };

  window.removeCookie = (name) => {
    setCookie(name, '', -5);
  };
})();
/**
 * Lien du chargement des évènements d'un calendrier.
 */
const ev_calendar_url = '?_task=calendar&_action=load_events';

/**
 * Liste des différents données constantes utile pour le plugin "mel_metapage".
 */
const mel_metapage = {
  /**
   * Liste des différents évènements.
   */
  EventListeners: {
    /**
     * Lorsque le calendrier est mis à jours.
     */
    calendar_updated: new EventListenerDatas('mel_metapage.calendar_updated'),
    /**
     * Lorsque les tâches sont mises à jours.
     */
    tasks_updated: new EventListenerDatas('mel_metapage.tasks_updated'),
    /**
     * Lorsque les mails sont mis à jours.
     */
    mails_updated: new EventListenerDatas('mel_metapage.mails_updated'),
    /**
     * Lorsque le stockage est mis à jours.
     */
    wsp_stockage_updated: new EventListenerDatas(
      'mel_metapage.wsp_stockage_updated',
    ),
    workspaces_updated: new EventListenerDatas('workspace.updated'),
  },
  /**
   * Différents clés de stockage local.
   */
  Storage: {
    unexist: Symbol('unexist'),
    exists(val) {
      return (val ?? this.unexist) !== this.unexist;
    },
    /**
     *
     * @returns {MelDataStore}
     */
    _getDataStore() {
      let self = (top ?? window).mel_metapage.Storage;

      if (!self._getDataStore.datastoreobject) {
        const current_user_key = `bnum.${rcmail.env.username}`;
        self._getDataStore.datastoreobject = new MelDataStore(
          current_user_key,
          {},
        );

        if (rcmail.env.keep_login) {
          const keys = Object.keys(localStorage);

          for (let index = 0, len = keys.length; index < len; ++index) {
            const key = keys[index];

            if (key !== current_user_key && key.includes('bnum')) {
              localStorage.removeItem(key);
            }
          }
        }
      }

      return self._getDataStore.datastoreobject;
    },
    /**
     * Récupère une donnée depuis le stockage local.
     * @param {string} key Clé de la donnée à récupérer.
     */
    get(key, _default = null) {
      let self = mel_metapage.Storage;
      try {
        return self._getDataStore().get(key) ?? _default;
      } catch (error) {
        console.error(error);
        return self.unexist;
      }
    },
    /**
     * Ajoute ou modifie une donnée dans le stockage local.
     * @param {string} key Clé de la donnée pour la retrouver.
     * @param {*} item Donnée à sauvegarder.
     */
    set(key, item, stringify = true) {
      this._getDataStore().set(key, item);
      this.setStoreChange(key, item);
    },
    /**
     * Supprime une donnée dans le stockage local.
     * @param {string} key Clé de la donnée à supprimer.
     */
    remove(key) {
      this._getDataStore().remove(key);
      this.setStoreChange(key, undefined);
    },
    setStoreChange(key, item) {
      if ((top ?? window).rcmail !== undefined)
        (top ?? window).rcmail.triggerEvent('storage.change', { key, item });

      (top ?? window).$('iframe.mm-frame').each((i, e) => {
        try {
          e.contentWindow.rcmail.triggerEvent('storage.change', { key, item });
        } catch (error) {}
      });
    },
    getAppStorageSize() {
      return this._getDataStore().getSize();
    },
    check(storage = null) {
      if (storage === null) {
        let items = [];
        for (const key in mel_metapage.Storage) {
          const element = mel_metapage.Storage[key];
          if (element !== undefined) {
            items.push(mel_metapage.Storage.check_day(key));
          }
        }

        return {
          items: items,
          wait: async function () {
            for (let index = 0; index < this.items.length; ++index) {
              const element = this.items[index];
              if (element.wait !== undefined) await element.wait();
            }
          },
        };
      } else {
        const update_element = (update_key, day_key) => {
          let item = {
            wait: async () => {
              return mel_metapage.Storage.get(update_key);
            },
          };
          let update = false;
          if (
            !update &&
            moment(mel_metapage.Storage.get(day_key)).format('DD/MM/YYYY') !==
              moment().format('DD/MM/YYYY')
          )
            update = true;
          if (!update && mel_metapage.Storage.get(update_key) === null)
            update = true;
          if (update) {
            mel_metapage.Storage.remove(update_key);
            workspaces.sync.PostToParent({
              exec: 'rcmail.mel_metapage_fn.tasks_updated()',
              child: false,
            });
            item.wait = async () => {
              await wait(() => mel_metapage.Storage.get(update_key) === null);
              return mel_metapage.Storage.get(update_key);
            };
          }
          return item;
        };

        switch (storage) {
          case mel_metapage.Storage.other_tasks:
          case mel_metapage.Storage.tasks:
            return update_element(
              storage,
              mel_metapage.Storage.last_task_update,
            );
          case mel_metapage.Storage.calendar_all_events:
          case mel_metapage.Storage.calendar:
            return update_element(
              storage,
              mel_metapage.Storage.last_calendar_update,
            );
          default:
            return item;
        }
      }
    },
    /**
     * Clé des données du calendrier.
     */
    calendar_all_events: CONST_STORAGE_KEY_ALL_EVENTS,
    calendar: 'mel_metapage.calendar',
    calendar_by_days: 'mel_metapage.calendars.by_days',
    calendars_number_wainting: 'mel_metapage.calendars.by_days.waiting',
    /**
     * Clé des données des tâches.
     */
    tasks: 'mel_metapage.tasks',
    other_tasks: 'mel_metapage.tasks.others',
    other_tasks_count: 'mel_metapage.tasks.others.count',
    /**
     * Clé du nombre de mail non lus.
     */
    mail: 'mel_metapage.mail.count',
    wsp_mail: 'mel_metapage.wsp.mails',
    last_calendar_update: 'mel_metapage.calendar.last_update_2',
    last_task_update: 'mel_metapage.tasks.last_update',
    ariane: 'ariane_datas',
    wait_frame_loading: 'mel_metapage.wait_frame_loading',
    wait_frame_waiting: 'waiting...',
    wait_frame_loaded: 'loaded',
    wait_call_loading: 'mel_metapage.call.loading',
    color_mode: 'colorMode',
    title_workspaces: 'workspaces.title',
  },
  /**
   * Liste des symboles.
   */
  Symbols: {
    /**
     * Symboles du plugin "My_Day".
     */
    my_day: {
      /**
       * Symbole "Calendrier", est utilisé pour savoir si il faut mettre à jours uniquement les évènements ou non.
       */
      calendar: Symbol('calendar'),
      /**
       * Symbole "Tâches", est utilisé pour savoir si il faut mettre à jours uniquement les tâches ou non.
       */
      tasks: Symbol('tasks'),
    },
    nextcloud: {
      folder: Symbol('folder'),
      file: Symbol('file'),
    },
    navigator: {
      firefox: Symbol('firefox'),
    },
    null: Symbol('null'),
  },
  /**
   * Les différents Identifiants
   */
  Ids: {
    /**
     * Ids pour le menu.
     */
    menu: {
      /**
       * Id des différents badges du menu.
       */
      badge: {
        calendar: 'menu-badge-calendar',
        tasks: 'menu-badge-tasks',
        mail: 'menu-badge-mail',
        ariane: 'menu-badge-ariane',
      },
    },
    create: {
      doc_input: 'generated-document-input-mel-metapage',
      doc_input_ext: 'generated-document-input-mel-metapage-ext',
      doc_input_hidden: 'generated-document-input-mel-metapage-hidden',
      doc_input_path: 'generated-document-select-mel-metapage-path',
    },
  },
  PopUp: {
    /**
     * Ouvre la popup de chat
     * @returns
     */
    open_ariane() {
      if (rcmail.busy) return;

      if (mel_metapage.PopUp.ariane === null) {
        mel_metapage.PopUp.ariane = new ArianePopUp(ArianeButton.default());
        rcmail.addEventListener('toggle-options-user', (show) => {
          let $iframe =
            mel_metapage.PopUp.ariane.ariane.card.body.card.find('iframe');

          if (show.show === true) $iframe.css('z-index', '1');
          else $iframe.css('z-index', '');
        });
      }

      if (mel_metapage.PopUp.ariane.is_show === true)
        mel_metapage.PopUp.ariane.hide();
      else mel_metapage.PopUp.ariane.show();
    },
    ariane: null,
  },
  Other: {
    webconf: {
      private: '/group',
    },
  },
  RCMAIL_Start: {
    async ping_nextcloud() {
      if (
        rcmail.env.nextcloud_url !== undefined &&
        rcmail.env.nextcloud_url !== null &&
        rcmail.env.nextcloud_url !== ''
      ) {
        rcmail.env.nextcloud_pinged = await ping(rcmail.env.nextcloud_url);
        if (rcmail.env.nextcloud_pinged === false)
          rcmail.env.nextcloud_pinged = await ping(
            rcmail.env.nextcloud_url,
            true,
          );
      }
    },
  },
  Frames: {
    max: 10,
    lastFrames: [],
    add(frame) {
      if (parent !== window) return parent.mel_metapage.Frames.add(frame);

      if (frame?.task === 'webconf') return this;

      if (this.lastFrames.length + 1 > 5) this.lastFrames.pop();

      this.lastFrames.push(frame);
      return this;
    },
    reset() {
      if (parent !== window) return parent.mel_metapage.Frames.reset();

      this.lastFrames = [];
      return this;
    },
    pop() {
      if (parent !== window) return parent.mel_metapage.Frames.pop();

      if (this.lastFrames.length === 0) return null;

      return this.lastFrames.pop();
    },
    last(it = 0) {
      if (parent !== window) return parent.mel_metapage.Frames.last(it);

      if (this.lastFrames.length === 0) return null;

      return this.lastFrames[this.lastFrames.length - 1 - it];
    },
    back(_default = 'home') {
      if (parent !== window) return parent.mel_metapage.Frames.back(_default);

      const unexist = mel_metapage.Storage.unexist;
      let last = this.pop()?.task || _default;

      if (last === unexist) last = _default;

      return mel_metapage.Functions.change_frame(last, true, true).then(() => {
        if ($('.menu-last-frame').hasClass('disabled')) {
          m_mp_ChangeLasteFrameInfo();
        }
      });
    },
    create_frame(name, task, icon) {
      return {
        name,
        task,
        icon,
      };
    },
  },
  Functions: {
    /**
     * Copie un texte dans le press-papier
     * @param {string} text Texte à copier
     */
    copy(text) {
      function copyOnClick(val) {
        var tempInput = document.createElement('input');
        tempInput.value = val;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }

      copyOnClick(text);
      rcmail.display_message(
        `${text} copier dans le presse-papier.`,
        'confirmation',
      );

      return this;
    },

    /**
     * Récupère les données du calendrier entre deux dates.
     * @param {moment} start (moment) Début des évènements à récupérer
     * @param {moment} end (moment) Fin des évènements à récupérer
     */
    update_calendar(start, end) {
      start = start.format('YYYY-MM-DDTHH:mm:ss');
      end = end.format('YYYY-MM-DDTHH:mm:ss');

      if (rcmail.env.ev_calendar_url === undefined)
        rcmail.env.ev_calendar_url = ev_calendar_url;

      return $.ajax({
        // fonction permettant de faire de l'ajax
        type: 'GET', // methode de transmission des données au fichier php
        url:
          rcmail.env.ev_calendar_url +
          `&source=${mceToRcId(rcmail.env.username)}` +
          '&start=' +
          start +
          '&end=' +
          end, // url du fichier php
        success: function (data) {
          try {
            let events = [];
            data = JSON.parse(data);
            data = Enumerable.from(data)
              .where(
                (x) =>
                  mel_metapage.Functions.check_if_date_is_okay(
                    x.start,
                    x.end,
                    start,
                  ) ||
                  mel_metapage.Functions.check_if_date_is_okay(
                    x.start,
                    x.end,
                    end,
                  ),
              )
              .toArray();
            return data;
          } catch (ex) {
            console.error(ex);
            rcmail.display_message(
              'Une erreur est survenue lors de la synchronisation.',
              'error',
            );
          }
        },
        error: function (xhr, ajaxOptions, thrownError) {
          // Add these parameters to display the required response
          console.error(xhr, ajaxOptions, thrownError);
          rcmail.display_message(
            'Une erreur est survenue lors de la synchronisation.',
            'error',
          );
        },
      });
    },

    /**
     * Vérifie si un élement est valide ou si c'est un doublon ou une instance originale
     * @param {JSON} element
     * @param {Array<JSON>} events
     * @param {boolean} test
     * @returns {boolean|JSON} True si pas de problème | Evènement problématique
     */
    check_if_calendar_valid(element, events, test = true) {
      if (mceToRcId(rcmail.env.username) !== element.calendar) return false;
      else {
        if (element._instance !== undefined && test) {
          for (let it = 0; it < events.length; it++) {
            const event = events[it];
            if (event.uid === element.uid && event._instance === undefined)
              return event;
          }
        }
      }
      return true;
    },

    /**
     * Vérifie si une date se trouve entre 2 dates
     * @param {string|moment} sd
     * @param {string|moment} ed
     * @param {string|moment} date
     * @returns {boolean}
     */
    check_if_date_is_okay(sd, ed, date) {
      if (typeof sd === 'string') sd = moment(sd).startOf('day');

      if (typeof ed === 'string') ed = moment(ed).endOf('day');

      if (typeof date === 'string') date = moment(date);

      startDate = moment(date).startOf('day');
      endDate = moment(date).endOf('day');

      if (startDate <= sd && sd <= endDate) return true;
      else if (startDate <= ed && ed <= endDate) return true;
      else if (
        sd <= startDate &&
        startDate <= ed &&
        sd <= endDate &&
        endDate <= ed
      )
        return true;
      else return false;
    },

    get_from_url(url) {
      const URL_VARIABLE = '/?';
      const URL_SEPARATOR = '&';
      url = url.split(URL_VARIABLE)[1].split(URL_SEPARATOR);
      let datas = {};

      for (let index = 0, len = url.length; index < len; ++index) {
        const element = url[index].split('=');
        datas[element[0]] = element[1];
      }

      return datas;
    },

    /**
     * Récupère une URL conforme.
     * @param {string} task Tâche
     * @param {string} action Action
     * @param {JSON} args divers arguments ex {_eventType:1}
     * @returns {string}
     */
    url(task, action = '', args = null) {
      let url = task;
      if (action !== null && action !== undefined && action !== '')
        url += '&_action=' + action;

      if (
        window.location.href.includes(
          `${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`,
        ) ||
        window !== parent
      ) {
        if (args === null || args === undefined) {
          args = {};
          args[rcmail.env.mel_metapage_const.key] =
            rcmail.env.mel_metapage_const.value;
        } else if (args[rcmail.env.mel_metapage_const.key] === undefined)
          args[rcmail.env.mel_metapage_const.key] =
            rcmail.env.mel_metapage_const.value;
      }

      if (args !== null) {
        for (const key in args) {
          if (Object.hasOwnProperty.call(args, key)) {
            const element = args[key];
            url += '&' + key + '=' + element;
          }
        }
      }
      return rcmail.get_task_url(
        url,
        window.location.origin + window.location.pathname,
      );
    },

    public_url(path, args = null) {
      let url =
        window.location.origin +
        window.location.pathname +
        (window.location.pathname[window.location.pathname.length - 1] === '/'
          ? ''
          : '/') +
        'public/' +
        path;

      if (args !== null) {
        for (const key in args) {
          if (Object.hasOwnProperty.call(args, key)) {
            const element = args[key];
            url += (url.includes('?') ? '&' : '?') + key + '=' + element;
          }
        }
      }

      return url;
    },

    /**
     * Change de frame, même si l'on est pas depuis "TOP"
     * @param {string} frame Frame à ouvrir
     * @param {boolean} changepage Si vrai, on change de page, sinon la page ouverte sera caché.
     * @param {boolean} waiting Si l'on veux attendre que la frame sois ouverte ou non.
     * @param {JSON} args Arguments à ajouter dans l'url de la frame.
     */
    async change_frame(
      frame,
      changepage = true,
      waiting = false,
      args = null,
      actions = [],
    ) {
      if (changepage) (top ?? window).rcmail.set_busy(true, 'loading');

      // if (frame === "webconf")
      // {
      //     var initial_change_page = changepage;
      //     changepage = false;
      // }

      if (waiting)
        mel_metapage.Storage.set(
          mel_metapage.Storage.wait_frame_loading,
          mel_metapage.Storage.wait_frame_waiting,
        );

      (top ?? window).rcmail.env.can_change_while_busy = true;
      (top ?? window).mm_st_OpenOrCreateFrame(frame, changepage, args, actions);

      if (waiting) {
        await wait(
          () =>
            mel_metapage.Storage.get(
              mel_metapage.Storage.wait_frame_loading,
            ) !== mel_metapage.Storage.wait_frame_loaded,
        );
        mel_metapage.Storage.remove(mel_metapage.Storage.wait_frame_loading);
      }

      // if (frame === "webconf")
      // {
      //     if (initial_change_page)
      //     {
      //         (top ?? window).mm_st_OpenOrCreateFrame(frame, initial_change_page, args, actions);
      //     }
      //     //this.update_refresh_thing();
      // }

      if (changepage && (top ?? window).rcmail.busy) {
        (top ?? window).rcmail.set_busy(false);
        rcmail.clear_messages();
      }

      return this;
    },

    /**
     * Change de page en utilisant le combo tâche + action.
     * @param {string} task
     * @param {string} action
     * @param {JSON} params
     * @returns
     */
    async change_page(
      task,
      action = null,
      params = {},
      update = true,
      force = false,
    ) {
      let contracted_task;
      let $querry;

      if (window !== parent)
        return await parent.mel_metapage.Functions.change_page(
          task,
          action,
          params,
          update,
          force,
        );

      contracted_task = mm_st_ClassContract(task);

      if (action !== null) params['_action'] = action;

      $querry = $(`iframe.${task}-frame`);

      if (update) {
        if ($querry.length > 0) {
          params[rcmail.env.mel_metapage_const.key] =
            rcmail.env.mel_metapage_const.value;
          action = mel_metapage.Functions.url(task, null, params);

          try {
            if ($querry[0].contentWindow.location.href !== action)
              $querry[0].src = action;
            else if (force) {
              $querry[0].contentWindow.location.reload();
            }
          } catch (error) {}
        } else if ($(`.${task}-frame`).length > 0) {
          action = mel_metapage.Functions.url(task, null, params);
          if (window.location.href !== action) $(`.${task}-frame`).remove();
        }
      }

      return await this.change_frame(contracted_task, true, true, params);
    },

    /**
     * Ouvre la page de chat, avec un can/group/tem associé ou non.
     * @param {string} channel_or_group group/ ou channel/
     * @returns {Promise}
     */
    open_chat(channel_or_group = null) {
      return mel_metapage.Functions.change_frame('rocket', true, true).then(
        () => {
          if (channel_or_group !== null && channel_or_group !== undefined) {
            if (channel_or_group[0] !== '/')
              channel_or_group = `/${channel_or_group}`;
            parent.$('.discussion-frame')[0].contentWindow.postMessage(
              {
                externalCommand: 'go',
                path: channel_or_group,
              },
              '*',
            );
          }
        },
      );
    },

    /**
     * F5 une frame
     * @param {string} frame Classe de la frame à refresh
     * @returns Chaînage
     */
    update_frame(frame) {
      this.call('reload_frame', false, {
        _integrated: true,
        always: true,
        args: [`${frame}-frame`],
      });

      return this;
    },

    /**
     * Reviens à la frame d'avant.
     * @param {boolean} wait Si l'on doit attendre le changement de frame ou non.
     * @param {string} default_frame Frame par défaut si il n'y a pas de frame d'avant. Si null, ne fait rien dans ce cas.
     */
    async frame_back(wait = true, default_frame = null) {
      let last = await this.ask('rcmail.env.last_frame_class');

      if (
        last === null ||
        last === undefined ||
        last === mel_metapage.Storage.unexist
      ) {
        if (default_frame !== null) last = default_frame;
        else return;
      }

      const tmp = await this.change_frame(last, true, wait);

      top.rcmail.clear_messages();

      for (const iterator of $('iframe.mm-frame')) {
        iterator.contentWindow.rcmail.clear_messages();
      }

      return tmp;
    },

    get_current_title(current_task = null, _default = document.title) {
      if (parent !== window)
        return parent.mel_metapage.Function.get_current_title(
          current_task,
          _default,
        );

      if (current_task === null)
        current_task = (top ?? window).rcmail.env.current_task;

      if (current_task === 'chat' || current_task === 'discussion') {
        return 'Discussion';
      } else if (current_task === 'webconf') {
        return 'Visioconférence';
      } else {
        const frame = $(`iframe.${current_task}-frame`);
        if (frame.length > 0) return frame[0].contentDocument.title || _default;
        else if ($(`.${current_task}-frame`).length > 0) return document.title;
        else return _default;
      }
    },

    /**
     * Execute un string depuis "TOP"
     * @param {string} exec String à éxécuter
     * @param {string} child Exécuter aussi dans les fenetres filles ?
     * @param  {JSON} args Autres arguments (eval etc....)
     */
    call(exec, child = false, args = {}) {
      if (typeof exec !== 'string') {
        const tmp_exec = JSON.stringify(exec);
        if (tmp_exec === undefined) {
          if (typeof exec === 'function') exec = `(${exec.toString()})()`;
          else exec = exec.toString();
        } else exec = tmp_exec;
      }

      let config = {
        exec: exec,
        child: child,
      };

      if (args != null && args !== undefined) {
        for (const key in args) {
          if (Object.hasOwnProperty.call(args, key)) {
            const element = args[key];
            config[key] = element;
          }
        }
      }

      if (
        window.workspaces !== undefined &&
        window.workspaces.sync !== undefined
      )
        workspaces.sync.PostToParent(config);
      else {
        parent.postMessage(config);
      }

      return this;
    },

    /**
     * Execute du script à un contexte au dessus.
     * @param {string} exec String à éxécuter
     * @param {boolean} child Exécuter aussi dans les fenetres filles ?
     * @param {JSON} args Autres arguments (eval etc....)
     */
    async callAsync(exec, child = false, args = {}) {
      mel_metapage.Storage.set(
        mel_metapage.Storage.wait_call_loading,
        mel_metapage.Storage.wait_frame_waiting,
      );
      this.call(exec, child, args);
      await wait(() => {
        return (
          mel_metapage.Storage.get(mel_metapage.Storage.wait_call_loading) ===
          mel_metapage.Storage.wait_frame_waiting
        );
      });

      return this;
    },

    /**
     * Modifie l'url du navigateur
     * @param {string} url URL à afficher
     */
    title(url) {
      mel_metapage.Functions.call(
        `window.history.replaceState({}, document.title, '${url}')`,
      );
      return this;
    },

    /**
     * Met (ou pas) la frame en cours et parente en loading.
     * @param {boolean} busy
     */
    busy(busy = true) {
      const framed = window !== parent;
      mel_metapage.Storage.set('mel.busy', busy);
      if (busy) {
        this.call("rcmail.set_busy(true, 'loading')");
        if (framed) rcmail.set_busy(true, 'loading');
      } else {
        this.call('rcmail.set_busy(false);rcmail.clear_messages();');
        if (framed) {
          rcmail.set_busy(false);
          rcmail.clear_messages();
        }
      }

      return this;
    },

    /**
     * Vérifie si l'application est occupée.
     * @returns {boolean}
     */
    is_busy() {
      const framed = window !== parent && rcmail.busy != undefined;
      if (framed)
        return mel_metapage.Storage.get('mel.busy') === true || rcmail.busy;
      else {
        if (rcmail.busy === undefined)
          return mel_metapage.Storage.get('mel.busy') === true;
        else
          return rcmail.busy || mel_metapage.Storage.get('mel.busy') === true;
      }
    },

    /**
     * @async
     * Récupère une variable globale parente.
     * @param {string} props Variable à récupérer
     * @returns {Promise<any>} Valeur de la variable
     */
    async ask(props) {
      this.call(`mel_metapage.Storage.set("mel.ask", ${props})`);
      await wait(() => mel_metapage.Storage.get('mel.ask') === null);
      props = mel_metapage.Storage.get('mel.ask');
      mel_metapage.Storage.remove('mel.ask');
      return props;
    },

    updateRichText(html) {
      return html.replace(/</g, '&lt;');
    },

    remove_accents(string) {
      return string.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    },

    replace_dets(string = '', rep = '') {
      const dets = [
        ' le ',
        ' la ',
        ' les ',
        ' un ',
        ' une ',
        ' de ',
        ' des ',
        ' mon ',
        ' ma ',
        ' tes ',
        ' ton ',
        ' ta ',
        ' son ',
        ' sa ',
        ' ses ',
        ' notre ',
        ' nos ',
        ' vos ',
        ' votre ',
        ' leur ',
        ' leurs ',
        ' se ',
        ' ce ',
        ' cette ',
        ' cet ',
        ' ces ',
        ' a ',
        "l'",
      ];

      for (const iterator of dets) {
        string = string.replaceAll(iterator, rep);
      }

      while (string[0] === rep) {
        string = string.slice(1, string.length);
      }

      return string;
    },

    replace_special_char(string, rep = '') {
      const regexp = /[^a-zA-Z0-9_ -]/g;
      string = string.replace(regexp, rep);

      while (string[0] === rep) {
        string = string.slice(1, string.length);
      }

      return string;
    },

    /**
     *
     * @param {string} url
     * @returns
     */
    webconf_url(url) {
      if (url[url.length - 1] === '&') url = url.slice(0, url.length - 1);

      let val = url.toUpperCase();

      if (val.includes(rcmail.env['webconf.base_url'].toUpperCase())) {
        val = val.split('/');
        val = val[val.length - 1];
        val = val.toUpperCase();
      } else if (val.includes('PUBLIC/WEBCONF'))
        val = val.split('_KEY=')[1].split('&')[0];
      else {
        let link = WebconfLink.create({ location: url, categories: [] });
        val = link.key;

        try {
          if (val === '') {
            link = WebconfLink.create({
              location: `#visio:${url}`,
              categories: [],
            });
            val = link.key;
          }
        } catch (error) {
          val = null;
        }
      }

      return val || null;
    },

    _shuffle(array) {
      var currentIndex = array.length,
        temporaryValue,
        randomIndex;
      // While there remain elements to shuffle...
      while (currentIndex !== 0) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }
      return array;
    },

    generateWebconfRoomName() {
      var charArray = [
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
      ];
      var digitArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
      var roomName =
        this._shuffle(digitArray).join('').substring(0, 3) +
        this._shuffle(charArray).join('').substring(0, 7);
      return this._shuffle(roomName.split('')).join('');
    },

    /**
     * Faire facilement une requête ajax
     * @param {string} url
     * @param {JSON} datas
     * @param {function} success
     * @param {function} failed
     * @param {string} type
     * @returns {Promise<any>} Appel ajax
     */
    ajax(
      url,
      datas = mel_metapage.Symbols.null,
      success = (datas) => {},
      failed = (xhr, ajaxOptions, thrownError) => {
        console.error(xhr, ajaxOptions, thrownError);
      },
      type = 'POST',
    ) {
      let config = {
        // fonction permettant de faire de l'ajax
        type: type, // methode de transmission des données au fichier php
        url: url, //rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
        success: success,
        error: failed,
      };
      if (datas !== mel_metapage.Symbols.null) config['data'] = datas;

      return $.ajax(config);
    },

    /**
     * Execute un appel ajax get
     * @param {string} url
     * @param {JSON} datas
     * @param {function} success
     * @param {function} failed
     * @returns {Promise<any>}
     */
    get(
      url,
      datas = {},
      success = (datas) => {},
      failed = (xhr, ajaxOptions, thrownError) => {
        console.error(xhr, ajaxOptions, thrownError);
      },
    ) {
      for (const key in datas) {
        if (Object.hasOwnProperty.call(datas, key)) {
          const element = datas[key];
          url += `${url.includes('?') ? '&' : '?'}${key}=${encodeURIComponent(element)}`;
        }
      }
      return this.ajax(url, mel_metapage.Symbols.null, success, failed, 'GET');
    },

    /**
     * Execute un appel ajax post
     * @param {string} url
     * @param {Symbol|JSON} datas <c>mel_metapage.Symbols.null</c> si aucune données.
     * @param {function} success
     * @param {function} failed
     */
    post(
      url,
      datas = mel_metapage.Symbols.null,
      success = (datas) => {},
      failed = (xhr, ajaxOptions, thrownError) => {
        console.error(xhr, ajaxOptions, thrownError);
      },
    ) {
      return this.ajax(url, datas, success, failed);
    },

    /**
     * Contient différents fonctions pour mettre à jours certaines données.
     */
    update: {
      /**
       * Met à jours le calendrier.
       */
      calendar() {
        mel_metapage.Functions.call(
          'rcmail.mel_metapage_fn.calendar_updated();',
        );
        return this;
      },
    },

    /**
     * Vérifie si un handler existe sur un élément.
     * @param {DOMElement} element Element à tester.
     * @param {function} handler Fonction à vérifier
     * @param {string} type Type d'évènement
     * @returns {boolean}
     */
    handlerExist(element, handler, type = 'click') {
      if (element.val !== undefined) element = element[0];
      return Enumerable.from(jQuery._data(element, 'events')[type])
        .where((x) => x.handler + '' === handler + '')
        .any();
    },

    /**
     * Fonctions lié au stockage nextcloud.
     */
    stockage: {
      /**
             * Ouvre la frame nextcloud et affiche un document en particulier (si il existe).
             * @param {JSON|Nextcloud_File} datas Données du document à afficher. 
             * {
                    file:nom du fichier,
                    folder:chemin du fichier
                }
             * @param {boolean} isfiledatas Si vrai, datas est un objet <c>Nextcloud_File</c>
             * @param {function} thenFunc Action à faire une fois que l'on à changer de page.
             */
      go(datas, goFunc = null, thenFunc = null) {
        let init = 'new Nextcloud("rcmail.env.nextcloud_username")';
        let go = `.go(${JSON.stringify(datas)}, ${goFunc})`;
        let then = '';

        if (thenFunc !== null) {
          then = `.then((a) => { (${thenFunc + ''})(a) })`;
        }

        return mel_metapage.Functions.call(init + go + then);
      },
      have_0_quota() {
        return rcmail.env.have_0_quota ?? false;
      },
      is_stockage_active() {
        const DEFAULT = false;
        return rcmail?.env?.why_is_not_active?.value
          ? rcmail.env.why_is_not_active.value ===
              rcmail.env.why_is_not_active.consts.ST_ACTIVE
          : DEFAULT;
      },
      canDriveActions() {
        return !this.have_0_quota() && this.is_stockage_active();
      },
    },

    /**
     * Recherche dans les mails
     * @param {string} itemToSearch Objet à chercher
     * @param {Array<string>} fields Champs
     * @param {boolean} openFrame Ouvrir ou non la frame
     */
    async searchOnMail(itemToSearch, fields, openFrame = false) {
      if (parent === window) {
        if (openFrame)
          await mel_metapage.Functions.change_frame('mail', true, true);

        if ($('iframe.mail-frame').length > 0)
          $('iframe.mail-frame')[0].contentWindow.postMessage({
            exec: 'search',
            _integrated: true,
            child: false,
            args: [itemToSearch, fields],
          });
        else search_action(itemToSearch, fields);
      } else
        mel_metapage.Functions.call(
          `mel_metapage.Functions.searchOnMail('${itemToSearch}', ${JSON.stringify(fields)}, ${openFrame})`,
        );

      return this;
    },

    doActionFrame(frame, doAction, ...functionArgs) {
      //console.log("[doActionFrame]",frame, doAction, parent !== window);
      if (parent !== window) {
        mel_metapage.Functions.call('mel_metapage.doActionFrame', false, {
          _integrated: true,
          always: true,
          args: [frame, doAction + '', ...functionArgs],
        });
      } else {
        if (typeof doAction === 'string') {
          doAction = new Function(`return (${doAction})(...arguments)`);
        }

        //Personne ouvert
        if ($(`.${frame}-frame`).length === 0) doAction(0, ...functionArgs);
        else if ($(`iframe.${frame}-frame`).length > 0)
          //Frame ouverte
          doAction(1, ...functionArgs);
        //Page ouverte
        else doAction(2, ...functionArgs);
      }

      return this;
    },

    update_refresh_thing() {
      let current = (top ?? window).$('.refresh-current-thing');
      let action =
        window.webconf_helper.already() ||
        (top ?? window).rcmail.env.current_frame_name === 'webconf';

      if (action === true)
        current.addClass('disabled').attr('disabled', 'disabled');
      else current.removeClass('disabled').removeAttr('disabled');

      return this;
    },

    isNavigator(symbol) {
      switch (symbol) {
        case mel_metapage.Symbols.navigator.firefox:
          return typeof InstallTrigger !== 'undefined';

        default:
          throw 'Unknown navigator';
      }
    },

    /**
     *
     * @param {string|JSON} _params - String sous forme '?dir=PATH&fileid=ID' ou JSON sous forme {path:'', id:''}
     */
    async change_frame_nextcloud(_params = null) {
      const appfiles = '/apps/files/';
      const urlToAdd =
        _params.id === undefined && _params.includes(appfiles) ? appfiles : '';
      let param = urlToAdd + (_params ?? '');
      let configArgs = null;

      //si _params n'est pas un string
      if (_params !== null) {
        if (_params.id !== undefined)
          param = `${urlToAdd}?dir=${_params.path}&fileid=${_params.id}`;

        configArgs = {
          _params: urlencode(param),
        };
      }

      const url = `${rcmail.env.nextcloud_url}${param ?? ''}`;

      if (parent.$('iframe.stockage-frame').length > 0)
        parent
          .$('iframe.stockage-frame')[0]
          .contentWindow.$('#mel_nextcloud_frame')[0].src = url;

      await this.change_frame('stockage', true, true, configArgs);

      parent.$(
        'iframe.stockage-frame',
      )[0].contentWindow.rcmail.env.nextcloud_gotourl = url;

      return this;
    },

    async comment_mail(uid, comment, folder = 'INBOX') {
      let data = uid;
      await this.post(
        mel_metapage.Functions.url('mel_metapage', 'comment_mail'),
        {
          _uid: uid,
          _comment: comment,
          _folder: folder,
        },
        (datas) => {
          if (datas == 'false') {
            rcmail.display_message('Une erreur est survenue!', 'error');
            data = false;
          } else data = datas;
        },
      );

      return data;
    },

    calculateObjectSizeInMo(obj) {
      const jsonString = JSON.stringify(obj);
      const blob = new Blob([jsonString]);
      const sizeInBytes = blob.size;
      const sizeInMb = sizeInBytes / (1024 * 1024);
      return sizeInMb;
    },

    colors: {
      kMel_Luminance(rgb) {
        let R = rgb[0] / 255;
        let G = rgb[1] / 255;
        let B = rgb[2] / 255;

        if (R <= 0.04045) {
          R = R / 12.92;
        } else {
          R = ((R + 0.055) / 1.055) ** 2.4;
        }
        if (G <= 0.04045) {
          G = G / 12.92;
        } else {
          G = ((G + 0.055) / 1.055) ** 2.4;
        }
        if (B <= 0.04045) {
          B = B / 12.92;
        } else {
          B = ((B + 0.055) / 1.055) ** 2.4;
        }

        const L = 0.2126 * R + 0.7152 * G + 0.0722 * B;

        return L;
      },

      kMel_CompareLuminance(rgb1, rgb2) {
        const l1 = this.kMel_Luminance(rgb1);
        const l2 = this.kMel_Luminance(rgb2);

        let ratio;
        if (l1 > l2) {
          ratio = (l1 + 0.05) / (l2 + 0.05);
        } else {
          ratio = (l2 + 0.05) / (l1 + 0.05);
        }

        return ratio;
      },

      kMel_LuminanceRatioAAA(rgb1, rgb2) {
        const isAAA = this.kMel_CompareLuminance(rgb1, rgb2) > 4.5;
        return isAAA;
      },

      kMel_extractRGB(color) {
        let regexp = /#[a-fA-F\d]{6}/g;
        let rgbArray = color.match(regexp);

        if (rgbArray) {
          rgbArray[0] = parseInt(color.slice(1, 3), 16);
          rgbArray[1] = parseInt(color.slice(3, 5), 16);
          rgbArray[2] = parseInt(color.slice(5, 7), 16);

          return rgbArray;
        }

        regexp = /#[a-fA-F\d]{3}/g;
        rgbArray = color.match(regexp);

        if (rgbArray) {
          rgbArray[0] = parseInt(color.slice(1, 2), 16);
          rgbArray[1] = parseInt(color.slice(2, 3), 16);
          rgbArray[2] = parseInt(color.slice(3, 4), 16);

          return rgbArray;
        }

        regexp = /\d+/g;
        rgbArray = color.match(regexp);

        if (rgbArray.length === 3 || rgbArray.length === 4) {
          return rgbArray;
        }
      },
    },
  },
};

window.mel_metapage = mel_metapage;
