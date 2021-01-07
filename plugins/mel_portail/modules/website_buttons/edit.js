$(document).ready(function() {
	$('fieldset.website_buttons.expandable > legend').click(function(event) {
		rcmail.mel_portail_expandable_fieldset_website_buttons($(this).parent())
	});
});

if (window.rcmail) {
	rcmail.addEventListener('init', function(evt) {
		// register commands
		rcmail.register_command('add_portail_button', function() {
			rcmail.add_portail_button();
		}, true);
	});
}

// Add a new button for app
rcube_webmail.prototype.add_portail_button = function() {
    $('fieldset.website_buttons.expanded').each(function(index) {
		rcmail.mel_portail_expandable_fieldset($(this))
		rcmail.mel_portail_expandable_fieldset_website_buttons($(this))
	});
    var html = $("#item_button_website_buttons_template").html();
    var count = $(".website_buttons.buttons").length;
    html = html.replace(/template/g, count);
    $(".website_buttons.buttons").last().after('<fieldset id="item_button_website_buttons_' + count + '" class="more expandable expanded website_buttons buttons">' + html + '</fieldset>');
    $(window).resize();
    $('#item_button_website_buttons_' + count + ' > legend').click(function(event) {
		rcmail.mel_portail_expandable_fieldset($(this).parent())
		rcmail.mel_portail_expandable_fieldset_website_buttons($(this).parent())
	});
	window.location.hash = '#item_button_website_buttons_' + count;
};

// Remove a button link
rcube_webmail.prototype.delete_portail_button = function(event, object) {
	$(object).parent().parent().remove();
};


rcube_webmail.prototype.mel_portail_expandable_fieldset_website_buttons = function(fieldset) {
	if (!fieldset.find('> table.propform tr.button_name span.readonly').length) {
		var name = fieldset.find('> table.propform tr.button_name input').val();
		if (name) {
			fieldset.find('> legend.expand').text(rcmail.get_label('mel_portail.item_button_website_buttons') + ' ' + name);
			fieldset.find('> legend.collapse').text(rcmail.get_label('mel_portail.item_button_website_buttons_collapse') + ' : ' + name);
		}
		else {
			fieldset.find('> legend.expand').text(rcmail.get_label('mel_portail.item_button_website_buttons'));
			fieldset.find('> legend.collapse').text(rcmail.get_label('mel_portail.item_button_website_buttons_collapse'));
		}
	}	
};