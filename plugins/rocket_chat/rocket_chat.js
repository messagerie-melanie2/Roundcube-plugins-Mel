if (window.rcmail) {
	if (rcmail.env.rocket_chat_domain) {
		document.domain = rcmail.env.rocket_chat_domain;
	}	
	
	window.favico = new Favico({
		position: 'up',
		animation: 'none'
	});		

	function login()
	{
		return $.ajax({ // fonction permettant de faire de l'ajax
			type: "GET", // methode de transmission des données au fichier php
			url: MEL_ELASTIC_UI.url("discussion", "login"),//"/?_task=discussion&_action=login",
			success: function (data) {
				console.log("RC", data);
				data = JSON.parse(data);
				rcmail.env.rocket_chat_auth_token = data.token;
				rcmail.env.rocket_chat_user_id = data.uid;
			},
			error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
				console.error(xhr, ajaxOptions, thrownError);
			},
		});
	} 

	rcmail.addEventListener('init_ariane', function(evt) {
		window.ariane_id = evt === null ? "ariane_id" : evt;
		window.document.getElementById(ariane_id).onload = function() {
			new Promise(async (a,b) => {
			if (rcmail.env.rocket_chat_auth_token === undefined && rcmail.env.rocket_chat_user_id === undefined)
				await login();
			setTimeout(function() {
				//console.log('log', window.document.getElementById(ariane_id), window.document.getElementById(ariane_id).contentWindow);
				try {
					window.document.getElementById(ariane_id).contentWindow.postMessage({
						event: 'login-with-token',
						loginToken: rcmail.env.rocket_chat_auth_token,
						userId: rcmail.env.rocket_chat_user_id
					}, rcmail.env.rocket_chat_url);
				} catch (error) {
					console.error(error);
				}
				rcmail.env.ariane_is_logged = true;

				
			}, 50);
		});
		};

				// // Récupération de l'url rocket
				// if (rcmail.env.rocket_chat_gotourl) {
				// 	var rocket_chat_url = rcmail.env.rocket_chat_gotourl;
				//   }
				//   else {
				// 	var rocket_chat_url = sessionStorage.getItem('rocket_chat_url');
				//   if (!rocket_chat_url) {
				// 	rocket_chat_url = rcmail.env.rocket_chat_url;
				//   }
				//   }
				//   if (navigator.appName == "Microsoft Internet Explorer"){
				// 	  window.document.getElementById(ariane_id).src = rocket_chat_url;
				// 	  window.document.getElementById(ariane_id).contentWindow.location.reload(true);
				//   } else {
				// 	  window.document.getElementById(ariane_id).src = rocket_chat_url;
				//   }

	});
	
	window.addEventListener('message', (e) => {
		console.log("message", e.data);
		if (e.data.eventName == 'login-error') {
			rcmail.display_message(e.data.response, 'error');
		}
		else if (rcmail.env.rocket_chat_channel && e.data.eventName == 'startup' && e.data.data === true) {
			window.document.getElementById(window.ariane_id).contentWindow.postMessage({
				externalCommand: 'go',
				path: rcmail.env.rocket_chat_channel
			}, rcmail.env.rocket_chat_url);
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
		if (parent.ariane !== undefined)
		{
			if (e.data.eventName === "unread-changed-by-subscription" ||  e.data.eventName == 'unread-changed')
			{
					parent.ariane.update_channel(e);
			}
			else if (e.data.eventName === "status-changed" || e.data.eventName === "user-status-manually-set")
			{
				parent.ariane.update_status(e.data.data);
			}
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