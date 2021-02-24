if (window.rcmail) {
	rcmail.addEventListener('init', function(evt) {
		// register commands
		rcmail.register_command('help_open_dialog', function() {
			rcmail.help_open_dialog();
        }, true);
        // Test le help action
        setTimeout(function() {
            if (rcmail.env.help_action) {
                switch (rcmail.env.help_action) {
                    case 'archivage':
                        // Open Archivage ?
                        if (rcmail.env.task == 'mail') {
                            rcmail.plugin_archiver();
                        }
                        break;
                    case 'import':
                        if (rcmail.env.task == 'addressbook') {
                            rcmail.command('import','',this,event);
                        }
                        break;
                    case 'labels':
                        if (rcmail.env.task == 'settings') {
                            rcmail.sections_list.select('labels');
                        }
                        break
                    case 'add':
                        if (rcmail.env.task == 'addressbook') {
                            rcmail.command('add','',this,event);
                        }
                        else if (rcmail.env.task == 'calendar') {
                            rcmail.command('addevent','',this,event);
                        }
                        else if (rcmail.env.task == 'tasks') {
                            $('#createnewtask').click();
                        }
                        break;
                    case 'general':
                        if (rcmail.env.task == 'settings') {
                            rcmail.sections_list.select('general');
                        }
                        break;
                }
                delete rcmail.env.help_action;
            }
        }, 500);
        
	});
}

// Click on Help button open a dialog
rcube_webmail.prototype.help_open_dialog = function() {
	var frame = $('<iframe>').attr('id', 'helppageframe')
        .attr('src', rcmail.url('help/index', {'_framed': '1', '_current_task': rcmail.mel_metapage_url_info.task, '_current_action': rcmail.mel_metapage_url_info.action}))
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
            $('.button-mel_help').removeClass('button-selected');
        },
        buttons: buttons,
        width: w+20,
        height: h,
        rcmail: rcmail
    }).width(w);
    $("#helppageframe").css("max-width", w+"px");
};