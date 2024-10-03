var double_fact_saved = true;

if (window.rcmail) {
  rcmail.addEventListener('init', function (evt) {
    if (
      rcmail.env.task == 'settings' &&
      rcmail.env.action == 'plugin.mel_doubleauth'
    ) {
      window.onbeforeunload = function (e) {
        if (!window.double_fact_saved) {
          rcmail.http_request('plugin.mel_doubleauth-removeuser');
          return "Attention! La configuration n'est pas terminée et l'authentification double facteur n'est pas encore activée, vous pouvez rester sur la page pour terminer la configuration ou quitter et laisse la double authentification désactivée.";
        }
      };

      rcmail.addEventListener(
        'responseafterplugin.mel_doubleauth-removeuser',
        function (evt) {
          $('#p2FA_activate_button').removeAttr('disabled');
          $(
            '#mel_doubleauth-form fieldset.main div.table div.row.added',
          ).remove();
          window.double_fact_saved = true;
        },
      );

      rcmail.addEventListener(
        'responseafterplugin.mel_doubleauth-adduser',
        function (evt) {
          // Return bootstrap row
          function row(html, className = 'row added') {
            let div = document.createElement('div');
            div.className = className;
            div.innerHTML = html;
            return div;
          }

          // Return bootstrap col
          function col(html, className = 'col-sm my-auto') {
            let div = document.createElement('div');
            div.className = className;
            div.innerHTML = html;
            return div.outerHTML;
          }

          // Return cercle span
          function cercle(text) {
            let span = document.createElement('span');
            span.className = 'cercle';
            span.textContent = text;
            return span.outerHTML;
          }

          let secret = b32_encode(evt.response.code);
          let table = document.querySelector(
            '#mel_doubleauth-form fieldset.main div.table',
          );

          document.querySelector('#p2FA_secret').value = secret;

          // 2/ Open FreeOTP indication
          table.append(
            row(
              col(cercle(2), 'col-sm-1 my-auto') +
                col(
                  rcmail.gettext('action_2', 'mel_doubleauth') +
                    '<div id="img_qr_code" style="display: visible;"></div>',
                ),
            ),
          );

          // 3/ Input secret
          table.append(
            row(
              col(cercle(3), 'col-sm-1 my-auto') +
                col(
                  rcmail.gettext('action_3', 'mel_doubleauth') +
                    '&nbsp;&nbsp;<input type="text" class="form-control"  size="32" id="2FA_code_input" value="' +
                    secret +
                    '">',
                ),
            ),
          );

          // Show QR Code
          table.append(
            row(
              col('&nbsp;', 'col-sm-1') +
                col(
                  '<div id="2FA_qr_code" style="display: inline-block; margin-top: 10px; padding: 10px; background: #fff;"></div>',
                ),
            ),
          );

          // 4/ Code checker
          table.append(
            row(
              col(cercle(4), 'col-sm-1 my-auto') +
                col(
                  rcmail.gettext('action_4', 'mel_doubleauth') +
                    '&nbsp;&nbsp;<input type="text" class="form-control" id="2FA_code_to_check" maxlength="10" onkeypress="if (event.keyCode == 13) return false;">' +
                    '&nbsp;&nbsp;<input type="button" class="button mainaction btn btn-primary" id="2FA_check_code" value="' +
                    rcmail.gettext('check_code', 'mel_doubleauth') +
                    '"/>',
                ),
            ),
          );

          // 5/ Save indication
          table.append(
            row(
              col(cercle(5), 'col-sm-1 my-auto') +
                col(rcmail.gettext('action_5', 'mel_doubleauth')),
            ),
          );

          // Save button
          table.append(
            row(
              col('&nbsp;', 'col-sm-1 my-auto') +
                col(
                  '<input type="button" class="button mainaction 2FA_save btn btn-primary" onclick="return rcmail.command(\'plugin.mel_doubleauth-save\',\'\',this,event)" value="Enregistrer" disabled="disabled">',
                ),
            ),
          );

          // ajax
          $('#2FA_check_code').click(function () {
            url =
              './?_action=plugin.mel_doubleauth-checkcode&code=' +
              $('#2FA_code_to_check').val();
            $.post(url, function (data) {
              alert(data);
              if (data == rcmail.gettext('code_ok', 'mel_doubleauth')) {
                $('.2FA_save').removeAttr('disabled');
              }
            });
          });

          // add qr-code before msg_info
          let url_qr_code_values =
            'otpauth://totp/' +
            document.querySelector('#_username').value +
            '?secret=' +
            secret +
            '&issuer=M2Web';

          let qrcode = new QRCode(document.getElementById('2FA_qr_code'), {
            text: url_qr_code_values,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.L,
          });

          url_qr_code_values = 'otpauth://totp/image_qr_code&issuer=M2Web';
          qrcode = new QRCode(document.getElementById('img_qr_code'), {
            text: url_qr_code_values,
            width: 20,
            height: 20,
            colorDark: '#5882FA',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.L,
          });

          $('#2FA_qr_code').prop('title', ''); // enjoy the
          // silence
          // (qrcode.js uses
          // text to set
          // title)
        },
      );
    }

    // populate all fields
    function setup2FAfields() {
      function createCode() {
        let min = 0;
        let max = 9;
        let n = 0;
        let x = '';

        while (n < 6) {
          n++;
          x += Math.floor(Math.random() * (max - min)) + min;
        }
        return x;
      }

      rcmail.http_request('plugin.mel_doubleauth-adduser');

      $('#mel_doubleauth-form :input').each(function () {
        if ($(this).get(0).type == 'password') $(this).get(0).type = 'text';
      });

      $('#2FA_qr_code').slideDown();

      $("[name^='2FA_recovery_codes']").each(function () {
        $(this).get(0).value = createCode();
      });

      // disable save button. It needs check code to enabled again
      $('.2FA_save')
        .attr('disabled', 'disabled')
        .attr(
          'title',
          rcmail.gettext('check_code_to_activate', 'mel_doubleauth'),
        );
    }

    $('#p2FA_activate_button').click(function () {
      rcmail.triggerEvent('start-da-modal', {
        $input: $('#mail-da-input'),
        $button: $('#start-button-modal'),
        do_all: true,
      });
      // setup2FAfields();
      // $('#p2FA_activate_button').attr('disabled', 'disabled');
      // window.double_fact_saved = false;
    });

    // ajax
    $('#2FA_check_code').click(function () {
      url =
        './?_action=plugin.mel_doubleauth-checkcode&code=' +
        $('#2FA_code_to_check').val();
      $.post(url, function (data) {
        alert(data);
        if (data == rcmail.gettext('code_ok', 'mel_doubleauth'))
          $('.2FA_save').removeAttr('disabled');
      });
    });

    // to show/hide recovery_codes
    $('#2FA_show_recovery_codes').click(function () {
      if ($("[name^='2FA_recovery_codes']")[0].type == 'text') {
        $("[name^='2FA_recovery_codes']").each(function () {
          $(this).get(0).type = 'password';
        });
        $('#2FA_show_recovery_codes').get(0).value = rcmail.gettext(
          'show_recovery_codes',
          'mel_doubleauth',
        );
      } else {
        $("[name^='2FA_recovery_codes']").each(function () {
          $(this).get(0).type = 'text';
        });
        $('#2FA_show_recovery_codes').get(0).value = rcmail.gettext(
          'hide_recovery_codes',
          'mel_doubleauth',
        );
      }
    });

    // to show/hide qr_code
    click2FA_change_qr_code = function () {
      if ($('#2FA_qr_code').is(':visible')) {
        $('#2FA_qr_code').slideUp();
        $(this).get(0).value = rcmail.gettext('show_qr_code', 'mel_doubleauth');
      } else {
        $('#2FA_qr_code').slideDown();
        $(this).get(0).value = rcmail.gettext('hide_qr_code', 'mel_doubleauth');
      }
    };
    $('#2FA_change_qr_code').click(click2FA_change_qr_code);

    // create secret
    $('#2FA_create_secret').click(function () {
      rcmail.http_request('plugin.mel_doubleauth-adduser');
      // var lock = rcmail.set_busy(true, 'loading');
      // rcmail.http_request('plugin.mel_doubleauth-adduser', lock);
    });

    $('#2FA_desactivate_button').click(function () {
      $('#p2FA_secret').get(0).value = '';
      $("[name^='2FA_recovery_codes']").each(function () {
        $(this).get(0).value = '';
      });
      $('#2FA_qr_code').parent().parent().remove();
      rcmail.http_request('plugin.mel_doubleauth-removeuser');
      window.double_fact_saved = true;
      rcmail.gui_objects.mel_doubleauthform.submit();
    });

    function b32_encode(s) {
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
            ((s.charCodeAt(i * 5) & 0x07) << 2) |
              (s.charCodeAt(i * 5 + 1) >> 6),
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

    // Define Variables
    var tabmel_doubleauth = $('<li>')
      .attr('id', 'settingstabpluginmel_doubleauth')
      .addClass('tablink mel_doubleauth');
    var button = $('<a>')
      .attr('href', rcmail.env.comm_path + '&_action=plugin.mel_doubleauth')
      .html(rcmail.gettext('mel_doubleauth', 'mel_doubleauth'))
      .appendTo(tabmel_doubleauth)
      .attr('role', 'button');

    button.bind('click', function (e) {
      return rcmail.command('plugin.mel_doubleauth', this);
    });

    // Button & Register commands
    rcmail.add_element(tabmel_doubleauth, 'tabs');
    rcmail.register_command(
      'plugin.mel_doubleauth',
      function () {
        rcmail.goto_url('plugin.mel_doubleauth');
      },
      true,
    );
    rcmail.register_command(
      'plugin.mel_doubleauth-save',
      function () {
        window.double_fact_saved = true;
        rcmail.gui_objects.mel_doubleauthform.submit();
      },
      true,
    );

    $('#start-button-modal')
      .attr('type', 'button')
      .removeClass('disabled')
      .removeAttr('disabled')
      .click(() => {
        rcmail.triggerEvent('start-da-modal', {
          $input: $('#mail-da-input'),
          $button: $('#start-button-modal'),
        });
      });
  });
}
