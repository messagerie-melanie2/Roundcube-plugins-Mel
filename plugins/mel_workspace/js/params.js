(() => {
  class Workspace_Param {
    constructor(workspace_id) {
      this.async(() => {
        this.change_icons();
      });
      this.uid = workspace_id;

      Object.defineProperty(this, '_data_null', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: Workspace_Param.data_null,
      });

      this.init_params_buttons();
    }

    /**
     * @return {Promise<NavBarManager>}
     */
    async NavBarManager() {
      const { NavBarManager } = await loadJsModule(
        'mel_workspace',
        'navbar.generator',
      );

      return NavBarManager;
    }

    init_params_buttons() {
      if ($('#update-channel-button').length > 0)
        $('#update-channel-button').on('click', () => {
          this.change_canal();
        });

      if ($('#update-wekan-button').length > 0)
        $('#update-wekan-button').on('click', () => {
          this.change_wekan();
        });
      if ($('#update-tchap-channel-button').length > 0)
        $('#update-tchap-channel-button').on('click', () => {
          this.change_tchap();
        });
    }

    change_icons() {
      $('.wsp-change-icon').each((i, e) => {
        let _class = null;

        for (let index = 0; index < e.classList.length; ++index) {
          const element = e.classList[index];

          if (element !== 'wsp-change-icon' && !element.includes('text')) {
            _class = element;
            break;
          }
        }

        e = $(e);

        if (_class !== null)
          e.removeClass(_class).addClass(
            m_mp_CreateDocumentIconContract(_class),
          );

        e.removeClass('wsp-change-icon');
      });
    }

    url(action = null) {
      if (action === null) {
        let default_config = null;

        if (
          window.location.href.includes(rcmail.env.mel_metapage_const.value)
        ) {
          default_config = {};
          default_config[rcmail.env.mel_metapage_const.key] =
            rcmail.env.mel_metapage_const.value;
        }

        return MEL_ELASTIC_UI.url('workspace', '', default_config);
      } else return MEL_ELASTIC_UI.url('workspace', action);
    }

    async(func) {
      return new Promise((a, b) => func());
    }

    ajax(
      url,
      datas = Workspace_Param.data_null,
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
        success,
        error: failed,
      };

      if (datas !== Workspace_Param.data_null) config['data'] = datas;

      return $.ajax(config);
    }

    busy(is_busy = true) {
      if (is_busy) rcmail.set_busy(true, 'loading');
      else {
        if (this.is_busy()) {
          rcmail.set_busy(false);
          rcmail.clear_messages();
        }
      }
    }

    async busyAsync(is_busy = true) {
      this.busy(is_busy);
    }

    is_busy() {
      return rcmail.busy;
    }

    changeColor(element) {
      if (this.is_busy()) return;

      this.busy();
      let color;

      if (typeof element === 'string') {
        if (!element.includes('#')) element = '#' + element;

        color = element;
      } else if ('value' in element) color = element.value;
      else if ('val' in element) color = element.val();
      else {
        console.warn(
          '[changeColor]/!\\ Impossible de déterminer le type de la variable "element".',
          element,
        );
        color = element;
      }

      return this.ajax(
        this.url('PARAM_Change_color'),
        {
          _color: color,
          _uid: this.uid,
        },
        () => {
          $('.dwp-round').css('background-color', color);
          this.update_home();
        },
      ).always(() => {
        this.busy(false);
      });
    }

    async add_user() {
      if (this.is_busy()) return;

      if (Workspace_Param.PopUp !== undefined) delete Workspace_Param.PopUp;

      const config = new GlobalModalConfig(
        'Ajouter un utilisateur',
        'default',
        MEL_ELASTIC_UI.get_input_mail_search('tmp-id-wsp'),
        null,
        'default',
        'default',
        () => {
          let tmp = new Workspace_Param(rcmail.env.current_workspace_uid);
          tmp.save_users();
        },
      );

      if ($('#globalModal .modal-close-footer').length == 0)
        await GlobalModal.resetModal();

      Workspace_Param.PopUp = new GlobalModal('globalModal', config, true);
      Workspace_Param.PopUp.input = $('#tmp-id-wsp');
      rcmail.init_address_input_events($('#tmp-id-wsp'));
    }

    save_users() {
      this.busy();
      let users = [];
      let input = Workspace_Param.PopUp.input;

      if (input.val() !== '') {
        input.val(input.val() + ',');
        m_mp_autocoplete(input[0]);
      }
      $('.workspace-recipient').each((i, e) => {
        users.push($(e).find('.email').html());
      });

      Workspace_Param.PopUp.close();
      delete Workspace_Param.PopUp;

      return this.ajax(
        this.url('PARAMS_add_users'),
        {
          _users: users,
          _uid: this.uid,
        },
        (datas) => {
          //console.log("datas", datas);
          if (datas === 'no one was found') {
            this.busy(false);
            rcmail.display_message(
              "Les personnes ajoutées ne font pas partie de l'annuaire... Elles ne sont donc pas ajouté à l'espace.",
              'warning',
            );
          } else if (datas === 'denied') {
            this.busy(false);
            rcmail.display_message('Accès interdit !', 'error');
          } else {
            try {
              datas = JSON.parse(datas);
              if (datas.length > 0) {
                this.busy(false);
                for (let index = 0; index < datas.length; ++index) {
                  const element = datas[index];
                  rcmail.display_message(
                    `Impossible d'ajouter ${element} !`,
                    'warning',
                  );
                }
              }
            } catch (e) {}
          }
        },
      ).always(() => {
        return this.update_user_table();
      });
    }

    join() {
      this.busy();
      return this.ajax(this.url('join_user'), {
        _uid: this.uid,
      }).always(() => {
        top.rcmail
          .triggerEvent(mel_metapage.EventListeners.workspaces_updated.get)
          .then(() => {
            window.location.reload();
          });
      });
    }

    async sync_list_member(list) {
      const busy = rcmail.set_busy(true, 'loading');
      let refresh_table = false;
      await this.ajax(
        this.url('sync_list_member'),
        {
          _uid: this.uid,
          _list: list,
        },
        (data) => {
          if (data === 'denied')
            rcmail.display_message(
              "Vous n'avez pas les droits pour faire ça !",
              'error',
            );
          else refresh_table = true;
        },
      );

      if (refresh_table) {
        await this.update_user_table(() => {});
        rcmail.display_message(
          'Liste synchronisée avec succès !',
          'confirmation',
        );
      }

      rcmail.set_busy(false, 'loading', busy);
    }

    update_user_table(func = () => this.busy(false)) {
      return this.ajax(
        this.url('PARAMS_update_user_table_rights'),
        {
          _uid: this.uid,
        },
        (datas) => {
          this.update_table(datas);
        },
      ).always(() => {
        func();
        MEL_ELASTIC_UI.update();
      });
    }
    update_table(html, id = '#wsp-user-rights') {
      //console.log("id", id);
      $(id).parent().html(html);
    }

    update_user_right(value) {
      this.busy();
      $('.btn-u-r').addClass('disabled').attr('disabled', 'disabled');
      value = value.split(':');
      const user = value[1];
      value = value[0];

      return this.ajax(
        this.url('PARAMS_update_user_rights'),
        {
          _uid: this.uid,
          _id: user,
          _right: value,
        },
        (datas) => {
          this.busy(false);
          $('.btn-u-r').removeClass('disabled').removeAttr('disabled');
          switch (datas) {
            case 'reload':
              window.location.reload();
              return;
            case 'error':
              $('.btn-u-r').each((i, e) => {
                if ($(e).data('onchange').includes(user))
                  MEL_ELASTIC_UI.setValue(value === 'o' ? 'w' : 'o', $(e));
              });
              return;
            case 'you are the alone':
              $('.btn-u-r').each((i, e) => {
                if ($(e).data('onchange').includes(user))
                  MEL_ELASTIC_UI.setValue(value === 'o' ? 'w' : 'o', $(e));
              });
              rcmail.clear_messages();
              rcmail.display_message(
                'Il doit y avoir au minimum un administrateur par espace !',
                'error',
              );
              return;
            default:
              break;
          }
          if ($('#wsp-user-rights').find('.select-button-mel.o').length < 2) {
            $('.wsp-description').show();
          } else {
            $('.wsp-description').hide();
          }
        },
        (a, b, c) => {
          console.error('###[update_user_right]', a, b, c);
          $('.btn-u-r').each((i, e) => {
            if ($(e).data('onchange').includes(user))
              MEL_ELASTIC_UI.setValue(value === 'o' ? 'w' : 'o', $(e));
          });
          this.busy(false);
          $('.btn-u-r').removeClass('disabled').removeAttr('disabled');
        },
      );
    }

    update_end_date(new_date) {
      if (new_date === undefined || new_date === null || new_date === '') {
        if (
          !confirm(
            'Vous n\'avez pas inscrit de nouvelle date, cela aura pour effet de supprimer la date de fin.\r\nSi c\'est ce que vous voulez, appuyez sur "Ok".',
          )
        )
          return;
      }

      this.busy();
      return this.ajax(
        this.url('PARAMS_update_end_date'),
        {
          _uid: this.uid,
          _date: new_date,
        },
        (datas) => {
          this.busy(false);

          if (datas === 'denied')
            rcmail.display_message(
              'Vous devez être un administrateur pour faire ça !',
              'error',
            );
          else {
            rcmail.display_message(
              'Date de fin modifié avec succès !',
              'confirmation',
            );

            if (new_date === undefined || new_date === null || new_date === '')
              $('#wsp-end-date').remove();
            else {
              if (moment(new_date, 'DD/MM/YYYY hh:mm') <= moment())
                $('#wsp-end-date').html('<i>Espace clôt !</i>');
              else $('#wsp-end-date').html(`Date de fin : ${new_date}`);
            }

            //$("#wsp-param-chg-button-enddate").attr("disabled", "disabled").addClass("disabled");
          }
        },
      ).always(() => {
        this.busy(false);
      });
    }

    update_primary_parameters(
      config = {
        type: '',
        input: $(),
        checks: 'empty;already-exist',
        text_on_error: 'Impossible de changer le paramètre.',
        text_on_succes: 'Paramètre changer avec succès.',
        action: null,
      },
    ) {
      const empty = '';
      const val = config.input.val();
      if (
        config.checks !== undefined &&
        config.checks !== null &&
        config.checks !== empty
      ) {
        const checks = config.checks.split(';');
        for (let index = 0; index < checks.length; ++index) {
          const element = checks[index];
          switch (element) {
            case 'empty':
              if (val === empty) {
                rcmail.display_message(
                  'La valeur ne peut pas être vide.',
                  'error',
                );
                return this;
              }
              break;

            case 'already-exist':
              if (val === config.input.attr('placeholder')) {
                rcmail.display_message(
                  'La valeur ne peut pas être la même que la précédente.',
                  'error',
                );
                return this;
              }

            default:
              break;
          }
        }
      }

      this.busy();
      return this.ajax(
        this.url('PARAMS_change_primary'),
        {
          _uid: this.uid,
          _type: config.type,
          _val: val,
        },
        (datas) => {
          this.busy(false);
          const denied = 'denied';
          if (datas === denied) {
            rcmail.display_message(
              "Vous n'avez pas les droits pour effectuer cette action.",
              'error',
            );
          } else {
            switch (config.type) {
              case 'title':
                // $('.wsp-head .header-wsp').html(val);
                config.input.attr('placeholder', val);
                this.titleUpdated(empty);
                this.NavBarManager().then((manager) => {
                  manager.currentNavBar.title = val;
                });
                break;

              default:
                if (config.action !== null) {
                  config.action(datas, config, val, empty);

                  switch (config.type) {
                    case 'desc':
                      this.NavBarManager().then((manager) => {
                        manager.currentNavBar.description = val;
                      });
                      break;

                    default:
                      break;
                  }
                }
                break;
            }

            this.update_home();

            rcmail.display_message(config.text_on_succes, 'confirmation');
          }
        },
        (xhr, ajaxOptions, error) => {
          this.busy(false);
          rcmail.display_message(config.text_on_error, 'error');
          console.error(
            '###[update_primary_parameters]',
            error,
            ajaxOptions,
            xhr,
          );
        },
      );
    }

    update_workspace_logo(new_logo) {
      if (new_logo === undefined || new_logo === null || new_logo === '')
        new_logo = 'false';

      this.busy();
      return this.ajax(
        this.url('PARAMS_change_logo'),
        {
          _uid: this.uid,
          _logo: new_logo,
        },
        (datas) => {
          if (datas === 'denied') {
            this.busy(false);
            rcmail.display_message(
              'Vous devez être administrateur pour pouvoir changer de logo.',
              'error',
            );
          } else {
            // if (new_logo === 'false') {
            //   $('#worspace-avatar-b').html(
            //     `<span>${$('.wsp-head h1.header-wsp').html().slice(0, 3)}</span>`,
            //   );
            //   $('.dwp-round.wsp-picture').html(
            //     `<span>${$('.wsp-head h1.header-wsp').html().slice(0, 3)}</span>`,
            //   );
            // } else {
            //   $('#worspace-avatar-b').html(`<img src="${new_logo}" />`);
            //   $('.dwp-round.wsp-picture').html(`<img src="${new_logo}" />`);
            // }

            $('#wsp-param-chg-button-plz')
              .attr('disabled', 'disabled')
              .addClass('disabled');

            //this.update_home();
            this.NavBarManager().then((manager) => {
              manager.currentNavBar.picture = new_logo;
            });
          }
        },
      ).always(() => {
        this.busy(false);
      });
    }

    async delete_list(list) {
      const confirm_text =
        'Êtes-vous sûr de vouloir supprimer cette liste ?\r\nCela supprimera aussi les membres associés.';
      if (confirm(confirm_text)) {
        const busy = rcmail.set_busy(true, 'loading');

        let refresh_table = false;
        await this.ajax(
          this.url('delete_list'),
          {
            _uid: this.uid,
            _list: list,
          },
          (datas) => {
            if (datas === 'denied') {
              rcmail.display_message(
                'Vous devez être administrateur pour pouvoir supprimer la liste.',
                'error',
              );
            } else refresh_table = true;
          },
        );

        if (refresh_table) {
          await this.update_user_table(() => {});
          rcmail.display_message(
            'Liste supprimée avec succès !',
            'confirmation',
          );
        }

        rcmail.set_busy(false, 'loading', busy);
      }
    }

    delete_user(user) {
      this.busy();
      return this.ajax(
        this.url('PARAMS_delete_user'),
        {
          _uid: this.uid,
          _user_to_delete: user,
        },
        (datas) => {
          switch (datas) {
            case 'denied':
              this.busy(false);
              rcmail.display_message(
                'Vous devez être administrateur pour pouvoir faire cette action !',
                'error',
              );
              break;
            case 'you are the alone':
              this.busy(false);
              rcmail.display_message(
                "Vous êtes le seul administrateur, nommez un autre administrateur ou supprimez l'espace.",
                'error',
              );
              break;

            default:
              return this.update_user_table();
          }
        },
      );
      // ).always(() => {
      //     return this.update_user_table();
      // })
    }

    set_body_loading() {
      $('#layout-content').removeClass('mwsp');
      return $('.body')
        .html(MEL_ELASTIC_UI.create_loader('rotomecamelloader', true))
        .css('display', 'grid')
        .css('justify-content', 'center');
    }

    leave() {
      this.busy();
      if (confirm('Êtes vous-sûr de vouloir quitter cet espace de travail ?')) {
        return this.ajax(
          this.url('leave_workspace'),
          {
            _uid: this.uid,
          },
          (msg) => {
            this.busy(false);
            switch (msg) {
              case 'yourealone':
                rcmail.display_message(
                  'Vous êtes la seule personne de cet espace, si vous souhaitez le quitter, supprimer le.',
                  'error',
                );
                break;
              case 'youretheone':
                rcmail.display_message(
                  'Vous êtes le seul administrateur, si vous souhaitez quittez, ajoutez un autre administrateur avant.',
                  'error',
                );
                break;
              default:
                top.rcmail
                  .triggerEvent(
                    mel_metapage.EventListeners.workspaces_updated.get,
                  )
                  .then(() => {
                    this.update_home();
                    this.quit();
                  });
                break;
            }
          },
          (a, b, c) => {
            console.error(a, b, c);
            this.busy(false);
          },
        );
      } else return this.busyAsync(false);
    }

    change_visibility() {
      this.busy();
      return this.ajax(
        this.url('PARAMS_change_visibility'),
        {
          _uid: this.uid,
        },
        (datas) => {
          this.busy(false);
          if (datas === 'denied')
            rcmail.display_message(
              "Vous n'avez pas les droits pour changer la visibilité de cet espace !",
              'error',
            );
          else {
            rcmail.display_message(
              'Visibilité changé avec succès !',
              'confirmation',
            );
            let querry = $('#param-visibility');
            if (querry.html().includes('privé'))
              querry.html('Passer en public');
            else querry.html('Passer en privé');
          }
        },
        (a, b, c) => {
          this.busy(false);
          console.error(a, b, c);
          rcmail.display_message('Une erreur est survenue...', 'error');
        },
      ).always(() => this.busy(false));
    }

    update_app(app) {
      this.busy();
      return this.ajax(
        this.url('PARAMS_update_app'),
        {
          _uid: this.uid,
          _app: app,
        },
        (d) => {
          if (d === 'error') {
            parent.rcmail.display_message(
              'Impossible de créer le service pour le moment.',
              'error',
            );
          }
        },
      )
        .always(() => {
          return this.update_app_table(() => {
            this.change_icons();
          });
        })
        .always(async () => {
          if (true || app === 'doc') this.reload();
          else {
            await this.ajax(
              this.url('PARAMS_update_services'),
              {
                _uid: this.uid,
              },
              (datas) => {
                $('.wsp-services').html(datas);
                WSPReady();
              },
            );
            await this.update_toolbar().always(() => {
              $('.wsp-services button').addClass('btn btn-secondary');
              this.busy(false);
            });
          }
        });
    }

    reload() {
      if (window !== top)
        window.location.href = `${window.location.href}&_is_from=iframe`;
      else {
        const url = mel_metapage.Functions.url('workspace', 'workspace', {
          _uid: this.uid,
          _page: 'params',
        });
        window.history.replaceState(
          {},
          document.title,
          url.replace(
            `${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`,
            '',
          ),
        );
        rcmail.set_busy(false);
        rcmail.command('refreshFrame');
      }
    }

    update_toolbar() {
      return this.ajax(
        this.url('PARAMS_update_toolbar'),
        {
          _uid: this.uid,
        },
        (datas) => {
          //console.log("toolbar", datas, $("#wsp-toolbar"));
          $('.wsp-toolbar').html(datas);
          $('.wsp-home.active').removeClass('active');
          $('.wsp-toolbar-item')
            .addClass('btn btn-secondary')
            .removeAttr('disabled')
            .removeAttr('aria-disabled');
          $('.wsp-item-params')
            .addClass('active')
            .attr('disabled', 'disabled')
            .attr('aria-disabled', true);
        },
      );
    }

    update_app_table(func = () => this.busy(false)) {
      return this.ajax(
        this.url('PARAMS_update_app_table'),
        {
          _uid: this.uid,
        },
        (datas) => {
          this.update_table(datas, '#table-apps');
        },
      ).always(() => {
        func();
        //MEL_ELASTIC_UI.update();
      });
    }

    async update_home() {
      let $querry = top.$('iframe.bureau-frame');

      if ($querry.length > 0) $querry[0].contentWindow.location.reload();
      else if (top.$('.bureau-frame').length > 0) {
        top.$('.bureau-frame').remove();
      }

      return this;
    }

    async delete() {
      const loadJsModule =
        window.loadJsModule ?? parent.loadJsModule ?? top.loadJsModule;
      const { MelDialog } = await loadJsModule(
        'mel_metapage',
        'modal.js',
        '/js/lib/classes/',
      );

      this.busy();

      if (
        await MelDialog.Confirm(
          `Êtes-vous sûr de vouloir supprimer l'espace de travail : ${$('.header-wsp').text()} ? <br/> Attention, cette action sera irréversible !`,
          {
            waiting_button_enabled: 5,
            title: 'Confirmation',
            button_confirm: "Supprimer l'espace",
            options: { height: 105 },
          },
        )
      ) {
        return this.ajax(
          this.url('delete_workspace'),
          {
            _uid: this.uid,
          },
          (datas) => {
            this.update_home();
            this.quit();
          },
          (a, b, c) => {
            this.busy(false);
            console.error(a, b, c);
            rcmail.display_message(
              "Impossible de supprimer cet espace, regardez la console pour plus d'informations.",
              'error',
            );
          },
        );
      } else return this.busyAsync(false);
    }

    compose() {
      top.rcmail.open_compose_step({ to: rcmail.env.current_workspace_email });
    }

    async create_webconf(needParameters = false) {
      if (!needParameters) {
        const conf = this.generate_webconf();
        const key = `${conf.letters}${rcmail.env.current_workspace_uid.replaceAll('-', '').toUpperCase()}${conf.numbers}`;

        await top.webconf_helper.go_ex({
          key,
          wsp: rcmail.env.current_workspace_uid,
          extra: {
            notify: true,
          },
        });
      } else
        await top.webconf_helper.go(
          '',
          rcmail.env.current_workspace_uid,
          null,
          true,
          [1],
          null,
          'need_config',
        );
    }

    generate_webconf() {
      const letters = [
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

      let datas = {
        letters: '',
        numbers: '',
      };

      for (let index = 0; index < 10; index++) {
        datas.letters += letters[this.getRandomInt(0, 26)];
        if (index <= 3) datas.numbers += this.getRandomInt(0, 10).toString();
      }

      return datas;
    }

    toggle_nav_color() {
      this.busy();
      return this.ajax(this.url('toggle_nav_color'), {
        _uid: this.uid,
      }).always(() => {
        this.busy(false);
        top.rcmail.command('refreshFrame');
      });
    }

    getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
    }

    change_canal() {
      if (this.is_busy()) return Promise.resolve();
      else this.busy(true);

      let globalModal;
      if ($('#globalModal .modal-close-footer').length == 0)
        globalModal = GlobalModal.resetModal();
      else globalModal = Promise.resolve();

      return this.ajax(
        this.url('PARAMS_get_arianes_rooms'),
        { _uid: this.uid },
        (datas) => {
          globalModal.then(() => {
            if (Workspace_Param.PopUp !== undefined)
              delete Workspace_Param.PopUp;

            const config = new GlobalModalConfig(
              'Changer de canal',
              'default',
              datas,
              null,
              'default',
              'default',
              () => {
                let val = $('#selectnewchannel select').val();

                const confirmation = confirm(
                  rcmail.gettext('canal_change_confirmation', 'mel_workspace'),
                );

                if (confirmation && val.includes(':')) {
                  val = val.split(':')[1];

                  if (val === rcmail.env.current_workspace_channel.name) {
                    let querry = $('#selectnewchannel');
                    querry.find('#addederrorsn').remove();
                    querry.append(
                      '<div id="addederrorsn" style="color:red;">*Vous devez choisir un canal différent !</div>',
                    );
                    return;
                  }

                  this.busy(true);
                  this.ajax(
                    this.url('PARAMS_change_ariane_room'),
                    {
                      _name: val,
                      _uid: this.uid,
                    },
                    (datas) => {
                      window.location.reload();
                    },
                    (a, b, c) => {
                      console.error(
                        '###[change_canal]une erreur est survenue ! ',
                        a,
                        b,
                        c,
                      );
                      this.busy(false);
                      rcmail.display_message(
                        'impossible de mettre à jour le canal !',
                        'error',
                      );
                    },
                  ).always(() => {
                    this.busy(false);
                    Workspace_Param.PopUp.close();
                  });
                } else if (confirmation) {
                  if (!val.includes(':')) {
                    let querry = $('#selectnewchannel');
                    querry.find('#addederrorsn').remove();
                    querry.append(
                      '<div id="addederrorsn" style="color:red;">*Vous devez choisir un canal !</div>',
                    );
                  }
                }
              },
            );

            Workspace_Param.PopUp = new GlobalModal(
              'globalModal',
              config,
              false,
            );

            let querry = $('#selectnewchannel select');
            querry.find('option[value="home"]').remove();
            querry = querry.find('option');

            for (let index = 0; index < querry.length; ++index) {
              const element = querry[index];

              try {
                if (
                  $(element).attr('value').split(':')[1] ===
                  rcmail.env.current_workspace_channel.name
                ) {
                  $(element).attr('selected', 'selected');
                  break;
                }
              } catch (error) {
                console.warn(error);
                continue;
              }
            }

            Workspace_Param.PopUp.footer.buttons.save
              .addClass('mel-button btn-secondary')
              .removeClass('btn-primary')
              .html(
                rcmail.gettext('save') +
                  '<span class="plus icon-mel-plus"></span>',
              );

            Workspace_Param.PopUp.footer.buttons.exit
              .addClass('mel-button btn-danger')
              .removeClass('btn-secondary')
              .html(
                rcmail.gettext('close') +
                  '<span class="plus icon-mel-close"></span>',
              );
            //console.log("popup", Workspace_Param.PopUp);

            this.busy(false);
            Workspace_Param.PopUp.show();
          });
        },
        (a, b, c) => {},
        'GET',
      );
    }

    change_tchap() {
      let buttons = [
        {
          text: rcmail.gettext('cancel'),
          class: 'cancel',
          click: function () {
            $popup.dialog('close');
          },
        },
        {
          text: rcmail.gettext('save'),
          class: 'save',
          click: () => {
            const value = $('#selecttchapchannel').val();
            this.ajax(
              this.url('change_tchap_room'),
              { _uid: this.uid, _room_uid: value },
              (data) => {
                data = JSON.parse(data);
                if (data) {
                  this.update_toolbar();
                  this.update_app_table();
                  $popup.dialog('close');
                } else {
                  alert("l'uid entré ne correspond pas à un salon tchap");
                }
              },
            );
          },
        },
      ];

      let $popup = rcmail.show_popup_dialog(
        ' <span> Attention! La présence de Bot-Gmcd [Developpement-Durable] dans le salon est nécessaire pour fonctionner.</span> <br/> <input id = "selecttchapchannel" type = "text" title = "Entrer l\'uid du salon tchap" /> ',
        "Entrer l'uid du salon tchap",
        buttons,
      );
    }

    change_wekan() {
      if (this.is_busy()) return Promise.resolve();
      else this.busy(true);

      let globalModal;
      if ($('#globalModal .modal-close-footer').length == 0)
        globalModal = GlobalModal.resetModal();
      else globalModal = Promise.resolve();

      return this.ajax(
        this.url('get_wekan_admin_boards'),
        { _wsp: this.uid },
        (datas) => {
          globalModal.then(() => {
            if (Workspace_Param.PopUp !== undefined)
              delete Workspace_Param.PopUp;

            const config = new GlobalModalConfig(
              'Changer de tableau',
              'default',
              datas,
              null,
              'default',
              'default',
              () => {
                let val = $('#select-update-wekan').val();

                const confirmation = confirm(
                  "Attention !\r\nCe tableau sera synchronisé avec votre espace.\r\nCelui-ci ne sera pas supprimé si l'espace est supprimé.\r\nÊtes-vous sûr de vouloir continuer ?",
                );

                if (confirmation) {
                  if (val === rcmail.env.wekan_datas?.id) {
                    let querry = $('#select-update-wekan').parent();
                    querry.find('#addederrorsn').remove();
                    querry.append(
                      '<div id="addederrorsn" style="color:red;">*Vous devez choisir un canal différent !</div>',
                    );
                    return;
                  }

                  this.busy(true);
                  this.ajax(
                    this.url('update_wekan_board'),
                    {
                      _id: val,
                      _wsp: this.uid,
                    },
                    (datas) => {
                      window.location.reload();
                    },
                    (a, b, c) => {
                      console.error(
                        '###[change_canal]une erreur est survenue ! ',
                        a,
                        b,
                        c,
                      );
                      this.busy(false);
                      rcmail.display_message(
                        'impossible de mettre à jour le tableau !',
                        'error',
                      );
                    },
                  ).always(() => {
                    this.busy(false);
                    Workspace_Param.PopUp.close();
                  });
                }
              },
            );

            Workspace_Param.PopUp = new GlobalModal(
              'globalModal',
              config,
              false,
            );

            // let querry = $("#selectnewchannel select");
            // querry.find(`option[value="home"]`).remove();
            // querry = querry.find("option")

            // for (let index = 0; index < querry.length; ++index) {
            //     const element = querry[index];

            //     try {
            //         if ($(element).attr("value").split(":")[1] === rcmail.env.current_workspace_channel.name)
            //         {
            //             $(element).attr("selected", "selected");
            //             break;
            //         }
            //     } catch (error) {
            //         console.warn(error);
            //         continue;
            //     }
            // }

            Workspace_Param.PopUp.footer.buttons.save
              .addClass('mel-button btn-secondary')
              .removeClass('btn-primary')
              .html(
                rcmail.gettext('save') +
                  '<span class="plus icon-mel-plus"></span>',
              );

            Workspace_Param.PopUp.footer.buttons.exit
              .addClass('mel-button btn-danger')
              .removeClass('btn-secondary')
              .html(
                rcmail.gettext('close') +
                  '<span class="plus icon-mel-close"></span>',
              );
            //console.log("popup", Workspace_Param.PopUp);

            this.busy(false);
            Workspace_Param.PopUp.show();
          });
        },
        (a, b, c) => {},
        'GET',
      );
    }

    async create_survey(survey = null) {
      this.create_survey.survey = survey;
      const edit_mode = !!this.create_survey.survey;
      let globalModal;
      if ($('#globalModal .modal-close-footer').length == 0)
        globalModal = GlobalModal.resetModal();
      else {
        globalModal = Promise.resolve();
        let $footer = $('#globalModal .modal-footer');
        $footer.html($footer.html());
      }

      const _default = 'default';

      let html = `
                <p class="red-star-removed"><star class="red-star mel-before-remover">*</star>
                    Champs obligatoires
                </p>
                <label for="survey-input-title" class="red-star-after span-mel t1 first mel-after-remover">Titre du sondage<star class="red-star mel-before-remover">*</star></label>
                <input id="survey-input-title" class="input-mel mel-input form-control" value="${edit_mode ? this.create_survey.survey.title : ''}" placeholder="titre du sondage" />
                <label for="survey-input-link" class="red-star-after span-mel t1 mel-after-remover">Lien du sondage<star class="red-star mel-before-remover">*</star></label>
                <input id="survey-input-link" class="input-mel mel-input form-control" value="${edit_mode ? this.create_survey.survey.link : ''}" placeholder="lien du sondage" />
            `;

      const global_config = new GlobalModalConfig(
        edit_mode ? 'Modifier un sondage' : 'Lier un sondage',
        _default,
        html,
        null,
        _default,
        _default,
        () => {
          const edit_mode = !!this.create_survey.survey;
          const val = $('#survey-input-link').val();
          const title = $('#survey-input-title').val();

          if (val !== '' && title !== '') {
            modal.close();
            this.busy();
            this.disable_surveys_buttons();
            let config = {
              _uid: this.uid,
              _zelda: val,
              _title: title,
            };

            if (edit_mode) config['_sid'] = this.create_survey.survey.id;

            this.ajax(this.url('add_survey'), config, (datas) => {
              if (datas !== 'denied') {
                this.generate_surveys(JSON.parse(datas));
                modal.close();
              } else {
                this.busy(false);
                rcmail.display_message(
                  "Vous devez être l'administrateur ou le créateur du sondage pour pouvoir le modifier.",
                  'error',
                );
              }
            }).always(() => {
              this.enable_surveys_buttons();
              this.busy(false);
            });
          } else modal.show();
        },
      );
      await globalModal;
      globalModal = null;

      let modal = new GlobalModal('globalModal', global_config, false);
      modal.contents.find('#survey-input-link').on('change', () => {
        const base = rcmail.env.sondage_create_sondage_url.split('?_')[0];
        const val = $('#survey-input-link').val();
        if (!val.includes(base)) {
          rcmail.display_message(`${val} n'est pas une url valide.`, 'error');
          $('#survey-input-link').val('');
        }
      });

      modal.show();
      return modal;
    }

    async delete_survey(sid) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce sondage ?')) {
        this.busy();
        this.disable_surveys_buttons();
        await this.ajax(
          this.url('delete_survey'),
          {
            _uid: this.uid,
            _sid: sid,
          },
          (datas) => {
            if (datas !== 'denied') {
              this.generate_surveys(JSON.parse(datas));
              modal.close();
            } else {
              this.busy(false);
              rcmail.display_message(
                "Vous devez être l'administrateur ou le créateur du sondage pour pouvoir le modifier.",
                'error',
              );
            }
          },
        );
        this.enable_surveys_buttons();
        this.busy(false);
      }
    }

    disable_surveys_buttons() {
      $('#button-create-new-survey')
        .addClass('disabled')
        .attr('disabled', 'disabled');
      $('.click-master button')
        .addClass('disabled')
        .attr('disabled', 'disabled');
    }

    enable_surveys_buttons() {
      $('#button-create-new-survey')
        .removeClass('disabled')
        .removeAttr('disabled', 'disabled');
      $('.click-master button')
        .removeClass('disabled')
        .removeAttr('disabled', 'disabled');
    }

    generate_surveys(datas) {
      const base_sondage_url =
        'https://pegase.din.developpement-durable.gouv.fr/'; //@Rotomeca : temp code
      const create_page_enabled = false;
      var $first = true;
      let $main = $('.ressources-surveys.bc').html('');
      for (var iterator of Enumerable.from(datas).orderByDescending((x) =>
        x.value ? x.value.create_date : x.create_date,
      )) {
        if (iterator.key) iterator = iterator.value;
        var $click_master = $('<div class="click-master"></div>').appendTo(
          $main,
        );
        var $btn_group = $('<div class="btn-group"></div>')
          .css('width', '100%')
          .appendTo($click_master);
        var $button_tab =
          $(`<button id="sondage-${iterator.id}" class="${$first ? 'selected' : ''} mel-focus text-header no-style full-width btn btn-secondary click-sondage click-tab">
                    <span>${iterator.title}</span>
                    <span class="icon-mel-chevron-${$first ? 'down' : 'right'} float-right"></span>`).appendTo(
            $btn_group,
          );
        var $button_copy = $(
          `<button onclick="survey_copy(this)" class="mel-button btn btn-secondary no-button-margin" data-slink="${iterator.link}"><span class="icon-mel-copy"></span></button>`,
        ).appendTo($btn_group);

        if (iterator.can_delete) {
          var $button_edit = $(
            `<button class="mel-button btn btn-secondary no-button-margin" onclick="survey_edit(this)" data-sid="${iterator.id}" data-stitle="${iterator.title}" data-slink="${iterator.link}"><span class="icon-mel-pencil"></span></button>`,
          ).appendTo($btn_group);
          var $button_delete = $(
            `<button style="border-bottom-right-radius:0;border-top-right-radius:5px;" class="mel-button btn btn-danger no-button-margin" onclick="survey_delete(this)" data-sid="${iterator.id}"><span class="icon-mel-trash"></span></button>`,
          ).appendTo($btn_group);
        }

        $(
          `<div class="${$first ? '' : 'hidden'} click-body click-sondage sondage-${iterator.id}"><iframe src="${iterator.link}&_embeded=1" style="width:100%;height:450px"></iframe></div>`,
        ).appendTo($click_master);

        if ($first) $first = false;
      }

      if ($first) {
        $('#button-create-new-survey').css('display', 'none');
        $(
          `<center>Créez un nouveau sondage (<a href="${create_page_enabled ? rcmail.env.sondage_create_sondage_url : base_sondage_url}" class="">ici</a>) puis liez le avec cet espace. (<a id="link-a-survey" onclick="rcmail.command('workspace.survey.create')" href="#" class="">ici</a>)</center>`,
        ).appendTo($main);
      } else {
        $('#button-create-new-survey').css('display', '');
        init_clicks();
      }
    }

    archive(archive = true) {
      this.busy();
      let bool;
      if (archive)
        bool = confirm(
          'Êtes-vous sûr de vouloir archiver cet espace de travail ?',
        );
      else
        bool = confirm(
          'Êtes-vous sûr de vouloir désarchiver cet espace de travail ?',
        );

      if (bool) {
        return this.ajax(
          this.url('archive_workspace'),
          {
            _uid: this.uid,
          },
          (datas) => {
            if (archive) this.quit();
            else window.location.reload();
          },
          (a, b, c) => {
            this.busy(false);
            console.error(a, b, c);
            rcmail.display_message(
              "Impossible d'archiver cet espace, regardez la console pour plus d'informations.",
              'error',
            );
          },
        );
      } else return this.busyAsync(false);
    }

    quit() {
      this.busy();
      this.set_body_loading();
      window.location.href =
        rcmail.env.current_workspace_back === undefined ||
        rcmail.env.current_workspace_back === null
          ? this.url()
          : rcmail.env.current_workspace_back;
    }

    endDateChanged() {
      //$("#wsp-param-chg-button-enddate").removeAttr("disabled").removeClass("disabled");
      return this.updateButtonState($('#wsp-param-chg-button-enddate'));
    }

    updateButtonState(jquery, enable = true) {
      if (enable && jquery.hasClass('disabled')) {
        jquery.removeAttr('disabled').removeClass('disabled');
      } else if (!enable && !jquery.hasClass('disabled')) {
        jquery.attr('disabled', 'disabled').addClass('disabled');
      }

      return this;
    }

    paramUpdated($button, newVal = null, authorizeEmpty = false) {
      let $jquery = $button;
      let $input = $jquery.parent().parent().find('input');

      if ($input.length === 0)
        $input = $jquery.parent().parent().find('textarea');

      if (newVal !== null) $input.val(newVal);

      const val = $input.val();
      const empty = '';
      if (
        (val !== empty || authorizeEmpty) &&
        val !== $input.attr('placeholder')
      )
        return this.updateButtonState($jquery);
      else return this.updateButtonState($jquery, false);
    }

    titleUpdated(newVal = null) {
      return this.paramUpdated($('#wsp-param-btn-title'), newVal);
    }
  }
  Object.defineProperty(Workspace_Param, 'data_null', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: Symbol('null'),
  });

  async function setup_avatars() {
    const tmp = (img) => {
      img = img.split('.');

      if (img.length > 1) img[img.length - 1] = '';

      img = img.join('.');
      img = img.slice(0, img.length - 1);

      return img;
    };

    let html = EMPTY_STRING;
    if (rcmail.env.mel_metapage_workspace_logos.length > 0) {
      html +=
        '<li role=menuitem><a title="" aria-disabled=true href=# tabindex=-1 class="active" id="" href="#" onclick="m_wp_change_picture(null)"><img src="' +
        rcmail.env.mel_metapage_workspace_logos[0].path +
        '" class="menu-image invisible">Aucune image</a></li>';

      for (
        let index = 0;
        index < rcmail.env.mel_metapage_workspace_logos.length;
        index++
      ) {
        const element = rcmail.env.mel_metapage_workspace_logos[index];
        html +=
          `<li role=menuitem><a aria-disabled=true href=# alt="${Enumerable.from(element.path.replace('.png', '').replace('.jpg', '').replace('.PNG', '').split('/')).last()}" title="" class="active" id="" tabindex=-1 href="#" onclick="m_wp_change_picture('` +
          element.path +
          '\')"><img src="' +
          element.path +
          '" class=menu-image>' +
          tmp(element.name) +
          '</a></li>';
      }
    }
    $('#ul-wsp-params').html(html);
  }

  async function m_wp_change_picture(img) {
    if (img === null) {
      const manager = await rcmail.env.WSP_Param.NavBarManager();
      $('#spaceLogo').html(
        `<span>${manager.currentNavBar.workspace.title.slice(0, 3)}</span>`,
      );
    } else
      $('#spaceLogo').html(
        `<img alt="${Enumerable.from(img.replace('.png', '').replace('.PNG', '').split('/')).last()}" src="${img}" /><p class="sr-only"> - Changer d'avatar</p>`,
      );

    $('#wsp-param-chg-button-plz')
      .removeAttr('disabled')
      .removeClass('disabled');
  }

  window.m_wp_change_picture = m_wp_change_picture;

  $(document).ready(() => {
    setup_avatars();

    rcmail.env.WSP_Param = new Workspace_Param(
      rcmail.env.current_workspace_uid,
    );
    rcmail.register_command(
      'workspace.changeColor',
      (x) => rcmail.env.WSP_Param.changeColor(x),
      true,
    );
    rcmail.register_command(
      'workspace.add_users',
      () => rcmail.env.WSP_Param.add_user(),
      true,
    );
    rcmail.register_command(
      'workspace.update_user',
      (x) => rcmail.env.WSP_Param.update_user_right(x),
      true,
    );
    rcmail.register_command(
      'workspace.remove_user',
      (x) => rcmail.env.WSP_Param.delete_user(x),
      true,
    );
    rcmail.register_command(
      'workspace.leave',
      () => rcmail.env.WSP_Param.leave(),
      true,
    );
    rcmail.register_command(
      'workspace.delete',
      () => rcmail.env.WSP_Param.delete(),
      true,
    );
    rcmail.register_command(
      'workspace.join',
      () => rcmail.env.WSP_Param.join(),
      true,
    );
    rcmail.register_command(
      'workspace.go',
      () => {
        rcmail.env.WSP_Param.quit();
      },
      true,
    );
    rcmail.register_command(
      'workspace.archive',
      () => rcmail.env.WSP_Param.archive(),
      true,
    );
    rcmail.register_command(
      'workspace.update_app',
      (e) => rcmail.env.WSP_Param.update_app(e),
      true,
    );
    rcmail.register_command(
      'workspace.unarchive',
      () => rcmail.env.WSP_Param.archive(false),
      true,
    );
    rcmail.register_command(
      'workspace.changeLogo',
      (x) => rcmail.env.WSP_Param.update_workspace_logo(x),
      true,
    );
    rcmail.register_command(
      'workspace.change_visibility',
      () => rcmail.env.WSP_Param.change_visibility(),
      true,
    );
    rcmail.register_command(
      'workspace.compose',
      () => rcmail.env.WSP_Param.compose(),
      true,
    );
    rcmail.register_command(
      'workspace.webconf',
      () => rcmail.env.WSP_Param.create_webconf(),
      true,
    );
    rcmail.register_command(
      'workspace.webconf.needParams',
      () => rcmail.env.WSP_Param.create_webconf(true),
      true,
    );
    rcmail.register_command(
      'workspace.update_end_date',
      (jquery) => rcmail.env.WSP_Param.update_end_date(jquery.val()),
      true,
    );
    rcmail.register_command(
      'workspace.toggle_bar_color',
      () => {
        rcmail.env.WSP_Param.toggle_nav_color();
      },
      true,
    );
    rcmail.register_command(
      'workspace.update_primary_parameter',
      (config) => {
        rcmail.env.WSP_Param.update_primary_parameters(config);
      },
      true,
    );
    rcmail.register_command(
      'workspace.survey.create',
      () => {
        rcmail.env.WSP_Param.create_survey();
      },
      true,
    );
    rcmail.register_command(
      'workspace.survey.edit',
      (survey) => {
        rcmail.env.WSP_Param.create_survey(survey);
      },
      true,
    );
    rcmail.register_command(
      'workspace.survey.delete',
      (sid) => {
        rcmail.env.WSP_Param.delete_survey(sid);
      },
      true,
    );
    rcmail.register_command(
      'workspace.sync_list',
      rcmail.env.WSP_Param.sync_list_member.bind(rcmail.env.WSP_Param),
      true,
    );
    rcmail.register_command(
      'workspace.remove_list',
      rcmail.env.WSP_Param.delete_list.bind(rcmail.env.WSP_Param),
      true,
    );
    rcmail.register_command(
      'workspace.update_title',
      () => {
        if (
          !confirm(rcmail.gettext('change_title_confirmation', 'mel_workspace'))
        )
          return;
        rcmail.env.WSP_Param.update_primary_parameters({
          type: 'title',
          input: $('#spaceTitle'),
          checks: 'empty;already-exist',
          text_on_error:
            "Une erreur est survenue.\r\nImpossible de changer le titre de l'espace.",
          text_on_succes: 'Le titre a été changer avec succès.',
        });
      },
      true,
    );
    rcmail.register_command(
      'workspace.update_desc',
      (isDelete = false) => {
        let $input = $('#spaceDesc');
        if (isDelete) $input.val('');

        rcmail.env.WSP_Param.update_primary_parameters({
          type: 'desc',
          input: $input,
          checks: 'already-exist',
          text_on_error:
            "Une erreur est survenue.\r\nImpossible de changer la description de l'espace.",
          text_on_succes: 'la description a été changer avec succès.',
          action: (data, config, newValue, empty) => {
            $('#wsp-desc-desc').html(newValue);
            config.input.attr(
              'placeholder',
              newValue === empty ? 'Nouvelle description....' : newValue,
            );
            rcmail.env.WSP_Param.paramUpdated($('#wsp-param-btn-desc'), empty);
          },
        });
      },
      true,
    );
    rcmail.register_command(
      'workspace.update_hashtag',
      (isDelete = false) => {
        let $input = $('#spaceHashtag');

        if ($input.val().includes('#'))
          $input.val($input.val().replaceAll('#', ''));

        if (isDelete) $input.val('');

        $('#list-of-all-hashtag-param').css('display', 'none');

        rcmail.env.WSP_Param.update_primary_parameters({
          type: 'hashtag',
          input: $input,
          checks: 'already-exist',
          text_on_error:
            "Une erreur est survenue.\r\nImpossible de changer la thématique de l'espace.",
          text_on_succes: 'la thématique a été changer avec succès.',
          action: (data, config, newValue, empty) => {
            let $querry = $('.wsp-head .col-10');
            let $span = $querry.children()[0];

            if ($span.nodeName === 'SPAN') $span = $($span);
            else $span = false;

            const hashtag =
              newValue.includes('#') || newValue === empty
                ? newValue
                : `#${newValue}`;

            if (hashtag !== empty) {
              if ($span !== false) $span.html(hashtag);
              else {
                $span = null;
                $querry.prepend(`<span>${hashtag}</span>`);
              }
            } else if ($span !== false) $span.remove();

            config.input.attr(
              'placeholder',
              newValue === empty ? 'Nouvelle thématique....' : newValue,
            );
            rcmail.env.WSP_Param.paramUpdated(
              $('#wsp-param-btn-hashtag'),
              empty,
            );
          },
        });
      },
      true,
    );

    rcmail.addEventListener('onHashtagChange', (selector) => {
      if (selector.input === '#spaceHashtag') {
        rcmail.env.WSP_Param.paramUpdated($('#wsp-param-btn-hashtag'));
      }
    });
    //init end
  });
})();
