if (window.rcmail) {
	function rc_url(task, action = "", args = null)
	{
		let url = task;
		if (action !== null && action !== undefined && action !== "")
			url += "&_action=" + action;

		if (window.location.href.includes(`${rcmail.env.mel_metapage_const.key}=${rcmail.env.mel_metapage_const.value}`) || window !== parent)
		{
			if (args === null || args === undefined)
			{
				args = {};
				args[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
			}
			else if (args[rcmail.env.mel_metapage_const.key] === undefined)
				args[rcmail.env.mel_metapage_const.key] = rcmail.env.mel_metapage_const.value;
		}

		if (args !== null)
		{
			for (const key in args) {
				if (Object.hasOwnProperty.call(args, key)) {
					const element = args[key];
					url += "&" + key + "=" + element
				}
			}
		}
		return rcmail.get_task_url(url, window.location.origin + window.location.pathname)
	}

	if (rcmail.env.rocket_chat_domain) {
		document.domain = rcmail.env.rocket_chat_domain;
	}	
	
	window.favico = new Favico({
		position: 'up',
		animation: 'none'
	});		

	rcmail.addEventListener("cookieChanged", (element) => {

		if (element.key === "ariane_need_to_reconnect" && (element.value == "true" || element.value == true))
		{
			login();
		}

	});

	rcmail.register_command("login_chat", login, true);

	function login()
	{
		//console.log("here");
		return $.ajax({ // fonction permettant de faire de l'ajax
			type: "GET", // methode de transmission des données au fichier php
			url: rc_url("discussion", "login"),//"/?_task=discussion&_action=login",
			success: function (data) {
				data = JSON.parse(data);
				rcmail.env.rocket_chat_auth_token = data.token;
				rcmail.env.rocket_chat_user_id = data.uid;
				rcmail.triggerEvent('rocket.chat.onloggin', {token:data.token, uid:data.uid, error:false});
			},
			error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
				console.error(xhr, ajaxOptions, thrownError);
				rcmail.triggerEvent('rocket.chat.onloggin', {error:true});
			},
		});
	} 


	function logout(onSuccess = null)
	{
		return $.ajax({ // fonction permettant de faire de l'ajax
			type: "GET", // methode de transmission des données au fichier php
			url: rc_url("chat", "logout"),//"/?_task=discussion&_action=login",
			success: function (data) {
				if (onSuccess !== null) onSuccess(data === "loggued");

				rcmail.triggerEvent('rocket.chat.onloggout', {datas:data, error:false});
			},
			error: function (xhr, ajaxOptions, thrownError) { // Add these parameters to display the required response
				console.error(xhr, ajaxOptions, thrownError);
				rcmail.triggerEvent('rocket.chat.onloggout', {datas:{xhr, ajaxOptions, thrownError}, error:true});
			},
		});
	} 

	rcmail.addEventListener('init_rocket_chat', async function(evt) {
		console.log('LOG ROCKET CHAT');
		window.chat_id = evt === null ? "ariane_id" : evt;
		
			await logout((loggued) => {
				if (!loggued)
					rcmail.env.rocket_chat_user_id = undefined;
			});
		if (rcmail.env.rocket_chat_auth_token === undefined || 
			rcmail.env.rocket_chat_user_id === undefined) await login();

		setTimeout(function() {
			try {
				window.document.getElementById(chat_id).contentWindow.postMessage({
					externalCommand: 'login-with-token',
					token: rcmail.env.rocket_chat_auth_token,
				}, '*');
			} catch (error) {
				try {
					parent.document.getElementById(chat_id).contentWindow.postMessage({
						externalCommand: 'login-with-token',
						token: rcmail.env.rocket_chat_auth_token,
					}, '*');
				} catch (error) {
					console.error(error);
				}
			}
			rcmail.env.ariane_is_logged = true;

			
		}, 50);

	});
	
	window.addEventListener('message', (e) => {

		if (e.data.eventName === undefined)
			return;

		 //console.info('chat',e.data.eventName,e.data);
		// console.trace();

		if (e.data.eventName == 'login-error') {
			rcmail.display_message(`###[Rocket.Chat]${e.data.response}`, 'error');
			console.error(`###[Rocket.Chat]${e.data.response}`, e);
			rcmail.triggerEvent('rocket.chat.event.login-error', {datas:e});
		}
		else if ( e.data.eventName == 'startup' && e.data.data === true) {
			const do_base_action = rcmail.triggerEvent('rocket.chat.event.startup', {do_base_action:true, datas:e})?.do_base_action ?? true;
			if (do_base_action)
			{
				if (rcmail.env.rocket_chat_channel) {
					window.document.getElementById(window.chat_id).contentWindow.postMessage({
						externalCommand: 'go',
						path: rcmail.env.rocket_chat_channel
					}, rcmail.env.rocket_chat_url);
				}
			}
		}
		else if (e.data.eventName == 'unread-changed') {
			const unread = e.data.data;
			const do_base_action = rcmail.triggerEvent('rocket.chat.event.unread-changed', {do_base_action:true, datas:e})?.do_base_action ?? true;
			
			if (do_base_action) {
				let title = rcmail.get_label('rocket_chat.task');
				if (unread) {
					title = '(' + unread + ') ' + title;
				}
				localStorage.setItem('rocket_chat_title', title);
			}
		}

		if (e.data.eventName === "room-opened")
		{
			rcmail.triggerEvent('rocket.chat.event.room-opened', {datas:e});
		}


		if (e.data.eventName === "unread-changed-by-subscription")
		{
			rcmail.triggerEvent('rocket.chat.event.unread-changed', {do_base_action:true, datas:e});
		}
		else if (e.data.eventName === "status-changed" || e.data.eventName === "user-status-manually-set")
		{
			rcmail.triggerEvent('rocket.chat.event.status-changed', {datas:e});
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
else
	console.warn("/!\\ Il n'y a pas d'environement RCMAIL, la connection automatique risque de ne pas fonctionner.");


