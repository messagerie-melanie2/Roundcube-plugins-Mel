window.rcmail && rcmail.addEventListener('init', function(evt) {
	$annuaire = $('#directorylist li a[rel=' + rcmail.env.annuaire_source + ']');
	if (rcmail.env.action == 'plugin.annuaire') {
		// Remove onclick addressbook attribute
		$('#directorylist li a').attr('onclick', null);
		// Contacts group href
		$('#directorylist li.contactgroup a').attr('href', $('#directorylist li.contactgroup').parent().parent().find('a').attr('href'));
		$('#directorylist li.contactgroup a').each(function(i) {
			var gid = $(this).attr('rel').split(':').pop();
			$(this).attr('href', $(this).parent().parent().parent().find('a').attr('href') + '&_gid=' + gid);
		});
	}
	else {
		// Remove onclick addressbook attribute
		$annuaire.attr('onclick', null);
	}
	$annuaire.attr('href', $annuaire.attr('href') + '&_action=plugin.annuaire');
});