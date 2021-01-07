// Add a new item in portail
rcube_webmail.prototype.addPortailItem = function(event) {
    event.preventDefault();
    openPortailFrame('new');
};

// Edit item in portail
rcube_webmail.prototype.editItem = function(event, id) {
    event.preventDefault();
    openPortailFrame(id);
};

function openPortailFrame(id) {
    var frame = $('<iframe>').attr('id', 'portail_item_frame')
		.attr('src', rcmail.url('settings/plugin.mel_resources_portail', {_frame: 1, _id: id}))
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
            
		},
		buttons: buttons,
		width: w+20,
		height: h,
		rcmail: rcmail
	}).width(w);
}

// Hide item in portail
rcube_webmail.prototype.hideItem = function(event, id) {
    event.preventDefault();
    if (id) {
		var lock = this
			.display_message(rcmail.gettext('mel_portail.wait'), 'loading');
		this.http_post('settings/plugin.portail_hide_item', {
			_id: id
        }, lock);
        $('#' + id).hide();
	}
};


// Switch to edit items
rcube_webmail.prototype.editPortailItems = function(event) {
    event.preventDefault();
    if ($('#portailview').hasClass('manage')) {
        $('#portailview').removeClass('manage');
        $("#portailview").sortable("disable")
    }
    else {
        $('#portailview').addClass('manage');
        $("#portailview").sortable({
            items: ".item:not(.unchangeable)",
            update: function (event, ui) {
                var items = [];
                $('#portailview article.item').each(function() {
                    items.push(this.id);
                });
                rcmail.http_post('settings/plugin.portail_sort_items', '_items='+JSON.stringify(items), rcmail.set_busy(true, 'loading'));
            }
        });
        $("#portailview").sortable("enable");
    }
};

rcube_webmail.prototype.mel_portail_reload_page = function(type) {
    if (type == 'create' || type == 'modify') {
        if (type == 'create') {
            $('#mainscreen').scrollTop(0);
        }
        setTimeout(function() {
            window.location.reload();
        }, 500);
    }
};
