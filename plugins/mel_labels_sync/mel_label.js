/**
 * Version:
 * $Revision: 26 $
 * Author:
 * Michael Kefeder
 * http://code.google.com/p/rcmail-thunderbird-labels/
 */

// global variable for contextmenu actions
rcmail.tb_label = '';

rcmail.options_labels = {};

if (window.rcmail) {
	rcmail.addEventListener('init', function(evt) {
		if (rcmail.task == 'mail') {
			if (rcmail.env.action == 'show') {
				$('#tb_label_popup .toolbarmenu li.labels').addClass('show');
			}
			rcmail.addEventListener('responseafterlist', function (evt) {
				var key = '';
				if (rcmail.env.balp_label) {
					$('#tb_label_popup .toolbarmenu li.labels').removeClass('show');
					$('#messagessearchfilter option.labels').removeClass('show');
					if (rcmail.env.mailbox.indexOf(rcmail.env.balp_label) === 0) {
						key = rcmail.env.mailbox.split(rcmail.env.delimiter)[1];
						key = rcmail_tb_labels_key_to_css(key);
					}
					else {
						key = rcmail_tb_labels_key_to_css(rcmail.env.username);
					}
				}
				else {
					key = rcmail_tb_labels_key_to_css(rcmail.env.username);
				}

				if (Enumerable.from(rcmail.options_labels).count() == 0)
				{
					$('#searchfilter option.labels').each((index, elem) => {
							const labelKey = Enumerable.from(elem.classList).toArray().join("."); 

							if (rcmail.options_labels[labelKey] === undefined)
								rcmail.options_labels[labelKey] = [];

							rcmail.options_labels[labelKey].push(elem.outerHTML);

							if (!$(elem).hasClass(key))
								$(elem).remove();
					});
				}
				else {
					let tmpQuerry = $('#searchfilter');//.html("");
	
					$('#searchfilter option.labels').remove();

					if (rcmail.options_labels[`labels.${key}`] !== undefined && rcmail.options_labels[`labels.${key}`])
					{
						for (const objectKey in rcmail.options_labels[`labels.${key}`]) {
							if (Object.hasOwnProperty.call(rcmail.options_labels[`labels.${key}`], objectKey)) {
								const element = rcmail.options_labels[`labels.${key}`][objectKey];
								tmpQuerry.append(element);
							}
						}
					}

				}

				$('#tb_label_popup .toolbarmenu li.labels.'+key).addClass('show');
				$('#searchfilter option.labels.'+key).addClass('show');
			});
		}
	});
}

function rcmail_tb_labels_key_to_css(key) {
	return key
		.replace(/\./g, '_-p-_')
		.replace(/\$/g, '_-s-_')
		.replace(/&/g, '_-e-_')
		.replace(/~/g, '_-t-_')
		.replace(/\\/g, '_-q-_');
}

function rcmail_tb_label_menu(p)
{
	if (typeof rcmail_ui == "undefined")
		rcmail_ui = UI;
	if (!rcmail_ui.check_tb_popup())
		rcmail_ui.tb_label_popup_add();
	
	// Show the popup menu with tags
	// -- skin larry vs classic
	if (typeof rcmail_ui.show_popupmenu == "undefined")
		rcmail_ui.show_popup('tb_label_popup');
	else
		rcmail_ui.show_popupmenu('tb_label_popup');

	return false;
}

/**
* Shows the colors based on flag info like in Thunderbird
*/
function rcm_tb_label_insert(uid, row)
{
	var message = rcmail.env.messages[uid];
	
	if (message.flags && message.flags.tb_labels)
	{
		var html = "";
		var rowobj = $(row.obj);
		for (idx in message.flags.tb_labels) {
			rowobj.addClass('label_' + message.flags.tb_labels[idx].replace('~', ''));
			html += `<span>${rcmail.env.labels_translate[message.flags.tb_labels[idx].replace('~', '')]}</span>`;
		}
		if (html !== "")
			rowobj.find("td.subject").prepend(`<td class="labels">${html}</td>`);
	}
}

/**
* Shows the submenu of thunderbird labels
*/
function rcm_tb_label_submenu(p)
{
	if (typeof rcmail_ui == "undefined")
		rcmail_ui = UI;
	// setup onclick and active/non active classes
	rcm_tb_label_create_popupmenu();
	
	// -- create sensible popup, using roundcubes internals
	if (!rcmail_ui.check_tb_popup())
		rcmail_ui.tb_label_popup_add();
	// -- skin larry vs classic
	if (typeof rcmail_ui.show_popupmenu == "undefined")
		rcmail_ui.show_popup('tb_label_popup');
	else
		rcmail_ui.show_popupmenu('tb_label_popup');
	return false;
}

function rcm_tb_label_flag_toggle(flag_uids, toggle_label, onoff)
{
	var headers_table = $('.message-partheaders table.headers-table');
	var preview_frame = $('#messagecontframe');
	var header_preview_all_table = $('.message-partheaders table.headers-table');
	
	// preview frame exists, simulate environment of single message view
	if (preview_frame.length)
	{
		tb_labels_for_message = preview_frame.get(0).contentWindow.tb_labels_for_message;
		headers_table = preview_frame.contents().find('.message-partheaders table.headers-table');
		header_preview_all_table = preview_frame.contents().find('.message-partheaders table.headers-table');
	}
	
	if (!rcmail.message_list
		&& !headers_table)
		return;
	
	if (rcmail.env.labels_translate[toggle_label]) {
		var label_name = rcmail.env.labels_translate[toggle_label];
	} else {
		var label_name = toggle_label;
	}
	// for single message view
	if (headers_table.length && flag_uids.length)
	{
		if (onoff == true)
		{
			// adcolor
			headers_table.addClass('label_' + toggle_label.replace('~', ''));
			// add to flag list
			tb_labels_for_message.push(toggle_label);
			
			if (header_preview_all_table.find('tr td.label').length > 0) {
				header_preview_all_table.find('tr td.label').html(header_preview_all_table.find('tr td.label').html() + ', <span class="label_' + toggle_label + '">' + label_name + '</span>'); 
			} else {
				if (header_preview_all_table.length > 0) {
					header_preview_all_table.append('<tr><td class="header-title">'+rcmail.gettext('mel_labels_sync.labels')+'</td><td class="header label"><span class="label_' + toggle_label.replace('~', '') + '">' + label_name + '</span></td></tr>');
				}
			}
		}
		else
		{
			// remove color
			headers_table.removeClass('label_' + toggle_label);
			var pos = jQuery.inArray(toggle_label, tb_labels_for_message);
			if (pos > -1)
				tb_labels_for_message.splice(pos, 1);
			
			if (header_preview_all_table.find('tr td.label').length > 0) {
				header_preview_all_table.find('tr td.label').html(header_preview_all_table.find('tr td.label').html().replace('<span class="label_' + toggle_label.replace('~','') + '">' + label_name + '</span>' + ', ','').replace(', ' + '<span class="label_' + toggle_label.replace('~','') + '">' + label_name + '</span>','').replace('<span class="label_' + toggle_label.replace('~','') + '">' + label_name + '</span>',''));
				if (header_preview_all_table.find('tr td.label').html() == "") {
					header_preview_all_table.find('tr td.label').parent().remove();
				}
			}
		}
		// exit function when in detail mode. when preview is active keep going
		if (!rcmail.env.messages)
			return;
	}
	jQuery.each(flag_uids, function (idx, uid) {
		if (uid == -1) {
			return;
		}
		var message = rcmail.env.messages[uid];
		var row = rcmail.message_list.rows[uid];
		if (onoff == true)
		{				
			// add colors
			var rowobj = $(row.obj);
			rowobj.addClass('label_' + toggle_label.replace('~',''));
			// add to flag list
			message.flags.tb_labels.push(toggle_label);

			if (rowobj.find('td.labels').length === 0 && rowobj.find('span.labels').length === 0)
				rowobj.find("td.subject").prepend(`<td class="labels"></td>`)
			
			if (rowobj.find('td.labels').length > 0) {
				if (rowobj.find('td.labels').html() == "") {
					rowobj.find('td.labels').html(`<span>${label_name}</span>`);
				} else {
					rowobj.find('td.labels').append(`<span>${label_name}</span>`);
				}
			}
			else if (rowobj.find('span.labels').length > 0) {
				if (rowobj.find('span.labels').html() == "") {
					rowobj.find('span.labels').html(label_name);
				} else {
					rowobj.find('span.labels').html(rowobj.find('span.labels').html() + ', ' + label_name);
				}
			}
		}
		else
		{
			// remove colors
			var rowobj = $(row.obj);
			rowobj.removeClass('label_' + toggle_label.replace('~',''));
			// remove from flag list
			var pos = jQuery.inArray(toggle_label, message.flags.tb_labels);
			if (pos > -1)
				message.flags.tb_labels.splice(pos, 1);
			
			if (rowobj.find('td.labels').length > 0) {
				rowobj.find('td.labels').html(rowobj.find('td.labels').html().replace(`<span>${label_name}</span>`, ''));
			}
			else if (rowobj.find('span.labels').length > 0) {
				rowobj.find('span.labels').text(rowobj.find('span.labels').text().replace(label_name + ', ','').replace(', ' + label_name,'').replace(label_name,''));
			}

			if (rowobj.find('td.labels').children().length === 0)
				rowobj.find('td.labels').remove();
		}
	});
}

function rcm_tb_label_flag_msgs(flag_uids, toggle_label)
{
	rcm_tb_label_flag_toggle(flag_uids, toggle_label, true);
}

function rcm_tb_label_unflag_msgs(unflag_uids, toggle_label)
{
	rcm_tb_label_flag_toggle(unflag_uids, toggle_label, false);
}

// helper function to get selected/active messages
function rcm_tb_label_get_selection()
{
	var selection = rcmail.message_list ? rcmail.message_list.get_selection() : [];
	if (selection.length == 0 && rcmail.env.uid)
		selection = [rcmail.env.uid, ];
	return selection;
}

function rcm_tb_label_create_popupmenu()
{
	if ($('div#tb_label_popup').length > 0
			&& !$('div#tb_label_popup').is(":visible")) {
		$('div#tb_label_popup').attr('data-sticky', 'true');
		if ($('div#tb_label_popup ul').length === 0) {
			rcmail.http_request('plugin.thunderbird_labels.update_list_labels');
		}
	}	
}

function rcm_tb_label_init_onclick(selector = '#tb_label_popup li a', closeAction = () => rcmail.hide_menu('tb_label_popup'))
{
	if ($(selector).length) {
		$(selector).each(function() {
			var cur_a = $(this);
			
			// TODO check if click event is defined instead of unbinding?
			$(this).unbind('click');
			$(this).click(function() {
				var toggle_label;// = $(this).parent().attr('id').split('_b_')[0];
				try {
					toggle_label = $(this).parent().attr('id').split('_b_')[0];
				} catch (error) {
					toggle_label = Enumerable.from(this.classList).where(x => x.includes("label_")).first().replace("label_", "");
				}
				rcmail.mel_label_toggle(toggle_label);
			});
		});
	}
}

function rcmail_ctxm_label(command, el, pos)
{
	// my code works only on selected rows, contextmenu also on unselected
	// so if no selection is available, use the uid set by contextmenu plugin
	var selection = rcmail.message_list ? rcmail.message_list.get_selection() : [];
	
	if (!selection.length && !rcmail.env.uid)
		return;
	if (!selection.length && rcmail.env.uid)
		rcmail.message_list.select_row(rcmail.env.uid);
	
	var cur_a = $('#tb_label_popup li.' + rcmail.tb_label +' a');
	if (cur_a)
	{
		cur_a.click();
	}
	
	return;
}

function rcmail_ctxm_label_set(which)
{
	// hack for my contextmenu submenu hack to propagate the selected label-no
	rcmail.tb_label = which;
}

/**
 * Show manage labels page as jquery UI dialog
 */
function show_rcube_manage_labels()
{
  var frame = $('<iframe>').attr('id', 'managelabelsframe')
    .attr('src', rcmail.url('settings/edit-prefs') + '&_section=labels&_framed=1')
    .attr('frameborder', '0')
    .appendTo(document.body);

  var buttons = {};

  frame.dialog({
    modal: true,
    resizable: false,
    closeOnEscape: true,
    title: '',
    close: function() {
      frame.dialog('destroy').remove();
      window.location.reload();
    },
    buttons: buttons,
    width: 660,
    height: 500,
    rcmail: rcmail
  }).width(640);

  // Fermer le pop up au click
  rcmail.hide_menu('tb_label_popup');
}

// Toggle label for selection
rcube_webmail.prototype.mel_label_toggle = function(toggle_label) {
	var selection = rcm_tb_label_get_selection();
	var unset_all = false;
	var labels_list = [];

	// special case flag 0 means remove all flags
	if (toggle_label == 'label0') {
		unset_all = true;
		$('#tb_label_popup li.show a').each(function() {
			if ($(this).parent().attr('id') != 'label0' 
					&& $(this).attr('id') != 'rcube_manage_labels') {
				labels_list.push($(this).parent().attr('id').split('_b_')[0]);
			}
		});
	} else {
		labels_list.push(toggle_label);
	}

	var _this = this;
	
	jQuery.each(labels_list, function(index, value) {
		if (value) {
			var toggle_label = value.toLowerCase();
			// compile list of unflag and flag msgs and then send command
			// Thunderbird modifies multiple message flags like it did the first in the selection
			// e.g. first message has flag1, you click flag1, every message select loses flag1, the ones not having flag1 don't get it!
			var first_toggle_mode = 'on';
			if (_this.env.messages)
			{
				var first_message = _this.env.messages[selection[0]];
				if (first_message.flags && jQuery.inArray(toggle_label, first_message.flags.tb_labels) >= 0)
					first_toggle_mode = 'off';
				else
					first_toggle_mode = 'on';
			}
			else // single message display
			{
				// flag already set?
				if (jQuery.inArray(toggle_label, tb_labels_for_message) >= 0)
					first_toggle_mode = 'off';
			}
			
			var flag_uids = [];
			var unflag_uids = [];
			jQuery.each(selection, function (idx, uid) {
					// message list not available (example: in detailview)
					if (!_this.env.messages)
					{
						if (first_toggle_mode == 'on')
							flag_uids.push(uid);
						else
							unflag_uids.push(uid);
						// make sure for unset all there is the single message id
						if (unset_all && unflag_uids.length == 0)
							unflag_uids.push(uid);
						return;
					}
					var message = _this.env.messages[uid];
					if (message.flags && jQuery.inArray(toggle_label, message.flags.tb_labels) >= 0)
					{
						if (first_toggle_mode == 'off')
							unflag_uids.push(uid);
					}
					else
					{
						if (first_toggle_mode == 'on')
							flag_uids.push(uid);
					}
			});
			
			if (unset_all)
				flag_uids = [];
			
			// skip sending flags to backend that are not set anywhere
			if (flag_uids.length > 0
					|| unflag_uids.length > 0) {
				var str_flag_uids = flag_uids.join(',');
				var str_unflag_uids = unflag_uids.join(',');
				
				var lock = _this.set_busy(true, 'loading');
				_this.http_request('plugin.thunderbird_labels.set_flags', '_flag_uids=' + str_flag_uids + '&_unflag_uids=' + str_unflag_uids + '&_mbox=' + urlencode(rcmail.env.mailbox) + "&_toggle_label=" + urlencode(toggle_label), lock);
				
				// remove/add classes and tb labels from messages in JS
				rcm_tb_label_flag_msgs(flag_uids, toggle_label);
				rcm_tb_label_unflag_msgs(unflag_uids, toggle_label);
			}
		}
	});
	// Fermer le pop up au click
	closeAction();
	//rcmail.hide_menu('tb_label_popup');
};

$(document).ready(function() {
	rcm_tb_label_init_onclick();
	
	// add keyboard shortcuts for normal keyboard and keypad
	$(document).keyup(function(e) {
		if (!($("input").is(":focus")) && !($("textarea").is(":focus"))) {
			
			var k = e.which;
			if ((k > 47 && k < 58) || (k > 95 && k < 106))
			{
				var label_no = k % 48;
				var cur_a = $('#tb_label_popup').find('li.show.click' + label_no + ' a').click();
			}
		}
	});
	
	// Add labels to mail template
	if ($('#listoptions').length > 0) {
		$('#listoptions fieldset#listoptions-columns ul.proplist').append('<li><label><input type="checkbox" name="list_col[]" value="labels" /> <span>'+rcmail.gettext('mel_labels_sync.labels')+'</span></label></li>');
	}
	if ($('th#rcmlabels').length > 0) {
		$('th#rcmlabels span.labels').text(rcmail.gettext('mel_labels_sync.labels'));
	}	
	
	// Add custom css
	var css = "";
	if (rcmail.env.ismobile) {
		$.each(rcmail.env.labels_color, function(id, val) {
			id = id.replace('~', '').replace(/\./g,'\\.');
			css += "#messagelist li.label_" + id + " span.labels,\n";
			css += "table span.label_" + id + ",\n";
			css += ".toolbarmenu li.label_" + id + ",\n";
			css += ".toolbarmenu li.label_" + id + " a.active\n";
			css += "{\n";
			css += "  color: " + val + ";\n";
			css += "}\n";
		});
	} 
	else {

		function luminance(r, g, b) {
			var a = [r, g, b].map(function (v) {
				v /= 255;
				return v <= 0.03928
					? v / 12.92
					: Math.pow( (v + 0.055) / 1.055, 2.4 );
			});
			return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
		}
		function contrast(rgb1, rgb2) {
			var lum1 = luminance(rgb1[0], rgb1[1], rgb1[2]);
			var lum2 = luminance(rgb2[0], rgb2[1], rgb2[2]);
			var brightest = Math.max(lum1, lum2);
			var darkest = Math.min(lum1, lum2);
			return (brightest + 0.05)
				 / (darkest + 0.05);
		}

		function hexToRgb(hex) {
			var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
			return result ? {
			  r: parseInt(result[1], 16),
			  g: parseInt(result[2], 16),
			  b: parseInt(result[3], 16)
			} : null;
		  }

		  function componentToHex(c) {
			var hex = c.toString(16);
			return hex.length == 1 ? "0" + hex : hex;
		  }
		  
		  function rgbToHex(r, g, b) {
			return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
		  }
		  

		$.each(rcmail.env.labels_color, function(id, val) {

			if (val === null)
				val = "#737373";
			else {
				let hex = hexToRgb(val);
				if (hex !== null)
				{
					let _contrast = contrast([hex.r, hex.g, hex.b], [255, 255, 255]);
					if (_contrast === 1) //same color
						val = "#737373";
					// else if (_contrast < 4.5)
					// {
					// 	let max = Math.max(hex.r, hex.g, hex.b);
					// 	let index = max === hex.r ? "r" : max === hex.g ? "g" : "b";

					// 	while (contrast([hex.r, hex.g, hex.b], [255, 255, 255]) < 4.5) {
							
					// 		if (max >= 255)
					// 			break;

					// 		max += 10;
					// 		if (max > 255)
					// 			max = 255;

					// 		hex[index] = max;
					// 		console.log(val, hex, max, index);
					// 	}

					// 	console.log("old", val, "new", rgbToHex(hex.r, hex.g, hex.b), "ratio", contrast([hex.r, hex.g, hex.b], [255, 255, 255]));
					// 	val = rgbToHex(hex.r, hex.g, hex.b);
					// }
				}

				

				// if (hex !== null && contrast([hex.r, hex.g, hex.b], [255, 255, 255]) <= 4.5)
				// 	val = "grey";
			}
				
			id = id.replace('~', '').replace(/\./g,'\\.');
			css += "#messagelist tr.label_" + id + " td,\n";
			// css += "#messagelist tr.label_" + id + " td a,\n";
			css += ".toolbarmenu li.label_" + id + ",\n";
			css += ".toolbarmenu li.label_" + id + " a.active,\n";
			css += "table span.label_" + id + "\n";
			css += "{\n";
			css += "  color: " + val + ";\n";
			css += "}\n";
			css += "#messagelist tr.selected.label_" + id + " td,\n";
			css += "#messagelist tr.selected.label_" + id + " td a\n";
			css += "{\n";
			css += "  color: #FFFFFF;\n";
			css += "  background-color: "+val+";\n";
			css += "}\n";
			css += `
				html.dark-mode #messagelist tr.label_${id} td,
				html.dark-mode #messagelist tr.selected.label_${id} td
				{
					color: ${val}!important;
				}
			`;
		});

	}

	$("<style type='text/css'>"+css+"</style>").appendTo("head");
	
	// if exists add contextmenu entries
	if (window.rcm_contextmenu_register_command) {
		rcm_contextmenu_register_command('ctxm_tb_label', rcmail_ctxm_label, $('#tb_label_ctxm_mainmenu'), 'moreacts', 'after', true);
	}
	
	// single message displayed?
	if (window.tb_labels_for_message)
	{
		jQuery.each(tb_labels_for_message, function(idx, val)
			{
				rcm_tb_label_flag_msgs([-1,], val);
			}
		);
	}
	
	// add roundcube events
	rcmail.addEventListener('insertrow', function(event) { 
		rcm_tb_label_insert(event.uid, event.row); 
	});
	
	rcmail.addEventListener('init', function(evt) {
		rcmail.register_command('plugin.thunderbird_labels.rcm_tb_label_submenu', rcm_tb_label_submenu, true);
		if (rcmail.message_list) {
			rcmail.message_list.addEventListener('select', function(list) {
				// Ne récupérer la selection qu'une seule fois (problème de perf)
				var selection = list.get_selection();
				$('div#tb_label_popup li a').each(function() {
					if ($(this).attr('id') != "rcube_manage_labels") {
						// add/remove active class
						if (selection.length == 0)
							$(this).removeClass('active');
						else
							$(this).addClass('active');
					}
				});
			});
		}
		if (rcmail.env.action == 'show') {
			// Ne récupérer la selection qu'une seule fois (problème de perf)
			var selection = rcm_tb_label_get_selection();
			$('div#tb_label_popup li a').each(function() {
				if ($(this).attr('id') != "rcube_manage_labels") {
					// add/remove active class
					if (selection.length == 0)
						$(this).removeClass('active');
					else
						$(this).addClass('active');
				}
			});
		}
	});
	rcmail.addEventListener('listupdate', function() {
		if ($('td#rcmlabels').length > 0) {
			$('td#rcmlabels span.labels').text(rcmail.gettext('mel_labels_sync.labels'));
		}
	});
	rcmail.addEventListener('responseafterplugin.thunderbird_labels.update_list_labels', function(evt) {
		if ($('div#tb_label_popup').length > 0) {
			// Ne récupérer la selection qu'une seule fois (problème de perf)
			var selection = rcm_tb_label_get_selection();
			
			$('div#tb_label_popup').html(evt.response.html);
			$('div#tb_label_popup li a').each(function() {
				if ($(this).attr('id') != "rcube_manage_labels") {
					// add/remove active class
					if (selection.length == 0)
						$(this).removeClass('active');
					else
						$(this).addClass('active');
				}
			});
			rcm_tb_label_init_onclick();
		}			
	});
	
	
	// -- add my submenu to roundcubes UI (for roundcube classic only?)
	if (window.rcube_mail_ui) {
		rcube_mail_ui.prototype.tb_label_popup_add = function() {
			add = {
				tb_label_popup:     {id:'tb_label_popup'}
			};
			this.popups = $.extend(this.popups, add);
			var obj = $('#'+this.popups.tb_label_popup.id);
			if (obj.length)
				this.popups.tb_label_popup.obj = obj;
			else
				delete this.popups.tb_label_popup;
		};
	}
	
	if (window.rcube_mail_ui) {
		rcube_mail_ui.prototype.check_tb_popup = function() {
			// larry skin doesn't have that variable, popup works automagically, return true
			if (typeof this.popups == 'undefined')
				return true;
			if (this.popups.tb_label_popup)
				return true;
			else
				return false;
		};
	}
});
