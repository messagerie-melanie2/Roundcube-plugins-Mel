if (window.rcmail) {
	rcmail.addEventListener('init', function(evt) {
		rcmail.enable_command('plugin.mel_portail_add_resource', true);
		rcmail.enable_command('plugin.mel_portail_hide_resource', true);
		rcmail.enable_command('plugin.mel_portail_show_resource', true);
		// register commands
		rcmail.register_command('plugin.mel_portail_add_resource', function() {
			rcmail.portail_add_item();
		});
		rcmail.register_command('plugin.mel_portail_delete_resource', function() {
			rcmail.portail_delete_item();
		});
		rcmail.register_command('plugin.mel_portail_export_resource', function() {
			rcmail.portail_export_item();
		});
		rcmail.register_command('plugin.mel_portail_reinit_resource', function() {
			rcmail.portail_reinit_items();
		}, true);
		rcmail.register_command('plugin.mel_portail_hide_resource', function(item) {
			rcmail.portail_hide_item(item);
		});
		rcmail.register_command('plugin.mel_portail_show_resource', function(item) {
			rcmail.portail_show_item(item);
		});
		// Elements list
		if (rcmail.gui_objects.mel_portail_items_list) {
			rcmail.mel_portail_items_list = new rcube_list_widget(rcmail.gui_objects.mel_portail_items_list, {
			  multiselect: false,
			  draggable: true,
			  keyboard: false
			});
			rcmail.mel_portail_items_list
				.addEventListener('select', function(e) { rcmail.mel_portail_item_select(e); })
				.addEventListener('dragstart', function(e) { rcmail.mel_portail_dragstart(e); })
				.addEventListener('dragend', function(e) { rcmail.mel_portail_dragend(e); })
				.addEventListener('initrow', function(row) {
					row.obj.onmouseover = function() { rcmail.mel_portail_focus_filter(row); };
					row.obj.onmouseout = function() { rcmail.mel_portail_unfocus_filter(row); };
				})
				.init();
			rcmail.mel_portail_items_list.focus();
		  }
	});
}

// Add new item on click on add button
rcube_webmail.prototype.portail_add_item = function() {
	// window.document.getElementById('mel_resources_type_frame').src = this.url('settings/plugin.mel_resources_portail', {_frame: 1, _id: 'new'});
	$('#mel_resources_elements_list .focused').removeClass('focused');
	$('#mel_resources_elements_list .selected').removeClass('selected');

	var frame = $('<iframe>').attr('id', 'portail_create_item')
		.attr('src', this.url('settings/plugin.mel_resources_portail', {_frame: 1, _id: 'new'}))
		.attr('frameborder', '0')
		.appendTo(document.body);

	var h = Math.floor($(window).height() * 0.75);
	var w = Math.floor($(window).width() * 0.75);
	var buttons = {};

	frame.dialog({
		modal: true,
		resizable: true,
		closeOnEscape: true,
		title: '',
		close: function() {
			frame.dialog('destroy').remove();
			window.location.reload();
		},
		buttons: buttons,
		width: w+20,
		height: h,
		rcmail: rcmail
	}).width(w);
};

// Delete personal item from list
rcube_webmail.prototype.portail_delete_item = function() {
	var id = rcmail.mel_portail_items_list.get_single_selection();
	if (id != null && confirm(rcmail.get_label('mel_portail.delete_confirm'))) {
		var lock = this
			.display_message(rcmail.gettext('mel_portail.wait'), 'loading');
		this.http_post('plugin.portail_delete_item', {
			_id: id
		}, lock);
	}
};

// Export personal item
rcube_webmail.prototype.portail_export_item = function() {
	var id = rcmail.mel_portail_items_list.get_single_selection();
	if (id != null) {
		window.location = this.url('plugin.portail_export_item', {
			_id: id
		});
	}
};

// RAZ of items list
rcube_webmail.prototype.portail_reinit_items = function() {
	if (confirm(rcmail.get_label('mel_portail.reinit_confirm'))) {
		var lock = this
			.display_message(rcmail.gettext('mel_portail.wait'), 'loading');
		this.http_post('plugin.portail_reinit_items', {}, lock);
	}
};

// Hide an item
rcube_webmail.prototype.portail_hide_item = function(item) {
	if (item) {
		var lock = this
			.display_message(rcmail.gettext('mel_portail.wait'), 'loading');
		this.http_post('plugin.portail_hide_item', {
			_id: item
		}, lock);
	}
};

// Show an item
rcube_webmail.prototype.portail_show_item = function(item) {
	if (item) {
		var lock = this
			.display_message(rcmail.gettext('mel_portail.wait'), 'loading');
		this.http_post('plugin.portail_show_item', {
			_id: item
		}, lock);
	}
};

// Resources selection
rcube_webmail.prototype.mel_portail_item_select = function(element) {
	var id = element.get_single_selection();
	if (id != null) {
	  this.load_portail_item_frame(id);
	}
};

// load filter frame
rcube_webmail.prototype.load_portail_item_frame = function(id) {
	var has_id = typeof (id) != 'undefined' && id != null;

	if (this.env.contentframe && window.frames
			&& window.frames[this.env.contentframe]) {
		if ($('#rcmrow' + id).hasClass('personal')) {
			rcmail.enable_command('plugin.mel_portail_delete_resource', true);
			rcmail.enable_command('plugin.mel_portail_export_resource', true);
		}
		else {
			rcmail.enable_command('plugin.mel_portail_delete_resource', false);
			rcmail.enable_command('plugin.mel_portail_export_resource', false);
		}

		target = window.frames[this.env.contentframe];
		var msgid = this.set_busy(true, 'loading');
		target.location.href = this.env.comm_path
			+ '&_action=plugin.mel_resources_' + this.env.resources_action
			+ '&_framed=1' + (has_id ? '&_id=' + id : '') + '&_unlock=' + msgid;
	}
};

rcube_webmail.prototype.mel_portail_reload_page = function()
{
	setTimeout(function() {
		if (rcmail.env.framed) {
			window.parent.location.reload();
		}
		else {
			window.location.reload();
		}
	}, 500);
};

// load filter frame
rcube_webmail.prototype.mel_portail_dragstart = function(list)
{
	var id = list.get_single_selection();

	this.drag_active = true;
	this.drag_filter = id;
};

rcube_webmail.prototype.mel_portail_dragend = function(e)
{
	if (this.drag_active) {
		if (this.drag_filter_target) {
		  var lock = this.set_busy(true, 'loading');
		  var items = [];
		  var index = 0, i = 0;
		  $('#mel_resources_elements_list tr.portail').each(function() {
			var id = this.id.replace(/^rcmrow/, '');
			if (id == rcmail.drag_filter_target) {
			  index = i;
			}
			if (id != rcmail.drag_filter) {
			  items.push(id);
			  i++;
			}
		  });
		  items.splice(index, 0, this.drag_filter);
		  this.show_contentframe(false);
		  this.http_post('plugin.portail_sort_items', '_items='+JSON.stringify(items), lock);
		}
		this.drag_active = false;
	  }
};

rcube_webmail.prototype.mel_portail_focus_filter = function(row)
{
	if (this.drag_active) {
		var id = row.id.replace(/^rcmrow/, '');
		if (id != this.drag_filter && !$('#'+row.id).hasClass('unchangeable')) {
			this.drag_filter_target = id;
			$(row.obj).addClass('elementmoveup');
		}
	}
};

rcube_webmail.prototype.mel_portail_unfocus_filter = function(row)
{
  if (this.drag_active) {
    $(row.obj).removeClass('elementmoveup');
    this.drag_filter_target = null;
  }
};
