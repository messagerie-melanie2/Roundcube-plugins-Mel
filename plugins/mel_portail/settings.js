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

// Add new item on click on add button
rcube_webmail.prototype.portail_add_item = function() {
	window.document.getElementById('mel_resources_type_frame').src = this.url('settings/plugin.mel_resources_portail', {_frame: 1, _id: 'new'});
	$('#mel_resources_elements_list .focused').removeClass('focused');
	$('#mel_resources_elements_list .selected').removeClass('selected');
};