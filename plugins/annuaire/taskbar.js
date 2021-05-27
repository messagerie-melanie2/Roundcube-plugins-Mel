window.rcmail && rcmail.addEventListener('init', function(evt) {
	var href = $('#taskbar a.button-addressbook').attr('href');
	href += '&_source=' + rcmail.env.annuaire_source + '&_action=plugin.annuaire';
	$('#taskbar a.button-addressbook').attr('href', href);
	$('#taskbar a.button-addressbook').attr('onclick', "return rcmail.command('switch-addressbook','addressbook',this,event)");
	rcmail.register_command('switch-addressbook', function(task) {
		rcmail.switch_addressbook(task);
	}, true);
});


// Switch to addressbook default annuaire
rcube_webmail.prototype.switch_addressbook = function(task) {
	var url = this.get_task_url(task);
	url += '&_source=' + this.env.annuaire_source + '&_action=plugin.annuaire';
	this.redirect(url);
};