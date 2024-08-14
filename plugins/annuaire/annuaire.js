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

// Conserver la liste des nodes
var nodes = {};

// On click gototree element list
$(document).on("submit", '#mainscreen-annuaire #quicksearchbar form', function(e) {
	e.preventDefault();
	var params = { 
		_source: rcmail.env.source,
		_q: $('#quicksearchbar input#quicksearchbox').val()
	};
	rcmail.http_get('addressbook/plugin.annuaire', params, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
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
				var params = {
					_source: source,
					_q: $('input#contactsearchbox').val()
				};

				rcmail.annuaire_set_loading_icon();

				rcmail.http_get('mail/plugin.annuaire', params, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
			}
		});
	}
	else {
		$('#annuaire-list').empty();
		var params = {};
		if ($('input#contactsearchbox').val()) {
			params['_source'] = rcmail.env.annuaire_source;
			params['_q'] = $('input#contactsearchbox').val();
		}
		rcmail.annuaire_set_loading_icon();
		// Search for current container
		rcmail.http_get('mail/plugin.annuaire', params, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
	}
	window.nodes = {};
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
$(document).on("click", '#annuaireselector a', function(e) {
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
			if (rcmail.env.action == 'plugin.annuaire') {
				rcmail.register_command('reset-search', function(props) {
					rcmail.reset_qsearch();
					$('#mainscreen-annuaire #quicksearchbar form').submit();
				}, true);
				rcmail.register_command('export', function() {
					rcmail.annuaire_export();
				});
				rcmail.enable_command('annuairelistsearch', true);
				// Event clic on annuaire
				$('#directorylist li a[rel=' + rcmail.env.annuaire_source + ']').parent().click(function(event) {
					event.preventDefault();
					rcmail.reset_qsearch();
					$('#mainscreen-annuaire #quicksearchbar form').submit();
				});

				$(".button.reset").on("click", () =>{
					event.preventDefault();
					rcmail.reset_qsearch();
					$('#mainscreen-annuaire #quicksearchbar form').submit();
				});

				$('#annuaireselector').on('change', () => {
					window.annuaireSelector = $('#annuaireselector').val();
					rcmail.annuaire_filter_list();

					if (window.annuaireSelector !== 'all')
					{
						$('#quicksearchbar .button.options').addClass('annuaire-filter-selected');
					}
					else {
						$('#quicksearchbar .button.options').removeClass('annuaire-filter-selected');
					}

				});

				let $filter = $('<a href="#search-filter" class="button options" title="Filtre" tabindex="0" data-target="searchmenu" id="rcmbtn133" role="button"><span class="inner">Options</span></a>')
				.click(() => {
					$('#annuaireselector').mousedown();
				});

				$('.filtergroup').appendTo($('#quicksearchbar .button.reset'));

				$('#quicksearchbar .menu').append($filter);

			}
			
			// init treelist widget
			if (rcmail.gui_objects.annuaire_list
					&& window.rcube_treelist_widget) {
				rcmail.annuaire_list = new rcube_treelist_widget(
						rcmail.gui_objects.annuaire_list, {
							selectable : true,
							id_prefix : 'rcmrow'
						});

				rcmail.annuaire_list
					.addEventListener('expand', function(node) {
						rcmail.annuaire_folder_expand(node)
					})
					.addEventListener('beforeselect', function(node) {
						return !$('#rcmrow' + node.id).hasClass('folder') && !$('#rcmrow' + node.id).hasClass('legend');
						// return !$('#rcmrow' + node.id).hasClass('legend');
					})
					.addEventListener('select', function(node) {
						rcmail.annuaire_node_select(node)
					});

				if (rcmail.env.annuaire_list) {
					rcmail.annuaire_list_fill_list(null,
							rcmail.env.annuaire_list);
				}
			}
			
			if (rcmail.env.task == 'mail') {
				rcmail.annuaire_set_show_contacts();
			}
			else if (rcmail.env.task == 'settings' && rcmail.env.action == 'plugin.mel_moncompte') {
				$('#listes_ajouter').click(function(e) {
					var dn_list = $('#liste_listes option:selected').val();
					if (dn_list) {
						$('#listview-float-right').show();
			        	if ($('#annuaire-list li').length == 0) {
							rcmail.annuaire_set_loading_icon();
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
			else if (rcmail.env.task == 'settings' && (rcmail.env.action == 'plugin.mel_resources_bal' || rcmail.env.action == 'plugin.mel_resources_agendas' || rcmail.env.action == 'plugin.mel_resources_contacts' || rcmail.env.action == 'plugin.mel_resources_tasks')) {
				$(document).on("click", '.showcontacts',
						function(e) {
							$('#list-contacts input#contactsearchbox').removeAttr('disabled').removeClass('ui-state-disabled');
							window.annuaireSelector = $('#input_hidden_isgroup').val() == "false" ? 'person' : 'group';
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
							if ($('#listview-float-right').hide !== undefined)
								$('#listview-float-right').hide();
							else 	
								$('#listview-float-right').modal("hide");
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

// Node export
rcube_webmail.prototype.annuaire_export = function() {
	this.goto_url('export', { _cid: this.annuaire_list.get_selection(), _format: 'csv' }, false, true);
};

// Node select
rcube_webmail.prototype.annuaire_node_select = function(node) {
	var node_id = node.id.split('-alias')[0];
	if (rcmail.env.task == 'addressbook') {
		this.enable_command('export', true);
		this.load_contact(node_id, 'show');
	}
	else if (rcmail.env.task == 'mail' && !$('#rcmrow' + node_id).hasClass('added')) {
		// find last focused field name
	    if (!window.field) {
	    	window.field = $(this.env.focused_field).filter(':visible');
	    	window.field = window.field.length ? window.field.attr('id').replace('_', '') : 'to';
	    }

		// Utiliser le node en mémoire
		if (window.nodes[node.id]) {
			node = window.nodes[node.id];
		}
	    
	    var recipients = [], input = $('#_'+field), delim = this.env.recipients_delimiter;
	    
	    if (node.mail) {
		    recipients.push(node.mail);
	    }
	    else if (node.name) {
	    	recipients.push(node.name);
	    	
	    	var gid = node_id.substr(1);
            this.group2expand[gid] = { name: node.name, input:input.get(0) };
            
            this.http_request('group-expand', {_source: $('#rcmrow' + node_id).parent().parent().attr('id').replace(/rcmrow/, ''), _gid: gid}, false);
	    }
	    
	    if (recipients.length && input.length) {
	        var oldval = input.val(), rx = new RegExp(RegExp.escape(delim) + '\\s*$');
	        if (oldval && !rx.test(oldval))
	          oldval += delim + ' ';
	        input.val(oldval + recipients.join(delim + ' ') + delim + ' ').change();
	    }
	    $('#rcmrow' + node_id).addClass('added');
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
				$('#rcmrow' + node_id).addClass('added');
			}
			else {
			    alert(rcmail.gettext('mel_moncompte.listes_addr_nok')
			    		.replace('%%newSMTP%%', node.email));
			}
		}
	}
	else if (rcmail.env.task == 'settings' && (rcmail.env.action == 'plugin.mel_resources_bal' || rcmail.env.action == 'plugin.mel_resources_agendas' || rcmail.env.action == 'plugin.mel_resources_contacts' || rcmail.env.action == 'plugin.mel_resources_tasks')) {
		var val = $('#input_hidden_isgroup').val() == "false" ? node.uid : node.dn;
		$('#acluser').val(val);
		$('#annuaire-list li.added').removeClass('added');
		$('#rcmrow' + node_id).addClass('added');
		setTimeout(() => {
			if ($('#listview-float-right').hide !== undefined)
				$('#listview-float-right').hide();
			else
				$('#listview-float-right').modal("hide");
		}, 1000);
	}
	else {

		if (!$('#rcmrow' + node_id).hasClass('added')) {
			// find last focused field name
			if (!window.field) {
				window.field = $(this.env.focused_field).filter(':visible');
				window.field = window.field.length ? window.field.attr('id').replace('_', '') : 'to';
			}
	
			// Utiliser le node en mémoire
			if (window.nodes[node.id]) {
				node = window.nodes[node.id];
			}
			
			var recipients = [], input = $('#_'+field), delim = this.env.recipients_delimiter;

			if (input.length === 0)
				input = $('#'+field);
			
			if (node.mail) {
				recipients.push(node.mail);
			}
			else if (node.name) {
				recipients.push(node.name);
				
				var gid = node_id.substr(1);
				this.group2expand[gid] = { name: node.name, input:input.get(0) };
				
				this.http_request('mail/group-expand', {_source: $('#rcmrow' + node_id).parent().parent().attr('id').replace(/rcmrow/, ''), _gid: gid}, false);
			}

			if (recipients.length && input.length) {
				var oldval = input.val(), rx = new RegExp(RegExp.escape(delim) + '\\s*$');
				if (oldval && !rx.test(oldval))
				  oldval += delim + ' ';
				input.val(oldval + recipients.join(delim + ' ') + delim + ' ').change();
			}
			else if (recipients.length){
				input.val(recipients.join(delim)).change();
			}

			$('#rcmrow' + node_id).addClass('added');
		}

	}

	const action = !!rcmail.env.annuaire_select_actions.onselect ? rcmail.env.annuaire_select_actions.onselect : null;
	
	if (!!action) 
	{
		action(node, node_id, window.field);
	}
};

// Node expand
rcube_webmail.prototype.annuaire_folder_expand = function(node) {
	if ($('#rcmrow' + node.id + ' > ul > li.child').length) {
		let params = {};
		if ($('#rcmrow' + node.id).hasClass('addressbook')) {
			// Ajouter la base a null sinon on a une erreur
			params['_base'] = null;
			params['_source'] = node.id;
		}
		else {
			let node_id = node.id;
			if (node_id.indexOf('-alias') !== -1) {
				let split_alias = node_id.split('-alias');
				params['_alias'] = 'alias' + split_alias.pop();
				node_id = split_alias[0];
			}
			let split = node_id.split('-');
			params['_source'] = split.pop();
			params['_base'] = split[0];
		}
		rcmail.annuaire_set_loading_icon();
		this.http_get('addressbook/plugin.annuaire', params, this.display_message(this.get_label('loading'), 'loading'));
	}
};

// Call refresh panel
rcmail.addEventListener('responseafterplugin.annuaire', function(evt) {
	rcmail.enable_command('search-create', evt.response.search_request ? true : false);
	rcmail.enable_command('search-delete', evt.response.search_id);
	if (evt.response.search_request) {
		rcmail.env.search_request = evt.response.search_request;
	}
	if (evt.response.search_id) {
		rcmail.env.search_id = evt.response.search_id;
	}
	else {
		$('#savedsearchlist > li').removeClass('selected');
	}
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
		window.nodes = {};
		rcmail.annuaire_list.reset();
		rcmail.annuaire_list_fill_list(null, evt.response.elements);
		if (window.annuaireSelector) {
			rcmail.annuaire_filter_list();
		}
	}
	// Scoll to find element
	if (evt.response.find) {
		rcmail.annuaire_list.reset(true);
		document.getElementById('rcmrow' + evt.response.find).scrollIntoView({
			behavior: 'smooth'
		});
		// $('#addresslist .scroller').scrollTop(
		// 		$('#annuaire-list li#' + 'rcmrow' + evt.response.find)
		// 				.position().top);
		if (rcmail.env.task == 'addressbook') {
			$('#annuaire-list li#' + 'rcmrow' + evt.response.find).click();
		}
	}

	rcmail.annuaire_set_loading_icon(false);
});

// Fill list with elements
rcube_webmail.prototype.annuaire_list_fill_list = function(parent_id, elements) {
	for (var i = 0; i < elements.length; i++) {
		// Gestion des children
		var children = null;
		if (elements[i].children && elements[i].children.length && elements[i].children[0]['html'] != "<span></span>") {
			children = elements[i].children;
			elements[i].children = null;
		}
		// Enregistrer le node
		window.nodes[elements[i].id] = elements[i];
		// Insert le parent
		rcmail.annuaire_list.insert(elements[i], parent_id);
		// Gestion des enfants
		if (children) {
			this.annuaire_list_fill_list(elements[i].id, children);
		}
	}
	if (parent_id) {
		$('#rcmrow' + parent_id).find('> ul > li.child').remove();
	}
	rcmail.annuaire_list.container.find('div.treetoggle, .object').each((i,e) => {
		if(!$(e).hasClass('already')) {
			$(e).attr('tabindex', 0).addClass('already mel-focus');
			if($(e).hasClass('object')) {
				$(e).on('keydown', function(node) {
					if(node.originalEvent.key === 'Enter'){
						$(node.currentTarget).click();
					}
				});
			}
		}
	});
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

// Search from recorded search
rcube_webmail.prototype.annuairelistsearch = function(id)
{
	var lock = this.set_busy(true, 'searching');

	this.env.search_id = id;
	
    this.reset_qsearch();

	$('#savedsearchlist > li').removeClass('selected');
	$('#savedsearchlist li a[rel=S' + id + ']').parent().addClass('selected');

	this.http_get('addressbook/plugin.annuaire', {
		_source : this.env.source,
		_sid : id
	}, lock);
};

// callback for creating a new saved search record
rcube_webmail.prototype.annuaire_insert_saved_search = function(name, id)
{
	var key = 'S'+id,
		link = $('<a>').attr('href', '#')
						.attr('rel', key)
						.click(function() { return rcmail.command('annuairelistsearch', id, this); })
						.html(name),
		prop = { name:name, id:id };

	rcmail.savedsearchlist.insert({ id:key, html:link, classes:['contactsearch'] }, null, 'contactsearch');
	rcmail.enable_command('search-delete', true);
	rcmail.env.search_id = id;

	rcmail.triggerEvent('abook_search_insert', prop);
};

// callback from server upon search-delete command
rcube_webmail.prototype.annuaire_remove_search_item = function(id)
{
	var li, key = 'S'+id;
	if (this.savedsearchlist.remove(key)) {
		this.triggerEvent('search_delete', { id:id, li:li });
	}

	this.env.search_id = null;
	this.env.search_request = null;
	this.enable_command('search-delete', 'search-create', false);

	this.reset_qsearch();
	$('#mainscreen-annuaire #quicksearchbar form').submit();
};

rcube_webmail.prototype.annuaire_set_loading_icon = function(load = true)
{
	if (load)
	{
		if ($(".listsearchbox a.searchicon").length > 0)
			$(".listsearchbox a.searchicon").attr("disabled", "disabled").addClass("disabled").addClass("mel-before-remover").html(`<span class="spinner-grow"></span>`);
	}
	else {

		if ($(".listsearchbox a.searchicon").length > 0)
			$(".listsearchbox a.searchicon").removeAttr("disabled").removeClass("disabled").removeClass("mel-before-remover").html(``);
	}
}

rcube_webmail.prototype.annuaire_set_show_contacts = function()
{
	const init = "initialized";

	$(".showcontacts").each((index, element) => {
		element = $(element);
		if (!element.hasClass(init))
		{
			element.click(function(e) {
				$('#compose-contacts').focus().modal("show");
				if ($('#annuaire-list li').length == 0) {
					rcmail.annuaire_set_loading_icon();
					rcmail.http_get('mail/plugin.annuaire', {}, rcmail.display_message(rcmail.get_label('loading'), 'loading'));
				}
				else {
					$('#annuaire-list li.added').removeClass("selected").removeClass("added").attr("aria-selected", false);
				}
				window.field = $(this).attr('id').replace('showcontacts_', '');
			}).css('cursor', 'pointer').addClass(init);
		}
	});

	$('#compose-contacts .close').each((index, element) => {
		element = $(element);

		if (!element.hasClass(init))
		{
			$('#compose-contacts .close').click(function(e){
				$('#compose-contacts').modal("hide");
				$('#annuaire-list li.added').removeClass('added');
			}).addClass(init);
		}

	});

}
