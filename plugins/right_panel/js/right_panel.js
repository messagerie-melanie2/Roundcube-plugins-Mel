/**
 * Client script for the Right Panel plugin
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 */

// Store current_timestamp
var current_timestamp;
// Configure number of milliseconds before next refresh
var NEXT_REFRESH = 300000;
// Current page for events
var current_event_page = 0;
var events_element_by_page = 2;
// Web socket Ariane
var webSocketAriane = false;
var webSocketArianeConnected = false;
// Current Rocket User ID
var currentUserID;
// Events list
var eventsList = []
var lastUpdateEventsList = 0;
// Alarms list
var alarmsList = []
// Recents messages
var messagesList = [];
var lastUpdateContactsList = 0;
var refreshContactsListTimeout = null;
// Favorites contacts
var favoritesList = [];
var lastUpdateFavoritesList = 0;

// On click right panel minifier
$(document).on("click", '#right_panel #right_panel_minifier', function(e) {
	if ($('#right_panel').hasClass('minified')) {
		$('#right_panel').removeClass('minified');
		$('body').removeClass('right_panel_minified');
		if ($('#messagelistcontainer table.fixedcopy').length) {
			$('#messagelistcontainer table.fixedcopy').width($('#messagelistcontainer table.fixedcopy').width() - 132);
			$('#messagelistcontainer table.fixedcopy #rcmsubject').width($('#messagelistcontainer table.fixedcopy #rcmsubject').width() - 132);
		}
		rcmail.right_panel_storage_set('minified', false);
	}
	else {
		$('#right_panel').addClass('minified');
		$('body').addClass('right_panel_minified');
		if ($('#messagelistcontainer table.fixedcopy').length) {
			$('#messagelistcontainer table.fixedcopy').width($('#messagelistcontainer table.fixedcopy').width() + 132);
		}
		rcmail.right_panel_storage_set('minified', true);
	}
	// Reset HTML
	$('#right_panel').html('<span id="right_panel_minifier">Min-Max</span><div id="right_panel_presence" title="' + rcmail.get_label('right_panel.right_panel_presence_title') + '"></div><div id="right_panel_date"><span class="day"></span><span class="date"></span></div><div id="right_panel_events"></div><div id="right_panel_contacts"></div>')
	rcmail.right_panel_today_date();
	// Récupération des événéments
	rcmail.right_panel_user_presence();
	// Récupération des événéments
	rcmail.right_panel_get_events();
	// Récupération des contacts
	rcmail.right_panel_get_contacts(true);
	// Récupération des contacts récents sur Ariane
	rcmail.right_panel_ariane_web_socket();
});

// On click event, open calendar
$(document).on("click", '#right_panel_events .events_title .text', function(e) {
	var url = rcmail.env.comm_path;
	url = url.replace(/\_task=[a-z0-9_-]+/, '_task=calendar');
	window.open(url, '_blank');
});
$(document).on("click", '#right_panel_events .events_list .event', function(e) {
	if (!$(this).hasClass('new_event') && !$(this).hasClass('noevent')) {
		if (rcmail.env.task == 'calendar') {
			window.cal.event_show_dialog($(this).data('event'), e);
		}
		else {
			rcmail.right_panel_storage_set('event', $(this).data('event'), true, true);
			var url = rcmail.env.comm_path;
			url = url.replace(/\_task=[a-z0-9_-]+/, '_task=calendar');
			window.open(url, '_blank');
		}
	}	
});
$(document).on("click", '#right_panel_events .events_list .alarm .title', function(e) {
	if ($('#right_panel').hasClass('minified')) {
		var id = $(this).parent().attr('id');
		rcmail.http_post('utils/plugin.alarms', { action:'dismiss', data:{ id:id, snooze:0 } });
		for (var i = 0; i < window.alarmsList.length; i++) {
			if (window.alarmsList[i].id == id) {
				window.alarmsList.splice(i, 1);
				rcmail.right_panel_storage_set('alarmsList', window.alarmsList, true);
				rcmail.right_panel_refresh_events();
				return;
			}
		}
	}
	else if (rcmail.env.task != 'tasks') {
		var url = rcmail.env.comm_path;
		url = url.replace(/\_task=[a-z0-9_-]+/, '_task=tasks');
		window.open(url, '_blank');
	}
	
});
$(document).on("click", '#right_panel_events .events_list .alarm .later', function(e) {
	var id = $(this).parent().parent().attr('id');
	rcmail.http_post('utils/plugin.alarms', { action:'dismiss', data:{ id:id, snooze:10 } });
	for (var i = 0; i < window.alarmsList.length; i++) {
		if (window.alarmsList[i].id == id) {
			window.alarmsList.splice(i, 1);
			rcmail.right_panel_storage_set('alarmsList', window.alarmsList, true);
			rcmail.right_panel_refresh_events();
			return;
		}
	}
});
$(document).on("click", '#right_panel_events .events_list .alarm .dismiss', function(e) {
	var id = $(this).parent().parent().attr('id');
	rcmail.http_post('utils/plugin.alarms', { action:'dismiss', data:{ id:id, snooze:0 } });
	for (var i = 0; i < window.alarmsList.length; i++) {
		if (window.alarmsList[i].id == id) {
			window.alarmsList.splice(i, 1);
			rcmail.right_panel_storage_set('alarmsList', window.alarmsList, true);
			rcmail.right_panel_refresh_events();
			return;
		}
	}
});
$(document).on("click", '#right_panel_contacts .contacts_count .email', function(e) {
	var url = rcmail.env.comm_path;
	url = url.replace(/\_task=[a-z0-9_-]+/, '_task=mail');
	window.open(url, '_blank');
});
$(document).on("click", '#right_panel_contacts .contacts_count .im', function(e) {
	var url = rcmail.env.comm_path;
	url = url.replace(/\_task=[a-z0-9_-]+/, '_task=ariane');
	window.open(url, '_blank');
});

$(document).on("click", '#right_panel_events .new_event', function(e) {
	return rcmail.commands['add-event-from-shortcut'] ? rcmail.command('add-event-from-shortcut', '', e.target, e) : rcmail.command('addevent', '', e.target, e);
});

// Pagination event click
$(document).on("click", '#right_panel_events .pagination .today', function(e) {
	if ($('#right_panel').hasClass('minified')) {
		var url = rcmail.env.comm_path;
		url = url.replace(/\_task=[a-z0-9_-]+/, '_task=calendar');
		window.open(url, '_blank');
	}
	else if (!$(this).hasClass('disabled')) {
		window.current_event_page = 0;
		rcmail.right_panel_events_pagination();
	}
});
$(document).on("click", '#right_panel_events .pagination .previous', function(e) {
	if (!$(this).hasClass('disabled')) {
		window.current_event_page--;
		rcmail.right_panel_events_pagination();
	}	
});
$(document).on("click", '#right_panel_events .pagination .next', function(e) {
	if (!$(this).hasClass('disabled')) {
		window.current_event_page++;
		rcmail.right_panel_events_pagination();
	}	
});

// Contacts menu
$(document).on("click", '#right_panel_contacts .contacts_menu .recents_button', function(e) {
	if ($(this).hasClass('disabled')) {
		$(this).removeClass('disabled');
		$('#right_panel_contacts .contacts_menu .favorites_button').addClass('disabled');
		rcmail.right_panel_get_contacts_list();
		rcmail.right_panel_storage_set('contacts_menu', 'recents_button');
	}
});
$(document).on("click", '#right_panel_contacts .contacts_menu .favorites_button', function(e) {
	if ($(this).hasClass('disabled')) {
		$(this).removeClass('disabled');
		$('#right_panel_contacts .contacts_menu .recents_button').addClass('disabled');
		rcmail.right_panel_get_contacts_list();
		rcmail.right_panel_storage_set('contacts_menu', 'favorites_button');
	}
});
$(document).on("click", '#right_panel_contacts .contacts_favorites .contact', function(e) {
	var cid = $(this).find('.cid').text();
	if (cid) {
		var url = rcmail.url('addressbook/show', {
			_framed: 1,
			_source: rcmail.env['username'].replace('.','_-P-_'),
			_cid: cid
		});
		rcmail.open_window(url, true, true);
	}
});
$(document).on("click", '#right_panel_contacts .contacts_recents .contact', function(e) {
	var id = $(this).attr('id');
	var contact = window.messagesList[id];
	if (contact) {
		if (contact.type == 'im') {
			rcmail.right_panel_open_rocket_chat_url(contact.im);
		}
		else if (contact.type == 'mail') {
			return rcmail.right_panel_show_message(contact.id);
		}
	}
});
$(document).on("click", '#right_panel_presence', function(event) {
	document.getElementById('useroptions').style.width = this.offsetWidth + 'px'; 
	return UI.toggle_popup('useroptions', {target: this, pointerType: 'mouse', pageX: event.pageX, pageY: event.pageY, clientX: event.clientX, clientY: event.clientY});
});

if (window.rcmail) {
	rcmail.addEventListener('init', function(evt) {
		// Ajouter le right panel au body
		$('body').append('<div id="right_panel"></div>');
		$('#right_panel').html('<span id="right_panel_minifier">→</span><div id="right_panel_presence" title="' + rcmail.get_label('right_panel.right_panel_presence_title') + '"></div><div id="right_panel_date"><span class="day"></span><span class="date"></span><span class="min"></span></div><div id="right_panel_events"></div><div id="right_panel_contacts"></div>')
		// Gestion du minified
		var minified = rcmail.right_panel_storage_get('minified');
		if (minified && minified === 'true' || $(window).width() <= 1100) {
			$('#right_panel').addClass('minified');
			$('body').addClass('right_panel_minified');
		}
		// Gestion des classes iframe
		if ($('#mainscreen').hasClass('rocket_chat-box') || $('#mainscreen').hasClass('mel_sondage-box') || $('#mainscreen').hasClass('melanie2_owncloud-box')) {
			$('#right_panel').addClass('iframecss');
		}
		rcmail.right_panel_today_date();
		// Get from session storage
		window.messagesList = rcmail.right_panel_storage_get('messagesList', true, false, []);
		window.favoritesList = rcmail.right_panel_storage_get('favoritesList', true, false, []);
		window.alarmsList = rcmail.right_panel_storage_get('alarmsList', true, false, []);
		window.eventsList = rcmail.right_panel_storage_get('eventsList', true, false, []);
		window.mailCount = rcmail.right_panel_storage_get('mailCount', false, false, 0);
		window.imCount = rcmail.right_panel_storage_get('imCount', false, false, 0);
		// Récupération des événéments
		rcmail.right_panel_user_presence();
		// Récupération des événéments
		rcmail.right_panel_get_events();
		// Récupération des contacts
		rcmail.right_panel_get_contacts(true);
		// Récupération des contacts récents sur Ariane
		rcmail.right_panel_ariane_web_socket();
		// Ouvrir l'événement en attente
		if (rcmail.env.task == 'calendar') {
			setTimeout(function() {
				var event = rcmail.right_panel_storage_get('event', false, true);
				if (event) {
					window.cal.event_show_dialog(JSON.parse(event));
				}
				rcmail.right_panel_storage_remove('event', true);
			}, 500);
		}
		// Use display alarms from libcalendaring
		rcmail.addEventListener('plugin.display_alarms', function (alarms) {
			// Sort alarms by alarm start
			alarms.sort(function(x, y) {
				return x.start > y.start;
			});
			window.alarmsList = alarms;
			rcmail.right_panel_storage_set('alarmsList', window.alarmsList, true);
			rcmail.right_panel_refresh_events();
		});
		// Call refresh panel
		rcmail.addEventListener('plugin.refresh_right_panel', function () {
			// Ajouter le right panel au body
			rcmail.right_panel_today_date();
			// Récupération des événéments
			rcmail.right_panel_get_events();
			// Mise à jour des contacts
			if ($('#right_panel').hasClass('minified')) {
				rcmail.right_panel_get_mails_count(true);
			}
			else {
				rcmail.right_panel_get_contacts_list(true);
			}
		});
		// Send refresh
//		setTimeout(function() {
//			rcmail.refresh();
//		}, 5000);
	});
	rcmail.addEventListener('actionafter', function(props) {
		if (props.action == 'toggle_status') {
			//rcmail.right_panel_get_contacts_recents(true);
			if ($('#right_panel').hasClass('minified')) {
				setTimeout(function() {
					rcmail.right_panel_get_mails_count(true);
				}, 1000);
			}
		}
		else if (props.action == 'event') {
			// Récupération des événéments
			rcmail.right_panel_get_events();
		}
	});
	window.addEventListener('storage', function(e) {
		if (e.key == 'rocket_chat_title') {
			rcmail.right_panel_ariane_web_socket();
		}
		else if (e.key == 'right_panel.ariane_user_status') {
			$('#right_panel #right_panel_presence').removeClass('online');
			$('#right_panel #right_panel_presence').removeClass('offline');
			$('#right_panel #right_panel_presence').removeClass('away');
			$('#right_panel #right_panel_presence').removeClass('busy');
			$('#right_panel #right_panel_presence').addClass(e.newValue);
			rcmail.env['ariane_user_status'] = e.newValue;
			$('#right_panel #right_panel_presence .presence').text(rcmail.get_label('right_panel.' + rcmail.env['ariane_user_status']));
		}
		else if (e.key == 'right_panel.messagesList') {
			window.messagesList = JSON.parse(e.newValue);
			clearTimeout(window.refreshContactsListTimeout);
			window.refreshContactsListTimeout = setTimeout(function() {
				rcmail.right_panel_refresh_recents_contacts();
			}, 500);
		}
		else if (e.key == 'right_panel.eventsList') {
			window.eventsList = JSON.parse(e.newValue);
			rcmail.right_panel_refresh_events();
		}
		else if (e.key == 'right_panel.alarmsList') {
			window.alarmsList = JSON.parse(e.newValue);
			rcmail.right_panel_refresh_events();
		}
		else if (e.key == 'right_panel.favoritesList') {
			window.favoritesList = JSON.parse(e.newValue);
			rcmail.right_panel_refresh_favorites_contacts();
		}
		else if (e.key == 'right_panel.imCount') {
			window.imCount = e.newValue;
			$('#right_panel_contacts .contacts_count .im').text(window.imCount);
		}
		else if (e.key == 'right_panel.mailCount') {
			window.mailCount = e.newValue;
			$('#right_panel_contacts .contacts_count .email').text(window.mailCount);
		}
	});
	// Response after event action
	rcmail.addEventListener('responseafterevent', function(evt) {
		// Récupération des événéments
		rcmail.right_panel_get_events();
	});
	// Favorites contacts list callback
	rcmail.addEventListener('responseafterplugin.list_contacts_favorites', function(evt) {
		window.favoritesList = evt.response.contacts;
		rcmail.right_panel_refresh_favorites_contacts();
		rcmail.right_panel_storage_set('favoritesList', window.favoritesList, true);
		window.lastUpdateFavoritesList = Date.now();
	});
}

// Read cookie value
function getCookieValue(a) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}

// Set today date
rcube_webmail.prototype.right_panel_today_date = function() {
  var date = new Date();
  window.current_timestamp = Math.round(date.getTime()/1000)
  if ($('#right_panel').hasClass('minified')) {
	  $('#right_panel_date .day').text(this.get_label("right_panel.day_" + date.getDay()));
	  $('#right_panel_date .date').text(date.getDate() + " " + this.get_label("right_panel.month_min_" + date.getMonth()));
  }
  else {
	  $('#right_panel_date .day').text(this.get_label("right_panel.day_" + date.getDay()));
	  $('#right_panel_date .date').text(date.getDate() + " " + this.get_label("right_panel.month_" + date.getMonth()));
  }
  $('#right_panel_date').attr('title', this.get_label("right_panel.day_" + date.getDay()) + " " + date.getDate() + " " + this.get_label("right_panel.month_" + date.getMonth()) + " " + date.getFullYear());
};

//Set user presence
rcube_webmail.prototype.right_panel_user_presence = function() {
	// Gestion de la presence
	if (!rcmail.env['ariane_user_status']) {
		rcmail.env['ariane_user_status'] = rcmail.right_panel_storage_get('ariane_user_status');
	}
	rcmail.right_panel_storage_set('ariane_user_status', rcmail.env['ariane_user_status']);
	$('#right_panel_presence').append('<span class="userstatus"></span>');
	if (!$('#right_panel').hasClass('minified')) {
		$('#right_panel_presence').append('<span class="fullname">' + rcmail.env['user_fullname'] + '</span>');
	}
	
	$('#right_panel #right_panel_presence').removeClass('online');
	$('#right_panel #right_panel_presence').removeClass('offline');
	$('#right_panel #right_panel_presence').removeClass('away');
	$('#right_panel #right_panel_presence').removeClass('busy');
	$('#right_panel #right_panel_presence').addClass(rcmail.env['ariane_user_status']);
	
	if ($('#right_panel').hasClass('minified')) {
		$('#right_panel_presence').append('<span class="presence">' + rcmail.get_label('right_panel.' + rcmail.env['ariane_user_status'] + '_min') + '</span>');
		$('#useroptions').addClass('minified');
		$('#useroptions ul#useroptionsmenu .presence').remove();
		$('#useroptions ul#useroptionsmenu').prepend('<li role="menuitem" class="presence offline"><a class="active" href="#" onclick="rcmail.change_im_status(\'offline\')">' + rcmail.get_label('right_panel.offline_min') + '</a></li>');
		$('#useroptions ul#useroptionsmenu').prepend('<li role="menuitem" class="presence away"><a class="active" href="#" onclick="rcmail.change_im_status(\'away\')">' + rcmail.get_label('right_panel.away_min') + '</a></li>');
		$('#useroptions ul#useroptionsmenu').prepend('<li role="menuitem" class="presence busy"><a class="active" href="#" onclick="rcmail.change_im_status(\'busy\')">' + rcmail.get_label('right_panel.busy_min') + '</a></li>');
		$('#useroptions ul#useroptionsmenu').prepend('<li role="menuitem" class="presence online"><a class="active" href="#" onclick="rcmail.change_im_status(\'online\')">' + rcmail.get_label('right_panel.online_min') + '</a></li>');
		$('#useroptions ul#useroptionsmenu #useroptionsitemlogout a').text(rcmail.get_label('right_panel.logout_min'));
	}
	else {
		$('#useroptions ul#useroptionsmenu .presence').remove();
		$('#useroptions').removeClass('minified');
		$('#right_panel_presence').append('<span class="presence">' + rcmail.get_label('right_panel.' + rcmail.env['ariane_user_status']) + '</span>');
		$('#useroptions ul#useroptionsmenu').prepend('<li role="menuitem" class="presence offline"><a class="active" href="#" onclick="rcmail.change_im_status(\'offline\')">' + rcmail.get_label('right_panel.offline') + '</a></li>');
		$('#useroptions ul#useroptionsmenu').prepend('<li role="menuitem" class="presence away"><a class="active" href="#" onclick="rcmail.change_im_status(\'away\')">' + rcmail.get_label('right_panel.away') + '</a></li>');
		$('#useroptions ul#useroptionsmenu').prepend('<li role="menuitem" class="presence busy"><a class="active" href="#" onclick="rcmail.change_im_status(\'busy\')">' + rcmail.get_label('right_panel.busy') + '</a></li>');
		$('#useroptions ul#useroptionsmenu').prepend('<li role="menuitem" class="presence online"><a class="active" href="#" onclick="rcmail.change_im_status(\'online\')">' + rcmail.get_label('right_panel.online') + '</a></li>');
		$('#useroptions ul#useroptionsmenu #useroptionsitemlogout a').text(rcmail.get_label('right_panel.logout'));
	}
};

// Get value from cache
rcube_webmail.prototype.right_panel_storage_get = function(name, fromJson = false, local = false, defaultValue = null) {
	if (this.env.keep_login) {
		var value = window.localStorage.getItem('right_panel.' + name);
	}
	else {
		var value = window.sessionStorage.getItem('right_panel.' + name);
	}
	
	if (value == null) {
		value = defaultValue;
	}
	else {
		if (fromJson) {
			value = JSON.parse(value);
		}
	}
	return value;
};

// Set value to cache
rcube_webmail.prototype.right_panel_storage_set = function(name, value, toJson = false, local = false) {
	if (toJson) {
		value = JSON.stringify(value);
	}
	if (this.env.keep_login) {
		window.localStorage.setItem('right_panel.' + name, value);
	}
	else {
		window.sessionStorage.setItem('right_panel.' + name, value);
	}
};

// Remove value from cache
rcube_webmail.prototype.right_panel_storage_remove = function(name, local = false) {
	if (this.env.keep_login) {
		window.localStorage.removeItem('right_panel.' + name);
	}
	else {
		window.sessionStorage.removeItem('right_panel.' + name);
	}
};

// Open Message
rcube_webmail.prototype.right_panel_show_message = function(id) {
	if (!id)
		return;

	var win, target = window,
	  url = this.params_from_uid(id, {_caps: this.browser_capabilities()});
	
	url = this.url('mail/show', url);
	url = url.replace(/&\_account=[a-z0-9._%-]+/, '');
	url = url.replace(/\_mbox=[a-zA-Z0-9._%-]+/, '_mbox=INBOX');
    this.location_href(url, target, true);
};

// Open Rocket Chat URL
rcube_webmail.prototype.right_panel_open_rocket_chat_url = function(channel, new_window = false) {
	if (rcmail.task == 'ariane') {
		window.document.getElementById('rocket_chat_frame').contentWindow.postMessage({
			externalCommand: 'go',
			path: channel
		}, rcmail.env.ariane_url);
	}
	else {
		var url = rcmail.env.comm_path;
		url = url.replace(/\_task=.*/, '_task=ariane');
		url = url + '&_channel=' + channel;
		if (new_window) {			
			if ($('#rocketchatframe').length) {
				window.document.getElementById('rocketchatframe').contentWindow.postMessage({
					externalCommand: 'go',
					path: channel
				}, rcmail.env.ariane_url);
				$('#rocketchatframe').dialog('open').width(600);
			}
			else {				
				var frame = $('<iframe>').attr('id', 'rocketchatframe')
					.attr('src', rcmail.env.ariane_url)
					.attr('frameborder', '0')
				    .appendTo(document.body);

				frame.dialog({
					modal: false,
					resizable: false,
					bgiframe: true,
					width: 600,
					height: 500,
					rcmail: rcmail
				}).width(600);
				
				window.document.getElementById('rocketchatframe').onload = function() {
					setTimeout(function() {
						window.document.getElementById('rocketchatframe').contentWindow.postMessage({
							event: 'login-with-token',
							loginToken: rcmail.env.ariane_auth_token,
							userId: rcmail.env.ariane_user_id
						}, rcmail.env.ariane_url);				
					}, 50);
				};
				
				window.addEventListener('message', (e) => {
				    if (e.data.eventName == 'startup' && e.data.data) {
				    	window.document.getElementById('rocketchatframe').contentWindow.postMessage({
							externalCommand: 'go',
							path: channel
						}, rcmail.env.ariane_url);
				    }
				    else if (e.data.eventName == 'unread-changed') {
				    	rcmail.right_panel_ariane_web_socket();
					}
				});
			}			
		}
		else {
			var win = window.open(url, '_blank');
			win.focus();
		}
	}
};

// Get calendar next events
rcube_webmail.prototype.right_panel_get_events = function() {
  if (window.eventsList.length && !$('#right_panel_events .events_list .event').length) {
    this.right_panel_refresh_events();
  }
  if (window.lastUpdateEventsList && (Date.now() - window.lastUpdateEventsList) < window.NEXT_REFRESH) {
    // The refresh is to early
    return;
  }
	// Get current timestamp
	if ($('#right_panel').hasClass('minified')) {
		var end_timestamp = window.current_timestamp + (1 * 24 * 60 * 60); // Add 1 day
	}
	else {
		var end_timestamp = window.current_timestamp + (5 * 24 * 60 * 60); // Add 5 days
	}
	$.ajax({
		  method: "GET",
		  url: this.url('calendar/load_events', {
		        source: this.env['username'].replace('.','_-P-_'),
		        start: window.current_timestamp,
		        end: end_timestamp,
		    }),
	}).done(function(json) {
		var events = JSON.parse(json);
		if (events) {
			window.eventsList = events;
			rcmail.right_panel_storage_set('eventsList', window.eventsList, true);
			rcmail.right_panel_refresh_events();
			window.lastUpdateEventsList = Date.now();
		}
	});
};

// Refresh calendar events display based on local storage
rcube_webmail.prototype.right_panel_refresh_events = function() {
	function checkTime(i) {
	  if (i < 10) {
	    i = "0" + i;
	  }
	  return i;
	}

	var events = window.eventsList;
	$('#right_panel_events').html('');
	if (events) {
		// Sort events by event start
		events.sort(function(x, y) {
			return x.start > y.start;
		});
		var today = new Date();
		if ($('#right_panel').hasClass('minified')) {
			$('#right_panel_events').append('<div class="pagination"><span class="today" title="' + this.get_label('right_panel.today_title') + '">' + this.get_label('right_panel.today') + '</span></div>');
			$('#right_panel_events').append('<div class="events_list"></div>');
			var count_events_today = 0, count_events = 0;
			// Gestion des alarmes
			if (window.alarmsList.length) {
				for (var i = 0; i < window.alarmsList.length; i++) {
					var alarm = window.alarmsList[i];
					var start_date = new Date(alarm.start);
					if (today.getDate() == start_date.getDate() && today.getMonth() == start_date.getMonth()) {
						var date = rcmail.get_label("right_panel.today_min");
					}
					else {
						var date = rcmail.get_label("right_panel.day_min_" + start_date.getDay()) + " " + start_date.getDate() + " " + this.get_label("right_panel.month_min_" + start_date.getMonth());
					}
					if (!alarm.allDay) {
						var time = checkTime(start_date.getHours()) + ':' + checkTime(start_date.getMinutes());
						date = rcmail.get_label('right_panel.date').replace(/%%day%%/, date).replace(/%%hour%%/, time);
					}
					var title = alarm.title;
					var type = alarm.id.split(':')[0];
					$('#right_panel_events .events_list').append('<div class="item alarm" id="' + alarm.id + '" title="' + title + '"><span class="type">' + rcmail.get_label("right_panel." + type) + '</span><span class="date">' + date + '</span><span class="title">' + title + '</span></div>');
					$('#right_panel_events .events_list .event[id="' + alarm.id + '"]').data('event', event);
					count_events++;
					if (count_events == 2) {
						break;
					}
				}
			}
			for (var i = 0; i < events.length; i++) {
				var event = events[i];
				var start_date = new Date(event.start);
				var end_date = new Date(event.end);
				if (event.allDay) {
					end_date.setDate(end_date.getDate() + 1);
				}
				if (end_date.getTime() < Date.now()) {
					continue;
				}
				if (today.getDate() == start_date.getDate() && today.getMonth() == start_date.getMonth()) {
					if (event.allDay) {
						var start = '00:00';
						var end = '00:00';
					}
					else {
						var start = checkTime(start_date.getHours()) + ':' + checkTime(start_date.getMinutes());
						var end = checkTime(end_date.getHours()) + ':' + checkTime(end_date.getMinutes());
					}
					var title = event.title;
					if (count_events == 0) {
						$('#right_panel_events .events_list').append('<div class="event item ' + event.status + '" id="' + event._id + '" title="' + title + '"><span class="title">' + event.title + '</span><span class="start">' + start + '</span><span class="date_separator"></span><span class="end">' + end + '</span></div>');
						$('#right_panel_events .events_list .event[id="' + event._id + '"]').data('event', event);
						count_events++;
					}
					else if (count_events == 1) {
						$('#right_panel_events .events_list').append('<div class="event item ' + event.status + '" id="' + event._id + '" title="' + title + '"><span class="title">' + event.title + '</span><span class="start">' + start + '</span><span class="date_separator"></span><span class="end">' + end + '</span><span class="count_event_today"></span></div>');
						$('#right_panel_events .events_list .event[id="' + event._id + '"]').data('event', event);
						count_events++;
					}
					else {
						count_events_today++;
					}
				}
				else {
					break;
				}
			}
			// Gestion du count
			if (count_events_today) {
				$('#right_panel_events .events_list .event .count_event_today').text('+' + count_events_today);
			}
		}
		else {
			$('#right_panel_events').append('<div class="events_title"><span class="text" title="' + this.get_label("right_panel.event_title") + '">' + this.get_label("right_panel.next_events") + '</span><span class="new_event" title="' + this.get_label("right_panel.new_event_title") + '">' + this.get_label("right_panel.new_event") + '</span></div>');
			$('#right_panel_events').append('<div class="pagination"><span class="previous" title="' + this.get_label('right_panel.previous_title') + '">' + this.get_label('right_panel.previous') + '</span><span class="today" title="' + this.get_label('right_panel.today_title') + '">' + this.get_label('right_panel.today') + '</span><span class="next" title="' + this.get_label('right_panel.next_title') + '">' + this.get_label('right_panel.next') + '</span></div>');
			$('#right_panel_events').append('<div class="events_list"></div>');
			// Gestion des alarmes
			if (window.alarmsList.length) {
				for (var i = 0; i < window.alarmsList.length; i++) {
					var alarm = window.alarmsList[i];
					var start_date = new Date(alarm.start);
					if (today.getDate() == start_date.getDate() && today.getMonth() == start_date.getMonth()) {
						var date = rcmail.get_label("right_panel.today_min");
					}
					else {
						var date = rcmail.get_label("right_panel.day_min_" + start_date.getDay()) + " " + start_date.getDate() + " " + this.get_label("right_panel.month_min_" + start_date.getMonth());
					}
					if (!alarm.allDay) {
						var time = checkTime(start_date.getHours()) + ':' + checkTime(start_date.getMinutes());
						date = rcmail.get_label('right_panel.date').replace(/%%day%%/, date).replace(/%%hour%%/, time);
					}
					var title = alarm.title;
					if (alarm.location) {
						title += " (" + alarm.location + ")";
					}
					var type = alarm.id.split(':')[0];
					$('#right_panel_events .events_list').append('<div class="item alarm" id="' + alarm.id + '" title="' + title + '"><span class="date">' + date + '</span><span class="type">' + rcmail.get_label("right_panel." + type) + '</span><span class="title">' + title + '</span><div class="alarm_buttons"><span class="later">' + rcmail.get_label("right_panel.later") + '</span><span class="dismiss">' + rcmail.get_label("right_panel.dismiss") + '</span></div></div>');
					$('#right_panel_events .events_list .event[id="' + alarm.id + '"]').data('event', event);
				}
			}
			var end_timestamp = Date.now() + (5 * 24 * 60 * 60 * 1000); // Add 5 days
			var tomorrow = new Date();
			tomorrow.setDate(today.getDate() + 1);
			for (var i = 0; i < events.length; i++) {
				var event = events[i];
				var start_date = new Date(event.start);
				var end_date = new Date(event.end);
				if (event.allDay) {
					end_date.setDate(end_date.getDate() + 1);
				}
				if (end_date.getTime() < Date.now() || start_date.getTime() > end_timestamp) {
					continue;
				}
				if (today.getDate() == start_date.getDate() && today.getMonth() == start_date.getMonth()) {
					var date = rcmail.get_label("right_panel.today");
				}
				else if (tomorrow.getDate() == start_date.getDate() && tomorrow.getMonth() == start_date.getMonth()) {
					var date = rcmail.get_label("right_panel.tomorrow");
				}
				else {
					var date = rcmail.get_label("right_panel.day_" + start_date.getDay()) + " " + start_date.getDate() + " " + this.get_label("right_panel.month_" + start_date.getMonth());
				}
				if (event.allDay) {
					var start = rcmail.get_label("right_panel.allday_min");
					var end = '';
				}
				else {
					var start = checkTime(start_date.getHours()) + ':' + checkTime(start_date.getMinutes());
					var end = checkTime(end_date.getHours()) + ':' + checkTime(end_date.getMinutes());
				}
				var title = event.title;
				if (event.location) {
					title += " (" + event.location + ")";
				}
				$('#right_panel_events .events_list').append('<div class="item event ' + event.status + '" id="' + event._id + '" title="' + title + '"><span class="date">' + date + '</span><span class="table"><span class="row"><span class="start cell">' + start + '</span><span class="title cell"><span class="innerTitle">' + event.title + '</span></span></span><span class="row"><span class="end cell">' + end + '</span><span class="location cell">' + event.location + '</span></span></span></div>');
				$('#right_panel_events .events_list .event[id="' + event._id + '"]').data('event', event);
			}
		}
		
		if ($('#right_panel_events .events_list .item').length == 0) {
			$('#right_panel_events .events_list').append('<div class="item event noevent" title="' + this.get_label("right_panel.no_event_title") + '"><span>' + this.get_label("right_panel.no_event") + '</span></div>');
			$('#right_panel_events .events_list').append('<div class="item event new_event" title="' + this.get_label("right_panel.new_event_title") + '"><span>' + this.get_label("right_panel.new_event") + '</span></div>');
		}
		else if (($('#right_panel_events .events_list .item').length % 2) !== 0) {
			$('#right_panel_events .events_list').append('<div class="item event new_event" title="' + this.get_label("right_panel.new_event_title") + '"><span>' + this.get_label("right_panel.new_event") + '</span></div>');
		}
		if (!$('#right_panel').hasClass('minified')) {
			this.right_panel_events_pagination();
		}
	}
};

// Set pagination for events
rcube_webmail.prototype.right_panel_events_pagination = function() {
	if ($('#right_panel_events .events_list .item').length <= window.events_element_by_page) {
		var max_page = 0;
	}
	else {
		var max_page = Math.floor($('#right_panel_events .events_list .item').length / window.events_element_by_page) - 1;
	}
	// Gérer la suppression depuis la dernière page
	if (window.current_event_page > max_page) {
		window.current_event_page = max_page; 
	}
	var first_element = window.current_event_page * window.events_element_by_page;
	var last_element = (window.current_event_page + 1) * window.events_element_by_page - 1;
	$('#right_panel_events .events_list .item').each(function (index) {
		if (index < first_element
				|| index > last_element) {
			$(this).hide();
		}
		else {
			$(this).show();
		}
	});
	if (window.current_event_page === 0) {
		$('#right_panel_events .pagination .previous').addClass('disabled');
		$('#right_panel_events .pagination .today').addClass('disabled');
	}
	else {
		$('#right_panel_events .pagination .previous').removeClass('disabled');
		$('#right_panel_events .pagination .today').removeClass('disabled');
	}
	if (window.current_event_page >= max_page) {
		$('#right_panel_events .pagination .next').addClass('disabled');
	}
	else {
		$('#right_panel_events .pagination .next').removeClass('disabled');
	}
};

// Get contacts menu
rcube_webmail.prototype.right_panel_get_contacts = function(force = false) {
	if ($('#right_panel').hasClass('minified')) {
		$('#right_panel_contacts').append('<div class="contacts_count_title">' + this.get_label("right_panel.contacts_count_title") + '</div>');
		$('#right_panel_contacts').append('<div class="contacts_count"></div>');
		$('#right_panel_contacts').append('<div class="contacts_favorites_title">' + this.get_label("right_panel.contacts_favorites_title") + '</div>');
		$('#right_panel_contacts').append('<div class="contacts_favorites"></div>');
		$('#right_panel_contacts .contacts_count').append('<div class="email">' + window.mailCount + '</div>');
		$('#right_panel_contacts .contacts_count').append('<div class="im">' + window.imCount + '</div>');
		this.right_panel_get_contacts_list_minified(force);
	}
	else {
		var contacts_menu = this.right_panel_storage_get('contacts_menu');
		if (contacts_menu && contacts_menu == 'favorites_button') {
			$('#right_panel_contacts').append('<div class="contacts_menu"><span class="recents_button disabled" title="' + this.get_label("right_panel.recents_button_title") + '"></span><span class="favorites_button" title="' + this.get_label("right_panel.favorites_button_title") + '"></span></div>');
		}
		else {
			$('#right_panel_contacts').append('<div class="contacts_menu"><span class="recents_button" title="' + this.get_label("right_panel.recents_button_title") + '"></span><span class="favorites_button disabled" title="' + this.get_label("right_panel.favorites_button_title") + '"></span></div>');
		}
		
		$('#right_panel_contacts').append('<div class="contacts_recents"></div>');
		$('#right_panel_contacts').append('<div class="contacts_favorites"></div>');
		// Load current contact list
		this.right_panel_get_contacts_list(force);
	}
};

// Get contacts list
rcube_webmail.prototype.right_panel_get_contacts_list = function(force = false) {
	if ($('#right_panel_contacts .contacts_menu .recents_button').hasClass('disabled')) {
		$('#right_panel_contacts .contacts_recents').hide();
		$('#right_panel_contacts .contacts_favorites').show();
		this.right_panel_get_contacts_favorites(force);
	}
	else if ($('#right_panel_contacts .contacts_menu .favorites_button').hasClass('disabled')) {
		$('#right_panel_contacts .contacts_recents').show();
		$('#right_panel_contacts .contacts_favorites').hide();
		this.right_panel_get_contacts_recents(force);
	}
};

//Get contacts list minified
rcube_webmail.prototype.right_panel_get_contacts_list_minified = function(force = false) {
	this.right_panel_get_mails_count(force);
	this.right_panel_get_contacts_favorites(force);
};

// Get contacts recent
rcube_webmail.prototype.right_panel_get_contacts_recents = function(force = false) {
	if (!window.messagesList.length || force) {
	  if (window.messagesList.length && !$('#right_panel_contacts .contacts_recents .contact').length) {
      clearTimeout(window.refreshContactsListTimeout);
      window.refreshContactsListTimeout = setTimeout(function() {
        rcmail.right_panel_refresh_recents_contacts();
      }, 500);
    }
	  if (window.lastUpdateContactsList && (Date.now() - window.lastUpdateContactsList) < window.NEXT_REFRESH) {
	    // The refresh is to early
	    return;
	  }
		$.ajax({
			  method: "GET",
			  url: './?_task=mail&_action=plugin.list_contacts_recent',
		}).done(function(contacts) {
			if (contacts) {
				// Get from session storage
				window.messagesList = rcmail.right_panel_storage_get('messagesList', true);
				if (!window.messagesList) {
					window.messagesList = [];
				}
				var hasChanged = false;
				for (var i = 0; i < contacts.length; i++) {
					var contact = contacts[i];
					// Ne pas s'afficher soit même
					if (rcmail.env['user_email'].toLowerCase() == contact.email.toLowerCase()) {
						continue;
					}
					// Contact name
					var name = '';
					if (contact.surname || contact.firstname) {
						name = contact.firstname + ' ' + contact.surname;
					}
					else {
						name = contact.name.split(' - ')[0];
					}
					// ID
					var id = contact.muid
					// Search for the contact in contacts list
					var found = false, key = null;
					for (var j = 0; j < window.messagesList.length; j++) {
						if (window.messagesList[j] && window.messagesList[j].id == id) {
							found = true;
							key = j;
							break;
						}
					}
					if (found) {
						if (name && window.messagesList[key].name != name) {
							hasChanged = true;
							window.messagesList[key].name = name;
						}
						if (contact.email && window.messagesList[key].email != contact.email) {
							hasChanged = true;
							window.messagesList[key].email = contact.email;
						}
						if (window.messagesList[key].timestamp < contact.timestamp) {
							hasChanged = true;
							window.messagesList[key].timestamp = contact.timestamp;
						}
						if (contact.muid && window.messagesList[key].id != contact.muid) {
							hasChanged = true;
							window.messagesList[key].id = contact.muid;
						}
						if (window.messagesList[key].munread != contact.munread) {
							hasChanged = true;
							window.messagesList[key].munread = contact.munread;
						}
						if (window.messagesList[key].type != contact.type) {
							hasChanged = true;
							window.messagesList[key].type = contact.type;
						}
						if (window.messagesList[key].subject != contact.subject) {
							hasChanged = true;
							window.messagesList[key].subject = contact.subject;
						}
						if (window.messagesList[key].text != contact.text) {
							hasChanged = true;
							window.messagesList[key].text = contact.text;
						}
					}
					else {
						// Add to contact list
						window.messagesList.push({
							name: name,
							email: contact.email,
							timestamp: contact.timestamp,
							id: contact.muid,
							type: contact.type,
							subject: contact.subject,
							text: contact.text,
							munread: contact.munread
						});
						hasChanged = true;
					}				
				}
				if (hasChanged) {
					window.messagesList.sort(function(a, b) {
						return b.timestamp - a.timestamp;
					});
					// Limiter à 20 l'affichage
					window.messagesList.splice(20, window.messagesList.length - 20);
					clearTimeout(window.refreshContactsListTimeout);
					window.refreshContactsListTimeout = setTimeout(function() {
						rcmail.right_panel_refresh_recents_contacts();
					}, 500);
					rcmail.right_panel_storage_set('messagesList', window.messagesList, true);
				}
				window.lastUpdateContactsList = Date.now();
			}
		});
	}
	else {
		// Get from session storage
		window.messagesList = this.right_panel_storage_get('messagesList', true);
		clearTimeout(window.refreshContactsListTimeout);
		window.refreshContactsListTimeout = setTimeout(function() {
			rcmail.right_panel_refresh_recents_contacts();
		}, 500);
	}
};

// Get mails count
rcube_webmail.prototype.right_panel_get_mails_count = function(force = false) {
	if (!window.mailCount.length || force) {
		$.ajax({
			  method: "GET",
			  url: './?_task=mail&_action=plugin.get_unread_count',
		}).done(function(json) {
			if (json) {
				// Get from session storage
				window.mailCount = json.unseen_count;
				rcmail.right_panel_storage_set('mailCount', window.mailCount);
			}
			$('#right_panel_contacts .contacts_count .email').text(window.mailCount);
		});
	}
	else {
		// Get from session storage
		window.mailCount = this.right_panel_storage_get('mailCount');
		$('#right_panel_contacts .contacts_count .email').text(window.mailCount);
	}
};

// Get contacts favorites
rcube_webmail.prototype.right_panel_get_contacts_favorites = function(force = false) {
	this.enable_command('compose', true);
	if (!window.favoritesList.length || force) {
	  if (window.lastUpdateFavoritesList && (Date.now() - window.lastUpdateFavoritesList) < window.NEXT_REFRESH) {
      // The refresh is to early
      return;
    }
		if (window.favoritesList.length && !$('#right_panel_contacts .contacts_favorites .contact').length) {
			this.right_panel_refresh_favorites_contacts();
		}
		var res = this.http_get('addressbook/plugin.list_contacts_favorites');	
	}
	else {
		this.right_panel_refresh_favorites_contacts();
	}
};

// Refresh favorites contacts list
rcube_webmail.prototype.right_panel_refresh_favorites_contacts = function() {
	$('#right_panel_contacts .contacts_favorites').html('');
	$('#right_panel_contacts .contacts_favorites').append('<div class="contacts_list"></div>');
	if (!window.favoritesList) {
		window.favoritesList = [];
	}
	for (var i = 0; i < window.favoritesList.length; i++) {
		var contact = window.favoritesList[i];
		// Contact name
		var name = '';
		if (contact.surname || contact.firstname) {
			name = contact.firstname + ' ' + contact.surname;
		}
		else {
			name = contact.name.split(' - ')[0];
		}
		// Contact email
		var email = '<span class="email"></span>';
		if (contact.email) {
			email = '<span class="email"><a href="mailto:' + contact.email + '" onclick="event.preventDefault(); event.stopPropagation(); return rcmail.command(\'compose\',\'' + contact.email + '\',this);"></a></span>';
		}
		// Contact im
		var im = '<span class="im"></span>';
		if (contact.username) {
			im = '<span class="im"><a href="#" onclick="event.preventDefault(); event.stopPropagation(); return rcmail.right_panel_open_rocket_chat_url(\'/direct/' + contact.username + '\');"></a></span>';
		}
		// Contact status
		var status = '<span class="status offline">none</span>';
		if (contact.status) {
			status = '<span class="status ' + contact.status + '">' + contact.status + '</span>';
		}
		// ID
		var id = contact.cuid
		if (contact.username) {
			id = contact.username;
		}
		// Photo url
		if (contact.photo_url) {
			var photo_url = contact.photo_url;	
		}
		else {
			var photo_url = rcmail.url('addressbook/photo', {_cid: contact.ID, _source: rcmail.env['username'].replace('.','_-P-_')});	
		}								
		var photo = '<img src="' + photo_url + '" alt="' + rcmail.get_label("right_panel.contactphoto") + '">';
		$('#right_panel_contacts .contacts_favorites .contacts_list').append('<div class="contact ' + id + '" title="' + contact.name + '"><span class="cid">' + contact.ID + '</span><span class="photo">' + photo + '</span><span class="name">' + name + '</span>' + status + im + email + '</div>');
	}
	$("#right_panel_contacts .contacts_favorites .contacts_list").mCustomScrollbar({theme: 'minimal', scrollInertia: 20});
};

// Refresh recents contacts list
rcube_webmail.prototype.right_panel_refresh_recents_contacts = function() {
	$('#right_panel_contacts .contacts_recents').html('');
	$('#right_panel_contacts .contacts_recents').append('<div class="contacts_list"></div>');	
	if (!window.messagesList) {
		window.messagesList = [];
	}
	window.messagesList.sort(function(a, b) {
		return b.timestamp - a.timestamp;
	});
	var today = new Date();
	var yesterday = new Date();
	yesterday.setDate(today.getDate() - 1);
	
	// Limiter à 20 l'affichage
	window.messagesList.splice(20, window.messagesList.length - 20);

	for (var i = 0; i < window.messagesList.length; i++) {
		var contact = window.messagesList[i];
		if (contact.subject) {
			// Mail unread
			var classMunread = '';
			if (contact.munread) {
				classMunread = ' munread';
			}
			// Date
			var date = new Date();
			date.setTime(contact.timestamp * 1000);
			
			var hours = date.getHours();
			hours = ("0" + hours).slice(-2);
			var minutes = date.getMinutes();
			minutes = ("0" + minutes).slice(-2);
			var hour = hours + ':' + minutes;
			if (date.getDate() == today.getDate() 
					&& date.getMonth() == today.getMonth()
					&& date.getFullYear() == today.getFullYear()) {
				var day = rcmail.get_label('right_panel.today_min');
			}
			else if (date.getDate() == yesterday.getDate() 
					&& date.getMonth() == yesterday.getMonth()
					&& date.getFullYear() == yesterday.getFullYear()) {
				var day = rcmail.get_label('right_panel.yesterday_min');
			}
			else {
				var day = date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear();
			}
			var date = rcmail.get_label('right_panel.date').replace(/%%day%%/, day).replace(/%%hour%%/, hour);
			// ID
			var id = contact.id
			$('#right_panel_contacts .contacts_recents .contacts_list').append('<div class="contact ' + contact.id + classMunread + '" id="' + i + '" title="' + contact.name + '"><span class="date">' + date + '</span><span class="title">' + rcmail.get_label('right_panel.' + contact.type) + '</span><span class="name">' + contact.name + '</span><span class="subject">' + contact.subject + '</span><span class="text">' + contact.text + '</span></div>');		
		}
	}
	$("#right_panel_contacts .contacts_recents .contacts_list").mCustomScrollbar({theme: 'minimal', scrollInertia: 20});
};

// Web socket Ariane
rcube_webmail.prototype.right_panel_ariane_web_socket = function() {
	if (!window.webSocketAriane) {
		// Initialisation de la socket Ariane
		window.webSocketAriane = new WebSocket(rcmail.env.web_socket_ariane_url);
		// Web socket open
		window.webSocketAriane.onopen = function (event) {
			if (!window.webSocketArianeConnected) {
				var params = {
					"msg": "connect",
					"version": "1",
					"support": ["1", "pre2", "pre1"]
				}			
			}
			else {
				var params = {
				    "msg": "method",
				    "method": "subscriptions/get",
				    "id": "method_subscriptions_get",
				    "params": [ ]
				};
			}
			window.webSocketAriane.send(JSON.stringify(params));
		};
		// Web socket on message
		window.webSocketAriane.onmessage = function (event) {
			//alert(event.data);
			var data = JSON.parse(event.data);
			rcmail.right_panel_ariane_web_socket_results(data);
		};
		// Web socket on notification
		window.webSocketAriane.onnotification = function (event) {
			//alert(JSON.stringify(event));
		};
		// Web socket on close
		window.webSocketAriane.onclose = function (event) {
			window.webSocketArianeConnected = false;
			// Nettoyage des localstorages
			if (getCookieValue('roundcube_login') == '') {
				window.localStorage.removeItem('right_panel.event');
				window.localStorage.removeItem('right_panel.messagesList');	
			}
			window.webSocketAriane = false;
		};
	}
	else {
		var params = {
		    "msg": "method",
		    "method": "subscriptions/get",
		    "id": "method_subscriptions_get",
		    "params": [ ]
		};
		window.webSocketAriane.send(JSON.stringify(params));
	}
};


//Web socket Ariane results
rcube_webmail.prototype.right_panel_ariane_web_socket_results = function(data) {
	switch (data.msg) {
		case 'ping':
			var params = {
			    "msg": "pong"
			}
			window.webSocketAriane.send(JSON.stringify(params));
			break;
		case 'added':
			if (data.id) {
				window.currentUserID = data.id;
				params = {
				    "msg": "sub",
				    "id": "sub_notify_user",
				    "name": "stream-notify-user",
				    "params":[
				    	window.currentUserID + "/rooms-changed",
				        false
				    ]
				};					
				window.webSocketAriane.send(JSON.stringify(params));
			}
			break;
		case 'changed':
			if (data.collection == "stream-notify-user") {
				if (data.fields.args[1]._id) {
					if ($('#right_panel').hasClass('minified')) {
						rcmail.right_panel_ariane_web_socket();
					}
					else {
						var rid = data.fields.args[1]._id;
						var found = false, key = null;
						for (var j = 0; j < window.messagesList.length; j++) {
							if (window.messagesList[j] && window.messagesList[j].rid == rid) {
								found = true;
								key = j;
								break;
							}
						}
						if (found) {
							var params = {
							    "msg": "method",
							    "method": "loadHistory",
							    "id": "loadHistory_" + window.messagesList[key].rid,
							    "params": [
							    	window.messagesList[key].rid,
							    	null,
							    	1,
							    	null
							    ]
							};
							window.webSocketAriane.send(JSON.stringify(params));
						}
						else {
							rcmail.right_panel_ariane_web_socket();
						}
					}
				}
			}
			break;
		case 'connected':
			window.webSocketArianeConnected = true;
			var params = {
			    "msg": "method",
			    "method": "login",
			    "id": "method_login",
			    "params":[
			        { "resume": rcmail.env.ariane_auth_token }
			    ]
			}
			window.webSocketAriane.send(JSON.stringify(params));
			break;
		case 'result':
			switch (data.id) {
				case 'method_login':
					rcmail.right_panel_ariane_web_socket();
					break;
				case 'sub_notify_user':
					alert('sub_notify_user');
					rcmail.right_panel_ariane_web_socket();
					break;
				case 'sub_notify_user_message':
					alert(JSON.stringify(data));
					break;
				case 'sub_notify_user_subscriptions':
					alert(JSON.stringify(data));
					break;
				case 'method_userpresence_defaultstatus':
					$('#right_panel #right_panel_presence').removeClass('online');
					$('#right_panel #right_panel_presence').removeClass('offline');
					$('#right_panel #right_panel_presence').removeClass('away');
					$('#right_panel #right_panel_presence').removeClass('busy');
					$('#right_panel #right_panel_presence').addClass(rcmail.env['ariane_user_status']);
					$('#right_panel #right_panel_presence .presence').text(rcmail.get_label('right_panel.' + rcmail.env['ariane_user_status']));
					rcmail.right_panel_storage_set('ariane_user_status', rcmail.env['ariane_user_status']);
					break;
				case 'method_subscriptions_get':					
					var new_recent = false;
					// Get from session storage
					window.messagesList = rcmail.right_panel_storage_get('messagesList', true);
					if (!window.messagesList) {
						window.messagesList = [];
					}
					var unread = 0;
					for (var i = 0; i < data.result.length; i++) {
						var contact = data.result[i];
						// timestamp
						var timestamp = contact._updatedAt['$date'].toString();
						timestamp = timestamp.substr(0, timestamp.length - 3);
						
						var id = contact.name.split('@')[0].replace(/\./g,'_');
						var found = false, key = null;
						for (var j = 0; j < window.messagesList.length; j++) {
							if (window.messagesList[j] && window.messagesList[j].username == contact.name 
									|| window.messagesList[j] && window.messagesList[j].id == id) {
								found = true;
								key = j;
								break;
							}
						}
						var chan_unread = contact.unread;
						
						if (contact.t == 'd' 
								&& contact.name) {
							// Ne pas s'afficher soit même
							if (rcmail.env['username'] == contact.name) {
								continue;
							}
							
							if ($('#right_panel_contacts div.' + id + ' span.unread').length && contact.unread > 0) {
								$('#right_panel_contacts div.contact.' + id + ' span.unread').text(contact.unread);
							}
							var name = contact.fname;
							var im = '/direct/' + contact.name;
							
							// Gestion du unread total
							unread += contact.unread;
						}
						else if (contact.t == 'p' 
								&& contact.name) {
							if (!chan_unread) {
								chan_unread = contact.alert ? '°' : '';
							}
							else {
								// Gestion du unread total
								unread += contact.unread;
							}
							
							var name = '@' + contact.name;
							var im = '/group/' + contact.name;
						}
						else if (contact.t == 'c' 
								&& contact.name) {
							var chan_unread = contact.unread;
							if (!chan_unread) {
								chan_unread = contact.alert ? '°' : '';
							}
							else {
								// Gestion du unread total
								unread += contact.unread;
							}
							
							var name = '#' + contact.name;
							var im = '/channel/' + contact.name;
						}
						if (found) {
							if (window.messagesList[key].timestamp != timestamp) {
								new_recent = true;
								window.messagesList[key].unread = chan_unread;
								window.messagesList[key].timestamp = timestamp;
								window.messagesList[key].history = true;
							}								
						}
						else {
							// Add to contact list
							window.messagesList.push({
								name: name,
								username: contact.name,
								type: 'im',
								channel: contact.t,
								im: im,
								unread: chan_unread,
								id: id,
								rid: contact.rid,
								history: true,
								subject: '',
								timestamp: timestamp
							});
							new_recent = true;
						}
					}
					// Gestion du titre
					var title = rcmail.get_label('rocket_chat.task');
					if (unread) {
						title = '(' + unread + ') ' + title;
					}
					localStorage.setItem('rocket_chat_title', title);
					$('.button-rocket_chat .button-inner').text(title);
					window.messagesList.sort(function(a, b) {
						return b.timestamp - a.timestamp;
					});
					// Limiter à 20 l'affichage
					window.messagesList.splice(20, window.messagesList.length - 20);
					if ($('#right_panel').hasClass('minified')) {
						window.imCount = unread;
						rcmail.right_panel_storage_set('imCount', window.imCount);
						$('#right_panel_contacts .contacts_count .im').text(window.imCount);
					}
					else {
						// Charger l'historique
						for (var i = 0; i < window.messagesList.length; i++) {
							if (window.messagesList[i].type == 'im' 
									&& window.messagesList[i].history) {
								var params = {
								    "msg": "method",
								    "method": "loadHistory",
								    "id": "loadHistory_" + window.messagesList[i].rid,
								    "params": [
								    	window.messagesList[i].rid,
								    	null,
								    	1,
								    	null
								    ]
								};
								window.webSocketAriane.send(JSON.stringify(params));
							}
						}
						rcmail.right_panel_storage_set('messagesList', window.messagesList, true);
						if ($('#right_panel_contacts .contacts_menu .favorites_button').hasClass('disabled') && new_recent) {
							clearTimeout(window.refreshContactsListTimeout);
							window.refreshContactsListTimeout = setTimeout(function() {
								rcmail.right_panel_refresh_recents_contacts();
							}, 500);
						}
					}
					break;
				default:
					if (data.id.indexOf('loadHistory_') === 0) {
						var rid = data.id.replace(/loadHistory_/, '');
						var found = false, key = null;
						for (var j = 0; j < window.messagesList.length; j++) {
							if (window.messagesList[j] && window.messagesList[j].rid == rid) {
								found = true;
								key = j;
								break;
							}
						}
						if (found
								&& data.result) {
							var message = data.result.messages[0];
							if (message) {
								// timestamp
								var timestamp = message.ts['$date'].toString();
								timestamp = timestamp.substr(0, timestamp.length - 3);
								
								if (message.u.username == rcmail.env['username']) {
									window.messagesList[key].subject = '(' + rcmail.get_label('right_panel.you') + ') ' + message.msg;
								}
								else {
									if (window.messagesList[key].channel == 'd') {
										window.messagesList[key].subject = message.msg;
									}
									else {
										window.messagesList[key].subject = message.alias + ': ' + message.msg;
									}
								}
								
								window.messagesList[key].history = false;
								window.messagesList[key].timestamp = timestamp;
								rcmail.right_panel_storage_set('messagesList', window.messagesList, true);
								if ($('#right_panel_contacts .contacts_menu .favorites_button').hasClass('disabled')) {
									window.messagesList.sort(function(a, b) {
										return b.timestamp - a.timestamp;
									});
									// Limiter à 20 l'affichage
									window.messagesList.splice(20, window.messagesList.length - 20);
									clearTimeout(window.refreshContactsListTimeout);
									window.refreshContactsListTimeout = setTimeout(function() {
										rcmail.right_panel_refresh_recents_contacts();
									}, 500);
								}
							}							
						}
					}
					break;
			
		}
	}	
};

// Web socket Ariane set status
rcube_webmail.prototype.change_im_status = function(status) {
	var params = {
	    "msg": "method",
	    "method": "UserPresence:setDefaultStatus",
	    "id": "method_userpresence_defaultstatus",
	    "params": [ status ]
	}
	window.webSocketAriane.send(JSON.stringify(params));
	rcmail.env['ariane_user_status'] = status;
};