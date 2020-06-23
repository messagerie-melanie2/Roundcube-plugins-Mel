$(document).ready(function() {
	$('#_item_logo').change(function(event) {
		if ($(this).val() == "") {
			$('#itemlogo .logobg').hide();
			$('#itemimg img').attr('src', '/plugins/mel_portail/modules/' + $('#_item_type').val() + '/logo.png')
			$('#itemimg img').removeClass('custom')
			$('#itemimg img').attr('style', '')
			$('#_item_logobg').val('');
		}
		else {
			$('#itemlogo .logobg').show();
			$('#itemimg img').attr('src', $(this).val())
			$('#itemimg img').addClass('custom')
		}
	});
	$('#_item_type').change(function(event) {
		if ($('#_item_logo').val() == "") {
			$('#itemimg img').attr('src', '/plugins/mel_portail/modules/' + $(this).val() + '/logo.png')
		}
		changeType($(this).val());
	});
	$('#_item_logobg').change(function(event) {
		$('#itemimg img').attr('style', 'background-color : ' + $(this).val())
	});
	// Affichage du type
	changeType(rcmail.env.personal_item_is_new ? $('#_item_type').val() : rcmail.env.personal_item.type);
	// Gestion du logo
	if ($('#_item_logo').val() != undefined && $('#_item_logo').val() != "" || $('#itemlogo .logo .readonly').length) {
		$('#itemlogo .logobg').show();
		if ($('#_item_logobg').val() != "" && $('#_item_logo').val() != undefined) {
			$('#itemimg img').attr('style', 'background-color : ' + $('#_item_logobg').val());
			$('#itemimg img').addClass('custom');
		}
		else if ($('#itemlogo .logobg .readonly').length) {
			$('#itemimg img').attr('style', 'background-color : ' + $('#itemlogo .logobg .readonly').text());
			$('#itemimg img').addClass('custom');
		}
	}
});

/**
 * Show/hide elements when changing type
 */
function changeType(type) {
	$('fieldset.more').hide();
	$('fieldset.' + type).show();
	if (rcmail.env.nologo.includes(type)) {
		$('#table_logo').hide();
		$('#iteminfo .name').hide();
		$('#iteminfo .tooltip').hide();
		$('#iteminfo .description').hide();
	}
	else {
		$('#table_logo').show();
		$('#iteminfo tr').show();
	}
}

rcube_webmail.prototype.mel_portail_reload_page = function()
{
	setTimeout(function() {
		if (rcmail.env.framed) {
			window.parent.location = rcmail.url('settings/plugin.mel_resources_portail');
		}
		else {
			window.location = rcmail.url('settings/plugin.mel_resources_portail');
		}
	}, 500);
};