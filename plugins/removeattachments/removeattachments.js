/**
 * RemoveAttachments plugin script
 */
window.rcmail  &&  rcmail.addEventListener('init', function(evt) {
    if (rcmail.env.task == 'mail') {
	rcmail.register_command('plugin.removeattachments.removeone', function() {
	    var part = rcmail.env.selected_attachment;
	    if (part > 0 && confirm(rcmail.gettext('removeoneconfirm','removeattachments'))) {
		var lock = rcmail.set_busy(true, 'removeattachments.removing');
		rcmail.http_request('plugin.removeattachments.remove_attachments', '_mbox=' + urlencode(rcmail.env.mailbox) + '&_uid=' + rcmail.env.uid + '&_part=' + part, lock);
	    }
	}, true);
	
	rcmail.register_command('plugin.removeattachments.removeall', function() {
	    if (confirm(rcmail.gettext('removeallconfirm','removeattachments'))) {
		var lock = rcmail.set_busy(true, 'removeattachments.removing');
		rcmail.http_request('plugin.removeattachments.remove_attachments', '_mbox=' + urlencode(rcmail.env.mailbox) + '&_uid=' + rcmail.env.uid + '&_part=-1', lock);
	    }
	}, true);

	rcmail.addEventListener('beforemenu-open', function(p) {
            if (p.menu == 'attachmentmenu') {
		rcmail.env.selected_attachment = p.id; 
            }
	});	

	rcmail.removeattachments_reload = function(uid) {
	    if (rcmail.env.action=='preview') {
		var lock = rcmail.set_busy(false, 'removeattachments.removing');
		parent.rcmail.list_mailbox(rcmail.env.mailbox, rcmail.env.current_page);
	    }
	    else {
		rcmail.show_message(uid);
	    }
	}
    }
});


