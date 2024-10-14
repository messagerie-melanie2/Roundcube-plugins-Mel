import { BnumConnector } from '../../helpers/bnum_connections/bnum_connections.js';
import { MelHtml } from '../../html/JsHtml/MelHtml.js';
import { MelObject } from '../../mel_object.js';
import { Mel_Promise } from '../../mel_promise.js';
import { module_bnum } from './module_bnum.js';

export { double_auth_modal };

MelHtml.create_alias('close_button', {
  after_callback(html) {
    html.addClass('done-button');
    html.attribs.id = 'modal-custom-button';

    if (
      html.attribs['data-is-start'] === true &&
      html.attribs.action === 'intro_modal'
    )
      html.attribs.action = null;

    html.attribs.onclick = function () {
      close_modal(
        double_auth_modal.Instance,
        $('#modal-custom-button')[0],
        html.attribs.action,
      );
    };
  },
  tag: 'button',
});

function close_modal(dam, dialog, action) {
  dam.closeDialog(dialog);

  if (action) dam[action]();
  else this.rcmail().triggerEvent('da.modal.close', dam);
}

function later_button(dam, dialog) {
  top.rcmail.triggerEvent('plugin.push_notification', {
    uid: 'double-auth-' + Math.random(),
    title: rcmail.gettext('mel_metapage.double_authentication_notification'),
    content: rcmail.gettext('mel_metapage.double_authentication_notification'),
    category: 'double_auth',
    action: [
      {
        title: 'Cliquez ici pour ouvrir les options',
        text: 'Options',
        command: 'open_double_auth',
      },
    ],
    created: Math.floor(Date.now() / 1000),
    modified: Math.floor(Date.now() / 1000),
    isread: false,
    local: true,
  });

  dam.closeDialog(dialog);
}

const bnum_connector = BnumConnector.connect;
BnumConnector.connect = async function (...args) {
  double_auth_modal.Instance?.disable_buttons?.();
  const data = await bnum_connector.call(BnumConnector, ...args);
  double_auth_modal.Instance?.enable_buttons?.();

  return data;
};

class double_auth_modal extends module_bnum {
  constructor() {
    super();
  }

  main() {
    super.main();
    this.nb_max_states = 4;
    double_auth_modal.Instance = this;
  }

  exec() {
    if (rcmail.env.double_authentification_forcee) {
      this.intro_modal();
    }
    return this;
  }

  disable_buttons() {
    $('.ui-dialog button').addClass('disabled').attr('disabled', 'disabled');
    $('.ui-dialog input').addClass('disabled').attr('disabled', 'disabled');
    return this;
  }

  enable_buttons() {
    $('.ui-dialog button')
      .removeClass('disabled')
      .removeAttr('disabled', 'disabled');
    $('.ui-dialog input')
      .removeClass('disabled')
      .removeAttr('disabled', 'disabled');
    return this;
  }

  intro_modal() {
    const self = this;

    const mois = [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ];

    const date = !rcmail.env.double_authentification_date_butoir?.date
      ? null
      : moment(rcmail.env.double_authentification_date_butoir?.date);
    let displayDate = date
      ? mois[date.format('M') - 1] + ' ' + date.format('YYYY')
      : '';

    const html = MelHtml.start
      .div({
        id: 'introduction',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n3',
      })
      .row()
      .col_8()
      .row()
      .span({ class: 'subtitle' })
      .text(rcmail.gettext('mel_metapage.informations'))
      .end()
      .end()
      .row()
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row()
      .p({ class: 'content' })
      .text(
        date
          ? rcmail
              .gettext('mel_metapage.introduction_text')
              .replace('%%date%%', displayDate)
          : 'mel_metapage.introduction_text_without_date',
      )
      .end()
      .end()
      .end()
      .col_4()
      .p()
      .img({
        src: `plugins/mel_metapage/skins/${rcmail.env.skin}/images/double_authentication.webp`,
        width: '150px',
      })
      .end()
      .end()
      .end()
      .row()
      .div({ class: 'custom-tooltipbuttons' })
      .close_button({ action: 'secondary_mail_modal' })
      .text(rcmail.gettext('mel_metapage.show_me'))
      .end()
      .button({
        id: 'modal-custom-button',
        class: 'done-button ml-3',
        onclick: function () {
          later_button(self, $('#modal-custom-button')[0]);
        },
      })
      .text(rcmail.gettext('mel_metapage.later'))
      .end('button')
      .end('div')
      .end('row')
      .end('div')
      .generate();

    rcmail.show_popup_dialog(html, '', null, {
      width: 600,
      resizable: false,
      height: 210,
    });

    setTimeout(() => {
      $('.ui-dialog .done-button').focus();
    }, 10);
  }

  secondary_mail_modal(isStart = false) {
    window.double_fact_saved = false;
    const self = this;

    const html = MelHtml.start
      .div({
        id: 'secondary-email',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row({ class: 'mb-2' })
      .p()
      .text(rcmail.gettext('mel_metapage.secondary_email_text'))
      .end()
      .p({ class: 'd-inline-flex align-items-center' })
      .icon('info', { class: 'mr-2' })
      .end()
      .text(rcmail.gettext('mel_metapage.different_email'))
      .end()
      .end()
      .row({ class: 'mb-4' })
      .input({
        type: 'email',
        id: 'email',
        class: 'form control',
        placeholder: 'Adresse e-mail...',
      })
      .span({ id: 'email-error', class: 'text-danger', style: 'display:none' })
      .end()
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-between' })
      .close_button({ action: 'intro_modal', 'data-is-start': isStart })
      .text(rcmail.gettext('mel_metapage.back'))
      .end()
      .button({
        id: 'modal-custom-button',
        class: 'next-button',
        onclick: async function () {
          const email = $('#email').val();
          if (self.isValidEmail(email)) {
            try {
              const data = await BnumConnector.connect(
                BnumConnector.connectors.settings_da_set_email_recup,
                {
                  params: { _val: email, _send_mail: true },
                },
              );

              if (BnumConnector.is_on_progress(data)) {
                throw new Error(
                  "Le connecteur n'est pas encore implémenté !",
                  1,
                );
              } else if (data.has_error) {
                console.log(data);
                self.displayTextError(
                  '#email-error',
                  rcmail.gettext('mel_metapage.send_email_error'),
                  100000,
                );
              } else {
                self.closeDialog($('#modal-custom-button')[0]);
                self.verification_mail_modal();
              }
            } catch (error) {
              console.error(error);
            }
          } else {
            self.displayTextError(
              '#email-error',
              rcmail.gettext('mel_metapage.email_format_error'),
            );
          }
        },
      })
      .text(rcmail.gettext('mel_metapage.send_code'))
      .end()
      .end()
      .end('div')
      .generate();

    rcmail.show_popup_dialog(html, '', null, {
      width: 600,
      resizable: false,
      height: 245,
    });

    this.createProgressPoint(1);

    $('.ui-dialog button.ui-dialog-titlebar-close').click(() => {
      this.rcmail().triggerEvent('da.modal.close', this);
    });

    setTimeout(() => {
      $('.ui-dialog input').first().focus();
    }, 10);
  }

  verification_mail_modal() {
    const self = this;

    const html = MelHtml.start
      .div({
        id: 'verification-email',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row({ class: 'my-2 justify-content-center' })
      .p()
      .text(rcmail.gettext('mel_metapage.verification_email_text'))
      .end()
      .end()
      .row({ class: 'justify-content-center' })
      .input({
        type: 'text',
        id: 'code',
        class: 'form control code-input text-center',
        placeholder: '0 0 0 0 0 0',
      })
      .end()
      .row({ class: 'justify-content-center' })
      .span({ id: 'error', class: 'text-danger', style: 'display:none' })
      .end()
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-between' })
      .close_button({ action: 'secondary_mail_modal' })
      .text(rcmail.gettext('mel_metapage.back'))
      .end()
      .button({
        id: 'modal-custom-button',
        class: 'next-button',
        onclick: async function () {
          try {
            const data = await BnumConnector.connect(
              BnumConnector.connectors.settings_da_set_token_otp,
              {
                params: { _token: $('#code').val().toString() },
              },
            );

            if (BnumConnector.is_on_progress(data)) {
              throw new Error("Le connecteur n'est pas encore implémenté !", 1);
            } else if (data.has_error) {
              console.log('ERROR', data);
            } else {
              switch (data.datas) {
                case -1:
                  self.displayTextError(
                    '#error',
                    rcmail.gettext('mel_metapage.code_expired'),
                  );
                  break;
                case 0:
                  self.displayTextError(
                    '#error',
                    rcmail.gettext('mel_metapage.wrong_code'),
                  );
                  break;
                case 1:
                  self.closeDialog($('#modal-custom-button')[0]);

                  const plugin = rcmail.triggerEvent('da.mail_changed.after', {
                    break: false,
                    modal: self,
                  });

                  if (!(plugin?.break ?? false)) self.application_modal();
                  break;
                default:
                  self.displayTextError(
                    '#error',
                    rcmail.gettext('mel_metapage.error'),
                  );
                  break;
              }
            }
          } catch (error) {
            console.error(error);
          }
        },
      })
      .text(rcmail.gettext('mel_metapage.continue'))
      .end()
      .end()
      .end('div')
      .generate();

    rcmail.show_popup_dialog(html, '', null, {
      width: 600,
      resizable: false,
      height: 200,
    });

    this.createProgressPoint(2);

    $('.ui-dialog button.ui-dialog-titlebar-close').click(() => {
      this.rcmail().triggerEvent('da.modal.close', this);
    });

    setTimeout(() => {
      $('.ui-dialog input').first().focus();
    }, 10);
  }

  application_modal() {
    const self = this;
    rcmail.env.continueWithUser = false;

    const html = MelHtml.start
      .div({
        id: 'application-modal',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row()
        .col_12()
          .row({ class: "justify-content-center" })
            .p({ class: "title" })
              .text(rcmail.gettext('mel_metapage.download_application'))
            .end()
          .end()
          .row({ class: "my-2 justify-content-center" })
            .p({class: "text-center"})
              .text(rcmail.gettext('mel_metapage.application_text'))
            .end()
          .end()
          .row({ class: "my-2" })
            .col_6({class: 'col-6 d-flex justify-content-center'})
              .div({class:'qrcode_frame text-center'})
                .p({class:'download_app'})
                  .text(rcmail.gettext('mel_metapage.download_app'))
                .end()
                .p()
                  .text('Google Authenticator')
                .end()
                .p()
                  .img({ src: `plugins/mel_metapage/skins/${rcmail.env.skin}/images/logo_store.png`})
                .end()
                .img({ src: `plugins/mel_metapage/skins/${rcmail.env.skin}/images/authenticator_link.svg`})
              .end()
            .end()
            .col_6({class: 'col-6 d-flex justify-content-center'})
              .div({class:'qrcode_frame text-center'})
                .p({class:'download_app'})
                  .text(rcmail.gettext('mel_metapage.download_app'))
                .end()
                .p()
                  .text('FreeOTP Authenticator')
                .end()
                .p()
                  .img({ src: `plugins/mel_metapage/skins/${rcmail.env.skin}/images/logo_store.png`})
                .end()
                .img({ src: `plugins/mel_metapage/skins/${rcmail.env.skin}/images/freeotp_link.svg`})
              .end()
            .end()
          .end()
          .p({class:'justify-content-center text-danger d-flex align-items-center my-3'})
              .icon('info', { class: 'mr-2' }).end().text('Si l\'une des applications est déjà installée, passez à l\'étape suivante.')
          .end()
          .p({class:'text-center mt-4'}).text(rcmail.gettext('mel_metapage.code_step_after')).end()
        .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-between' })
        .close_button({action:'verification_mail_modal'})
          .text(rcmail.gettext('mel_metapage.back'))
        .end()
        .button({ id: "modal-custom-button", class: "next-button",
          onclick:function () {
            rcmail.env.continueWithUser = true;
            self.closeDialog($('#modal-custom-button')[0]);
            self.add_key_modal();
          }
        })
          .text(rcmail.gettext('mel_metapage.continue'))
        .end('button')
      .end('row')
      .end('div')
      .generate();

    rcmail.show_popup_dialog(html, "", null, { width: 600, resizable: false, height: 530, close:function (event, ui) { $(this).remove(); self.checkBeforeClose() } })

    this.createProgressPoint(3);
  }

  add_key_modal() {
    const self = this;
    rcmail.env.continueWithUser = false;

    const html = MelHtml.start
      .div({
        id: 'application-email',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row({ class: 'my-2 justify-content-center' })
      .p({ class: 'text-center' })
      .text(rcmail.gettext('mel_metapage.scan_authentication_code'))
      .end()
      .end()
      .row({ class: 'justify-content-center' })
      .div({ id: 'qr-code' })
      .end()
      .end()
      .row({ class: 'mt-4 justify-content-center' })
      .p({ class: 'text-center' })
      .text(rcmail.gettext('mel_metapage.add_key'))
      .end()
      .end()
      .row({
        class: 'input-group input-group-code justify-content-center mb-4',
      })
      .input({
        type: 'text',
        class: 'form-control secret-code-input',
        id: 'code_to_copy',
        readonly: 'readonly',
      })
      .div({
        class: 'input-group-append',
        id: 'copy_to_clipboard',
        onclick: function () {
          $('#copy_to_clipboard').on('click', function () {
            const code = $('#code_to_copy');

            navigator.clipboard
              .writeText(code.val())
              .then(function () {
                $('#copy-icon').text('done').fadeIn();
                setTimeout(function () {
                  $('#copy-icon').text('content_copy').fadeIn();
                }, 3000);
              })
              .catch(function (err) {
                // Gestion des erreurs
                console.error('Erreur de copie : ', err);
              });
          });
        },
      })
      .span({
        id: 'copy-icon',
        class: 'material-symbols-outlined mt-1 ml-1 mr-2',
      })
      .text('content_copy')
      .end()
      .end()
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-between' })
      .close_button({ action: 'application_modal' })
      .text(rcmail.gettext('mel_metapage.back'))
      .end()
      .button({
        id: 'modal-custom-button',
        class: 'next-button',
        onclick: function () {
          rcmail.env.continueWithUser = true;
          self.closeDialog($('#modal-custom-button')[0]);
          self.verification_application_modal();
        },
      })
      .text(rcmail.gettext('mel_metapage.continue'))
      .end('button')
      .end('row')
      .end('div')
      .generate();

    if (!rcmail.env.userSecret) {
      mel_metapage.Functions.post(
        mel_metapage.Functions.url(
          'mel_metapage',
          'plugin.mel_doubleauth-adduser',
        ),
        {},
        (datas) => {
          datas = JSON.parse(datas);

          if (datas.code) {
            rcmail.env.userSecret = this.b32_encode(datas.code);

            rcmail.show_popup_dialog(html, '', null, {
              width: 600,
              resizable: false,
              height: 420,
              close: function (event, ui) {
                $(this).remove();
                self.checkBeforeClose();
              },
            });

            this.createProgressPoint(3);

            this.createQrCode('qr-code', rcmail.env.userSecret);

            $('#code_to_copy').val(rcmail.env.userSecret);
          } else {
            rcmail.display_message(
              rcmail.gettext('mel_metapage.doubleauth-error'),
              'error',
            );
          }
        }, //success
        (...args) => {
          rcmail.display_message(
            rcmail.gettext('mel_metapage.doubleauth-error'),
            'error',
          );
        }, //error
      );
    } else {
      rcmail.show_popup_dialog(html, '', null, {
        width: 600,
        resizable: false,
        height: 420,
        close: function (event, ui) {
          $(this).remove();
          self.checkBeforeClose();
        },
      });

      this.createProgressPoint(3);

      this.createQrCode('qr-code', rcmail.env.userSecret);

      $('#code_to_copy').val(rcmail.env.userSecret);
    }

    if (!window._bnum_da_on_quit) {
      $(window).on('beforeunload', (e) => {
        if (window.double_fact_saved === false) {
          rcmail.http_request('plugin.mel_doubleauth-removeuser');
          return "Attention! La configuration n'est pas terminée et l'authentification double facteur n'est pas encore activée, vous pouvez rester sur la page pour terminer la configuration ou quitter et laisse la double authentification désactivée.";
        }
      });

      window._bnum_da_on_quit = true;
    }

    setTimeout(() => {
      $('.ui-dialog input').first().focus();
    }, 10);
  }

  verification_application_modal() {
    const self = this;
    rcmail.env.continueWithUser = false;

    const html = MelHtml.start
      .div({
        id: 'verification-application',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row({ class: 'my-2 justify-content-center' })
      .p()
      .text(rcmail.gettext('mel_metapage.verification_application_text'))
      .end()
      .end()
      .row({ class: 'justify-content-center' })
      .input({
        type: 'text',
        id: 'code_to_check',
        class: 'form control code-input text-center',
        placeholder: '0 0 0 0 0 0',
      })
      .end()
      .row({ class: 'justify-content-center' })
      .span({ id: 'error', class: 'text-danger', style: 'display:none' })
      .end()
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-between mt-4' })
      .button({
        id: 'modal-custom-button',
        class: 'done-button',
        onclick: function () {
          rcmail.env.continueWithUser = true;
          self.closeDialog($('#modal-custom-button')[0]);
          self.add_key_modal();
        },
      })
      .text(rcmail.gettext('mel_metapage.back'))
      .end()
      .button({
        id: 'modal-custom-button',
        class: 'next-button',
        onclick: function () {
          let dialog = $('#modal-custom-button')[0];

          if ($('#code_to_check').val().length === 0) {
            self.displayTextError(
              '#error',
              rcmail.gettext('mel_metapage.enter_code'),
            );
            return;
          }

          let url =
            './?_action=plugin.mel_doubleauth-checkcode&code=' +
            $('#code_to_check').val();
          $.post(url, function (data) {
            if (data == rcmail.gettext('code_ok', 'mel_doubleauth')) {
              rcmail.env.continueWithUser = true;

              new Mel_Promise(async () => {
                const busy = rcmail.set_busy(true, 'loading');

                $('#verification-application button')
                  .addClass('disabled')
                  .attr('disabled', 'disabled');

                let createCode = function createCode() {
                  let min = 0;
                  let max = 9;
                  let n = 0;
                  let x = '';

                  while (n < 6) {
                    n++;
                    x += Math.floor(Math.random() * (max - min)) + min;
                  }
                  return x;
                };

                const max =
                  (
                    await BnumConnector.connect(
                      BnumConnector.connectors
                        .settings_da_get_recovery_code_max,
                      {},
                    )
                  )?.datas ?? 4;
                let codes = [];

                for (let index = 0; index < max; ++index) {
                  codes.push(createCode());
                }

                await MelObject.Empty().http_internal_post({
                  task: 'settings',
                  action: 'plugin.mel_doubleauth-save',
                  params: {
                    p2FA_activate: 1,
                    '2FA_recovery_codes': codes,
                  },
                  on_success: (datas) => {
                    rcmail.set_busy(false, 'loading', busy);

                    window.double_fact_saved = true;

                    self.closeDialog(dialog);
                    self.closing_modal();
                  },
                  on_error: (...args) => {
                    console.error(...args);
                  },
                });

                createCode = null;

                if (rcmail.busy) rcmail.set_busy(false, 'loading', busy);

                if ($('#verification-application button').length > 0)
                  $('#verification-application button')
                    .removeClass('disabled')
                    .removeAttr('disabled');
              });
            } else {
              self.displayTextError(
                '#error',
                rcmail.gettext('mel_metapage.wrong_code'),
              );
            }
          });
        },
      })
      .text(rcmail.gettext('mel_metapage.continue'))
      .end('button')
      .end('row')
      .end('div')
      .generate();

    rcmail.show_popup_dialog(html, '', null, {
      width: 600,
      resizable: false,
      height: 200,
      close: function (event, ui) {
        $(this).remove();
        self.checkBeforeClose();
      },
    });

    this.createProgressPoint(4);

    setTimeout(() => {
      $('.ui-dialog input').first().focus();
    }, 10);
  }

  closing_modal() {
    const self = this;

    const html = MelHtml.start
      .div({
        id: 'closing',
        tabindex: '0',
        class: 'double-auth-modal mx-5 mt-n4',
      })
      .row({ class: 'justify-content-center' })
      .div({ class: 'check_logo' })
      .span({ class: 'material-symbols-outlined' })
      .text('done')
      .end()
      .end()
      .end()
      .row()
      .col_12()
      .row({ class: 'justify-content-center' })
      .p({ class: 'title' })
      .text(rcmail.gettext('mel_metapage.double_authentication'))
      .end()
      .end()
      .row({ class: 'my-2 justify-content-center' })
      .p()
      .text(rcmail.gettext('mel_metapage.double_authentication_validation'))
      .end()
      .end()
      .end()
      .end()
      .row({ class: 'custom-tooltipbuttons justify-content-center' })
      .button({
        id: 'modal-custom-button',
        class: 'next-button',
        onclick: function () {
          rcmail.triggerEvent('da.da_changed.after', { modal: self });
          self.closeDialog($('#modal-custom-button')[0]);
        },
      })
      .text(rcmail.gettext('mel_metapage.close_double_auth'))
      .end('button')
      .end('row')
      .end('div')
      .generate();

    rcmail.show_popup_dialog(html, '', null, {
      width: 500,
      resizable: false,
      height: 280,
    });

    $('.ui-dialog button.ui-dialog-titlebar-close').click(() => {
      this.rcmail().triggerEvent('da.da_changed.after', { modal: this });
    });

    setTimeout(() => {
      $('.ui-dialog .next-button').focus();
    }, 10);
  }

  closeDialog(dialog) {
    $(dialog).closest('.ui-dialog-content').dialog('close');
  }

  isValidEmail(email) {
    const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{1,5})+$/;
    return emailPattern.test(email);
  }

  displayTextError(selector, message, time = 2000) {
    $(selector).text(message);
    $(selector).fadeIn();
    setTimeout(() => {
      $(selector).fadeOut();
    }, time);
  }
  createQrCode(id, secret) {
    let url_qrcode = `otpauth://totp/Bnum:${rcmail.env.username}?secret=${secret}&issuer=Bnum`;

    let qrcode = new QRCode(document.getElementById(id), {
      text: url_qrcode,
      width: 150,
      height: 150,
      colorDark: '#000',
      colorLight: '#fff',
      correctLevel: QRCode.CorrectLevel.L,
    });

    $('#' + id).prop('title', '');
  }

  checkBeforeClose() {
    if (rcmail.env.userSecret) {
      if (!rcmail.env.continueWithUser) {
        alert(rcmail.gettext('mel_metapage.doubleauth_not_activated'));
        rcmail.env.userSecret = null;
        rcmail.http_request('plugin.mel_doubleauth-removeuser');
      }
    }
  }

  createProgressPoint(numActivePoints) {
    if (numActivePoints < 0 || numActivePoints > this.nb_max_states) {
      console.error('Le paramètre doit être compris entre 0 et 4.');
      return;
    }

    const doubleAuthModalProgress = document.createElement('div');
    doubleAuthModalProgress.className = 'double-auth-modal-progress';

    for (let i = 0; i < this.nb_max_states; ++i) {
      const progressPoint = document.createElement('div');
      progressPoint.className = 'progress-point';

      if (i < numActivePoints) {
        progressPoint.classList.add('active');
      }

      doubleAuthModalProgress.appendChild(progressPoint);
    }

    $('.ui-dialog-title').html(doubleAuthModalProgress);
  }

  b32_encode(s) {
    /* encodes a string s to base32 and returns the encoded string */
    var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    var parts = [];
    var quanta = Math.floor(s.length / 5);
    var leftover = s.length % 5;

    if (leftover != 0) {
      for (var i = 0; i < 5 - leftover; i++) {
        s += '\x00';
      }
      quanta += 1;
    }

    for (i = 0; i < quanta; i++) {
      parts.push(alphabet.charAt(s.charCodeAt(i * 5) >> 3));
      parts.push(
        alphabet.charAt(
          ((s.charCodeAt(i * 5) & 0x07) << 2) | (s.charCodeAt(i * 5 + 1) >> 6),
        ),
      );
      parts.push(alphabet.charAt((s.charCodeAt(i * 5 + 1) & 0x3f) >> 1));
      parts.push(
        alphabet.charAt(
          ((s.charCodeAt(i * 5 + 1) & 0x01) << 4) |
            (s.charCodeAt(i * 5 + 2) >> 4),
        ),
      );
      parts.push(
        alphabet.charAt(
          ((s.charCodeAt(i * 5 + 2) & 0x0f) << 1) |
            (s.charCodeAt(i * 5 + 3) >> 7),
        ),
      );
      parts.push(alphabet.charAt((s.charCodeAt(i * 5 + 3) & 0x7f) >> 2));
      parts.push(
        alphabet.charAt(
          ((s.charCodeAt(i * 5 + 3) & 0x03) << 3) |
            (s.charCodeAt(i * 5 + 4) >> 5),
        ),
      );
      parts.push(alphabet.charAt(s.charCodeAt(i * 5 + 4) & 0x1f));
    }

    var replace = 0;
    if (leftover == 1) replace = 6;
    else if (leftover == 2) replace = 4;
    else if (leftover == 3) replace = 3;
    else if (leftover == 4) replace = 1;

    for (i = 0; i < replace; i++) parts.pop();
    for (i = 0; i < replace; i++) parts.push('=');

    return parts.join('');
  }
}
