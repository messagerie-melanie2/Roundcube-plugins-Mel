var timeout_sharesmailboxeslist;
var hide_mailviewsplitterv = false;
var mailviewright_left = 0;
var mailviewleft_width = 0;
var mailviewsplitterv_left = 0;
var page_loading;
var current_page_scroll;
// Configure number of milliseconds before next refresh
var UNSEEN_COUNT_REFRESH = 300000;

$(document).on({
    dblclick: function (e) {
    	if (hide_mailviewsplitterv) {
    		$('#mailview-left').css("width", mailviewleft_width);
    		$('#mailviewsplitterv').css("left", mailviewsplitterv_left);
    		$('#mailview-right').css("left", mailviewright_left);
    		hide_mailviewsplitterv = false;
    	}
    	else {
    		mailviewleft_width = $('#mailview-left').css("width");
    		mailviewsplitterv_left = $('#mailviewsplitterv').css("left");
    		mailviewright_left = $('#mailview-right').css("left");
    		$('#mailview-left').css("width", '0px');
    		$('#mailviewsplitterv').css("left", '3px');
    		$('#mailview-right').css("left", '12px');
    		hide_mailviewsplitterv = true;
    	}
    	
    }
}, "#mailviewsplitterv"); //pass the element as an argument to .on

//register event handlers for UI elements
$(document).on("click", '#sharesmailboxesul-first li.box.current',
	function(e) {
		var obj = $(this).find('> a > div.treetoggle');
		if (obj.hasClass('expanded')) {
			$('#mailboxlist').hide();
			var unread = parseInt($('#mailboxlist > li:first-child > a > span.unreadcount').text());
			
			if (unread > 0) {
				$(this).addClass('unread');
				$(this).find('> a > span.unreadcount').text(unread);
			}
			obj.removeClass('expanded').addClass('collapsed');
			$(this).addClass('selected');
		}
		else {
			$('#mailboxlist').show();
			obj.addClass('expanded').removeClass('collapsed');
			$(this).removeClass('unread');
			$(this).find('> a > span.unreadcount').text('');
			$(this).removeClass('selected');
		}
		return false;
	}
);

$('html').click(function() {
	timeout_sharesmailboxeslist = setTimeout(function() {
		var sharemailboxeslist = $("#sharesmailboxeslist-settings");
		if (sharemailboxeslist.hasClass("sharesmailboxesshow")) {
			sharemailboxeslist.addClass("sharesmailboxeshide")
								.removeClass("sharesmailboxesshow");
			$(".button-sharesmailboxes").removeClass("button-selected");
			$("#folderlist-header-m2-settings span").removeClass("click");
			$("#folderlist-header-m2-settings").removeClass("click");
		}
	}, 200);	
});


$(document).on({
    click: function (e) {
    	clearTimeout(timeout_sharesmailboxeslist);
    	e.stopPropagation();
    	var sharemailboxeslist = $("#sharesmailboxeslist-settings");
    	if (sharemailboxeslist.hasClass("sharesmailboxesshow")) {
    		sharemailboxeslist.addClass("sharesmailboxeshide")
    							.removeClass("sharesmailboxesshow");
    		$("#folderlist-header-m2-settings span").removeClass("click");
    		$("#folderlist-header-m2-settings").removeClass("click");
    		$(".button-sharesmailboxes").removeClass("button-selected");
    	}
    	else {
    		sharemailboxeslist.addClass("sharesmailboxesshow")
    							.removeClass("sharesmailboxeshide");
    		$("#folderlist-header-m2-settings span").addClass("click");
    		$("#folderlist-header-m2-settings").addClass("click");
    		$(".button-sharesmailboxes").addClass("button-selected");
    	}
    }
}, ".folderlist-header-m2-settings"); //pass the element as an argument to .on

// Changement d'utilisateur sur la page de login
$(document).on({
    click: function (e) {
    	$('#formlogintable .hidden_login_input').removeClass('hidden_login_input');
    	$('.login_div').hide();
    	$('#rcmloginuser').val('');
    	$('#rcmloginuser').focus();
    	$('#rcmloginkeep').removeAttr('checked');
    }
}, "#rcmchangeuserbutton"); //pass the element as an argument to .on


if (window.rcmail) {
	  rcmail.addEventListener('init', function(evt) {
		  // Initialisation de la liste des pages chargées
		  page_loading = {};
		  current_page_scroll = 1;
		  if (rcmail.env['plugin.show_password_change']) {
			  show_password_change(this);
		  }
		  
		  // Gestion de l'url courrielleur
		  var url = window.location.href.split('?')[1];
		  if (url && url.indexOf('_courrielleur') != -1 && url.indexOf('_err=session') != -1) {
		    if (url.indexOf('_courrielleur=1') != -1) {
		      window.location.href = '_task=login&_courrielleur=1';
		    }
		    else if (url.indexOf('_courrielleur=2') != -1) {
		      window.location.href = '_task=login&_courrielleur=2';
	    	}
		  }
		  
		  // Gestion des mails count pour toutes les boites
		  rcmail.mel_refresh_mails_count();
		  
		  rcmail.addEventListener('responseafterrefresh', function(props) {
			  // Refresh mails count
			  rcmail.mel_get_mails_count();
		  });
		  rcmail.addEventListener('responseaftergetunread', function(props) {
		    // Refresh current mail count
        rcmail.mel_refresh_current_mail_count();
		  });
		  rcmail.addEventListener('responseaftermark', function(props) {
        // Refresh current mail count
        rcmail.mel_refresh_current_mail_count();
      });
		  rcmail.addEventListener('responseafterlist', function(props) {
        // Refresh current mail count
		    if ($('#mailboxlist > li:first-child').hasClass('selected')) {
		      rcmail.mel_refresh_current_mail_count();
		    }
      });
		  rcmail.addEventListener('actionafter', function(props) {
  			if (props.action == 'checkmail') {
  				// Refresh mails count
  				rcmail.mel_get_mails_count();
  			}
		  });
		  
		  window.addEventListener('storage', function(e) {
		    if (e.key.indexOf('mel.seen.') == 0) {
		      var id = e.key.replace(/mel\.seen\./, '')
		      var value = JSON.parse(e.newValue);
		      rcmail.mel_refresh_unseen_count($('.sharesmailboxesul li#' + id), value.unseen_count);
		    }
		  });
		  
		  if (rcmail.env.task == 'mail' 
			  	&& (!rcmail.env.action || rcmail.env.action == "") 
			  	&& rcmail.env.use_infinite_scroll) {
			  var scroll = false;
			  $('.pagenavbuttons').hide();
			  $('#countcontrols').hide();
				
			  // Gestion du scroll infini
			  $('#messagelistcontainer').scroll(function() {
				  if (($('#messagelistcontainer').scrollTop() > 1 
						  && (($('#messagelistcontainer').scrollTop() + $('#messagelistcontainer').height()) / $('#messagelist').height()) >= 0.95)
						  && current_page_scroll > 1) {
					  // Affichage de la page suivante au bas de la page					  					  
					  var page = current_page_scroll;
					  if (page > 0 && page <= rcmail.env.pagecount && !page_loading[page]) {
						  page_loading[page] = true;
						  var lock = rcmail.set_busy(true, 'loading');
						  var post_data = {};
						  post_data._mbox = rcmail.env.mailbox;
						  post_data._page = page;
						  // also send search request to get the right records
						  if (rcmail.env.search_request)
							  post_data._search = rcmail.env.search_request;
						  rcmail.http_request('list', post_data, lock);						  
					  }
				  }		  
			  });
			  if (!rcmail.env.ismobile) {
				  // Réinitialise les données une fois que la liste est rafraichie
				  rcmail.message_list.addEventListener('clear', function(evt) {
					  page_loading = {};
					  rcmail.env.current_page = 1;
					  current_page_scroll = 2;
				  });
				  rcmail.addEventListener('responseafterlist', function(evt) {
					  if (rcmail.env.use_infinite_scroll) {
						  current_page_scroll = rcmail.env.current_page + 1;
						  rcmail.env.current_page = 1;
					  }
					  rcmail.http_post('plugin.set_current_page', {});
				  });
			  }
		  }
		  else if (rcmail.env.task == 'settings') {
		    // Masquer la skin mobile de l'interface de choix des skins
		    if ($('#rcmfd_skinmel_larry_mobile').length) {
		      $('#rcmfd_skinmel_larry_mobile').parent().parent().parent().parent().hide();
		    }
		  }
		  else if (rcmail.env.task == 'calendar') {
		    // PAMELA - Masquer les champs non utilisés dans Mél
		    $('#edit-url').parent().hide();
		    $('#edit-priority').parent().hide();
		    $('#edit-free-busy').parent().hide();
		    $('#event-free-busy').hide();
		    $('.edit-alarm-buttons').hide();
		    $("#edit-sensitivity option[value='confidential']").remove();
		    $("#edit-recurrence-frequency option[value='RDATE']").remove();
		  }
		  // Refresh mails count
		  rcmail.mel_get_mails_count();
	  });
	  // MANTIS 0004276: Reponse avec sa bali depuis une balp, quels "Elements envoyés" utiliser
	  rcmail.addEventListener('change_identity', function(evt) {
	    if (window.identity && window.identity != rcmail.env.identity) {
	      rcmail.http_request('mail/plugin.refresh_store_target_selection', 
	          {
	            "_account": rcmail.env.identities_to_bal[rcmail.env.identity],
	          }
	      , rcmail.set_busy(true, 'loading'));
	    }
	    window.identity = rcmail.env.identity;
	  });
	  rcmail.addEventListener('responseafterplugin.refresh_store_target_selection', function(evt) {
	    $("#composeoptions .composeoption select[name=\"_store_target\"]").replaceWith(evt.response.select_html);
	    $('#_compose_hidden_account').val(rcmail.env.identities_to_bal[rcmail.env.identity]);
    });
}

// Get mails count
rcube_webmail.prototype.mel_get_mails_count = function() {
	if (rcmail.env.task == 'mail' 
	  	&& $('.sharesmailboxesul').length) {
	  $('.sharesmailboxesul li').each(function() {
		 if (!$(this).hasClass('current') || !$(this).find('> a > div.treetoggle').hasClass('expanded')) {
			 var _this = $(this);
			 var res = rcmail.mel_storage_get('seen.' + _this.attr('id'), true);
			 var load_data = true;
			 if (res) {
				 load_data = !_this.hasClass('current') && (Date.now() > (res.timestamp + window.UNSEEN_COUNT_REFRESH));
			 }
			 if (load_data) {
				 var url = _this.find('> a').attr('href') == '#' ? rcmail.url('mail/plugin.get_mbox_unread_count') : _this.find('> a').attr('href') + '&_action=plugin.get_mbox_unread_count';
				 $.ajax({
					  method: "GET",
					  url: url,
				 }).done(function(json) {
					if (json) {
						rcmail.mel_refresh_unseen_count(_this, json.unseen_count);
						rcmail.mel_storage_set('seen.' + _this.attr('id'), {unseen_count: json.unseen_count, timestamp: Date.now()}, true);
					}
				});
			 }
			 else {
			   if (_this.hasClass('current')) {
			     var unread = parseInt($('#mailboxlist > li:first-child > a > span.unreadcount').text());
			     if (unread) {
			       res.unseen_count = unread;
			     }
			     else {
			       res.unseen_count = 0;
			     }
			     res.timestamp = Date.now();
			     rcmail.mel_storage_set('seen.' + _this.attr('id'), res, true);
			   }
			   rcmail.mel_refresh_unseen_count(_this, res.unseen_count);
			 }
		 }
	  });
  }
};

// Refresh current mails count
rcube_webmail.prototype.mel_refresh_current_mail_count = function() {
  if (rcmail.env.task == 'mail' 
     && $('.sharesmailboxesul').length) {
    var obj = $('.sharesmailboxesul li.current');
    var res = {};
    var unread = parseInt($('#mailboxlist > li:first-child > a > span.unreadcount').text());
    if (unread) {
      res.unseen_count = unread;
    }
    else {
      res.unseen_count = 0;
    }
    res.timestamp = Date.now();
    this.mel_storage_set('seen.' + obj.attr('id'), res, true);
    this.mel_refresh_unseen_count(obj, res.unseen_count);
  }
};

// Refresh mails count
rcube_webmail.prototype.mel_refresh_mails_count = function() {
	if (rcmail.env.task == 'mail' 
	  	&& $('.sharesmailboxesul').length) {
	  $('.sharesmailboxesul li').each(function() {
		 if (!$(this).hasClass('current') || !$(this).find('> a > div.treetoggle').hasClass('expanded')) {
			 var _this = $(this);
			 var res = rcmail.mel_storage_get('seen.' + _this.attr('id'));
			 if (res) {
				 rcmail.mel_refresh_unseen_count(_this, res.unseen_count);
			 }
		 }
	  });
  }
};

// Refresh unseen count
rcube_webmail.prototype.mel_refresh_unseen_count = function(obj, unseen_count) {
	if (unseen_count > 0 && !obj.find('> a > div.treetoggle').hasClass('expanded')) {
		obj.find('> a > .unreadcount').text(unseen_count);
		obj.addClass('unread');
	}
	else {
		obj.find('> a > .unreadcount').text('');
		obj.removeClass('unread');
	}
	if (unseen_count > 0 && obj.hasClass('current') && $('#mailboxlist > li:first-child').hasClass('selected')) {
		if (obj.find('> a > div.treetoggle').hasClass('expanded')) {
			var unread = parseInt($('#mailboxlist > li:first-child > a > span.unreadcount').text()) || 0;
		}
		else {
			var unread = parseInt(obj.find('> a > span.unreadcount').text()) || 0;
		}
		if (unseen_count > unread) {
			this.refresh();
		}
	}
	// Gestion du title
  if (obj.hasClass('current') && document.title) {
    reg = /^\([0-9]+\)\s+/i;
    var new_title = '',
    doc_title = String(document.title);

    if (unseen_count && doc_title.match(reg))
      new_title = doc_title.replace(reg, '('+unseen_count+') ');
    else if (unseen_count)
      new_title = '('+unseen_count+') '+doc_title;
    else
      new_title = doc_title.replace(reg, '');
  
    this.set_pagetitle(new_title);
  }
};

// Get value from cache
rcube_webmail.prototype.mel_storage_get = function(name, fromJson = false, defaultValue = null) {
	if (this.env.keep_login) {
		var value = window.localStorage.getItem('mel.' + name);
	}
	else {
		var value = window.sessionStorage.getItem('mel.' + name);
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
rcube_webmail.prototype.mel_storage_set = function(name, value, toJson = false) {
	if (toJson) {
		value = JSON.stringify(value);
	}
	if (this.env.keep_login) {
		window.localStorage.setItem('mel.' + name, value);
	}
	else {
		window.sessionStorage.setItem('mel.' + name, value);
	}
};

// Add value to cache
rcube_webmail.prototype.mel_storage_add = function(name, key, value) {
	var obj =  this.mel_storage_get(name, true)
	if (!obj) {
		obj = {};
	}
	obj[key] = value;
	this.mel_storage_set(name, obj, true);
};

// Remove value from cache
rcube_webmail.prototype.mel_storage_remove = function(name) {
	if (this.env.keep_login) {
		window.localStorage.removeItem('mel.' + name);
	}
	else {
		window.sessionStorage.removeItem('mel.' + name);
	}
};

/**
 * Show password change page as jquery UI dialog
 */
function show_password_change()
{
  if (rcmail.is_framed()) {
    var frame = $('<iframe>').attr('id', 'changepasswordframe')
    .attr('src', rcmail.url('settings/plugin.mel_moncompte') + '&_fid=changepassword&_framed=1')
    .attr('frameborder', '0')
    .appendTo(parent.document.body);
  }
  else {
    var frame = $('<iframe>').attr('id', 'changepasswordframe')
    .attr('src', rcmail.url('settings/plugin.mel_moncompte') + '&_fid=changepassword&_framed=1')
    .attr('frameborder', '0')
    .appendTo(document.body);
  }
  

  var h = Math.floor($(window).height() * 0.75);
  var buttons = {};

  frame.dialog({
    modal: true,
    resizable: false,
    closeOnEscape: true,
    title: rcmail.env.passwordchange_title,
    close: function() {
      frame.dialog('destroy').remove();
    },
    buttons: buttons,
    width: 700,
    height: 500,
    rcmail: rcmail
  }).width(680);
}

if (rcmail
		&& (rcmail.env.task == 'mail' || rcmail.env.task == 'addressbook')
		&& typeof(rcube_list_widget) !== 'undefined') {
	/**
	 * Réécriture de la fonction clear de la classe javascript rcube_list_widget
	 * Permet d'ajouter le triggerEvent clear
	 * Nécessaire pour le scroll infini notamment
	 */
	rcube_list_widget.prototype.clear = function(sel)
	{
		  if (this.tagname == 'table') {
		    var tbody = document.createElement('tbody');
		    this.list.insertBefore(tbody, this.tbody);
		    this.list.removeChild(this.list.tBodies[1]);
		    this.tbody = tbody;
		  }
		  else {
		    $(this.row_tagname() + ':not(.thead)', this.tbody).remove();
		  }

		  this.rows = {};
		  this.rowcount = 0;

		  if (sel)
		    this.clear_selection();

		  // reset scroll position (in Opera)
		  if (this.frame)
		    this.frame.scrollTop = 0;

		  // fix list header after removing any rows
		  this.resize();
		  // PAMELA - triggerEvent clear for list
		  this.triggerEvent('clear');
	};
}
