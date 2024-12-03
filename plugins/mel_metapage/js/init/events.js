function MetapageEventKey(key) {
  return {
    key: key,
    trigger: function () {
      if (rcmail) rcmail.triggerEvent(this.key);
      else
        console.warn(
          "/!\\[MetapageEventKey::trigger]rcmail n'est pas défini !",
        );
    },
  };
}

const event_keys = {
  init: {
    chat_button: MetapageEventKey('event.init.chat_button'),
  },
};

if (rcmail && window.mel_metapage) {
  //Initialise le bouton de chat
  rcmail.addEventListener(event_keys.init.chat_button.key, () => {
    if (rcmail.env.last_frame_class !== undefined && parent === window) {
      let eClass = mm_st_ClassContract(rcmail.env.last_frame_class);
      let btn = ArianeButton.default();

      if (rcmail.env.mel_metapage_ariane_button_config[eClass] !== undefined) {
        if (
          rcmail.env.mel_metapage_ariane_button_config[eClass].hidden === true
        )
          btn.hide_button();
        else {
          btn.show_button();
          btn.place_button(
            rcmail.env.mel_metapage_ariane_button_config[eClass].bottom,
            rcmail.env.mel_metapage_ariane_button_config[eClass].right,
          );
        }
      } else {
        btn.show_button();
        btn.place_button(
          rcmail.env.mel_metapage_ariane_button_config['all'].bottom,
          rcmail.env.mel_metapage_ariane_button_config['all'].right,
        );
      }
    }
  });

  rcmail.addEventListener('calendar.dismiss.after', (props) => {
    let navigator = window;

    if (
      parent.rcmail.mel_metapage_fn !== undefined &&
      parent.rcmail.mel_metapage_fn.calendar_updated !== undefined
    )
      navigator = parent;
    else if (
      top.rcmail.mel_metapage_fn !== undefined &&
      top.rcmail.mel_metapage_fn.calendar_updated !== undefined
    )
      navigator = top;

    navigator.rcmail.triggerEvent(
      mel_metapage.EventListeners.calendar_updated.get,
      {
        force: true,
      },
    );
  });

  //Après la mise à jours du calendrier
  rcmail.addEventListener(
    mel_metapage.EventListeners.calendar_updated.after,
    () => {
      if (window.alarm_managment !== undefined) {
        window.alarm_managment.clearTimeouts();
        const storage = mel_metapage.Storage.get(mel_metapage.Storage.calendar);
        if (storage !== null && storage !== undefined)
          window.alarm_managment.generate(storage);
      }
    },
  );

  rcmail.addEventListener(
    mel_metapage.EventListeners.calendar_updated.before,
    () => {
      if (rcmail.env.task === 'bureau') {
        mel_item_in_update(
          '#tab-for-agenda-content .icon-mel-calendar',
          'icon-mel-calendar',
          'spinner-grow',
        );
      }
    },
  );

  rcmail.addEventListener(
    mel_metapage.EventListeners.tasks_updated.before,
    () => {
      if (rcmail.env.task === 'bureau') {
        mel_item_in_update(
          '#tab-for-tasks-contents .icon-mel-task',
          'icon-mel-task',
          'spinner-grow',
        );
      }
    },
  );

  rcmail.addEventListener(
    mel_metapage.EventListeners.calendar_updated.after,
    () => {
      if (rcmail.env.task === 'bureau') {
        mel_item_in_update(
          '#tab-for-agenda-content .spinner-grow',
          'icon-mel-calendar',
          'spinner-grow',
          false,
        );
      }
    },
  );

  rcmail.addEventListener(
    mel_metapage.EventListeners.tasks_updated.after,
    () => {
      if (rcmail.env.task === 'bureau') {
        mel_item_in_update(
          '#tab-for-tasks-contents .spinner-grow',
          'icon-mel-task',
          'spinner-grow',
          false,
        );
      }
    },
  );

  function mel_item_in_update(selector, oldClass, newClass, start = true) {
    if (start) {
      $(selector)
        .removeClass(oldClass)
        .addClass(newClass)
        .children()
        .first()
        .addClass('hidden');
    } else {
      $(selector)
        .addClass(oldClass)
        .removeClass(newClass)
        .children()
        .first()
        .removeClass('hidden');
    }
  }

  rcmail.addEventListener('mel_update', (args) => {
    if (args.type !== undefined) {
      let type = args.type;

      switch (type) {
        case 'agendas':
          type = 'calendar';
          break;
        case 'contacts':
          type = 'addressbook';
          break;
        case 'tasks':
          type = 'tasks';
          break;
        default:
          type = null;
          break;
      }

      if (type !== null) mel_metapage.Functions.update_frame(type);
    }
  });

  //Calencdrier initialisé
  rcmail.addEventListener('plugin.calendar.initialized', (cal) => {
    if (cal && rcmail.env.task === 'mail') {
      cal.create_from_mail = function (uid) {
        if (!uid && !(uid = rcmail.get_single_uid())) {
          return;
        }

        const event = {
          mail_datas: {
            mbox: rcmail.env.mailbox,
            uid: uid,
          },
        };

        //FIX MANTIS 0007961
        $('.modal-save-footer').removeAttr('disabled').removeClass('disabled');
        $('#globalModal .modal-close-footer').remove();
        window.create_event = false;
        this.create_event_from_somewhere(event);
      };
      rcmail.register_command(
        'calendar-create-from-mail',
        function () {
          cal.create_from_mail();
        },
        true,
      );
    }
  });

  //Action à faire après certains actions des mails.
  rcmail.addEventListener('responsebefore', function (props) {
    if (props.response && props.response.action == 'getunread') {
      parent.rcmail.triggerEvent(mel_metapage.EventListeners.mails_updated.get);
    }
  });

  rcmail.addEventListener('responseafter', function (props) {
    if (
      rcmail.env.task === 'tasks' &&
      props.response &&
      props.response.action == 'fetch'
    ) {
      _rm_update_task_size();
    } else if (props.response && props.response.action === 'refresh') {
      loadJsModule('mel_metapage', 'mel_object').then((loaded_module) =>
        loaded_module.MelObject.Empty().trigger_event('on_frame_refresh', {
          rc: rcmail,
          context: window,
        }),
      );
    }
  });

  rcmail.addEventListener('set_unread', function (props) {
    if (props.mbox === 'INBOX') {
      parent.rcmail.triggerEvent(
        mel_metapage.EventListeners.mails_updated.get,
        {
          new_count: props.count,
        },
      );
    }
  });

  rcmail.addEventListener('calendar-delete-all', function () {
    mel_metapage.Storage.remove(mel_metapage.Storage.calendar);
    mel_metapage.Storage.remove(mel_metapage.Storage.last_calendar_update);
  });

  rcmail.addEventListener('frames.setup.after', () => {
    if (top === window && rcmail.env.task === 'bnum') {
      try {
        let base_url = rcmail.env['bnum.redirect'];

        if (!base_url.includes('?'))
          base_url += `?task=${rcmail.env['bnum.init_task']}`;

        const urls = mel_metapage.Functions.get_from_url(base_url);
        const task =
          rcmail.env['bnum.init_task'] === 'chat'
            ? 'rocket'
            : rcmail.env['bnum.init_task'];
        //mel_metapage.Functions.change_frame(task, true, true, urls);
        FramesHelper.switch_frame(task, {
          args: urls,
        });
      } catch (error) {
        FramesHelper.switch_frame('bureau', {});
      }
    }
  });

  rcmail.addEventListener('toggle-quick-options.after', (args) => {
    const { hidden, frame } = args;

    if (
      !hidden &&
      mel_metapage.Functions.isNavigator(mel_metapage.Symbols.navigator.firefox)
    ) {
      let $scollbar = $('#mel-scrollbar-size-large').parent();
      let $parent = $scollbar.parent();

      $parent.hide().children().removeClass('col-4').addClass('col-6');
      $scollbar.remove();

      $scollbar = null;

      if (
        rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'] === 'Large'
      ) {
        $('#mel-scrollbar-size-normal').prop('checked', true);
      }

      $parent.show();
      $parent = null;
    }

    if (!hidden) {
      switch (frame) {
        case 'mail':
          let $delay = $('#speed-delay');
          $delay
            .on('change', () => {
              const val = $('#speed-delay').val();
              top.save_option('mail_delay', val, $('#speed-delay')).then(() => {
                top.rcmail.env.mail_delay = val;
                top.$('iframe.mm-frame').each((i, e) => {
                  e.contentWindow.rcmail.env.mail_delay = val;
                });

                try {
                  if (top.$('.wlp-contents iframe').length > 0) {
                    top.$('.wlp-contents iframe').each((i, e) => {
                      e.contentWindow.rcmail.env.mail_delay = val;
                    });
                  }
                } catch (error) {}
              });
            })
            .attr('min', $delay.data('min'))
            .attr('max', $delay.data('max'))
            .on('input', () => {
              $('#delay-number').text(`${$('#speed-delay').val()} secondes`);
            });

          $delay = null;
          break;

        default:
          break;
      }
    }
  });

  if (
    rcmail.env.task === 'calendar' &&
    !(top ?? parent ?? window).calendar_listener_added
  ) {
    (top ?? parent ?? window).rcmail.addEventListener(
      'frame_loaded',
      (args) => {
        const {
          eClass: frame_name,
          changepage,
          isAriane,
          querry: frame,
          id,
          first_load,
        } = args;

        if (frame_name === 'calendar') {
          let it = 0;
          const timeout = 5 * 100; //5 secondes
          const interval = setInterval(() => {
            let $querry = $('#calendar');

            if ($querry.length > 0) {
              it = null;
              clearInterval(interval);
              $querry.fullCalendar('updateViewSize', true);
              $querry.fullCalendar('rerenderEvents', true);
            } else if (it >= timeout) {
              it = null;
              clearInterval(interval);
            }

            ++it;
          }, 100);
        }
      },
    );
    (top ?? parent ?? window).calendar_listener_added = true;
  }

  //Initialisation
  rcmail.addEventListener('init', () => {
    $('[data-popup]').each((i, e) => {
      $(e)
        .on('show.bs.popover', () => {
          $(e).attr('aria-expanded', 'true');
        })
        .on('hide.bs.popover', () => {
          $(e).attr('aria-expanded', 'false');
        });
    });

    if (rcmail.env.task === 'settings') {
      if (
        top.rcmail.env.avatar_background_color !==
        rcmail.env.avatar_background_color
      ) {
        top.rcmail.env.avatar_background_color =
          rcmail.env.avatar_background_color;

        for (const key of Object.keys(
          mel_metapage.Storage._getDataStore().store,
        )) {
          if (key.includes('avatar_')) {
            mel_metapage.Storage.remove(key);
          }
        }

        let avatar = top.document.querySelector('#user-picture');
        avatar.outerHTML = `<bnum-avatar id="user-picture"></bnum-avatar>`;
        avatar = null;
      }

      if (
        rcmail.env.mel_metapage_mail_configs['mel-chat-placement'] !==
        parent.parent.rcmail.env.mel_metapage_mail_configs['mel-chat-placement']
      ) {
        parent.parent.rcmail.env.mel_metapage_mail_configs[
          'mel-chat-placement'
        ] = rcmail.env.mel_metapage_mail_configs['mel-chat-placement'];
        if (
          rcmail.env.mel_metapage_mail_configs['mel-chat-placement'] ===
          rcmail.gettext('up', 'mel_metapage')
        )
          parent.parent.rcmail.command('chat.setupConfig');
        else parent.parent.rcmail.command('chat.reinit');
      }

      if (
        rcmail.env['mel_metapage.tab.notification_style'] !==
        top.rcmail.env['mel_metapage.tab.notification_style']
      ) {
        top.rcmail.env['mel_metapage.tab.notification_style'] =
          rcmail.env['mel_metapage.tab.notification_style'];
        m_mp_e_on_storage_change_notifications(true);
      }

      if (
        rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'] !==
        top.rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size']
      ) {
        const data = rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'];
        top.rcmail.env.mel_metapage_mail_configs['mel-scrollbar-size'] = data;
        top.MEL_ELASTIC_UI.updateScollBarMode();

        top.$('iframe.mm-frame').each((i, e) => {
          try {
            e.contentWindow.rcmail.env.mel_metapage_mail_configs[
              'mel-scrollbar-size'
            ] = data;
            e.contentWindow.MEL_ELASTIC_UI.updateScollBarMode();
          } catch (error) {}
        });
      }

      if (rcmail.env.current_theme !== top.rcmail.env.current_theme) {
        try {
          MEL_ELASTIC_UI.update_theme(rcmail.env.current_theme);
        } catch (error) {}

        top.rcmail.env.current_theme = rcmail.env.current_theme;
        top.MEL_ELASTIC_UI.update_theme(rcmail.env.current_theme);

        top.$('iframe.mm-frame').each((i, e) => {
          e.contentWindow.rcmail.env.current_theme = rcmail.env.current_theme;
          e.contentWindow.MEL_ELASTIC_UI.update_theme(rcmail.env.current_theme);
        });
      }

      if (
        rcmail.env['reorder-notes'] !== top.rcmail.env['reorder-notes'] &&
        rcmail.env['reorder-notes'] === true
      ) {
        if (
          confirm(
            'Attention, cela va réordonner vos notes et recharger vôtre page, êtes-vous sûr de vouloir faire cela ?',
          )
        ) {
          $('body').html(
            '<center class="absolute-center"><div class="spinner-grow"></div></center>',
          );
          parent.rcmail.set_busy(true, 'loading');
          mel_metapage.Functions.post(
            mel_metapage.Functions.url('mel_metapage', 'notes'),
            {
              _a: 'reorder',
            },
            (datas) => {
              top.location.reload();
            },
          );
        }
      }

      if (rcmail.env.mail_delay !== top.rcmail.env.mail_delay) {
        top.rcmail.env.mail_delay = rcmail.env.mail_delay;
        top.$('iframe.mm-frame').each((i, e) => {
          e.contentWindow.rcmail.env.mail_delay = rcmail.env.mail_delay;
        });

        try {
          if (top.$('.wlp-contents iframe').length > 0) {
            top.$('.wlp-contents iframe').each((i, e) => {
              e.contentWindow.rcmail.env.mail_delay = rcmail.env.mail_delay;
            });
          }
        } catch (error) {}
      }

      if (
        rcmail.env.main_nav_can_deploy !== top.rcmail.env.main_nav_can_deploy
      ) {
        top.rcmail.env.main_nav_can_deploy = rcmail.env.main_nav_can_deploy;
        top.MEL_ELASTIC_UI.update_main_nav_meca();
      }

      if (
        rcmail.env.menu_last_frame_enabled !==
        top.rcmail.env.menu_last_frame_enabled
      ) {
        top.rcmail.env.menu_last_frame_enabled =
          rcmail.env.menu_last_frame_enabled;
        let $item = top.$('#taskmenu .menu-last-frame');
        if (rcmail.env.menu_last_frame_enabled === true) {
          const css_key = 'm_mp_CreateOrUpdateIcon';

          $item
            .addClass('disabled')
            .attr('aria-disabled', true)
            .parent()
            .css(CONST_CSS_DISPLAY, 'block')
            .find('.menu-last-frame-inner-down')
            .html(EMPTY_STRING);
          $item.find('.menu-last-frame-item').remove();

          top.rcmail.env.last_frame_class = 'settings';
          top.rcmail.env.last_frame_name = 'Configuration du bureau numérique';

          if ((mel_metapage.Frames.lastFrames?.length ?? 0) !== 0)
            mel_metapage.Frames.lastFrames.length = 0;

          MEL_ELASTIC_UI.css_rules.remove(css_key);
        } else $item.parent().css(CONST_CSS_DISPLAY, CONST_CSS_NONE);
      }

      if (
        JSON.stringify(rcmail.env.navigation_apps) !==
        JSON.stringify(top.rcmail.env.navigation_apps)
      ) {
        if (
          confirm(
            'Voulez vous actualiser pour voir apparaître ces changements ?',
          )
        ) {
          top.location.reload();
        }
      }
    }

    if (rcmail.env.keep_login === true) {
      if (!rcmail.get_cookie('mel_cerbere')) {
        mel_metapage.Functions.get(
          mel_metapage.Functions.url('mel_metapage', 'get_have_cerbere'),
          {},
          (datas) => {
            melSetCookie(
              'mel_cerbere',
              datas,
              moment().daysInMonth() - moment().date(),
            );
          },
        );
      }
    } else if (rcmail.get_cookie('mel_cerbere')) removeCookie('mel_cerbere');

    //tasklistsearch

    let initSearches = (selector) => {
      $(selector)
        .on('focus', () => {
          //.mel-animated
          let $parent = $(selector).parent().parent();

          if (!$parent.hasClass('mel-animated'))
            $parent.addClass('mel-animated');

          $parent.addClass('mel-focus focused');
        })
        .on('focusout', () => {
          $(selector)
            .parent()
            .parent()
            .removeClass('focused')
            .removeClass('mel-focus');
        });

      return initSearches;
    };

    initSearches('#searchform')('#tasklistsearch');
  });

  function _rm_get_margin_height($item) {
    return (
      parseInt($item.css('margin-top').replace('px', '')) +
      parseInt($item.css('margin-bottom').replace('px', ''))
    );
  }

  function _rm_update_theme_size() {
    let size = window.innerHeight;
    const array = [
      $('#layout-list .header'),
      $('#layout-list .searchbar'),
      $('#taskselector-content'),
      $('#layout-list-content separate').first(),
    ];

    for (let index = 0, len = array.length; index < len; ++index) {
      const element = array[index];
      size -= element.height() + _rm_get_margin_height(element);
    }

    return size;
  }

  function _rm_update_task_size() {
    const size = _rm_update_theme_size();
    $('#layout-list .scroller').css('max-height', `${size}px`);

    const othersize =
      $('#layout-list .header').height() +
      _rm_get_margin_height($('#layout-list .header')) +
      $('#layout-list-content').height() +
      _rm_get_margin_height($('#layout-list-content'));
    if (othersize < window.innerHeight) {
      $('#layout-list .scroller').css(
        'max-height',
        `${size + (window.innerHeight - othersize)}px`,
      );
    }
  }

  rcmail.addEventListener('theme.changed', () => {
    if (rcmail.env.task === 'tasks') {
      _rm_update_task_size();
    }
  });

  //Lorsqu'il y a un redimentionnement.
  rcmail.addEventListener('skin-resize', (datas) => {
    if ($('html').hasClass('framed')) {
      if (rcmail.env.task === 'tasks') {
        _rm_update_task_size();
      }

      return;
    }

    // if ($("html").hasClass("touch") && $("html").hasClass("layout-normal"))
    // {
    //     $("#barup-buttons").removeClass("col-6").addClass("col-3");
    //     $("#barup-search-col").removeClass("col-3").addClass("col-6").removeClass("col-7");
    //     $("#barup-search-col .col-12").removeClass("col-12").addClass("col-7");
    // }
    // else {
    //     if ($("html").hasClass("touch") && rcmail.env.mel_metapage_mail_configs !== undefined && rcmail.env.mel_metapage_mail_configs !== null && rcmail.env.mel_metapage_mail_configs["mel-chat-placement"] === rcmail.gettext("up", "mel_metapage"))
    //     {
    //         $("#barup-search-col .col-7").removeClass("col-7").addClass("col-12");
    //         $("#barup-buttons").removeClass("col-6").addClass("col-3");
    //         $("#barup-search-col").removeClass("col-3").addClass("col-7");

    //     }
    //     else if ($("html").hasClass("touch"))
    //     {
    //         $("#barup-search-col .col-7").removeClass("col-7").addClass("col-12");
    //         $("#barup-buttons").removeClass("col-6").addClass("col-3");
    //         $("#barup-search-col").removeClass("col-3").addClass("col-7");
    //     }
    //     else {
    //         $("#barup-buttons").removeClass("col-3").addClass("col-6");
    //         $("#barup-search-col .col-12").removeClass("col-12").addClass("col-7");
    //         $("#barup-search-col").removeClass("col-6").removeClass("col-7").addClass("col-3");
    //     }
    // }

    try {
      MEL_ELASTIC_UI._resize_themes();
    } catch (error) {}

    $('window').resize();
  });

  if (rcmail.env.task === 'calendar') {
    rcmail.addEventListener('calendar.renderEvent', (args) => {
      if (top.$('html').hasClass('mwsp'))
        return (
          args.eventDatas.categories !== undefined &&
          args.eventDatas.categories[0] ===
            `ws#${JSON.parse(mel_metapage.Storage.get('current_wsp'))}`
        );

      if (args.eventDatas.allDay === true) {
        args.element.find('.fc-content').addClass('fc-time');
      }
      return true;
    });

    rcmail.addEventListener('calendar.renderEvent.after', (args) => {
      const old_newline = rcube_calendar.old_newline_key;
      const newline = rcube_calendar.newline_key;
      let desc = args.element.find('.fc-event-location');

      if (
        !!args.eventDatas.location &&
        args.eventDatas.location.includes(old_newline)
      )
        args.eventDatas.location = args.eventDatas.location.replaceAll(
          old_newline,
          newline,
        );

      if (desc.length > 0 && args.eventDatas.location.includes(newline)) {
        let text = '';
        const splited = args.eventDatas.location.split(newline);

        for (let index = 0; index < splited.length; index++) {
          const element = splited[index] || null;

          if (element === null) continue;

          text += '@&nbsp;' + mel_metapage.Functions.updateRichText(element);

          if (index !== splited.length - 1) text += '<br/>';
        }

        desc.html(text);
      }

      return true;
    });
  }

  // au changement de couleur
  rcmail.addEventListener('switched_color_theme', (color_mode) => {
    on_switched_color_mode(color_mode);
    sendMessageToAriane({ isDarkTheme: color_mode === 'dark' });

    if (rcmail.env.task === 'stockage') {
      window.document
        .getElementById('mel_nextcloud_frame')
        .contentWindow.postMessage(`switch-theme-${color_mode}`);
    }
  });

  function on_switched_color_mode(color_mode) {
    const dark_logo = 'skins/mel_elastic/images/taskbar-logo.svg';
    const element_data_name = 'initsrc';

    let $logo = $('.logo-mel');

    if (MEL_ELASTIC_UI.color_mode() === 'dark') {
      $logo.data(element_data_name, $logo.attr('src')).attr('src', dark_logo);
    } else {
      $logo
        .attr('src', $logo.data(element_data_name))
        .data(element_data_name, '');
    }

    $('iframe').each((i, e) => {
      let contentWindow = e.contentWindow;
      contentWindow.postMessage('colorMode', '*');
      try {
        if (
          !!contentWindow.MEL_ELASTIC_UI &&
          MEL_ELASTIC_UI.color_mode() !==
            contentWindow.MEL_ELASTIC_UI.color_mode()
        ) {
          contentWindow.MEL_ELASTIC_UI.switch_color();
        } else
          contentWindow.rcmail.triggerEvent('switched_color_theme', color_mode);
      } catch (error) {}
    });

    mel_metapage.Storage.set(mel_metapage.Storage.color_mode, color_mode);
  }

  $(document).ready(() => {
    on_switched_color_mode(MEL_ELASTIC_UI.color_mode());
  });

  rcmail.addEventListener('rcmail.addrow.update_html', (args) => {
    switch (args.c) {
      case 'fromto':
        if (
          rcmail.env._insearch &&
          rcmail.env.current_search_scope !== 'base' &&
          !!args.flags.mbox
        )
          args.html = `<div class="mel-search-location">${show_mail_path(args.flags.mbox)}</div>${args.html}`;
        break;

      default:
        break;
    }

    return args.html;
  });

  function show_mail_path(text) {
    if (text.includes(rcmail.env.balp_label)) {
      text = text.split('/');
      text[1] = text[1].split('.')[0];
      text = text.join('/');
    }

    return decode_imap_utf7(
      text.replace('INBOX', 'Courrier entrant').replaceAll('/', ' » '),
    );
  }

  rcmail.addEventListener('responsebeforesearch', function () {
    rcmail.env._insearch = true;
  });
  rcmail.addEventListener('responseaftersearch', function () {
    $('#mail-search-icon').addClass('success-search');
    $('#mail-search-border').addClass('border-success-search');
    $('#mailsearchlist a.button').addClass('success-search');
    delete rcmail.env._insearch;
  });
  rcmail.addEventListener('responseafterlist', function () {
    $('#mail-search-icon').removeClass('success-search');
    $('#mail-search-border').removeClass('border-success-search');
    $('#mailsearchlist a.button').removeClass('success-search');

    try {
      delete rcmail.env._insearch;
      delete rcmail.env.current_search_scope;
    } catch (error) {}

    //RIEN
    //BALP
    const balp = 'balpartagee.';
    //AUTRE
    const bap = 'Boite partag&AOk-e/';
    const splited_key = '.-.';
    let current_bal = rcmail.get_message_mailbox();

    if (current_bal.includes(balp)) {
      current_bal = m_mp_mail_context(current_bal, balp);
    } else if (current_bal.includes(bap)) {
      current_bal = m_mp_mail_context(current_bal, bap);
    } else current_bal = 'INBOX';

    current_bal = current_bal ?? '';

    if (
      current_bal === 'INBOX' ||
      (!!current_bal &&
        Enumerable.from(rcmail.env.all_mailboxes).any(
          (x) =>
            x.key.split('.-.')[1].toLowerCase() === current_bal.toLowerCase(),
        ))
    )
      $('.ct-cm').css('display', '');
    else $('.ct-cm').css('display', 'none');
  });

  rcmail.addEventListener('start-da-modal', async function (args) {
    const loader =
      top.loadJsModule ?? parent.loadJsModule ?? window.loadJsModule;

    const { double_auth_modal } = await loader(
      'mel_metapage',
      'double_auth_modal',
      '/js/lib/metapages_actions/bnum/',
    );

    let da = new double_auth_modal(); //.intro_modal();
    da.nb_max_states = args.do_all ? da.nb_max_states : 2;
    da.data = args;

    const is_first_step_ignore = true;

    if (args.do_all) {
      da.data = undefined;
      da.after_data = args;
      da.intro_modal();
    } else da.secondary_mail_modal(is_first_step_ignore);
  });

  rcmail.addEventListener('da.mail_changed.after', function (args) {
    if (!args.modal.data) return args;

    args.break = true;

    new Promise(async (ok, nok) => {
      let { $input, $button } = args.modal.data;

      const busy = rcmail.set_busy(true, 'loading');
      $button.addClass('disabled').attr('disabled', 'disabled');
      const BnumConnector = await module_helper_mel.BnumConnector();

      const email_recup = await BnumConnector.connect(
        BnumConnector.connectors.settings_da_get_email_recup,
        {},
      );

      rcmail.set_busy(false, 'loading', busy);

      if ($input.length > 0) {
        $input.val(email_recup?.datas ?? 'ERROR');
      } else {
        rcmail.command('refreshFrame');
      }

      $button.removeClass('disabled').removeAttr('disabled');

      args = null;

      if (email_recup?.datas) {
        rcmail.display_message('Adresse changée avec succès !', 'confirmation');
        ok();
      } else {
        console.error('### [DA]', email_recup);
        rcmail.display_message('Une erreur est survenue !', 'error');
        nok();
      }
    });

    return args;
  });

  rcmail.addEventListener('da.da_changed.after', async function (args) {
    let { modal } = args;
    if (modal.after_data) {
      modal.after_data = null;
      rcmail.command('refreshFrame');
      modal = null;
    }
  });

  rcmail.addEventListener('da.modal.close', async function (modal) {
    if (modal.data) {
      const BnumConnector = await module_helper_mel.BnumConnector();

      const obj = await BnumConnector.connect(
        BnumConnector.connectors.settings_da_get_email_valid,
        {},
      );

      if (!obj.datas && data.$input.length > 0) {
        rcmail.command('refreshFrame');
      }
    }
  });

  rcmail.addEventListener('responseaftercheck-recent', function () {
    if (rcmail.env.list_uid_to_select) {
      rcmail.message_list.select(rcmail.env.list_uid_to_select);
      rcmail.env.list_uid_to_select = null;
    }
  });

  rcmail.addEventListener(
    'storage.change',
    (datas) => {
      rcmail.triggerEvent(`storage.change.${datas.key}`, datas.item);

      m_mp_e_on_storage_change_notifications(datas.key);
    },
    false,
  );

  async function m_mp_e_on_storage_change_notifications(key) {
    const accepted_changes = [
      'mel_metapage.mail.count',
      'mel_metapage.tasks',
      'mel_metapage.calendar',
      'ariane_datas',
      'tchat',
      true,
    ];

    if (!accepted_changes.includes(key)) return;

    if (!window.loadJsModule) return;

    const Chat = await ChatHelper.Chat();
    const Calendar = (
      await loadJsModule('mel_metapage', 'calendar_loader', '/js/lib/calendar/')
    ).CalendarLoader.Instance;
    const delimiter = ') ';
    const config = rcmail.env['mel_metapage.tab.notification_style'];
    const get = mel_metapage.Storage.get;
    const current_task = top.rcmail.env.current_task;
    const current_title = top.document.title;

    let numbers = 0;
    switch (config) {
      case 'all':
        //temp = ;

        if (Chat) {
          numbers = Enumerable.from(Chat.unreads[Symbol.iterator]())
            .where((x) => x.key !== 'haveSomeUnreads')
            .sum((x) =>
              typeof x.value === 'string' ? parseInt(x.value) : (x?.value ?? 0),
            );

          if (numbers === 0 && Chat.unreads.haveUnreads() === true) {
            numbers = '•';
            break;
          }
        }

        numbers +=
          parseInt(get('mel_metapage.mail.count') ?? 0) +
          (get('mel_metapage.tasks') ?? []).length +
          Calendar.get_next_events_day(moment(), { enumerable: false }).length;

        break;

      case 'page':
        switch (current_task) {
          case 'discussion':
            numbers = Enumerable.from(Chat.unreads[Symbol.iterator]())
              .where((x) => x.key !== 'haveSomeUnreads')
              .sum((x) =>
                typeof x.value === 'string'
                  ? parseInt(x.value)
                  : (x?.value ?? 0),
              );

            if (numbers === 0 && Chat.unreads.haveUnreads() === true)
              numbers = '•';
            break;

          case 'calendar':
            numbers = Calendar.get_next_events_day(moment(), {
              enumerable: false,
            }).length;
            break;

          case 'tasks':
            numbers = (get('mel_metapage.tasks') ?? []).length;
            break;

          case 'mail':
            return;

          default:
            break;
        }

        break;

      default:
        return;
    }

    numbers = numbers || null;

    let title = '';
    if (current_title.includes(delimiter)) {
      title = current_title.split(delimiter);
      title = title.pop();
    }

    if (numbers !== null) {
      title = `(${numbers}) ${title || current_title}`;
    }

    rcmail.set_pagetitle(title);

    return title;
  }
  m_mp_e_on_storage_change_notifications(true);

  window.update_notification_title = () => {
    return m_mp_e_on_storage_change_notifications(true);
  };

  rcmail.addEventListener('set_unread_count_display.after', (args) => {
    if (args.set_title) {
      update_notification_title();
    }
  });

  rcmail.addEventListener('intercept.click.ok', (args) => {
    if ($('#groupoptions-user').is(':visible') == true) {
      m_mp_ToggleGroupOptionsUser($('#groupoptions-user').data('opener'));
    }
  });

  rcmail.addEventListener('beforeswitch-task', function (prop) {
    if (prop === 'logout') {
      let $querry = $('iframe.wekan-frame');
      if ($querry.length > 0) {
        try {
          $querry[0].contentWindow
            .$('#wekan-iframe')
            .contentWindow.Meteor.logout();
        } catch (error) {}

        try {
          const kanban = $querry[0].contentWindow.rcmail.env.wekan_storage_end;
          const storage = Object.keys(localStorage);
          for (const key of storage) {
            if (key.includes(kanban)) localStorage.removeItem(key);
          }
        } catch (error) {}
      }
    }
  });

  /*********AFFICHAGE D'UN EVENEMENT*************/
  rcmail.addEventListener(
    'calendar.event_show_dialog.custom',
    async (datas) => {
      const Alarm = (
        await loadJsModule('mel_metapage', 'alarms', '/js/lib/calendar/')
      ).Alarm;
      if (datas.showed.start.format === undefined)
        datas.showed.start = moment(datas.showed.start);

      if (datas.showed.end === null)
        datas.showed.end = moment(datas.showed.start);

      if (datas.showed.end.format === undefined)
        datas.showed.end = moment(datas.showed.end);

      const event = datas.showed;
      const isInvited = datas.show_rsvp;

      rcmail.env.bnum_last_event_datas = datas;

      let html = '';
      html += '<div id=parenthtmlcalendar>';
      const reserved_all_day = '¤¤*_RESERVED:ADLL_DAY_*¤¤';
      //Date / Horaire
      html += `<div class="row"><div class=col-6><b>${event.start.format('dddd D MMMM')}</b></div><div class="col-6"><span class="icon-mel-clock mel-cal-icon"></span>${event.allDay ? rcmail.gettext('all-day', 'mel_metapage') + reserved_all_day : event.start.format('DD/MM/YYYY') === event.end.format('DD/MM/YYYY') ? `${event.start.format('HH:mm')} - ${event.end.format('HH:mm')}` : `${event.start.format('DD/MM/YYYY HH:mm')} - ${event.end.format('DD/MM/YYYY HH:mm')}`}</div></div>`;

      if (event.allDay) {
        if (
          event.start.format('DD/MM/YYYY') !==
          moment(event.end).subtract(1, 'days').format('DD/MM/YYYY')
        ) {
          html = html.replace(
            reserved_all_day,
            `<br/><span style='font-size:smaller'>${event.start.format('DD/MM/YYYY')} - ${moment(event.end).subtract(1, 'days').format('DD/MM/YYYY')}</span>`,
          );
        } else {
          html = html.replace(reserved_all_day, '');
        }
      }

      //Affichage de la récurrence puis de l'alarme
      let rec =
        event.recurrence_text === undefined ? null : event.recurrence_text;
      let alarm =
        event.alarms !== undefined ? new Alarm(event.alarms).toString() : null;

      html += `<div class=row style="margin-top:5px">${rec !== null ? `<div class=col-6>${rec}</div>` : ''}${alarm !== null ? `<div class=col-6><span class="icon-mel-notif mel-cal-icon"></span>Rappel : ${alarm}</div>` : ''}</div>`;

      const hasLocation =
        event.location !== undefined &&
        event.location !== null &&
        event.location !== '';
      let location_phone = '';
      let location = '';

      if (hasLocation) {
        const old_new_line = rcube_calendar?.old_newline_key ?? '{mel.newline}';
        const newline =
          rcube_calendar?.newline_key ?? String.fromCharCode('8232');
        const tmp_location = event.location
          .replaceAll(old_new_line, newline)
          .split(newline);

        let element;
        for (let index = 0; index < tmp_location.length; ++index) {
          element = tmp_location[index];

          if (
            element.includes('(') &&
            element.includes('|') &&
            element.includes('/public/webconf')
          ) {
            location_phone = element.split('(');
            element = location_phone[0];
            location_phone = location_phone[1].replace(')', '').split('|');
          }

          location += mel_metapage.Functions.updateRichText(element)
            .replaceAll('#visio:', '')
            .replaceAll('@visio:', '');

          if (index !== tmp_location.length - 1) location += '<br/>';
        }
      }

      //Affichage du lieu
      if (hasLocation)
        html += `<div id="location-mel-edited-calendar" class=row style="margin-top:15px"><div class=col-12 style="overflow: hidden;
            /*white-space: nowrap;*/
            display:flex;
            text-overflow: ellipsis;"><span style="display: inline-block;
            vertical-align: top;margin-top:5px" class="icon-mel-pin-location mel-cal-icon"></span><span style='display:inline-block'>${linkify(location)}</span></div></div>`;

      if (location_phone !== '')
        html += `<div id="location-mel-edited-calendar" class=row style="margin-top:15px"><div class=col-12 style="overflow: hidden;
            /*white-space: nowrap;*/
            display:flex;
            text-overflow: ellipsis;"><span style="display: inline-block;
            vertical-align: top;margin-top:5px" class="icon-mel-phone mel-cal-icon"></span><span style='display:inline-block'><a title="Rejoindre la visio par téléphone. Le code pin est ${location_phone[1]}." href="tel:${location_phone[0]};${location_phone[1]}#">${location_phone[0]}</a> - PIN : ${location_phone[1]}</span></div></div>`;
      if (event.categories !== undefined && event.categories.length > 0) {
        const isWsp = event.categories[0].includes('ws#');
        if (isWsp) {
          const wsp = event.categories[0].replace('ws#', '');
          const wsp_name =
            mel_metapage.Storage.get(
              mel_metapage.Storage.title_workspaces,
              wsp,
            )[wsp] ?? wsp;
          html += `<div class=row style="margin-top:5px">
                                    <div class=col-12>
                                        <span class="icon-mel-workplace mel-cal-icon"></span>
                                        <a class='a-event-wsp-link' href="${mel_metapage.Functions.url('workspace', 'workspace', { _uid: wsp })}" style="color:#${rcmail.env.calendar_categories[event.categories[0]]}" >${wsp_name}</a>
                                    </div>
                                </div>`;
        } else {
          html += `<div class=row style="margin-top:5px">
                            <div class=col-12>
                                <span style="color:#${rcmail.env.calendar_categories[event.categories[0]]}" class="icon-mel-label-full mel-cal-icon"></span>
                                <span>${event.categories[0]}</span>
                            </div>
                        </div>`;
        }
      }

      html += '<div style=font-size:1rem>';

      //Affichage de la description
      if (event.description !== undefined && event.description !== '')
        html += `<div class=row style="margin-top:15px;"><div class=col-12 style=white-space:nowrap;><span class="icon-mel-descri mel-cal-icon" style="display: inline-block;
            vertical-align: top;
            margin-top: 5px;"></span><p style="overflow:auto;display:inline-block;white-space: break-spaces;width:95%;">${linkify(mel_metapage.Functions.updateRichText(event.description).replaceAll('\n', '<br/>'))}</p></div></div>`;

      //Affichage des invités
      if (event.attendees !== undefined && event.attendees.length > 1) {
        let tmp = Enumerable.from(event.attendees)
          .where((x) => !!x.email)
          .orderBy((x) => x.role !== 'ORGANIZER')
          .thenBy((x) => x.name)
          .toArray();
        let attendeesHtml = '';
        for (let index = 0; index < tmp.length && index < 3; ++index) {
          const element = tmp[index];
          attendeesHtml += `<div class="attendee mel-ellipsis  ${element.status === undefined ? element.role.toLowerCase() : element.status.toLowerCase()}"><a href="mailto:${element.email}">${element.name || element.email}</a></div>`;
        }

        if (tmp.length > 3) {
          attendeesHtml += '<div id=mel-hidden-attendees class=hidden>';

          for (let index = 3; index < tmp.length; ++index) {
            const element = tmp[index];
            attendeesHtml += `<div class="attendee mel-ellipsis  ${element.status === undefined ? element.role.toLowerCase() : element.status.toLowerCase()}"><a href="mailto:${element.email}">${element.name || element.email}</a></div>`;
          }

          attendeesHtml += '</div>';

          attendeesHtml += `<b><a role="button" data-length=${tmp.length - 3} href=# onclick="event_calendar_show_all_something(this)">${tmp.length - 3} de plus...</a></b>`;
        }

        html += `<div class=row style="max-width:100%;${event.description === undefined || event.description === '' ? 'margin-top:15px;' : ''}"><div class="col-12 mel-calendar-col"><span class="mel-calendar-left-element icon-mel-user mel-cal-icon"></span><div class="mel-calendar-right-element" style="">${attendeesHtml}</div></div></div>`;
        html += `
            <div class="attendees-cout">${tmp.length - 1} Invité${tmp.length - 1 > 1 ? 's' : ''}</div>
         <div class="attendees-details">
            `;

        tmp = Enumerable.from(tmp)
          .groupBy((x) => x.status)
          .where((x) => x.key() !== undefined)
          .toJsonDictionnary(
            (x) => x.key(),
            (x) => x.getSource(),
          );

        for (const key in tmp) {
          if (Object.hasOwnProperty.call(tmp, key)) {
            const element = tmp[key];

            if (!!element && element.length > 0) {
              html += `${element.length} ${rcmail.gettext(`status${key.toLowerCase()}`, key === 'NEEDS-ACTION' ? 'mel_metapage' : 'libcalendaring')}, `;
            }
          }
        }

        html = `${html.slice(0, html.length - 2)} </div>`;

        // Affichage du status
        try {
          // PAMELA - Mode assistantes
          const me = Enumerable.from(event.attendees)
            .where((x) => x.email === datas.calendar.owner_email.toLowerCase())
            .first();
          if (
            datas.calendar.editable &&
            me.status !== undefined &&
            event.editable !== false
          ) {
            html += `<div class="row" id="event-dialog-invited-row" style="margin-top:15px"><div class=col-4><span style="margin-right:11px" class="mel-cal-icon attendee ${me.status === undefined ? me.role.toLowerCase() : me.status.toLowerCase()}"></span><span style=vertical-align:text-top><b>${rcmail.gettext('answer', 'calendar')}</b> : ${rcmail.gettext(`status${me.status.toLowerCase()}`, 'libcalendaring')}</span>
                    ${me.status === 'NEEDS-ACTION' || isInvited ? '' : '<button id="event-status-editor" class="btn btn-secondary dark-no-border-default mel-button" style="margin-top:0;margin-left:5px;padding:10px;line-height:0"><span class="icon-mel-pencil"></span></button>'}
                    </div>
                    </div>`;
          }
        } catch (error) {
          console.warn('/!\\[status]', error);
        }
      }

      //Affichage des pièces jointes
      if ($.isArray(event.attachments) && event.attachments.length > 0)
        html +=
          '<div id=mel-event-attachments class="row" style=margin-top:15px><div class="col-12"><span class="icon-mel-pj mel-cal-icon mel-calendar-left-element"></span><span class="mel-event-text mel-calendar-right-element"></span></div></div>';

      //Affichage du calendrier
      html += `<div class=row style="margin-top:15px"><div class=col-12><span class="icon-mel-calendar mel-cal-icon"></span><span style=vertical-align:text-top>${event['calendar-name']}</span></div></div>`;

      //Affichage free_busy
      html += `<div class=row><div class=col-12 style="margin-top:10px"><span style="display: inline-block;
        width: 0.7rem;
        height: 0.7rem;
        background-color: ${event.free_busy === 'free' || event.free_busy === 'telework' ? 'green' : 'red'};
        border-radius: 100%;
        margin-bottom: -0.1rem;
        margin-left: 0.35rem;
        margin-right: 1rem;" class="mel-cal-icon"></span><span style=vertical-align:text-top><b>${rcmail.gettext('status', 'calendar')}</b> : ${rcmail.gettext(event.free_busy, 'calendar')}</span></div></div>`;

      //Affichage de la date de création
      const created = rcube_calendar.mel_metapage_misc.CapitalizeMonth(
        rcube_calendar.mel_metapage_misc.GetDateFr(
          moment(event.created).format('DD MMMM YYYY'),
        ),
      );
      html += `<div class=row style="margin-top:10px"><div class=col-12><span class="icon-mel-pencil mel-cal-icon"></span><span style=vertical-align:text-top><b>Créé le : </b>${created}</span></div></div>`;

      //Affichage de la date de modification
      if (event.changed !== undefined) {
        const edited = rcube_calendar.mel_metapage_misc.CapitalizeMonth(
          rcube_calendar.mel_metapage_misc.GetDateFr(
            moment(event.changed).format('DD MMMM YYYY'),
          ),
        );
        html += `<div class=row><div class=col-12><span style="opacity:0" class="icon-mel-pencil mel-cal-icon"></span><span style=vertical-align:text-top><b>Dernière modification le : </b>${created}</span></div></div>`;
      }
      //fin table
      html += '</div></div>';

      const cancelled = event.status === 'CANCELLED';
      const okTitle = mel_metapage.Functions.updateRichText(event.title);
      const title =
        event.sensitivity === 'private'
          ? `<span class="icon-mel-lock mel-cal-icon"><span class="sr-only">Privé : </span></span>${cancelled ? `<span style="text-decoration-line: line-through;">${okTitle}</span> (Annulé)` : okTitle}`
          : cancelled
            ? `<span style="text-decoration-line: line-through;">${okTitle}</span> (Annulé)`
            : okTitle;

      const config = new GlobalModalConfig(title, 'default', html);
      let modal = new GlobalModal('globalModal', config, true);
      modal.modal
        .find('.modal-lg')
        .css('font-size', '1.2rem')
        .find('.a-event-wsp-link')
        .click((e) => {
          e.preventDefault();
          mel_metapage.Functions.change_page(
            'workspace',
            'workspace',
            {
              _uid: event.categories[0].replace('ws#', ''),
            },
            true,
          );
        });

      //Gérer le titre
      modal.header.querry
        .css('position', 'sticky')
        .css('top', '0')
        // .css("background-color","white")
        .css('border-top-left-radius', '15px')
        .css('border-top-right-radius', '15px')
        .css('z-index', 1);

      //gérer les boutons du footer
      modal.footer.querry
        .css('position', '')
        .css('bottom', '0')
        // .css("background-color", "white")
        .css('flex-direction', 'row-reverse')
        .css('z-index', 1)
        .addClass('calendar-show-event');

      modal.footer.querry.html('').append(
        $(
          '<button class="mel-calendar-button" id="-mel-send-event"><span class="icon-mel-send"></span><span class=inner>Partager</span></button>',
        ).click((e) => {
          if (rcmail.busy) {
            rcmail.display_message('Une action est déjà en cours....');
            return;
          }

          modal.editTitle("Partager l'évènement");

          modal.editBody('');

          let $userInput =
            top.$(`<input id="tmp-generated-input-user" class="form-control input-mel" type="text"
            autocomplete="off" aria-autocomplete="list" aria-expanded="false" role="combobox"
            placeholder="Liste d'adresses emails..."
            style="margin-top: 8px;
            margin-left: -1px;"/>`);

          let $subject = $(
            `<input class="form-control input-mel" type="text" placeholder="Sujet du message..." value="${top.rcmail.env.firstname ?? ''} ${top.rcmail.env.lastname ?? ''}${!!top.rcmail.env.firstname && !!top.rcmail.env.lastname ? '' : 'On'} vous partage l'évènement ${event.title}"/>`,
          );
          let $commentArea = $(
            '<textarea placeholder="Message optionnel ici...." class="input-mel mel-input form-control" row=10 style="width:100%"></textarea>',
          );

          let $userInputParent = $('<div></div>').append($userInput);

          $userInputParent = m_mp_autocomplete_startup($userInput);

          modal.appendToBody(
            $(`<p class="red-star-removed"><star class="red-star mel-before-remover">*</star>
            Champs obligatoires
        </p>`),
          );

          modal.appendToBody(
            $(
              '<div><label class="red-star-after span-mel t1 first">Participants</label></div>',
            ).append($userInputParent),
          );

          modal.appendToBody(
            $('<div><label class="span-mel t1">Objet</label></div>').append(
              $subject,
            ),
          );

          modal.appendToBody(
            $('<div><label class="span-mel t1">Message</label></div>').append(
              $commentArea,
            ),
          );

          modal.footer.querry.html('');
          modal.footer.querry
            .append(
              $(
                '<button class="btn btn-secondary mel-button" style="position: absolute;bottom: 14px;right: 65px;">Envoyer <span class="plus icon-mel-send"></span></button>',
              ).click(() => {
                let loading = rcmail.set_busy(true, 'loading');
                const comment = $commentArea.val();
                const subject = $subject.val();

                let users = [];

                $userInputParent.find('.recipient').each((i, e) => {
                  const datas = $(e).find('.email').html();
                  if (datas) users.push(datas);
                });

                let cloned_event = Object.assign({}, event);
                delete cloned_event['source'];

                if (typeof cloned_event.start !== 'string')
                  cloned_event.start = cal.date2ISO8601(
                    cloned_event.start.toDate(),
                  );
                if (typeof cloned_event.end !== 'string')
                  cloned_event.end = cal.date2ISO8601(
                    cloned_event.end.toDate(),
                  );

                if (!cloned_event.allDay) delete cloned_event.allDay;

                if (users.length === 0) {
                  rcmail.set_busy(false);
                  rcmail.clear_messages();
                  top.rcmail.display_message(
                    'Vous devez mettre des utilisateurs !',
                    'error',
                  );
                  return;
                }

                if (subject.length === 0) {
                  if (
                    !confirm(
                      'Êtes-vous sûr de vouloir envoyer un message sans objet ?',
                    )
                  ) {
                    rcmail.set_busy(false);
                    rcmail.clear_messages();
                    top.rcmail.display_message(
                      'Vous devez mettre des utilisateurs !',
                      'error',
                    );
                    return;
                  }
                }

                modal.close();
                rcmail.http_post(
                  'event',
                  {
                    action: 'share',
                    e: cloned_event,
                    _users_to_share: users,
                    _comment: comment,
                    _subject: subject,
                    _organizer: event.source.ajaxSettings.owner,
                  },
                  loading,
                );
              }),
            )
            .append(
              $(
                '<button class="btn btn-secondary mel-button">Annuler <span class="plus icon-mel-undo"></span></button>',
              ).click(() => {
                rcmail.triggerEvent('calendar.event_show_dialog.custom', datas);
              }),
            );
        }),
      );

      if (
        rcmail.env.calendars[event.calendar].editable &&
        event.editable !== false
      ) {
        modal.footer.querry
          .append(
            $(
              '<button class="mel-calendar-button danger" id="-mel-delete-event"><span class="icon-mel-trash"></span><span class=inner>Supprimer</span></button>',
            ).click(() => {
              datas.object.delete_event(event);
              modal.close();
            }),
          )
          .append(
            $(
              '<button class="mel-calendar-button" id="-mel-modify-event"><span class="icon-mel-pencil"></span><span class=inner>Modifier</span></button>',
            ).click(() => {
              modal.close();
              datas.functions.event_edit_dialog('edit', event);
              // PAMELA - Actions à faire lorsque l'on appelle la fenêtre d'édition d'évènement
              rcmail.triggerEvent('edit-event', event);
            }),
          );
      }

      //Options
      if (!datas.temp && !event.temporary && event.calendar != '_resource') {
        $('<button>')
          .attr({
            href: '#',
            class: 'dropdown-link mel-calendar-button ',
            'data-popup-pos': 'top',
          })
          .append(
            `<span class="inner">${rcmail.gettext('eventoptions', 'calendar')}</span>`,
          )
          .click(function (e) {
            return rcmail.command('menu-open', 'eventoptionsmenu', this, e);
          })
          .prepend(
            `<span style="transform: rotateZ(90deg);
          display: inline-block;" class="icon-mel-dots"></span>`,
          )
          .prependTo(modal.footer.querry)
          .find('span')
          .click((e) => {
            $(e.currentTarget).parent().click();
          });
        $('#eventoptionsmenu .send').css('display', 'none');

        if (!$('#eventoptionsmenu .copy').hasClass('mel-edited'))
          $('#eventoptionsmenu .copy')
            .addClass('mel-edited')
            .click(() => {
              modal.close();
            });
      }

      modal.footer.querry.prepend(
        $(`<button style="position: absolute;
    right: 50px;
    bottom: 20px;" class="mel-button">Fermer<span class="plus icon-mel-close"></span></button>`).click(
          () => {
            modal.close();
          },
        ),
      );

      modal.contents
        .css('height', `${window.innerHeight - 250}px`)
        .css('overflow-y', 'auto')
        .css('overflow-x', 'hidden');

      modal.onClose(() => {
        modal.footer.querry
          .css('position', '')
          .css('bottom', '')
          .css('background-color', '')
          .css('flex-direction', '')
          .css('z-index', 1)
          .removeClass('calendar-show-event');

        if (window.create_popUp !== undefined) delete window.create_popUp;

        if (window.current_event_modal) delete window.current_event_modal;
      });

      //Gestion des liens
      setTimeout(() => {
        let querry = $('#location-mel-edited-calendar').find('a');
        if (querry.length > 0) {
          if (
            rcube_calendar.is_valid_for_bnum_webconf(querry.attr('href') ?? '')
          ) {
            querry.data('spied', true);
            querry.click((e) => {
              e.preventDefault();
              e.stopPropagation();
              modal.close();
              const categoryExist =
                event.categories !== undefined &&
                event.categories !== null &&
                event.categories.length > 0;
              const ariane = null;
              const wsp =
                categoryExist && event.categories[0].includes('ws#')
                  ? event.categories[0].replace('ws#', '')
                  : null;
              const pass = querry.attr('href').includes('_pass=')
                ? querry
                    .attr('href')
                    .split('_pass=')[1]
                    .split('&')[0]
                    .split(' (')[0]
                : null;

              setTimeout(() => {
                rcmail.set_busy(false);
                //window.webconf_helper.go(mel_metapage.Functions.webconf_url(querry.attr("href")), wsp, ariane);
                window.webconf_helper.go_ex({
                  key: mel_metapage.Functions.webconf_url(querry.attr('href')),
                  ariane,
                  wsp,
                  pass,
                });
              }, 10);
            });
          }
        }

        function invited() {
          $('#noreply-event-rsvp')?.attr('id', 'noreply-event-rsvp-old');
          let a = $(`
                <div id="event-rsvp-cloned" class="row" style="margin-top:10px;margin-left:-5px">
                    <div class="rsvp-buttons itip-buttons">
                        <input type="button" class="button btn btn-secondary" rel="accepted" value="${rcmail.gettext('itipaccepted', 'libcalendaring')}">
                        <input type="button" class="button btn btn-secondary" rel="tentative" value="${rcmail.gettext('itiptentative', 'libcalendaring')}">
                        <input type="button" class="button btn btn-secondary" rel="declined" value="${rcmail.gettext('itipdeclined', 'libcalendaring')}">
                        <input type="button" class="button btn btn-secondary" rel="delegated" value="${rcmail.gettext('itipdelegated', 'libcalendaring')}">
                        <div class="itip-reply-controls" style="margin-top:5px">
                            <div class="custom-control custom-switch">
                                <input type="checkbox" id="noreply-event-rsvp" value="1" class="pretty-checkbox form-check-input custom-control-input">
                                <label class="custom-control-label" for="noreply-event-rsvp" title="">${rcmail.gettext('itipsuppressreply', 'libcalendaring')}</label>
                            </div>
                            <div><a href="#toggle" class="reply-comment-toggle" onclick="$(this).parent().hide().parent().find('textarea').show().focus()">${rcmail.gettext('itipeditresponse', 'libcalendaring')}</a></div>
                            <div class="itip-reply-comment">
                                <textarea id="reply-comment-event-rsvp" name="_comment" cols="40" rows="4" class="form-control" style="display:none" placeholder="${rcmail.gettext('itipcomment', 'libcalendaring')}"></textarea>
                                </div>
                            </div>
                        </div>
                </div>
            `)
            .insertAfter('#event-dialog-invited-row')
            .find('input[rel=accepted]')
            .click((e) => {
              if (event.recurrence !== undefined)
                window.event_can_close = false;
              ui_cal.event_rsvp(e.currentTarget, null, null, e.originalEvent);
            })
            .parent()
            .find('input[rel=tentative]')
            .click((e) => {
              if (event.recurrence !== undefined)
                window.event_can_close = false;
              ui_cal.event_rsvp(e.currentTarget, null, null, e.originalEvent);
            })
            .parent()
            .find('input[rel=delegated]')
            .click((e) => {
              if (event.recurrence !== undefined) {
                window.event_can_close = false;
                ui_cal.event_rsvp(e.currentTarget, null, null, e.originalEvent);
              } else {
                ui_cal.event_rsvp(e.currentTarget, null, null, e.originalEvent);
                modal.close();
              }
            })
            .parent()
            .find('input[rel=declined]')
            .click((e) => {
              if (event.recurrence !== undefined)
                window.event_can_close = false;
              ui_cal.event_rsvp(e.currentTarget, null, null, e.originalEvent);
            });
          // Disable current response
          const me = Enumerable.from(event.attendees)
            .where((x) => x.email === datas.calendar.owner_email.toLowerCase())
            .first();
          $('#event-rsvp-cloned input[rel=' + me.status + ']').prop(
            'disabled',
            true,
          );
          return a;
        }

        // Gestion des invitations
        if (isInvited) {
          invited();
        }

        if (event.attendees === undefined)
          $('.mel-event-compose').css('display', 'none');
        else $('.mel-event-compose').css('display', '');

        if (
          event.calendar === mceToRcId(rcmail.env.username) ||
          event.attendees === undefined
        )
          $('.mel-event-self-invitation').css('display', 'none');
        else $('.mel-event-self-invitation').css('display', '');

        //Button edit
        $('#event-status-editor').click(() => {
          const closed = 'closed';
          let $this = $('#event-status-editor');
          if ($this.data('state') !== closed) {
            invited()
              .parent()
              .parent()
              .parent()
              .parent()
              .parent()
              .css('display', '')
              .find('input.button.btn')
              .click(() => {
                if (window.event_can_close !== false) {
                  $('#event-status-editor').click();
                } else window.event_can_close = true;
              });
            $this
              .data('state', closed)
              .find('span')
              .removeClass('icon-mel-pencil')
              .addClass('icon-mel-close');
          } else {
            $('#event-rsvp-cloned').remove();
            $this
              .data('state', '')
              .find('span')
              .addClass('icon-mel-pencil')
              .removeClass('icon-mel-close');
          }
        });
      }, 1);

      //Gestion des attachements
      if ($.isArray(event.attachments)) {
        libkolab.list_attachments(
          event.attachments,
          $('#mel-event-attachments').find('.mel-event-text'),
          undefined,
          event,
          function (id) {
            rcmail.env.deleted_attachments.push(id);
          },
          function (data) {
            var event = data.record,
              query = {
                _id: data.attachment.id,
                _event: event.recurrence_id || event.id,
                _cal: event.calendar,
              };

            if (event.rev) query._rev = event.rev;

            if (event.calendar == '--invitation--itip')
              $.extend(query, {
                _uid: event._uid,
                _part: event._part,
                _mbox: event._mbox,
              });

            libkolab.load_attachment(query, data.attachment);
          },
        );
        if (event.attachments.length > 0) {
          $('#mel-event-attachments').show();
          $('#mel-event-attachments')
            .find('ul')
            .css('background-color', 'transparent')
            .css('border-color', 'transparent');
          $('#mel-event-attachments')
            .find('.mel-event-text')
            .css('width', '94%')
            .find('li')
            .each((i, e) => {
              const txt = $(e)
                .addClass('mel-before-remover')
                .css('display', 'block')
                .find('a')
                .find('span')
                .html();
              const splited = txt.split('.');
              const ext = splited[splited.length - 1];
              const name = Enumerable.from(splited)
                .where((x, i) => i < splited.length - 1)
                .toArray()
                .join('.');

              $(e).prepend(
                `<div class=row><div class=col-8>${name}</div><div class=col-2>${ext}</div><div class="col-2 r-gm-col-temp" ></div></div>`,
              );
              $(e)
                .find('a')
                .addClass('mel-calendar-button mel-calendar-button-sm')
                .appendTo($('.r-gm-col-temp').removeClass('r-gm-col-temp'))
                .find('span')
                .html('')
                .addClass('icon-mel-download');
            });
        }
      }
      //fin
      window.current_event_modal = modal;
    },
  );

  async function deplace_popup_if_exist(rec) {
    let it = -1;
    return wait(() => {
      ++it;
      if ($('.popover.show').length > 0 && $('#itip-rsvp-menu').length > 0)
        return false;
      else if (
        $('.popover.show').length > 0 &&
        $('#itip-rsvp-menu').length == 0
      )
        return false;
      else if (it === 5) return false;
      else return true;
    }).then(() => {
      const top = rec.top + rec.height / 2;
      const left = rec.left + rec.width;
      var popup = $('.popover.show')
        .css('top', `${top}px`)
        .css('left', `${left}px`);
      if (deplace_popup_if_exist.hasAlready === undefined) {
        popup.find('li a').each((i, e) => {
          $(e).click(() => {
            if (rcmail.env.bnum_itip_action !== undefined) {
              rcmail.env.bnum_itip_action(e);
            }
          });
        });
        deplace_popup_if_exist.hasAlready = true;
      }
    });
  }

  function linkify(text, config = { style: '' }) {
    var urlRegex =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    return text.replace(urlRegex, function (url) {
      return `<a target="_blank" href="${url}" ${config !== undefined && config.style !== undefined && config.style !== '' ? `style="${config.style}"` : ''}>${url}</a>`;
    });
  }

  function event_calendar_show_all_something(element) {
    element = $(element);
    let querry = $('#mel-hidden-attendees');

    if (querry.hasClass('hidden')) {
      querry.removeClass('hidden');
      element.html(`${rcmail.gettext('see_minus', 'mel_metapage')}...`);
    } else {
      querry.addClass('hidden');
      element.html(`${element.data('length')}  de plus...`);
    }
  }

  rcmail.addEventListener(
    'rcube_libcalendaring.itip_delegate_dialog.open',
    (datas) => {
      window.current_event_modal.modal.css('display', 'none');
      $('.modal-backdrop').css('display', 'none');
    },
  );

  rcmail.addEventListener(
    'rcube_libcalendaring.itip_delegate_dialog.close',
    (datas) => {
      window.current_event_modal.modal.css('display', 'block');
      $('.modal-backdrop').css('display', '');
    },
  );

  function m_mp_mail_context(current_bal, word) {
    current_bal = current_bal.split(word)[1];

    if (current_bal.includes('/')) current_bal = current_bal.split('/')[0];

    return current_bal;
  }

  rcmail.addEventListener('contextmenu_init', function (menu) {
    // identify the folder list context menu
    if (menu.menu_name == 'messagelist') {
      // add a shortcut to the folder management screen to the end of the menu
      //menu.menu_source.push({label: rcmail.gettext('new-mail-from', "mel_metapage"), command: 'new-mail-from', classes: 'compose mel-new-compose options'});

      menu.menu_source.unshift({
        label: 'Editer le modèle',
        command: 'edit_model',
        classes: 'ct-em',
      });
      menu.menu_source.unshift({
        label: 'Utiliser comme modèle',
        command: 'use_as_new',
        classes: 'ct-m',
      });

      menu.menu_source.push({
        label: 'Commenter',
        command: 'mel-comment-mail',
        classes: 'ct-cm',
      });
      menu.menu_source.push({
        label: 'Gérer les étiquettes',
        command: 'gestion_labels',
        classes: 'ct-tb',
      });

      menu.addEventListener('beforeactivate', (p) => {
        if (decode_imap_utf7(rcmail.env.mailbox) === rcmail.env.model_mbox) {
          $('.ct-em').css('display', '');
          $('.ct-m').css('display', '');
        } else {
          $('.ct-em').css('display', 'none');
          $('.ct-m').css('display', 'none');
        }

        //RIEN
        //BALP
        const balp = 'balpartagee.';
        //AUTRE
        const bap = 'Boite partag&AOk-e/';
        const splited_key = '.-.';
        let current_bal = rcmail.get_message_mailbox();

        if (current_bal.includes(balp)) {
          current_bal = m_mp_mail_context(current_bal, balp);
        } else if (current_bal.includes(bap)) {
          current_bal = m_mp_mail_context(current_bal, bap);
        } else current_bal = 'INBOX';

        current_bal = current_bal ?? '';

        if (
          current_bal === 'INBOX' ||
          (!!current_bal &&
            Enumerable.from(rcmail.env.all_mailboxes).any(
              (x) =>
                x.key.split('.-.')[1].toLowerCase() ===
                current_bal.toLowerCase(),
            ))
        )
          $('.ct-cm').css('display', '');
        else $('.ct-cm').css('display', 'none');

        $('.ct-tb')
          .on('mouseover', (e) => {
            let source = [];

            for (const key in rcmail.env.labels_translate) {
              if (
                Object.hasOwnProperty.call(rcmail.env.labels_translate, key)
              ) {
                const element = rcmail.env.labels_translate[key];
                const haveLabel = Enumerable.from(
                  menu.selected_object.classList,
                )
                  .toArray()
                  .includes('label_' + key);

                source.push({
                  label: element,
                  command: haveLabel ? 'remove_label' : 'add_label',
                  props: { label: key, message: menu.selected_object },
                  classes:
                    (haveLabel ? 'selected' : '') +
                    ' label ' +
                    key +
                    ' label_' +
                    key,
                });
              }
            }

            var a = rcmail.contextmenu.init({
              menu_name: 'labellist',
              menu_source: source,
            });

            a.show_menu($('.ct-tb'), e);
            menu.labels_submenu = a;
          })
          .on('mouseout', (e) => {
            let target = $(e.relatedTarget);
            while (target[0].nodeName !== 'BODY') {
              if (target[0].id == 'rcm_labellist') return;
              target = target.parent();
            }

            menu.labels_submenu.destroy();
            delete menu.labels_submenu;
          });
      });

      menu.addEventListener('hide_menu', (p) => {
        $('.ct-tb').off('mouseover').off('mouseout');
      });

      // make sure this new shortcut is always active
      menu.addEventListener('activate', function (p) {
        console.log('p', p);
        switch (p.command) {
          case 'move':
            $(p.el).attr('aria-disabled', 'false').parent().css('display', '');
          case 'gestion_labels':
            return true;
          default:
            break;
        }
      });
    } else if (menu.menu_name == 'labellist') {
      menu.addEventListener('beforeactivate', (p) => {
        rcm_tb_label_init_onclick($('#rcm_labellist li a'), () => {
          menu.triggerEvent('hide_menu');
          menu.destroy();
        });
        $('#rcm_labellist').on('mouseout', (e) => {
          let target = $(e.relatedTarget);
          while (target[0].nodeName !== 'BODY') {
            if (target[0].id == 'rcm_labellist' || target.hasClass('ct-tb'))
              return;
            target = target.parent();
          }

          menu.destroy();
        });
      });

      menu.addEventListener('hide_menu', (p) => {
        $('#rcm_labellist').off('mouseout');
      });
    }
  });

  function resize_mail() {
    if (
      rcmail.env.task === 'mail' &&
      (rcmail.env.action === '' || rcmail.env.action === 'index')
    ) {
      if (
        $('#layout-content .header ul#toolbar-menu li.hidden-item-mt').length >
        0
      ) {
        $(
          '#layout-content .header ul#toolbar-menu li.hidden-item-mt',
        ).removeClass('hidden-item-mt');
        $('#message-menu > ul.menu .moved-item-mt').remove();
      }

      if (
        $('#layout-content .header')[0].scrollWidth >
        $('#layout-content').width()
      ) {
        let array = $('#layout-content .header ul#toolbar-menu li');
        let it = array.length;

        while (
          $('#layout-content .header ul#toolbar-menu')[0].scrollWidth >
          $('#layout-content').width()
        ) {
          --it;

          if (it <= 3) break;
          else if ($(array[it]).find('.tb_noclass').length > 0) {
            //tb_label_popuplink
            var tmp = $(array[it]).clone().addClass('moved-item-mt');
            tmp.find('a').each((i, e) => {
              e.id = `${e.id}-${i}`;
              $(e).on('click', () => {
                $('#tb_label_popuplink').click();
              });
            });
            $('#message-menu > ul.menu').prepend(tmp);
            $(array[it]).addClass('hidden-item-mt');
          } else if (
            $(array[it]).css('display') === 'none' ||
            $(array[it]).find('a').hasClass('more') ||
            $(array[it]).find('a').attr('aria-haspopup') == 'true' ||
            $(array[it]).find('a').length > 1
          )
            //aria-haspopup
            continue;
          else {
            var tmp = $(array[it]).clone().addClass('moved-item-mt');
            tmp.find('a').each((i, e) => {
              e.id = `${e.id}-${i}`;
              $(e).addClass('moved-item-mt');
            });
            $('#message-menu > ul.menu').prepend(tmp);
            $(array[it]).addClass('hidden-item-mt');
          }
        }
      }
    }
  }

  $(document).ready(async () => {
    if (
      rcmail.env.task === 'mail' &&
      (rcmail.env.action === '' || rcmail.env.action === 'index')
    ) {
      new ResizeObserver(resize_mail).observe($('#layout-content')[0]);
      resize_mail();

      //Gère les différents cas de phishing
      rcmail.addEventListener('insertrow', function (event) {
        if (event.row.flags.BLOQUED === true) {
          $(event.row.obj)
            .addClass('bloqued')
            .attr(
              'title',
              "Ce message est bloqué sur le Bnum car il s'agit de phishing !",
            );
        } else if (event.row.flags.SUSPECT === true) {
          $(event.row.obj)
            .addClass('suspect')
            .attr(
              'title',
              'Ce message est suspect et peut possiblement être du phishing !',
            );
        }
      });
    }
  });

  if (parent === window) {
    switch (rcmail.env.task) {
      case 'workspace':
        rcmail.addEventListener('elastic.UI.screen_mode.tests', (datas) => {
          if ($('html').hasClass('webconf-started')) {
            for (const key in datas.tests) {
              if (Object.hasOwnProperty.call(datas.tests, key)) {
                datas.tests[key] += 324;
              }
            }
          } else if ($('html').hasClass('ariane-started')) {
            for (const key in datas.tests) {
              if (Object.hasOwnProperty.call(datas.tests, key)) {
                datas.tests[key] += datas.tests[key] * (25 / 100);
              }
            }
          }

          return datas.tests;
        });

        rcmail.addEventListener(
          'elastic.UI.screen_mode.customSize',
          (datas) => {
            const size = $('html').hasClass('webconf-started')
              ? 597 + 324
              : $('html').hasClass('ariane-started')
                ? 597 + 597 * (25 / 100)
                : 597;
            if (datas.tests.phone <= datas.width && datas.width <= size)
              $('html').addClass('layout-ultra-small');
            else if ($('html').hasClass('layout-ultra-small'))
              $('html').removeClass('layout-ultra-small');
          },
        );
        break;

      default:
        break;
    }
  }
}

//Gestion des liens internes
$(document).ready(() => {
  if (rcmail.env._courielleur) return;

  /**
   * Liste des exceptions
   */
  const plugins = {
    /**
     * Tâche lié au stockage
     */
    drive: 'stockage',
    /**
     * Tâche lié à la discussion instantanée
     */
    chat: 'discussion',
    /**
     * Tâche lié au sondage
     */
    sondage: 'sondage',
    /**
     * Tâche lié au Trello
     */
    kanban: 'kanban',
    /**
     * Tâche lié à la visioconférence
     */
    webconf: 'webconf',
  };

  /**
   * Gère les interceptions de liens pour les exceptions de liens.
   * @param {string} top_selector Selecteur lié à la tâche choisie
   * @param {string} sub_frame_selector Selecteur de la frame qui contient le module externe
   * @param {string} url Nouveau lien
   * @returns Si vrai, une frame existe déjà
   */
  function intercept_exceptions(top_selector, sub_frame_selector, url) {
    let retour = true;
    let $iframe_querry = top.$(`iframe${top_selector}`);
    let $top_querry = top.$(top_selector);

    if ($iframe_querry.length > 0)
      $iframe_querry[0].contentWindow.$(sub_frame_selector)[0].src = url;
    else if ($top_querry > 0) top.$(sub_frame_selector)[0].src = url;
    else retour = false;

    return retour;
  }

  async function intercept_click(event) {
    var Enumerable = Enumerable || top.Enumerable;

    try {
      let $target = $(event.currentTarget ?? event.target);
      //Vérification si on intercetpe le lien ou non
      const intercept = $target.data('spied');

      if (
        intercept !== undefined &&
        intercept !== null &&
        (intercept == 'false' || intercept === false)
      )
        return;
      else if ($target.attr('href').includes('mailto:'))
        return intercept_mailto(event);
      else if (
        $target.attr('onclick') !== undefined &&
        !$target.attr('onclick').includes('event.click')
      )
        return;
      else if (
        !!Enumerable &&
        !!$target.parent()[0] &&
        Enumerable.from($target.parent()[0].classList).any((x) =>
          x.includes('listitem'),
        )
      )
        return;
      else if ($target.parent().parent().parent().attr('id') === 'taskmenu')
        return;
      //else if ($target.attr('target') === '_blank') return;

      //On ferme la modal
      $('#globalModal').modal('hide');

      /**
       * @constant
       * @type {JSON|Enumerator} Liste des exceptions
       */
      const spies =
        rcmail.env.enumerated_url_spies !== true
          ? Enumerable.from(rcmail.env.urls_spies)
          : rcmail.env.urls_spies;
      /**
       * @constant
       * @type {string} Adresse du lien
       */
      const url = $target.attr('href');

      //Changement des liens en enumerable (optimisation)
      if (rcmail.env.enumerated_url_spies !== true) {
        rcmail.env.urls_spies = spies;
        rcmail.env.enumerated_url_spies = true;
      }

      if (url !== undefined && url !== null) {
        //Initialisation
        let $querry;
        let reloop;

        let task = null;
        let action = null;
        let othersParams = null;
        let after = null;
        let update = false;

        let _switch = (spies || Enumerable.from([])).firstOrDefault(
          (x) => url.includes(x.key),
          null,
        );

        do {
          reloop = false;
          switch (_switch === null ? null : _switch.value) {
            case plugins.webconf:
              const key = url.replace(_switch.key, '').replaceAll('/', '');

              top.webconf_helper.go(key, null, '@home');

              if (after !== null) after();

              event.preventDefault();
              break;
            case plugins.drive:
              const stockage_url =
                _switch.url !== undefined
                  ? decodeURIComponent(_switch.url)
                  : decodeURIComponent(url);
              task = 'stockage';

              if (stockage_url.includes('/s/')) return;

              if (
                !intercept_exceptions(
                  '.stockage-frame',
                  '#mel_nextcloud_frame',
                  stockage_url,
                )
              )
                othersParams = {
                  _params: stockage_url.replace(_switch.key, ''),
                };

              break;
            case plugins.chat:
              $querry = top.$('iframe.discussion-frame');
              task = 'discussion';

              if ($querry.length > 0) {
                $querry[0].contentWindow.postMessage(
                  {
                    externalCommand: 'go',
                    path: url.replace(_switch.key, ''),
                  },
                  rcmail.env.rocket_chat_url,
                );
              } else {
                after = () => {
                  top.$('iframe.discussion-frame')[0].src = url;
                };
              }

              break;
            case plugins.sondage:
              task = 'sondage';

              if (
                !intercept_exceptions(
                  '.sondage-frame',
                  '#mel_sondage_frame',
                  url,
                )
              )
                othersParams = { _url: url };

              break;
            case plugins.kanban:
              task = 'wekan';

              if (!intercept_exceptions('.wekan-frame', '#wekan-iframe', url))
                othersParams = { _url: url };

              break;

            default:
              if (url.includes('/?_task=')) {
                update = true;
                task = url.split('/?_task=', 2)[1].split('&')[0];

                if (['ariane', 'discussion', 'chat'].includes(task)) {
                  _switch = spies.firstOrDefault(
                    (x) => x.value == plugins.chat,
                    null,
                  );

                  if (_switch !== null) {
                    reloop = true;
                    break;
                  }
                }

                othersParams = {};

                try {
                  let tmp_othersParams = url.split('/?_task=', 2)[1];

                  if (tmp_othersParams.includes('&')) {
                    othersParams = Enumerable.from(tmp_othersParams.split('&'))
                      .where((x) => x.includes('='))
                      .toJsonDictionnary(
                        (x) => x.split('=')[0],
                        (x) => x.split('=')[1],
                      );

                    if (
                      task === 'stockage' &&
                      othersParams['_params'] !== undefined
                    ) {
                      _switch = spies.firstOrDefault(
                        (x) => x.value == plugins.drive,
                        null,
                      );

                      if (_switch !== null) {
                        action = null;
                        _switch.url = _switch.key + othersParams['_params'];
                        reloop = true;
                        break;
                      }
                    }
                  }
                } catch (error) {}
              } else if (url.includes('/public/webconf')) {
                var IntegratedPubliWebconfLink =
                  IntegratedPubliWebconfLink || top.IntegratedPubliWebconfLink;

                const link = new IntegratedPubliWebconfLink(url);

                top.webconf_helper.go(link.key, link.wsp, link.ariane);

                if (after !== null) after();

                event.preventDefault();
              } else if (spies) {
                for (const iterator of spies) {
                  if (url.includes(iterator.key)) {
                    _switch = iterator;
                    reloop = true;
                    break;
                  }
                }
              }

              if (!url.includes('/?_task=') && !/^data:/i.test(url)) {
                //On ouvre une modal pour prévenir d'un lien externe
                let domain = new URL(url).hostname;
                let open_modal = true;
                let suspect_url = false;

                rcmail.env.mel_suspect_url.forEach((item) => {
                  if (url.includes(item) && !suspect_url) {
                    suspect_url = true;
                  }
                });
                if (suspect_url) {
                  event.preventDefault();
                  top.external_link_modal(url, suspect_url);
                  return;
                }

                rcmail.env.mel_official_domain.forEach((item) => {
                  if (domain.endsWith(item)) {
                    open_modal = false;
                  }
                });
                if (open_modal) {
                  event.preventDefault();
                  top.external_link_modal(url);
                }
              }
              break;
          }
        } while (reloop);

        if (task !== null) {
          // top.mel_metapage.Functions.change_page(
          //   task,
          //   action,
          //   othersParams === null ? {} : othersParams,
          //   update,
          // ).then(() => {
          //   if (after !== null) after();
          // });
          const { FramesManager } = await loadJsModule(
            'mel_metapage',
            'frame_manager',
            '/js/lib/classes/',
          );

          if (!!action && !othersParams?._action) {
            othersParams ??= {};
            othersParams._action = action;
          }

          await FramesManager.Instance.switch_frame(task, {
            args: othersParams,
          });

          if (after !== null) after();

          rcmail.triggerEvent('intercept.click.ok', {
            task,
            action,
            othersParams,
            update,
          });
          event.preventDefault();
        }
      }
    } catch (error) {
      //console.error("###[DEBUG][ONCLICK]", error);
    }
  }

  function intercept_mailto(event) {
    const onclick = $(event.currentTarget).attr('onclick');
    if (onclick) return;

    event.preventDefault();
    rcmail.triggerEvent('intercept.click.ok', { event });
    const url = $(event.target).attr('href').replace('mailto:', '');
    if (url == rcmail.env.email) rcmail.open_compose_step({});
    else rcmail.open_compose_step({ to: url });
  }

  $(document).on('click', 'a', (event) => {
    intercept_click(event);
  });

  rcmail.addEventListener('event.click', (params) => {
    intercept_click(params.e === undefined ? params.obj : params.e);
  });
});

function sendMessageToAriane(data) {
  if (top !== window) return top.sendMessageToAriane(data);

  let iframe = $('iframe.discussion-frame');

  if (iframe.length > 0) {
    iframe[0].contentWindow.postMessage(data, '*');
  }
}

(() => {
  const chat_urls_origin = [
    'https://ariane.preprod.m2.e2.rie.gouv.fr',
    'https://ariane.din.developpement-durable.gouv.fr',
    'https://mel.din.developpement-durable.gouv.fr',
    'https://rcube.preprod.m2.e2.rie.gouv.fr',
  ];

  const pegaze_url =
    rcmail.env.sondage_url ||
    parent.rcmail.env.sondage_url ||
    top.rcmail.env.sondage_url;

  const suggestionUrl = 'suggestionUrl'; //type/value
  const suggestionId = 'suggestionId';

  window.addEventListener('message', receiveMessage, false);
  function receiveMessage(event) {
    //Evènement venant d'une visio
    if (event.origin.includes(rcmail.env['webconf.base_url'])) {
      const datas_accepted = 'feedbackSubmitted';
      let $querry = $('.webconf-frame');

      if (event.data === datas_accepted && $querry.length > 0) {
        $querry.remove();
        mel_metapage.Frames.back();
      }
    } else if (chat_urls_origin.includes(event.origin)) {
      //Evènement venant du chat
      const datas_accepted = 'isBNumEmbedded';
      const datas_url_accepted = 'taskLink';
      if (event.data === datas_accepted) {
        //Rocketchat
        sendMessageToAriane({
          bNumEmbedded: true,
          isDarkTheme: new Roundcube_Mel_Color().isDarkMode(),
        });
      } else if (event.data[datas_url_accepted]) {
        //Url au clique
        let link = event.data[datas_url_accepted];

        if (link.includes(pegaze_url))
          link = mel_metapage.Functions.url('sondage', null, { _url: link });

        $('<a>')
          .attr('href', link)
          .click((e) => rcmail.triggerEvent('event.click', { e }))
          .click()
          .remove();
      }

      if (event.data && event.data.webconfRoom) {
        window.webconf_helper.go(
          (key = event.data.webconfRoom),
          (wsp = null),
          (ariane = event.data.arianeRoom),
        );
      }
    } else if (
      rcmail.env.task === 'settings' &&
      rcmail.env.action === 'plugin.mel_suggestion_box' &&
      window.location.origin.includes(event.origin)
    ) {
      const datas_accepted = 'suggestion.app.url';
      if (event.data === datas_accepted) {
        $('#settings-suggest-frame')[0].contentWindow.postMessage(
          {
            type: suggestionUrl,
            value: mel_metapage.Functions.url(
              'settings',
              'plugin.mel_suggestion_box',
              { _uid: suggestionId },
            ).replace('&_is_from=iframe', ''),
          },
          '*',
        );
      }
    }
  }
})();
