if (window.rcmail) {
	rcmail.addEventListener(
		'init',
		function() {
			if (rcmail.env.ismobile) {
				// remove the user/password/... input from login
				$('form > div#formlogintable > div').each(function() {
					$(this).remove();
				});
				
				$('#pasBALI').remove();

				// change task & action
				$('form').attr('action', './');
				$('input[name=_task]').attr('value', 'mail');
				$('input[name=_action]').attr('value', '');
				
				var text = '';
				text += '<div class="">' + rcmail.gettext(
						'two_step_verification_form',
				'mel_doubleauth') + '</div>';
				text += '<div class=""><input name="_code_2FA" id="2FA_code" style="width:150px; " size="10" autocapitalize="off" autocomplete="off" type="text" maxlength="10"></div>'
					
				// create textbox
				$('form > div#formlogintable').append(text);
				
				// focus
				$('#2FA_code').focus();
			} else {
				// remove the user/password/... input from login
				$('form > table > tbody > tr').each(function() {
					$(this).remove();
				});

				$('#pasBALI').remove();

				// change task & action
				$('form').attr('action', './');
				$('input[name=_task]').attr('value', 'mail');
				$('input[name=_action]').attr('value', '');

				var text = '';
				text += '<tr>';
				text += '<td colspan="2" align="center">'
						+ rcmail.gettext(
								'two_step_verification_form',
								'mel_doubleauth') + '</td>';
				text += '<tr/><tr>';
				text += '<td colspan="2" align="center"><input name="_code_2FA" id="2FA_code" style="width:150px; " size="10" autocapitalize="off" autocomplete="off" type="text" maxlength="10"></td>';
				text += '</tr>';

				// create textbox
				$('form > table > tbody:last').append(text);

				// focus
				$('#2FA_code').focus();
			}
		});
};
