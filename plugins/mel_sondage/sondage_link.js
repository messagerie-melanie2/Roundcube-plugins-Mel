$(document).ready(function() {
	$(document).on('click', 'a', function (event) 
	{ 
		const url = $(this).attr('href');
		if (url && (url.indexOf(rcmail.env.sondage_external_url) === 0 || url.indexOf(rcmail.env.sondage_email_url) === 0)) {
			let other_params = '';

			if (url.indexOf(rcmail.env.sondage_external_url) === 0 && url.length > rcmail.env.sondage_external_url.length) {
				other_params = url.replace(rcmail.env.sondage_external_url, '');
			}
			else if (url.indexOf(rcmail.env.sondage_email_url) === 0 && url.length > rcmail.env.sondage_email_url.length) {
				other_params = url.replace(rcmail.env.sondage_email_url, '');
			}

			if (url === rcmail.env.sondage_create_sondage_url && $('#event-panel-summary #edit-title').length) {
				other_params += '&title=' + encodeURIComponent($('#event-panel-summary #edit-title').val()) 
							+ '&location=' + encodeURIComponent($('#event-panel-summary #edit-location').val())
						+ '&description=' + encodeURIComponent($('#event-panel-summary #edit-description').val());
				window.open(rcmail.env.sondage_apppoll_url.replace('%25%25other_params%25%25', encodeURIComponent(other_params)));
				event.preventDefault();
				event.stopImmediatePropagation();
				return;
			}
			
			$(this).attr('href', rcmail.env.sondage_apppoll_url.replace('%25%25other_params%25%25', encodeURIComponent(other_params)));
		}	
	});
	if (window.rcmail) {
		if (rcmail.env.task === 'calendar') {
			$('<div class="create_poll_link"><a target="_blank" class="button" href="' + rcmail.env.sondage_create_sondage_url + '">' + rcmail.get_label('mel_sondage.create poll') + '</a></div>').insertBefore('#edit-attendees-form .attendees-commentbox');
		}
	}
});