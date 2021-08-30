$(document).ready(function() {
    $(document).on('change', '._item_website_links_logo', function(event) {
        var item = $(this).parent().parent().parent().parent().parent();
		if ($(this).val() == "") {
			item.find('.item_links_img img').attr('src', '/plugins/mel_portail/modules/' + $('#_item_type').val() + '/logo.png');
			item.find('.item_links_img img').removeClass('custom');
			item.find('.item_links_img img').attr('style', '');
		}
		else if ($(this).val() == "custom") {
			item.find('table.propform .logo_custom').show();
			item.find('.item_links_img img').attr('src', item.find('table.propform .logo_custom input').val());
		}
		else {
			item.find('.item_links_img img').attr('src', $(this).val());
			item.find('.item_links_img img').addClass('custom');
		}
	});
	
	$(document).on('change', '._item_website_links_custom_logo', function(event) {
        var item = $(this).parent().parent().parent().parent().parent();
		if ($(this).val() == "") {
			item.find('.item_links_img img').attr('src', '/plugins/mel_portail/modules/' + $('#_item_type').val() + '/logo.png');
			item.find('.item_links_img img').removeClass('custom');
			item.find('.item_links_img img').attr('style', '');
		}
		else {
			item.find('.item_links_img img').attr('src', $(this).val());
		}
	});
    
    $('#_item_website_links_links_logobg').on('change', function(event) {
		alert($(this).val());
		if ($(this).val() == '' || $(this).val() == undefined) {
			$('.item_links_img img').removeAttr('style');
		}
		else {
			$('.item_links_img img').attr('style', 'background-color : ' + $(this).val());
		}
		
	});

	$('fieldset.website_links .item_links_img img').on('click', function(event) {
		var fieldset = $(this).parent().parent();
		if (fieldset.hasClass('hide')) {
			fieldset.find('.link_show input').attr('checked', true);
			fieldset.removeClass('hide')
		}
		else {
			fieldset.find('.link_show input').attr('checked', false);
			fieldset.addClass('hide')
		}
	});

	$('fieldset.website_links .link_show input').on('change', function(event) {
		var fieldset = $(this).parent().parent().parent().parent().parent();
		if (this.checked) {
			fieldset.removeClass('hide');
		}
		else {
			fieldset.addClass('hide');
		}
	});

	$('fieldset.website_links.expandable > legend').click(function(event) {
		rcmail.mel_portail_expandable_fieldset_website_links($(this).parent());
	});

	// Gestion du logo
	$('fieldset.website_links').each(function(index) {
		var val = $(this).find('table.propform .link_logo select').val();
		var img = $(this).find('.item_links_img img');
		if (val == 'custom') {
			$(this).find('table.propform .logo_custom').show();
			if ($('#_item_website_links_links_logobg').val()) {
				img.attr('style', 'background-color : ' + $('#_item_website_links_links_logobg').val());
			}
			else if ($('#itemwebsite_links .links_logobg span.readonly').text() && $('#itemwebsite_links .links_logobg span.readonly').text() != "") {
				img.attr('style', 'background-color : ' + $('#itemwebsite_links .links_logobg span.readonly').text());
			}
			else {
				img.removeAttr('style');
			}
		}
		else if (val != '' && val != undefined) {
			if ($('#_item_website_links_links_logobg').val()) {
				img.attr('style', 'background-color : ' + $('#_item_website_links_links_logobg').val());
				img.addClass('custom');
			}
			else if ($('#itemwebsite_links .links_logobg span.readonly').text() && $('#itemwebsite_links .links_logobg span.readonly').text() != "") {
				img.attr('style', 'background-color : ' + $('#itemwebsite_links .links_logobg span.readonly').text());
				img.addClass('custom');
			}
			else {
				img.removeAttr('style');
			}
		}
		else {
			img.attr('style', 'background-color : ' + $('#itemwebsite_links .links_logobg span.readonly').text());
			img.addClass('custom');
		}
	});
});

if (window.rcmail) {
	rcmail.addEventListener('init', function(evt) {
		// register commands
		rcmail.register_command('add_portail_link', function() {
			rcmail.add_portail_link();
		}, true);
	});
}

// Add a new app link
rcube_webmail.prototype.add_portail_link = function() {
	$('fieldset.website_links.expanded').each(function(index) {
		rcmail.mel_portail_expandable_fieldset($(this));
		rcmail.mel_portail_expandable_fieldset_website_links($(this));
	});
    var html = $("#item_link_website_links_template").html();
    var count = $(".website_links.links").length;
    html = html.replace(/template/g, count);
    $(".website_links.links").last().after('<fieldset id="item_link_website_links_' + count + '" class="more expandable expanded website_links links">' + html + '</fieldset>');
	$(window).resize();
	$('#item_link_website_links_' + count + ' > legend').click(function(event) {
		rcmail.mel_portail_expandable_fieldset($(this).parent());
		rcmail.mel_portail_expandable_fieldset_website_links($(this).parent());
	});
	window.location.hash = '#item_link_website_links_' + count;
};

// Remove an app link
rcube_webmail.prototype.delete_portail_link = function(event, object) {
	$(object).parent().parent().remove();
};

rcube_webmail.prototype.mel_portail_expandable_fieldset_website_links = function(fieldset) {
	if (!fieldset.find('> table.propform tr.link_name span.readonly').length) {
		var name = fieldset.find('> table.propform tr.link_name input').val();
		if (name) {
			fieldset.find('> legend.expand').text(rcmail.get_label('mel_portail.item_link_website_links') + ' ' + name);
			fieldset.find('> legend.collapse').text(rcmail.get_label('mel_portail.item_link_website_links_collapse') + ' : ' + name);
		}
		else {
			fieldset.find('> legend.expand').text(rcmail.get_label('mel_portail.item_link_website_links'));
			fieldset.find('> legend.collapse').text(rcmail.get_label('mel_portail.item_link_website_links_collapse'));
		}
	}	
};