if (window.rcmail) {
	if (rcmail.env.rocket_chat_domain) {
		document.domain = rcmail.env.rocket_chat_domain;
	}	
	
	window.favico = new Favico({
		position: 'up',
		animation: 'none'
	});		
	
	rcmail.addEventListener('init', function(evt) {
		window.document.getElementById('rocket_chat_frame').onload = function() {
			setTimeout(function() {
				window.document.getElementById('rocket_chat_frame').contentWindow.postMessage({
					event: 'login-with-token',
					loginToken: rcmail.env.rocket_chat_auth_token,
					userId: rcmail.env.rocket_chat_user_id
				}, rcmail.env.rocket_chat_url);
			}, 50);
		};
		// Récupération de l'url rocket
		var rocket_chat_url = sessionStorage.getItem('rocket_chat_url');
		if (!rocket_chat_url) {
			rocket_chat_url = rcmail.env.rocket_chat_url;
		}
		if (navigator.appName == "Microsoft Internet Explorer"){
			window.document.getElementById('rocket_chat_frame').src = rocket_chat_url;
			window.document.getElementById('rocket_chat_frame').contentWindow.location.reload(true);
		} else {
			window.document.getElementById('rocket_chat_frame').src = rocket_chat_url;
		}
	});
	
	window.addEventListener('message', (e) => {
		if (e.data.eventName == 'login-error') {
			rcmail.display_message(e.data.response, 'error');
		}
		else if (rcmail.env.rocket_chat_channel && e.data.eventName == 'startup' && e.data.data === true) {
			window.document.getElementById('rocket_chat_frame').contentWindow.postMessage({
				externalCommand: 'go',
				path: rcmail.env.rocket_chat_channel
			}, rcmail.env.ariane_url);
		}
		else if (e.data.eventName == 'unread-changed') {
			var unread = e.data.data;
			var title = rcmail.get_label('rocket_chat.task');
			if (unread) {
				title = '(' + unread + ') ' + title;
			}
			localStorage.setItem('rocket_chat_title', title);
			$('.button-rocket_chat .button-inner').text(title);
			document.title = title;
			refreshFavico();
			//sessionStorage.setItem('rocket_chat_url', window.document.getElementById('rocket_chat_frame').contentWindow.location);
		}
	});
	
	function refreshFavico() {
		if (favico) {
			var unread = Number(document.title.replace('(', '').replace(') ' + rcmail.get_label('rocket_chat.task'), ''));
			if (isNaN(unread) && document.title.indexOf('(') === 0) {
				unread = document.title.replace('(', '').replace(') ' + rcmail.get_label('rocket_chat.task'), '');
			}
			favico.badge(unread, {
				bgColor: typeof unread !== 'number' ? '#3d8a3a' : '#ac1b1b'
			});
		}
	}
}