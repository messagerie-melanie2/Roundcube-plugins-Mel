/**
 * Client script for the Annuaire plugin
 * 
 * @licstart The following is the entire license notice for the JavaScript code
 *           in this file.
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License version 2 as published by the
 * Free Software Foundation.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 * 
 * @licend The above is the entire license notice for the JavaScript code in
 *         this file.
 */

// Compose field for annuaire
var field = null;

// On click gototree element list
$(document).on("submit", '#quicksearchbar form', function(e) {
	e.preventDefault();
	rcmail.http_get('addressbook/plugin.annuaire', {
		_source : rcmail.env.source,
		_q : $('#quicksearchbar input#quicksearchbox').val()
	}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
});

// Search submit in compose contacts list
$(document).on("submit", '.contactslist .listsearchbox form', function(e) {
	e.preventDefault();
	if ($('#annuaire-list li.container').length) {
		// Search for every containers
		$('#annuaire-list li.container').each(function() {
			$(this).find('> ul').empty();
			$(this).find('> ul').append('<li class="child"><span></span></li>');
			if ($('input#contactsearchbox').val().length < 1) {
				// Reinit
				$(this).removeClass('legend');
				rcmail.annuaire_list.collapse($(this).attr('id').replace(/rcmrow/, ''));
			}
			else {
				$(this).addClass('legend');
				if ($(this).hasClass('addressbook')) {
					var source = $(this).attr('id').replace(/rcmrow/, '');
				}
				else {
					var source = $(this).attr('id').split('-').pop();
				}
				rcmail.http_get('mail/plugin.annuaire', {
					_source : source,
					_q : $('input#contactsearchbox').val()
				}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
			}
		});
	}
	else {
		$('#annuaire-list').empty();
		// Search for current container
		rcmail.http_get('mail/plugin.annuaire', {
			_source : rcmail.env.annuaire_source,
			_q : $('input#contactsearchbox').val()
		}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
	}
	
	rcmail.annuaire_list.reset(true);
});

// Filter in compose contacts list
$(document).on("keyup", 'input#contactsearchbox', function(e) {
	$('#annuaire-list li.object').show();
	var search = $(this).val().toLowerCase();
	$('#annuaire-list li.object').each(function() {
		var obj = $(this).find('> span.name');
		if (search.length > 1) {
			if (obj.text().toLowerCase().indexOf(search) >= 0) {
				obj.html(obj.text());
				obj.html(obj.text().replace(new RegExp(search, 'gi'), '<strong>$&</strong>'));
			}
			else {
				obj.html(obj.text());
				$(this).hide();
			}
		}
		else {
			obj.html(obj.text());
		}
	});
});

// register event handlers for UI elements
$(document).on(
		"click",
		'#annuaireselector a',
		function(e) {
			if (!$(this).parent().hasClass('inactive')
					&& !$(this).parent().hasClass('selected')) {
				window.annuaireSelector = this.href.replace(/^.*#/, '');
				$('#annuaireselector li.selected').removeClass('selected')
						.attr('aria-checked', 'false');
				$(this).parent().addClass('selected').attr('aria-checked',
						'true');
				rcmail.annuaire_filter_list();
			}
			return false;
		});

window.rcmail
		&& rcmail.addEventListener('init', function(evt) {
			// Remove contact search
			$('#quicksearchbar form').attr('onsubmit', null);
			$('#compose-contacts .listsearchbox form').attr('onsubmit', null);
			// Annuaire selector
			window.annuaireSelector = 'all';
			
			// init treelist widget
			if (rcmail.gui_objects.annuaire_list
					&& window.rcube_treelist_widget) {
				rcmail.annuaire_list = new rcube_treelist_widget(
						rcmail.gui_objects.annuaire_list, {
							selectable : true,
							id_prefix : 'rcmrow'
						});

				rcmail.annuaire_list.addEventListener('expand', function(node) {
					rcmail.annuaire_folder_expand(node)
				}).addEventListener('beforeselect', function(node) {
					return !$('#rcmrow' + node.id).hasClass('folder') && !$('#rcmrow' + node.id).hasClass('legend');
				}).addEventListener('select', function(node) {
					rcmail.annuaire_node_select(node)
				}).addEventListener('dragstart', function(o) {
					rcmail.drag_start(o);
				}).addEventListener('dragmove', function(e) {
					rcmail.drag_move(e);
				}).addEventListener('dragend', function(e) {
					rcmail.drag_end(e);
				});

				if (rcmail.env.annuaire_list) {
					rcmail.annuaire_list_fill_list(null,
							rcmail.env.annuaire_list);
				}
			}
			
			if (rcmail.env.task == 'mail') {
				$('.showcontacts').click(function(e) {
		        	$('#composeview-float-right').show();
		        	if ($('#annuaire-list li').length == 0) {
		        		rcmail.http_get('mail/plugin.annuaire', {}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
		        	}
		        	window.field = $(this).attr('id').replace('showcontacts_', '');
			    }).css('cursor', 'pointer');
				$('#compose-contacts .close').click(function(e){
		        	$('#composeview-float-right').hide();
		        	$('#annuaire-list li.added').removeClass('added');
			    });
			}
			else if (rcmail.env.task == 'settings' && rcmail.env.action == 'plugin.mel_moncompte') {
				$('#listes_ajouter').click(function(e) {
					var dn_list = $('#liste_listes option:selected').val();
					if (dn_list) {
						$('#listview-float-right').show();
			        	if ($('#annuaire-list li').length == 0) {
			        		rcmail.http_get('mail/plugin.annuaire', {}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
			        	}
					}
					else {
					    alert(rcmail.gettext('mel_moncompte.listes_noselect'));
					}
			    }).css('cursor', 'pointer');
				$('#list-contacts .close').click(function(e){
		        	$('#listview-float-right').hide();
		        	$('#annuaire-list li.added').removeClass('added');
			    });
			}
			else if (rcmail.env.task == 'settings' && (rcmail.env.action == 'plugin.mel_resources_agendas' || rcmail.env.action == 'plugin.mel_resources_contacts' || rcmail.env.action == 'plugin.mel_resources_tasks')) {
				$(document).on("click", '.showcontacts',
						function(e) {
							$('#list-contacts input#contactsearchbox').removeAttr('disabled').removeClass('ui-state-disabled');
							window.annuaireSelector = $('#input_hidden_isgroup').val() == "false" ? 'person' : 'list';
							$('#listview-float-right').show();
				        	if ($('#annuaire-list li').length == 0) {
				        		rcmail.http_get('mail/plugin.annuaire', {_source: rcmail.env.annuaire_source}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
				        	}
				        	else {
				        		rcmail.annuaire_filter_list();
				        	}
				        	window.field = $(this).attr('id').replace('showcontacts_', '');
						});
				$(document).on("click", '#list-contacts .close',
						function(e) {
							$('#listview-float-right').hide();
				        	$('#annuaire-list li.added').removeClass('added');
						});
			}
		});

// Node gototree
rcube_webmail.prototype.annuaire_gototree = function(obj, event) {
	event.stopPropagation();
	var row = $(obj).parent();
	var split = row.attr('id').split('-');
	var source = split.pop();
	var dn = split[0].replace(/rcmrow/, '');
	rcmail.http_get('addressbook/plugin.annuaire', {
		_source : source,
		_find : dn
	}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
};

// Node select
rcube_webmail.prototype.annuaire_node_select = function(node) {
	if (rcmail.env.task == 'addressbook') {
		this.load_contact(node.id, 'show');
	}
	else if (rcmail.env.task == 'mail' && !$('#rcmrow' + node.id).hasClass('added')) {
		// find last focused field name
	    if (!window.field) {
	    	window.field = $(this.env.focused_field).filter(':visible');
	    	window.field = window.field.length ? window.field.attr('id').replace('_', '') : 'to';
	    }
	    
	    var recipients = [], input = $('#_'+field), delim = this.env.recipients_delimiter;
	    
	    if (node.mail) {
		    recipients.push(node.mail);
	    }
	    else if (node.name) {
	    	recipients.push(node.name);
	    	
	    	var gid = node.id.substr(1);
            this.group2expand[gid] = { name: node.name, input:input.get(0) };
            
            this.http_request('group-expand', {_source: $('#rcmrow' + node.id).parent().parent().attr('id').replace(/rcmrow/, ''), _gid: gid}, false);
	    }
	    
	    if (recipients.length && input.length) {
	        var oldval = input.val(), rx = new RegExp(RegExp.escape(delim) + '\\s*$');
	        if (oldval && !rx.test(oldval))
	          oldval += delim + ' ';
	        input.val(oldval + recipients.join(delim + ' ') + delim + ' ').change();
	    }
	    
	    $('#rcmrow' + node.id).addClass('added');
	}
	else if (rcmail.env.task == 'settings' && rcmail.env.action == 'plugin.mel_moncompte') {
		if ($('#idLboxMembers').length && node.email) {
			if (isValidEmail(node.email)) {
				var dn_list = $('#liste_listes option:selected').val();
			    var lock = rcmail.display_message(rcmail
			        .gettext('mel_moncompte.wait'), 'loading');
				var res = rcmail.http_post('plugin.listes_add_externe', {
				  _dn_list : dn_list,
				  _new_smtp : node.email,
				  _current_username : $('#rcmmoncomptebalplist option:selected').val()
			    }, lock);
				$('#rcmrow' + node.id).addClass('added');
			}
			else {
			    alert(rcmail.gettext('mel_moncompte.listes_addr_nok')
			    		.replace('%%newSMTP%%', node.email));
			}
		}
	}
	else if (rcmail.env.task == 'settings' && (rcmail.env.action == 'plugin.mel_resources_agendas' || rcmail.env.action == 'plugin.mel_resources_contacts' || rcmail.env.action == 'plugin.mel_resources_tasks')) {
		var val = $('#input_hidden_isgroup').val() == "false" ? node.uid : node.dn;
		$('#acluser').val(val);
		$('#annuaire-list li.added').removeClass('added');
		$('#rcmrow' + node.id).addClass('added');
		setTimeout(() => {
			$('#listview-float-right').hide();
		}, 1000);
	}
};

// Node expand
rcube_webmail.prototype.annuaire_folder_expand = function(node) {
	if ($('#rcmrow' + node.id + ' > ul > li.child').length) {
		if ($('#rcmrow' + node.id).hasClass('addressbook')) {
			var dn = null;
			var source = node.id;
		}
		else {
			var split = node.id.split('-');
			var source = split.pop();
			var dn = split[0];
		}
		
		this.http_get('addressbook/plugin.annuaire', {
			_base : dn,
			_source : source
		}, this.display_message(this.get_label('loading'), 'loading'));
	}
};

// Call refresh panel
rcmail.addEventListener('responseafterplugin.annuaire', function(evt) {
	if (evt.response.id) {
		if (evt.response.search) {
			if (evt.response.elements.length) {
				$('#rcmrow' + evt.response.id).attr('aria-expanded', 'true');
				$('#rcmrow' + evt.response.id + ' > ul').show();
				rcmail.annuaire_list_fill_list(evt.response.id, evt.response.elements);
			}
			else {
				$('#rcmrow' + evt.response.id).hide();
			}
		}
		else {
			rcmail.annuaire_list_fill_list(evt.response.id, evt.response.elements);
			if (window.annuaireSelector) {
				rcmail.annuaire_filter_list();
			}
		}
	} else {
		rcmail.annuaire_list.reset();
		rcmail.annuaire_list_fill_list(null, evt.response.elements);
		if (window.annuaireSelector) {
			rcmail.annuaire_filter_list();
		}
	}
	// Scoll to find element
	if (evt.response.find) {
		rcmail.annuaire_list.reset(true);
		$('#addresslist .scroller').scrollTop(
				$('#annuaire-list li#' + 'rcmrow' + evt.response.find)
						.position().top);
		$('#annuaire-list li#' + 'rcmrow' + evt.response.find).click();
	}
});
// Fill list with elements
rcube_webmail.prototype.annuaire_list_fill_list = function(parent_id, elements) {
	for (var i = 0; i < elements.length; i++) {
		rcmail.annuaire_list.insert(elements[i], parent_id);
	}
	if (parent_id) {
		$('#rcmrow' + parent_id).find('> ul > li.child').remove();
	}
};
// Filter list with annuaireSelector
rcube_webmail.prototype.annuaire_filter_list = function() {
	if (window.annuaireSelector == 'all') {
		$('#annuaire-list li').show();
	} else {
		$('#annuaire-list li').hide();
		$('#annuaire-list li.folder').show();
		$('#annuaire-list li.' + window.annuaireSelector).show();
	}
};

// load contact record
rcube_webmail.prototype.load_contact_annuaire = function(cid, action, framed) {
	var win, url = {}, target = window;

	if (win = this.get_frame_window(this.env.contentframe)) {
		url._framed = 1;
		target = win;
		this.show_contentframe(true);
	} else if (framed)
		return false;

	if (action && (cid || action == 'add') && !this.drag_active) {
		if (this.env.group)
			url._gid = this.env.group;

		if (this.env.search_request)
			url._search = this.env.search_request;

		url._action = action;
		url._source = this.env.source;
		url._cid = cid;

		this.location_href(url, target, true);
	}

	return true;
};
