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
	if ($('#_item_logo').val() != "") {
		$('#itemlogo .logobg').show();
		if ($('#_item_logobg').val() != "") {
			$('#itemimg img').attr('style', 'background-color : ' + $('#_item_logobg').val())
		}
		$('#itemimg img').addClass('custom')
	}
});

if (window.rcmail) {
	rcmail.addEventListener('init', function(evt) {
		rcmail.enable_command('plugin.mel_portail_add_resource', true);
		// register commands
		rcmail.register_command('plugin.mel_portail_add_resource', function() {
			rcmail.portail_add_item()
		});
		rcmail.register_command('plugin.mel_portail_delete_resource', function() {
			rcmail.portail_delete_item()
		});
	});
}

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

// Add a new button for app
rcube_webmail.prototype.save_item = function(event, object) {
	var form = this.gui_objects.itemeditform;
	if (form) {
		form.submit();
	}
};

// Add new item on click on add button
rcube_webmail.prototype.portail_add_item = function() {
	alert('proot');
	window.document.getElementById('mel_resources_type_frame').src = this.url('settings/plugin.mel_resources_portail', {_frame: 1, _id: 'new'});
	$('#mel_resources_elements_list .focused').removeClass('focused');
	$('#mel_resources_elements_list .selected').removeClass('selected');
};