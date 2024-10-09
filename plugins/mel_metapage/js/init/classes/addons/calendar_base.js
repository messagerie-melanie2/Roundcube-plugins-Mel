$(document).ready(() => {
  const plugin_text = 'mel_metapage';
  const newline = String.fromCharCode('8199');

  if (window.rcube_calendar_ui === undefined)
    window.rcube_calendar_ui = () => {};

  /**
   * Sauvegarde l'évènement
   * @returns {boolean} Faux si il y a des champs invalides
   */
  rcube_calendar_ui.save = async function () {
    let canContinue = true;

    //Si l'évènement n'a pas de titre
    if ($('#edit-title').val() === '') {
      //On se met sur le bon onglet, on focus le champs, puis on affiche le texte d'erreur.
      $('li > a[href="#event-panel-summary"]').click();
      canContinue = false;
      $('#edit-title').focus();
      if ($('#edit-title').parent().find('.required-text').length > 0)
        $('#edit-title').parent().find('.required-text').css('display', '');
      else
        $('#edit-title')
          .parent()
          .append(
            `<span class="required-text" style="color:red;display:block">*${rcmail.gettext('title_needed', plugin_text)}</span>`,
          );
    }
    //Sinon, ok
    else {
      //Suppression du message d'erreur
      if (
        $('#wsp-event-all-cal-mm').val() !== '#none' &&
        $('#wsp-event-all-cal-mm').val() !== ''
      )
        $('.have-workspace').css('display', '');
      else $('.have-workspace').css('display', 'none');

      if ($('#edit-title').parent().find('.required-text').length > 0)
        $('#edit-title').parent().find('.required-text').remove();
    }

    //Si il n'y a pas d'erreurs
    if (canContinue) {
      //On sauvegarde l'évènement
      let querry = $('#eventedit')
        .parent()
        .parent()
        .find('.ui-dialog-buttonset')
        .find('.save.mainaction');

      if (querry.length > 0) querry.click();
      else {
        rcmail.command('event-save');
        mel_metapage.Functions.call('update_cal', false, {
          _integrated: true,
          eval: 'always',
          args: {
            refresh: true,
            child: true,
            goToTop: true,
          },
        });
      }

      EventUserNotified.Dispose();

      return true;
    }
    //Si erreur(s)
    else return false;
  };

  window.rcube_calendar_ui._beforeSave = (event) => {
    if (event._notify === undefined || event._notify === null) {
      let checked = false;
      $('#edit-attendees-table')
        .find('input.edit-attendee-reply')
        .each((i, e) => {
          if (!checked && e.checked === true) checked = true;
        });

      if (checked) event._notify = 1;
    }

    return event;
  };

  /**
   * Affiche la modale d'édition d'un évènement
   * @param {JSON} event Event plugin calendar
   */
  window.rcube_calendar_ui.edit = async function (event, dialog) {
    const loader =
      window.loadJsModule ?? parent.loadJsModule ?? top.loadJsModule;

    const { CalendarEvent } = await loader(
      'mel_metapage',
      'edit_event',
      '/js/lib/calendar/event/',
    );

    return CalendarEvent.Start(event, dialog);
  };

  rcmail.addEventListener('calendar-event-dialog', ({ dialog }) => {
    const event = cal.selected_event;

    window.rcube_calendar_ui.edit(event, dialog);
  });

  rcmail.addEventListener('dialog-attendees-save', (datetimes) => {
    const getDate = function (string) {
      string = string.split(' ');
      const date = string[0].split('/');
      const time = string[1].split(':');

      return new moment(
        `${date[2]}-${date[1]}-${date[0]}T${time[0]}:${time[1]}:00`,
      );
    };
    const format = 'DD/MM/YYYY HH:mm';
    $('.input-mel-datetime .input-mel.start').val(
      getDate(`${datetimes.start.date} ${datetimes.start.time}`).format(format),
    );
    $('.input-mel-datetime .input-mel.end').val(
      getDate(`${datetimes.end.date} ${datetimes.end.time}`).format(format),
    );
  });

  rcmail.addEventListener('init', () => {
    window?.m_mp_action_from_storage?.(
      'calendar_redirect',
      SearchResultCalendar.after_loading,
      true,
      '¤avoid',
    );
    rcmail.register_command(
      'calendar-workspace-add-all',
      () => {
        mel_metapage.Functions.busy();
        mel_metapage.Functions.post(
          mel_metapage.Functions.url('workspace', 'get_email_from_ws'),
          {
            _uid: $('#mel-event-category').val().replace('ws#', ''),
          },
          (datas) => {
            datas = JSON.parse(datas);
            let str = '';
            for (let index = 0; index < datas.length; ++index) {
              const element = datas[index];
              str += `${element},`;
            }
            $('#attendee-input').val(str).change();
          },
        ).always(() => {
          mel_metapage.Functions.busy(false);
        });
      },
      true,
    );

    rcmail.register_command(
      'calendar-mail-add-all',
      () => {
        for (const key in rcmail.env['event_prop.mails']) {
          if (Object.hasOwnProperty.call(rcmail.env['event_prop.mails'], key)) {
            const element = rcmail.env['event_prop.mails'][key]?.split?.(',');

            if (element) {
              $('#edit-attendee-name').val(element);
              $('#edit-attendee-add').click();
            }
          }
        }
      },
      true,
    );

    try {
      $(
        '.task-calendar #layout #layout-content > .header #calendartoolbar a.button',
      ).each((i, e) => {
        if ($(e).data('hidden') == 'small') return;

        let li = $('<li></li>');
        $(e).clone().appendTo(li);
        li.appendTo($('#toolbar-menu-mel ul'));
        //console.log("e", $(e).css("display"),e);
      });
    } catch (error) {}

    $('#mel-button-small-search').click(() => {
      let querry = $('#mel-small-search');

      if (querry.css('display') === 'none') querry.css('display', '');
      else querry.css('display', 'none');
    });

    $('#mel-small-search input').on('change', () => {
      $('#searchform')
        .val($('#mel-small-search input').val())
        .parent()
        .submit();
    });

    $('#mel-small-search button').click(() => {
      $('.toolbar-calendar .button.reset').click();
      $('#mel-small-search input').val('');
      $('#mel-button-small-search').click();
    });

    $('#searchform')
      .parent()
      .on('submit', () => {
        $('#calendarOptionSelect').val('ootd');
      });
  });

  if (!window.rcube_calendar) return;
  try {
    if (!rcube_calendar) return;
  } catch (error) {
    return;
  }

  rcube_calendar.prototype.create_event_from_somewhere = async function (
    event = null,
  ) {
    let isFromGlobalModal = false;

    if (event === null) {
      event = rcmail.local_storage_get_item('tmp_calendar_event');

      if (event) isFromGlobalModal = true;
    }

    if (window.create_event !== true) window.create_event = true;
    else {
      $('#mel-have-something-minified-main-create').remove();
      window.event_reduced = false;
      window.kolab_event_dialog_element.show();
      return;
    }

    var url = {
      _category:
        event === null ||
        event.categories === undefined ||
        event.categories === null ||
        event.categories.length === 0
          ? null
          : event.categories[0],
      _framed: true,
      _calendar_blocked: event != null && event.calendar_blocked === true,
      _startDate:
        event == null || event.start === undefined
          ? null
          : moment(event.start).format('YYYY-MM-DDTHH:mm'),
      _endDate:
        event == null || event.end === undefined
          ? null
          : moment(event.end).format('YYYY-MM-DDTHH:mm'),
    };

    if (event.mail_datas) {
      url['_mbox'] = event.mail_datas.mbox;
      url['_uid'] = event.mail_datas.uid;
    }

    var buttons = {},
      button_classes = ['mainaction save', 'cancel'],
      title = rcmail.gettext('mel_metapage.new_event'),
      dialog = $('<iframe>')
        .attr({
          id: 'kolabcalendarinlinegui',
          name: 'kolabcalendardialog',
          src: rcmail.url('mel_metapage/dialog-ui', url),
        })
        .css('width', '100%')
        .css('height', '100%');

    rcmail.lock_frame(dialog);

    let hasglobalmodal = true;

    try {
      hasglobalmodal = !!GlobalModal;
    } catch (error) {
      hasglobalmodal = false;
    }

    if (!hasglobalmodal) {
      buttons = [
        {
          text: 'Annuler',
          class:
            'mel-button no-button-margin no-margin-button btn btn-danger cancel-button',
          click: () => {
            $popup.dialog('close');
          },
        },
        {
          text: 'Sauvegarder',
          class: 'mel-button no-button-margin no-margin-button btn save-button',
          click: async () => {
            window.event_saved = true;
            $popup
              .parent()
              .find('.save-button, .cancel-button')
              .addClass('disabled')
              .attr('disabled', 'disabled');
            const saved = await $popup
              .find('iframe')[0]
              .contentWindow.rcube_calendar_ui.save();
            if (!saved) {
              $popup
                .parent()
                .find('.save-button, .cancel-button')
                .removeClass('disabled')
                .removeAttr('disabled');
            } else {
              window.kolab_event_dialog_element = undefined;
              $popup.dialog('close');
            }
          },
        },
      ];
      let $popup = rcmail.show_popup_dialog(
        dialog[0],
        rcmail.gettext('create_event', plugin_text),
        buttons,
        {
          position: { my: 'top', at: 'top' },
          width: 740,
        },
      );

      $popup
        .css('height', 'calc(100% - 125px)')
        .parent()
        .css('height', 'calc(100%)')
        .find('.save-button')
        .css({
          display: 'flex',
          'align-items': 'center',
        })
        .append(
          $('<span>')
            .addClass('plus material-symbols-outlined')
            .text('arrow_right_alt'),
        );

      $popup
        .parent()
        .find('.cancel-button')
        .css({
          display: 'flex',
          'align-items': 'center',
        })
        .append(
          $('<span>').addClass('plus material-symbols-outlined').text('cancel'),
        );

      window.kolab_event_dialog_element = dialog = $popup;

      return false;
    }

    if (!$('#globalModal .modal-close-footer').length)
      await GlobalModal.resetModal();

    const config = new GlobalModalConfig(
      rcmail.gettext('create_event', plugin_text),
      'default',
      dialog,
      null,
    );
    window.kolab_event_dialog_element = dialog = new GlobalModal(
      'globalModal',
      config,
      true,
    );
    kolab_event_dialog_element.footer.buttons.save
      .removeClass('disabled')
      .removeAttr('disabled');

    kolab_event_dialog_element.footer.buttons.save
      .click(async () => {
        window.event_saved = true;
        kolab_event_dialog_element.footer.buttons.save
          .addClass('disabled')
          .attr('disabled', 'disabled');
        const saved = await kolab_event_dialog_element.modal
          .find('iframe')[0]
          .contentWindow.rcube_calendar_ui.save();
        if (!saved) {
          kolab_event_dialog_element.footer.buttons.save
            .removeClass('disabled')
            .removeAttr('disabled');
        }
      })
      .removeClass('btn-primary')
      .addClass('btn-secondary mel-button');

    kolab_event_dialog_element.footer.buttons.exit.click(() => {
      window.event_saved = true;
    });
    //.append(`<span class="plus icon-mel-arrow-right"></span>`);

    if (
      kolab_event_dialog_element.footer.buttons.save.find('.plus').length === 0
    )
      kolab_event_dialog_element.footer.buttons.save.append(
        '<span class="plus icon-mel-arrow-right"></span>',
      );

    kolab_event_dialog_element.footer.buttons.exit
      .addClass('mel-button')
      .addClass('btn-danger')
      .addClass('mel-before-remover')
      .removeClass('btn-secondary');
    //.append(`<span class="plus icon-mel-close"></span>`);
    if (
      kolab_event_dialog_element.footer.buttons.exit.find('.plus').length === 0
    )
      kolab_event_dialog_element.footer.buttons.exit.append(
        '<span class="plus icon-mel-close"></span>',
      );

    // ${event.from === "barup" ? '' : ""}
    if (event.from === 'barup') {
      $('#mel-have-something-minified-main-create').remove();
      const func_minifier = () => {
        if (
          $('#mel-have-something-minified-main-create').length === 0 &&
          $('#globallist').length === 0
        ) {
          let $qu = $('#button-create').append(`
                    <span id="mel-have-something-minified-main-create" class="badge badge-pill badge-primary" style="position: absolute;
                    top: -5px;
                    right: -5px;">•</span>
                    `);

          if ($qu.css('position') !== 'relative')
            $qu.css('position', 'relative');
        }
      };
      // create_popUp.close();
      //window.event_reduced = true;
      window.kolab_event_dialog_element.setBeforeTitle(
        `<a href=# title="${rcmail.gettext('back')}" class="icon-mel-undo mel-return mel-focus focus-text mel-not-link" onclick="delete window.event_saved;delete window.create_event;m_mp_reinitialize_popup(() => {$('iframe#kolabcalendarinlinegui').remove();window.kolab_event_dialog_element.removeBeforeTitle();})"><span class=sr-only>${rcmail.gettext('create_modal_back', plugin_text)}</span></a>`,
      );
      window.kolab_event_dialog_element.haveReduced().on_click_minified =
        () => {
          window.event_reduced = true;
          window.kolab_event_dialog_element.close();
          func_minifier();
          if (isFromGlobalModal) $('#button-create').focus();
        };
      window.kolab_event_dialog_element.on_click_exit = () => {
        window.kolab_event_dialog_element.close();
        window.event_reduced = false;
        window.event_saved = false;
        window.create_event = false;
        window.event_reduced = false;
        window.kolab_event_dialog_element = null;

        if (isFromGlobalModal) $('#button-create').focus();
      };
      window.kolab_event_dialog_element.onClose(() => {
        if (window.event_reduced === false) {
          window.event_saved = false;
          window.create_event = false;
          window.kolab_event_dialog_element?.editBody?.('');
          window.kolab_event_dialog_element = null;
          $('#mel-have-something-minified-main-create').remove();
        } else {
          window.event_reduced = true;
          func_minifier();
        }

        if (isFromGlobalModal) $('#button-create').focus();
      });
    } else
      window.kolab_event_dialog_element.onClose(() => {
        if (window.event_saved === true) {
          delete window.event_saved;
          delete window.create_event;
        }
      });

    window.kolab_event_dialog_element.autoHeight();
    window.kolab_event_dialog_element.onDestroy((globalModal) => {
      globalModal.contents.find('iframe').remove();
    });
  };

  if (window.cal) {
    cal.create_event_from_somewhere =
      rcube_calendar.prototype.create_event_from_somewhere;
  }

  rcube_calendar.change_calendar_date = async function (
    jquery_element,
    add,
    where = null,
  ) {
    if (rcmail.busy) return;

    const config = {
      add_day_navigation: false,
      add_create: false,
      add_see_all: false,
    };

    rcmail.set_busy(true, 'loading');
    let date = moment(jquery_element.data('current-date'));

    if (date === null || date === undefined || date === '') date = moment();

    date = date.add(add, 'd').startOf('day');
    rcube_calendar.mel_metapage_misc.SetCalendarDate(jquery_element, date);

    //const storage = mel_metapage.Storage.get(mel_metapage.Storage.calendar_by_days);

    const array = await rcube_calendar.block_change_date(
      jquery_element,
      add,
      where,
      date,
    );

    if (array !== false) {
      const html = await html_helper.Calendars({
        datas: array,
        config: config,
        _date: date,
        get_only_body: true,
      });
      rcube_calendar.mel_metapage_misc.GetAgenda(jquery_element).html(html);
      jquery_element.data('current-date', date.format());

      if (html_helper.Calendars.$jquery_array) {
        const $jquery_array = html_helper.Calendars.$jquery_array;

        html_helper.Calendars.$jquery_array = undefined;

        let $ul = rcube_calendar.mel_metapage_misc
          .GetAgenda(jquery_element)
          .find('ul');

        if ($ul.length === 0)
          $ul = rcube_calendar.mel_metapage_misc.GetAgenda(jquery_element);

        $ul.html($jquery_array);
      }
    }

    rcmail.set_busy(false);
    rcmail.clear_messages();
  };

  rcube_calendar.block_change_date = async function (
    jquery_element,
    add,
    where = null,
    _date = null,
  ) {
    //const SetCalendarDate = rcube_calendar.mel_metapage_misc.SetCalendarDate;
    const GetAgenda = rcube_calendar.mel_metapage_misc.GetAgenda;
    const check = (x, item) => {
      x.uid === item.uid;
    };
    //  const before = "ws#";
    //  const uid = rcmail.env.current_workspace_uid;
    //  const id = before + uid;
    const date =
      _date === null
        ? moment(jquery_element.data('current-date'))
            .add(add, 'd')
            .startOf('day')
        : _date;
    //SetCalendarDate(jquery_element, date);
    if (jquery_element !== null)
      var querry = GetAgenda(jquery_element).html(
        '<center><span class="spinner-border"></span></center>',
      );

    const datas = await mel_metapage.Functions.update_calendar(
      date,
      moment(date).endOf('day'),
    );

    let events =
      where === null || where === undefined
        ? JSON.parse(datas)
        : Enumerable.from(JSON.parse(datas)).where(where).toArray();
    //console.log("change_calendar_date",events, JSON.parse(datas));
    if (events !== null || events.length !== 0) {
      let element;
      let tmp;
      let array = [];
      let elementsToDelete = [];

      const parse = cal && cal.parseISO8601 ? cal.parseISO8601 : (item) => item;

      for (let index = 0; index < events.length; index++) {
        element = events[index];
        if (element.allDay) element.order = 0;
        else element.order = 1;
        tmp = mel_metapage.Functions.check_if_calendar_valid(
          element,
          events,
          false,
        );
        if (tmp === true) {
          const s = moment(element.start);
          const e = moment(element.end);
          const tmp_bool =
            (element.recurrence !== undefined || element.recurrence !== null) &&
            s < date &&
            e < date &&
            element._instance === undefined;

          if (tmp_bool) tmp = element;
          else if (e < date || s.startOf('day') > date.startOf('day'))
            tmp = element;
          else if (element.allDay) {
            element.end = moment(parse(element.end)).startOf('day');
            if (
              element.end.format('YYYY-MM-DD HH:mm:ss') ==
                date.format('YYYY-MM-DD HH:mm:ss') &&
              moment(element.start)
                .startOf('day')
                .format('YYYY-MM-DD HH:mm:ss') !=
                element.end.format('YYYY-MM-DD HH:mm:ss')
            )
              tmp = element;
            else element.end = element.end.format();
          }
        }

        if (tmp === true) array = Array.AddIfExist(array, check, element);
        else if (tmp !== false) elementsToDelete.push(tmp);
      }
      //console.log(array);
      events = Enumerable.from(array)
        .where((x) => !elementsToDelete.includes(x))
        .orderBy((x) => x.order)
        .thenBy((x) => moment(x.start))
        .toArray();
      //setup_calendar(array, querry, date);
    }

    if (events === null || events.length === 0) {
      let _html;
      if (date === moment().startOf('day'))
        _html = rcmail.gettext('no_events_today', plugin_text);
      else _html = rcmail.gettext('no_events_this_day', plugin_text);
      if (jquery_element !== null) {
        querry.html(_html);
        return false;
      } else return _html;
    } else return events;
  };

  rcube_calendar.mel_metapage_misc = {
    SetCalendarDate: function (jquery_element, date = null) {
      const now = date === null ? moment() : date;
      jquery_element
        .html(rcube_calendar.mel_metapage_misc.GetDate(now))
        .data('current-date', now);
    },
    GetParent: function (jquery_element) {
      return rcube_calendar.mel_metapage_misc
        .GetAgenda(jquery_element)
        .parent();
    },
    GetAgenda: function (jquery_element) {
      return jquery_element.parent().parent().parent().find('.block-body');
    },
    GetDate: function (momentObject) {
      return rcube_calendar.mel_metapage_misc.GetDateFr(
        momentObject.format('dddd DD MMMM'),
      );
    },
    GetDateFr: function (date) {
      const capitalize = (s) => {
        if (typeof s !== 'string') return '';
        s = s.toLowerCase();
        return s.charAt(0).toUpperCase() + s.slice(1);
      };
      const arrayTransform = {
        MONDAY: 'LUNDI',
        TUESDAY: 'MARDI',
        WEDNESDAY: 'MERCREDI',
        THURSDAY: 'JEUDI',
        FRIDAY: 'VENDREDI',
        SATURDAY: 'SAMEDI',
        SUNDAY: 'DIMANCHE',
        JANUARY: 'JANVIER',
        FEBRUARY: 'FÉVRIER',
        MARCH: 'MARS',
        APRIL: 'AVRIL',
        MAY: 'MAI',
        JUNE: 'JUIN',
        JULY: 'JUILLET',
        AUGUST: 'AOÛT',
        SEPTEMBER: 'SEPTEMBRE',
        OCTOBER: 'OCTOBRE',
        NOVEMBER: 'NOVEMBRE',
        DECEMBER: 'DECEMBRE',
      };
      date = date.toUpperCase();
      for (const key in arrayTransform) {
        if (Object.hasOwnProperty.call(arrayTransform, key)) {
          const element = arrayTransform[key];
          if (date.includes(key)) date = date.replace(key, element);
        }
      }
      return capitalize(date);
    },
    CapitalizeMonth: function (date, monthIndex = 1) {
      const capitalize = (s) => {
        if (typeof s !== 'string') return '';
        s = s.toLowerCase();
        return s.charAt(0).toUpperCase() + s.slice(1);
      };
      return Enumerable.from(date.split(' '))
        .select((x, i) => (i === monthIndex ? capitalize(x) : x))
        .toArray()
        .join(' ');
    },
  };

  /**
   * Ouvre la fenêtre qui permet de créer un évènement.
   */
  rcube_calendar.mel_create_event = function () {
    const format = 'DD/MM/YYYY HH:mm';
    const getDate = function (string) {
      string = string.split(' ');
      const date = string[0].split('/');
      const time = string[1].split(':');

      return new moment(
        `${date[2]}-${date[1]}-${date[0]}T${time[0]}:${time[1]}:00`,
      );
    };

    var create_popUp = new GlobalModal();

    create_popUp = window.create_popUp;

    if (create_popUp === undefined) create_popUp = new GlobalModal();

    create_popUp.editTitle('Créer une réunion (étape 1/2)');
    create_popUp.editBody(
      '<center><span class=spinner-border></span></center>',
    );
    mel_metapage.Functions.get(
      mel_metapage.Functions.url('mel_metapage', 'get_event_html'),
      mel_metapage.Symbols.null,
      (datas) => {
        create_popUp.editBody(datas);
        create_popUp.contents.find('.input-mel-datetime').datetimepicker({
          format: 'd/m/Y H:i', //'Y/m/d H:i',
          onChangeDateTime: () => {
            let querry = $('.input-mel-datetime.end');
            const end_val = getDate(querry.val());
            const start_val = getDate($('.input-mel-datetime.start').val());
            if (
              end_val === '' ||
              end_val === undefined ||
              end_val === null ||
              end_val <= start_val
            )
              querry.val(
                getDate($('.input-mel-datetime.start').val())
                  .add(1, 'h')
                  .format(format),
              );
          },
        });
        create_popUp.contents
          .find('.input-mel-datetime.start')
          .val(moment().format(format));
        create_popUp.contents
          .find('.input-mel-datetime.end')
          .val(moment().add(1, 'h').format(format));
        create_popUp.contents
          .find('.input-mel-datetime.audio')
          .val(moment().add(30, 'm').format(format));
        create_popUp.contents
          .find('.form-check-input.event-mode')
          .on('click', (e) => {
            e = e.target;
            create_popUp.contents
              .find('.content.event-mode')
              .css('display', 'none');
            create_popUp.contents.find(`.${e.id}`).css('display', '');
          });
        create_popUp.contents.find('#eb-mm-all-day').on('click', (e) => {
          e = e.target;
          if (e.checked) {
            create_popUp.contents
              .find('.input-mel-datetime.start')
              .addClass('disabled')
              .attr('disabled', 'disabled');
            create_popUp.contents
              .find('.input-mel-datetime.end')
              .addClass('disabled')
              .attr('disabled', 'disabled');
            create_popUp.contents
              .find('.input-mel-datetime.start')
              .val(moment().startOf('day').format(format));
            create_popUp.contents
              .find('.input-mel-datetime.end')
              .val(moment().endOf('day').format(format));
          } else {
            create_popUp.contents
              .find('.input-mel-datetime.start')
              .removeClass('disabled')
              .removeAttr('disabled');
            create_popUp.contents
              .find('.input-mel-datetime.end')
              .removeClass('disabled')
              .removeAttr('disabled');
          }
        });
        create_popUp.footer.querry.html(`
            <div style="margin-top:0" class="mel-button invite-button create" onclick="">
                <span>Continuer</span>
                <span class="icofont-arrow-right  plus" style="margin-left: 15px;"></span>
            </div>
            `);
        create_popUp.show();
      },
    );
  };

  rcube_calendar.is_desc_webconf = function (text) {
    return (
      text.includes('@visio') ||
      rcube_calendar.is_desc_bnum_webconf(text) ||
      rcube_calendar.is_desc_frame_webconf(text)
    );
  };

  rcube_calendar.is_desc_bnum_webconf = function (text) {
    return text.includes('#visio') || text.includes('public/webconf');
  };

  rcube_calendar.is_desc_frame_webconf = function (text) {
    return text.includes(rcmail.env['webconf.base_url']);
  };

  rcube_calendar.is_valid_for_bnum_webconf = function (text) {
    return (
      rcube_calendar.is_desc_frame_webconf(text) ||
      rcube_calendar.is_desc_bnum_webconf(text)
    );
  };

  Object.defineProperty(rcube_calendar, 'newline_key', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: newline,
  });

  Object.defineProperty(rcube_calendar, 'old_newline_key', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: '{mel.newline}',
  });

  rcube_calendar.number_waiting_events = function (
    events = [],
    get_number = true,
  ) {
    const user = (top ?? window).rcmail.env.email?.toUpperCase?.();
    let numbers = get_number ? 0 : [];

    for (const key in events) {
      if (Object.hasOwnProperty.call(events, key)) {
        const element = events[key];

        if (Array.isArray(element)) {
          if (get_number)
            numbers += rcube_calendar.number_waiting_events(
              element,
              get_number,
            );
          else
            numbers = numbers.concat(
              rcube_calendar.number_waiting_events(element, get_number),
            );
        } else if (!!element?.attendees && element.attendees.length > 0) {
          if (
            Enumerable.from(element.attendees).any(
              (x) =>
                x.email.toUpperCase() === user && x.status === 'NEEDS-ACTION',
            )
          ) {
            if (get_number) ++numbers;
            else numbers.push(element);
          }
        }
      }
    }

    return numbers;
  };

  rcube_calendar.get_number_waiting_events = function (get_number = true) {
    const events_key = mel_metapage.Storage.calendar_by_days;

    if (get_number) {
      const key = mel_metapage.Storage.calendars_number_wainting;

      let number = mel_metapage.Storage.get(key);

      if (!mel_metapage.Storage.exists(number)) {
        const events = mel_metapage.Storage.get(events_key);
        number = rcube_calendar.number_waiting_events(
          mel_metapage.Storage.exists(events) ? events : [],
        );
        mel_metapage.Storage.set(number);
      }

      return number;
    } else {
      const events = mel_metapage.Storage.get(events_key);
      return rcube_calendar.number_waiting_events(
        mel_metapage.Storage.exists(events) ? events : [],
        get_number,
      );
    }
  };

  rcmail.addEventListener('calendar.not_saved', () => {
    let navigator =
      window.kolab_event_dialog_element ??
      parent.kolab_event_dialog_element ??
      top.kolab_event_dialog_element;
    if (navigator) {
      setTimeout(() => {
        navigator.footer.buttons.save
          .removeClass('disabled')
          .removeAttr('disabled');
        navigator.autoHeight();
      }, 10);
    }
  });
});
