(function () {
  $.datetimepicker.setLocale('fr');

  if (rcmail) {
    if (rcmail.env.task === 'tasks') parent.child_rcmail = rcmail;

    var refreshWorkspaceCloudNotification = function () {
      switch (rcmail.env.task) {
        case 'bureau':
          if (!!rcmail.env.bureau && !!rcmail.env.bureau.wsp_doc)
            rcmail.env.bureau.wsp_doc.update(true);
          break;

        case 'workspace':
          switch (rcmail.env.action) {
            case '':
            case 'index':
              if (!!rcmail.env.wsp_index && !!rcmail.env.wsp_index.wsp_doc)
                !!rcmail.env.wsp_index.wsp_doc.update(true);
              break;

            case 'workspace':
              if (rcmail.env.wsp_roundrive_show)
                rcmail.env.wsp_roundrive_show.checkNews();
              break;

            default:
              break;
          }
          break;

        default:
          break;
      }
    };

    $(document).ready(() => {
      if (rcmail.env.mailboxes_display === 'unified')
        $('#folderlist-content ul#mailboxlist').addClass(
          rcmail.env.mailboxes_display,
        );

      rcmail.addEventListener('init', function () {
        try {
          if (rcmail.task === 'settings')
            $('#settingstabidentities').after(
              $('#settingstabpluginmelsignatures'),
            );
        } catch (error) {}
      });
    });

    if (parent != window && rcmail.mel_metapage_fn === undefined) {
      rcmail.mel_metapage_fn = {
        refresh: () => {
          refreshWorkspaceCloudNotification();
          rcmail.triggerEvent('mel_metapage_refresh');
        },
      };
    }

    //console.log(parent, window, parent === window);
    if (parent.rcmail.mel_metapage_fn !== undefined) return;

    parent.rcmail.addEventListener('init', function () {
      $(
        `<p id="sr-document-title-focusable" tabindex="-1" class="sr-only">${window.document.title}</p>`,
      ).prependTo('body');

      //Definition des functions
      parent.rcmail.mel_metapage_fn = {
        async calendar_updated(args) {
          if (parent.rcmail.mel_metapage_fn.started) return false;
          else parent.rcmail.mel_metapage_fn.started = true;

          //const SELECTOR_CLASS_ROUND_CALENDAR = `${CONST_JQUERY_SELECTOR_CLASS}calendar`;
          const Loader = (
            await loadJsModule(
              'mel_metapage',
              'calendar_loader',
              '/js/lib/calendar/',
            )
          ).CalendarLoader.Instance;
          const loaded_datas = await Loader.update_agenda_local_datas(
            args?.force ?? 'random',
          );
          //const start_of_day = moment().startOf('day');

          // try_add_round(SELECTOR_CLASS_ROUND_CALENDAR, mel_metapage.Ids.menu.badge.calendar);
          // update_badge(Enumerable.from(loaded_datas).where(x => x.free_busy !== CONST_EVENT_DISPO_FREE && x.free_busy !== CONST_EVENT_DISPO_TELEWORK && Loader.is_date_okay(moment(x.start), moment(x.end), start_of_day)).count(), mel_metapage.Ids.menu.badge.calendar);

          parent.rcmail.mel_metapage_fn.started = false;
        },
        tasks_updated: async function () {
          const MelObject = (
            await loadJsModule('mel_metapage', 'mel_object')
          ).MelObject.Empty();
          parent.rcmail.triggerEvent(
            mel_metapage.EventListeners.tasks_updated.before,
          );
          MelObject.trigger_event(
            mel_metapage.EventListeners.tasks_updated.before,
          );

          await $.ajax({
            // fonction permettant de faire de l'ajax
            type: 'POST', // methode de transmission des données au fichier php
            url: '?_task=tasks&_action=fetch&filter=0&_remote=1&_unlock=true&_=1613118450180', //rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
            success: function (data) {
              try {
                try {
                  data = JSON.parse(data).callbacks[0][1].data;
                } catch (error) {
                  data = data.callbacks[0][1].data;
                }
                let datas_to_save = [];
                let other_datas = {};
                let other_datas_count = {};
                let element;
                let username = mceToRcId(rcmail.env.username);
                for (let index = 0; index < data.length; ++index) {
                  element = data[index];
                  // if ()
                  //     continue;
                  if (
                    element.list !== username &&
                    other_datas[element.list] === undefined
                  ) {
                    other_datas[element.list] = [];
                    other_datas_count[element.list] = 1;
                  } else if (element.list !== username)
                    ++other_datas_count[element.list];
                  if (element.complete === 0) {
                    element.mel_metapage = {
                      order:
                        element._hasdate === 1
                          ? moment(element.datetime * 1000) <= moment()
                            ? 0
                            : 1
                          : 1,
                    };
                    if (element.list !== username)
                      other_datas[element.list].push(element);
                    else datas_to_save.push(element);
                  }
                }
                datas_to_save.sort(
                  (a, b) => a.mel_metapage.order - b.mel_metapage.order,
                );
                mel_metapage.Storage.set(
                  mel_metapage.Storage.tasks,
                  datas_to_save,
                );
                mel_metapage.Storage.set(
                  mel_metapage.Storage.other_tasks,
                  other_datas,
                );
                mel_metapage.Storage.set(
                  mel_metapage.Storage.other_tasks_count,
                  other_datas_count,
                );
                try_add_round('.tasklist', mel_metapage.Ids.menu.badge.tasks);
                update_badge(
                  datas_to_save.length,
                  mel_metapage.Ids.menu.badge.tasks,
                );
                mel_metapage.Storage.set(
                  mel_metapage.Storage.last_task_update,
                  moment().startOf('day'),
                );
                parent.rcmail.triggerEvent(
                  mel_metapage.EventListeners.tasks_updated.after,
                );
                MelObject.trigger_event(
                  mel_metapage.EventListeners.tasks_updated.after,
                );
              } catch (ex) {
                console.error(ex, data);
                //rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
              }
            },
            error: function (xhr, ajaxOptions, thrownError) {
              // Add these parameters to display the required response
              console.error(xhr, ajaxOptions, thrownError);
              //rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
            },
          }).always(() => {
            // rcmail.set_busy(false);
            // rcmail.clear_messages();
          });
        },
        mail_updated: async function (isFromRefresh = false, new_count = null) {
          const MelObject = (
            await loadJsModule('mel_metapage', 'mel_object')
          ).MelObject.Empty();
          parent.rcmail.triggerEvent(
            mel_metapage.EventListeners.mails_updated.before,
          );
          MelObject.trigger_event(
            mel_metapage.EventListeners.mails_updated.before,
          );

          mel_metapage.Storage.remove(mel_metapage.Storage.mail);

          rcmail.mel_metapage_fn.mail_wsp_updated();

          if (new_count !== null && new_count !== undefined) {
            mel_metapage.Storage.set(mel_metapage.Storage.mail, new_count);
            try_add_round('.mail ', mel_metapage.Ids.menu.badge.mail);
            update_badge(new_count, mel_metapage.Ids.menu.badge.mail);
            parent.rcmail.triggerEvent(
              mel_metapage.EventListeners.mails_updated.after,
            );
            // if ($(".mail-frame").length > 0)
            //     Title.update($(".mail-frame")[0].id);

            return (async () => {})();
          }

          const last_count = mel_metapage.Storage.get(
            mel_metapage.Storage.mail,
          );
          return $.ajax({
            // fonction permettant de faire de l'ajax
            type: 'GET', // methode de transmission des données au fichier php
            url: '?_task=mel_metapage&_action=get_unread_mail_count', //rcmail.env.ev_calendar_url+'&start='+dateNow(new Date())+'&end='+dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)), // url du fichier php
            success: function (data) {
              try {
                //console.log("mail_updated", data);
                if (
                  isFromRefresh === true &&
                  (last_count === null ||
                    last_count ||
                    undefined ||
                    last_count < data)
                ) {
                  if (rcmail.env.current_frame_name !== 'mail') {
                    const querry = $('iframe.mail-frame');
                    if (querry.length > 0)
                      querry[0].contentWindow.postMessage({
                        exec: 'refresh_frame',
                        child: false,
                        _integrated: true,
                        always: true,
                      });
                  }
                }

                mel_metapage.Storage.set(mel_metapage.Storage.mail, data);
                try_add_round('.mail ', mel_metapage.Ids.menu.badge.mail);
                update_badge(data, mel_metapage.Ids.menu.badge.mail);
                parent.rcmail.triggerEvent(
                  mel_metapage.EventListeners.mails_updated.after,
                );
                MelObject.trigger_event(
                  mel_metapage.EventListeners.mails_updated.after,
                );
                // if ($(".mail-frame").length > 0)
                //     Title.update($(".mail-frame")[0].id);
              } catch (ex) {
                console.error(ex);
                //rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
              }
            },
            error: function (xhr, ajaxOptions, thrownError) {
              // Add these parameters to display the required response
              console.error(xhr, ajaxOptions, thrownError);
              //rcmail.display_message("Une erreur est survenue lors de la synchronisation.", "error")
            },
          });
        },
        mail_wsp_updated: async function () {
          return mel_metapage.Functions.get(
            mel_metapage.Functions.url(
              'mel_metapage',
              'get_wsp_unread_mails_count',
            ),
            {},
            (datas) => {
              // try {
              //     console.log("datas mails upd", JSON.parse(datas));
              // } catch (error) {
              //     console.log("datas mails upde", datas);
              // }
              datas = JSON.parse(datas);
              //console.log("datas", datas);
              mel_metapage.Storage.set(
                mel_metapage.Storage.wsp_mail,
                datas.datas,
              );

              workspaces.sync.PostToParent({
                exec: 'trigger.mail_wsp_updated',
                _integrated: true,
                always: true,
              });
            },
          );
        },
        async wsp_updated() {
          const MelObject = (
            await loadJsModule('mel_metapage', 'mel_object')
          ).MelObject.Empty();
          parent.rcmail.triggerEvent(
            mel_metapage.EventListeners.workspaces_updated.before,
          );
          MelObject.trigger_event(
            mel_metapage.EventListeners.workspaces_updated.before,
          );
          mel_metapage.Storage.remove(mel_metapage.Storage.title_workspaces);

          return mel_metapage.Functions.get(
            mel_metapage.Functions.url(
              'workspace',
              'get_joined_workspace_title',
            ),
            {},
            (datas) => {
              mel_metapage.Storage.set(
                mel_metapage.Storage.title_workspaces,
                datas,
                false,
              );
              parent.rcmail.triggerEvent(
                mel_metapage.EventListeners.workspaces_updated.after,
                datas,
              );
              MelObject.trigger_event(
                mel_metapage.EventListeners.workspaces_updated.after,
                datas,
              );
            },
          );
        },
        weather: async function () {
          if (rcmail.env.mel_metapage_weather_enabled !== true) return;

          const maxAge = 1000 * 60;
          const weatherKey = 'weatherIcon';

          let last_datas = mel_metapage.Storage.get(weatherKey);

          if (last_datas !== null && $('#user-weather').html() === '') {
            $('#user-weather')
              .html(`<img src="${last_datas.icon}" alt="Icone de la météo du jour"/><div style="position: absolute;
                bottom: -2px;
                right: 50%;
                left: 50%;
                text-shadow: -1px -1px 0px black;" class="weather-number">${last_datas.temp}°C</div>`);
          }

          let last_update = mel_metapage.Storage.get(weatherKey + '_last');

          if (last_update !== null && last_datas !== null) {
            last_update = moment(last_update);

            if (
              last_update.format('DD/MM/YYYY HH') ===
              moment().format('DD/MM/YYYY HH')
            )
              return;
          }

          let options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: maxAge,
          };

          function success(pos) {
            // console.log("success", pos);
            let crd = pos.coords;

            // console.log('Your current position is:');
            // console.log(`Latitude : ${crd.latitude}`);
            // console.log(`Longitude: ${crd.longitude}`);
            // console.log(`More or less ${crd.accuracy} meters.`);

            mel_metapage.Functions.post(
              mel_metapage.Functions.url('mel_metapage', 'weather'),
              {
                _lat: crd.latitude,
                _lng: crd.longitude,
              },
              (datas) => {
                try {
                  datas = JSON.parse(datas);
                  datas[1].content = JSON.parse(datas[1].content);
                  $('#user-weather')
                    .html(`<img src="${datas[1].content.current_condition.icon}" /><div style="position: absolute;
                        bottom: -2px;
                        right: 50%;
                        left: 50%;
                        text-shadow: -1px -1px 0px black;" class="weather-number">${datas[1].content.current_condition.tmp}°C</div>`);
                  mel_metapage.Storage.set(weatherKey, {
                    icon: datas[1].content.current_condition.icon,
                    temp: datas[1].content.current_condition.tmp,
                  });
                  mel_metapage.Storage.set(weatherKey + '_last', moment());
                } catch (error) {}
              },
              () => {
                mel_metapage.Storage.remove(weatherKey);
              },
            );
          }

          function error(err) {
            console.warn(`ERROR(${err.code}): ${err.message}`);
            mel_metapage.Storage.remove(weatherKey);
          }

          navigator.geolocation.getCurrentPosition(success, error, options);
        },
        refresh: function () {
          let querry = $('.calendar-frame');
          if (querry.length > 0) {
            //refresh du calendrier
            if (parent.child_cal !== undefined) {
              //child_cal.refresh({ source:child_cal.calendars["tommy_-P-_delphin_-P-_i"].id, refetch:true });
              for (const key in parent.child_cal.calendars) {
                child_cal.refresh({ source: key, refetch: true });
              }
            }
          }
          querry = $('.tasks-frame');
          if (querry.length > 0) {
            if (parent.rctasks !== undefined) rctasks.init();
          }

          let promises = [
            parent.rcmail.mel_metapage_fn.wsp_updated(),
            parent.rcmail.mel_metapage_fn.calendar_updated(),
            parent.rcmail.mel_metapage_fn.tasks_updated(),
            parent.rcmail.mel_metapage_fn.mail_updated(true),
          ];
          //parent.rcmail.mel_metapage_fn.weather();

          refreshWorkspaceCloudNotification();
          rcmail.triggerEvent('mel_metapage_refresh');

          Promise.allSettled(promises).then(async () => {
            const MelObject = (
              await loadJsModule('mel_metapage', 'mel_object')
            ).MelObject.Empty();
            MelObject.trigger_event('mel_metapage_refresh');
          });
        },
      };

      parent.rcmail.mel_metapage_fn.weather();

      //ajout des events listener
      parent.rcmail.addEventListener(
        mel_metapage.EventListeners.calendar_updated.get,
        parent.rcmail.mel_metapage_fn.calendar_updated,
      );
      parent.rcmail.addEventListener(
        mel_metapage.EventListeners.tasks_updated.get,
        parent.rcmail.mel_metapage_fn.tasks_updated,
      );
      parent.rcmail.addEventListener(
        mel_metapage.EventListeners.mails_updated.get,
        (x) => {
          parent.rcmail.mel_metapage_fn.mail_updated(
            x.isFromRefresh === undefined ? false : x.isFromRefresh,
            x.new_count === undefined ? null : x.new_count,
          );
        },
      );
      parent.rcmail.addEventListener(
        mel_metapage.EventListeners.workspaces_updated.get,
        parent.rcmail.mel_metapage_fn.wsp_updated,
      );

      parent.rcmail.enable_command('my_account', true);
      parent.rcmail.register_command('my_account', async () => {
        await PageManager.SwitchFrame('settings', {
          args: {
            _action: 'plugin.mel_moncompte',
          },
        });
        // mel_metapage.Functions.change_page(
        //   'settings',
        //   'plugin.mel_moncompte',
        //   {},
        //   true,
        //   true,
        // );
      });

      parent.rcmail.enable_command('change_avatar', true);
      parent.rcmail.register_command('change_avatar', () => {
        const func = function () {
          document
            .querySelector('iframe.discussion-frame')
            .contentWindow.postMessage(
              {
                externalCommand: 'go',
                path: '/account/profile',
              },
              '*',
            );
        };

        rcmail.triggerEvent('intercept.click.ok', {});

        if (rcmail.env.current_frame_name === 'discussion') func();
        else
          mel_metapage.Functions.change_frame('rocket', true, true).then(func);
      });

      rcmail.register_command(
        'more_options',
        (e) => {
          let otherapp = $('#otherapps');
          if (otherapp.css('display') === 'none') {
            otherapp.css('display', 'flex');
            otherapp.find('a').first().focus();
            $('#taskmenu a.more-options').addClass('selected');

            if ($('html').hasClass('touch')) {
              otherapp.css('left', '0');
              $('<div id="menu-overlay" class="popover-overlay">')
                .on('click', function () {
                  $('#touchmelmenu').click();
                })
                .appendTo('body');
            }
          } else {
            otherapp.css('display', 'none').css('left', '');
            if ($('#otherapps a.selected').length === 0)
              $('#taskmenu a.more-options').focus().removeClass('selected');
            else $('#taskmenu a.more-options').focus().addClass('selected');
          }
        },
        true,
      );

      $('.barup').on('click', (e) => {
        let target = $(e.target);

        let isFav = false;

        while (!isFav && !target.hasClass('barup')) {
          if (target.hasClass('my_favorites')) isFav = true;
          else target = target.parent();
        }

        if (!isFav) FullscreenItem.close_if_exist();
      });
      //console.log(rcmail.env.mel_metapage_mail_configs, rcmail.gettext("up", "mel_metapage"));

      function ChatSetupConfig() {
        if (
          rcmail.env.mel_metapage_chat_visible == undefined ||
          rcmail.env.mel_metapage_chat_visible === true
        ) {
          if (
            rcmail.env.mel_metapage_mail_configs !== undefined &&
            rcmail.env.mel_metapage_mail_configs !== null &&
            rcmail.env.mel_metapage_mail_configs['mel-chat-placement'] ===
              rcmail.gettext('up', 'mel_metapage')
          ) {
            //console.log("neteoemkd");//width: calc(25% - 60px)
            // $("#barup-search-col").append(`<div class="row"><div class=col-7></div></div>`)
            //     .find(".search").appendTo("#barup-search-col .col-7");

            // $("#barup-search-col").find(".row").append("<div id=chatCore class=col-5></div>");

            // $("#barup-search-input").attr("placeholder", rcmail.gettext("globalsearch", "mel_metapage"));

            $('#rcmfd_hide_chat').prop('checked', true);

            $('.tiny-rocket-chat')
              .prependTo('.hide-button-search')
              .addClass('inbarup transparent-icon-button ml-3');

            $('#button-help').removeClass('ml-3');
            // .css("position", "sticky")
            // .css("height", "100%")
            // .css("width", "100%")
            // // .css("min-width", "125px")
            // .css("border-radius", "15px")
            // .css("z-index", 0)
            // .css("white-space", "nowrap")
            //.prepend("<span class=disc>Discussion</span>")
            // .css("font-size", "1vw")
            // .find(".tiny-rocket-chat-icon")
            // .css("position", "initial")
            // .css("font-size", "1vw")
            // .css("margin-left", "0.5vw"); //.css("position", "sticky").appendTo($(".barup"));
          }
        } else {
          $('.tiny-rocket-chat').addClass('layout-hidden');
          $('#rcmfd_hide_chat').prop('checked', false);
        }

        if (!rcmail.env.plugin_list_chat) {
          $('#button-chat').css('display', 'none');
        }
      }

      rcmail.register_command(
        'chat.setupConfig',
        () => {
          ChatSetupConfig();
        },
        true,
      );

      rcmail.register_command(
        'chat.reinit',
        () => {
          if (
            rcmail.env.mel_metapage_mail_configs['mel-chat-placement'] !==
            rcmail.gettext('up', 'mel_metapage')
          ) {
            //console.log("neteoemkd");//width: calc(25% - 60px)
            $('#barup-search-col .search').appendTo($('#barup-search-col'));
            // .append(`<div class="row"><div class=col-5></div></div>`)
            // .find(".search").appendTo("#barup-search-col .col-5");

            // $("#barup-search-col").find(".row").append("<div id=chatCore class=col-5></div>");

            $('#barup-search-input').attr(
              'placeholder',
              rcmail.gettext('globalsearch', 'mel_metapage'),
            );

            $('.tiny-rocket-chat')
              .removeClass('inbarup')
              .removeClass('transparent-icon-button')
              .removeClass('ml-3')
              .appendTo('#layout')
              // .css("position", "absolute")
              // .css("height", "")
              // .css("width", "")
              // .css("min-width", "")
              // .css("border-radius", "")
              // .css("z-index", 999)
              // .css("white-space", "")
              .find('.tiny-rocket-chat-icon')
              // .css("position", "")
              // .css("font-size", "")
              // .css("margin-left", "")
              .parent()
              .find('.disc')
              .remove();

            $('#barup-search-col .row').remove();

            $('#button-help').addClass('ml-3');
          }

          if (!rcmail.env.plugin_list_chat) {
            $('#button-chat').css('display', 'none');
          }
        },
        true,
      );

      ChatSetupConfig();
      if (rcmail.env.launch_chat_frame_at_startup === true) {
        mel_metapage.Functions.change_frame('rocket', false);
        mel_metapage.Functions.change_frame('tchap', false);
      }

      //Ajustement de la barre des tâches
      $(window).on('resize', () => {
        let check = false;
        if ($('#otherapps .resized').length > 0) {
          $('#otherapps .resized').remove();
          $('#taskmenu li.hiddedli').css('display', 'block');
          check = true;
        }
        let isHidden = false;

        let $querry = $('#layout-menu');
        if ($querry.length > 0 && $querry.hasClass('hidden')) {
          $querry.css('opacity', '0').removeClass('hidden');
          isHidden = true;
        }

        $querry = $('#taskmenu');
        if (
          $querry.length > 0 &&
          $querry[0].scrollHeight > window.innerHeight
        ) {
          let items = $('#taskmenu li');
          let it = items.length;

          while ($('#taskmenu')[0].scrollHeight > window.innerHeight) {
            --it;

            if (it <= 5) break;

            if (
              $(items[it]).find('a').hasClass('settings') ||
              $(items[it]).find('a').hasClass('more-options')
            )
              continue;
            else {
              const tmp = $(items[it]).clone();
              $(items[it]).addClass('hiddedli').css('display', 'none');
              $('#otherapps #listotherapps').append(tmp.addClass('resized'));
            }
          }
          setTimeout(() => {
            mm_st_ChangeClicks('#otherapps', '.resized a');
          }, 10);
          check = true;
        }

        if (check) {
          setTimeout(() => {
            let $querry = $('.more-options');
            if ($querry.length > 0) {
              if ($('#otherapps .selected').length === 0)
                $querry.removeClass('selected');
              else $querry.addClass('selected');
            }
            $querry = null;
          }, 10);
        }

        $querry = $('#layout-menu');
        if (isHidden && $querry.length > 0) {
          $querry.css('opacity', '').addClass('hidden');
          let $html = $('html');
          if (
            ($html.hasClass('layout-normal') && !$html.hasClass('touch')) ||
            $html.hasClass('layout-large')
          ) {
            $querry.css('opacity', '').removeClass('hidden');
          }
        }

        $querry = $('#taskmenu .more-options');
        if ($querry.length > 0) {
          if ($('#otherapps #listotherapps').children().length === 0)
            $querry.parent().css('display', 'none');
          else $querry.parent().css('display', 'block');
        }

        MEL_ELASTIC_UI.setup_other_apps(true);
      });

      $(document).ready(() => {
        $(window).resize();
      });

      // //checks
      let local_storage = {
        calendar: mel_metapage.Storage.get(mel_metapage.Storage.calendar),
        tasks: mel_metapage.Storage.get(mel_metapage.Storage.tasks),
        mails: {
          unread_count: mel_metapage.Storage.get(mel_metapage.Storage.mail),
        },
        last_update: {
          calendar: moment(
            mel_metapage.Storage.get(mel_metapage.Storage.last_calendar_update),
          ),
          tasks: moment(
            mel_metapage.Storage.get('mel_metapage.tasks.last_update'),
          ),
        },
      };

      if (
        local_storage.last_update.calendar.startOf('day').format() !==
        moment().startOf('day').format()
      )
        parent.rcmail.triggerEvent(
          mel_metapage.EventListeners.calendar_updated.get,
          { force: true },
        );

      if (
        local_storage.last_update.tasks.format() !==
        moment().startOf('day').format()
      )
        parent.rcmail.triggerEvent(
          mel_metapage.EventListeners.tasks_updated.get,
        );

      // if (window.alarm_managment !== undefined) {
      //     window.alarm_managment.clearTimeouts();
      //     setTimeout(async() => {
      //         let it = 0;
      //         await wait(() => {
      //             return rcmail._events["plugin.display_alarms"] === undefined && it++ < 5;
      //         });
      //         window.alarm_managment.generate(local_storage.calendar);
      //     }, 100);

      // }

      // //add
      if (parent === window) {
        //Si on est pas dans une frame
        // init_badge(local_storage.calendar, mel_metapage.Storage.calendar, () => rcmail.mel_metapage_fn.calendar_updated({force:true}),
        //     ".calendar", mel_metapage.Ids.menu.badge.calendar, true, true, (storage, defaultValue) => {
        //         return Enumerable.from(storage).where(x => x.free_busy !== "free" && x.free_busy !== "telework").count();
        //     });
        init_badge(
          local_storage.tasks,
          mel_metapage.Storage.tasks,
          rcmail.mel_metapage_fn.tasks_updated,
          '.tasklist',
          mel_metapage.Ids.menu.badge.tasks,
          true,
        );
        init_badge(
          local_storage.mails.unread_count,
          mel_metapage.Storage.mail,
          rcmail.mel_metapage_fn.mail_updated,
          '.mail',
          mel_metapage.Ids.menu.badge.mail,
          true,
          true,
        );
        init_badge(
          0,
          null,
          null,
          '.rocket',
          mel_metapage.Ids.menu.badge.ariane,
          false,
          true,
        );
      }

      $('#menu-small-li')
        .prependTo('#taskmenu ul')
        .css('display', '')
        .children()
        .click(() => {
          if (
            $('html').hasClass('touch') &&
            $('html').hasClass('layout-normal')
          ) {
            let it = 0;
            wait(() => {
              ++it;
              if (it >= 5) return false;

              return $('.popover .popover-body').length === 0;
            }).then(() => {
              const rect = $('#touchmelmenu')[0].getClientRects()[0];
              $('.popover .popover-body')
                .parent()
                .css('top', `${rect.top + rect.height}px`)
                .css('left', `${rect.width / 2}px`);
            });
          }
        });

      $('#user-up-panel-a')
        .on('click', m_mp_avatarOnSelect)
        .on('keydown', m_mp_avatarOnSelect)
        .on('focus', () => {
          $('#user-up-panel')
            .find('.row')
            .first()
            .addClass('mel-focus focused'); //.css("box-shadow","0 0 0 .2rem #484D7A69");
        })
        .on('blur', () => {
          $('#user-up-panel')
            .find('.row')
            .first()
            .removeClass('mel-focus')
            .removeClass('focused');
        });

      //create-modal
      parent.rcmail.enable_command('create-modal', true);
      parent.rcmail.register_command('create-modal', () => {
        m_mp_Create();
      });

      rcmail.register_command(
        'fav-modal',
        () => {
          m_mp_shortcuts();
        },
        true,
      );

      parent.rcmail.enable_command('help-modal', true);
      parent.rcmail.register_command('help-modal', () => {
        m_mp_Help();
      });

      parent.rcmail.enable_command('mm-search', true);
      parent.rcmail.register_command('mm-search', () => {
        $('#barup-buttons').css('display', 'none');
        $('#barup-user').css('display', 'none');
        $('#barup-search-input').css('max-width', '70%');
        $('#barup-search').css('left', 0);
        if ($('#gbtniabsc').length === 0)
          $('#barup-search-col')
            .find('.input-group-append')
            .append(
              '<button onclick="rcmail.command(`stop-search`)" id="gbtniabsc" class="btn btn-danger"><span class="icofont-close"></button>',
            );
        $('.barup').css('display', 'initial');
      });

      parent.rcmail.enable_command('stop-search', true);
      parent.rcmail.register_command('stop-search', () => {
        $('#barup-buttons').css('display', '');
        $('#barup-user').css('display', '');
        $('#barup-search-input').css('max-width', '');
        $('#barup-search').css('left', '').addClass('hidden');
        if ($('#gbtniabsc').length !== 0) $('#gbtniabsc').remove();
        $('.barup').css('display', '');
      });

      window.addEventListener('message', receiveMessage, false);

      function receiveMessage(event) {
        if (event.data.message === undefined) return;
        const datas = event.data.datas;
        switch (event.data.message) {
          case 'update_calendar':
            rcmail.triggerEvent(
              mel_metapage.EventListeners.calendar_updated.get,
            );
            break;
          default:
            break;
        }
      }
    });
  }

  /**
   * Initialise un des badges du menu.
   * @param {*} storage Donnée en local.
   * @param {string} storage_key Clé de la donnée en local.
   * @param {function} func Fonction à appeller si la donnée en local est nulle.
   * @param {string} selector Classe ou id de la commande du menu à ajouter un badge.
   * @param {string} idBadge Id du badge.
   * @param {boolean} isAsyncFunc Si la function "func" est asynchrone ou non. "false" par défaut.
   * @param {boolean} isLength Si la données en local est un tableau ou une taille.
   * - "false" = tableau (défaut)
   * - "true" = taille
   */
  function init_badge(
    storage,
    storage_key,
    func,
    selector,
    idBadge,
    isAsyncFunc = false,
    isLength = false,
    editFunc = null,
  ) {
    try {
      if (storage === null) {
        if (isAsyncFunc) {
          func().then((data) => {
            if (data !== false) {
              try {
                try_add_round(selector, idBadge);
                storage = mel_metapage.Storage.get(storage_key);
                const val = isLength ? storage : storage.length;
                update_badge(
                  editFunc !== null ? editFunc(storage, val) : val,
                  idBadge,
                );
              } catch (error) {
                console.error(error);
              }
            }
          });
        } else {
          func();
          try_add_round(selector, idBadge);
          storage = mel_metapage.Storage.get(storage_key);
          const val = isLength ? storage : storage.length;
          update_badge(
            editFunc !== null ? editFunc(storage, val) : val,
            idBadge,
          );
        }
      } else {
        try_add_round(selector, idBadge);
        const val = isLength ? storage : storage.length;
        update_badge(editFunc !== null ? editFunc(storage, val) : val, idBadge);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Ajoute un badge si la taille est supérieur à 0.
   * @param {string} selector Objet à ajouter le badge.
   * @param {string} idBadge Id du badge.
   */
  function try_add_round(selector, idBadge) {
    selector = $(selector);
    if ($('#' + idBadge).length === 0)
      selector.append(
        '<sup><span id="' +
          idBadge +
          '" class="roundbadge menu lightgreen" style="display:none;">?</span></sup>',
      );
  }

  /**
   * Met à jours le badge.
   * @param {number} size Nombre à afficher.
   * @param {string} idBadge Id du badge à modifier.
   */
  function update_badge(size, idBadge) {
    let querry = $('#' + idBadge);

    if (isNaN(+size)) size = 0;

    if (size == 0) {
      //console.log("heeeeere", querry);
      querry.css('display', 'none');
    } else {
      if (size > 999) {
        size = '999+';
        querry.css('font-size', '6px');
      } else querry.css('font-size', '');
      querry.text(size);
      querry.css('display', '');
    }
  }

  function dateNow(date) {
    let set = date;
    let getDate = set.getDate().toString();
    if (getDate.length == 1) {
      //example if 1 change to 01
      getDate = '0' + getDate;
    }
    let getMonth = (set.getMonth() + 1).toString();
    if (getMonth.length == 1) {
      getMonth = '0' + getMonth;
    }
    let getYear = set.getFullYear().toString();
    let dateNow = getYear + '-' + getMonth + '-' + getDate + 'T00:00:00';
    return dateNow;
  }
})();

$(document).ready(() => {
  if (parent != window || MEL_ELASTIC_UI._hide_main_menu) {
    rcmail.addEventListener('init', function () {
      //$(".mm-frame").css("margin-top", "0");
      if ($('html.iframe').length > 0) $('.mm-frame').css('margin-top', '0');
      let querry = $('#user-picture');
    });
  } else {
    // Fermeture du bienvenue
    rcmail.addEventListener('menu-close', function (p) {
      if (
        p &&
        p.name &&
        p.name == 'groupoptions-user' &&
        p.originalEvent.target.parentNode.className != 'notification_button' &&
        !$(p.originalEvent.target).parents().is('#groupoptions-user')
      ) {
        m_mp_ToggleGroupOptionsUser($('#groupoptions-user').data('opener'));
      }
    });
  }
});
