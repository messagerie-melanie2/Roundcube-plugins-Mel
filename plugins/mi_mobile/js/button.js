window.rcmail && rcmail.addEventListener('init', function(evt) {
    // Mobile button
    if (rcmail.env.task == 'settings' && !rcmail.env.courrielleur) {
        var mobile_button = $('<div>');
        mobile_button.attr('class', 'mobile');
        var mobile_link = $('<a>');
        mobile_link.attr('href', './?_task=switch_skin&_action=switch_mobile');
        // mobile_link.attr('onclick', 'return rcmail.command(\'switch_mobile\',\'\',this,event)');
        mobile_link.text(rcmail.get_label('mi_mobile.mobile'))
        mobile_button.append(mobile_link);
        $('#settings-sections').append(mobile_button);
    }
  });
