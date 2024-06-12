/*
 * Suggestion box plugin
 */
if (window.rcmail) {
  // Plugin  init
  rcmail.addEventListener('init', function (evt) {
    if (rcmail.env.settings_frame_url || false) {
      $('#settings-suggest-frame')
        .attr('src', rcmail.env.settings_frame_url)
        .parent()
        .css('height', '100%')
        .parent()
        .css('height', '100%');
    }

    var tab = $('<li>')
        .attr('id', 'settingstabpluginmel_suggestion_box')
        .addClass('tablink mel_suggestion_box'),
      button = $('<a>')
        .attr(
          'href',
          rcmail.env.comm_path + '&_action=plugin.mel_suggestion_box',
        )
        .attr('title', rcmail.gettext('mel_suggestion_box.showsuggestionbox'))
        .attr('role', 'button')
        .html(rcmail.gettext('mel_suggestion_box.suggestionbox'))
        .appendTo(tab);

    // add tab
    rcmail.add_element(tab, 'tabs');
    // Enable js commande
    rcmail.enable_command('send-suggestion-message', true);
  });
  // HTTP POST send_suggestion_message response
  rcmail.addEventListener(
    'responseafterplugin.mel_suggestion_box_send',
    function (evt) {
      if (evt.response.ret) {
        $('#mel_suggestion_box_option_box .suggestion-box').hide();
        $('#mel_suggestion_box_option_box .sent_message').show();
        $('#mel_suggestion_box_option_box .sent_message').addClass('success');
        $('#mel_suggestion_box_option_box .sent_message').text(
          rcmail.gettext('mel_suggestion_box.suggestionboxmessagesent'),
        );
      } else {
        rcmail.display_message(
          rcmail.gettext('mel_suggestion_box.suggestionboxmessagesenterror'),
          'error',
        );
      }
    },
  );
}

/**
 * Methode d'envoi du message de suggestion (appel Ajax en POST)
 */
rcube_webmail.prototype.send_suggestion_message = function () {
  if (!$('textarea#suggestion-text').val().length) {
    rcmail.display_message(
      rcmail.gettext('mel_suggestion_box.suggestionboxmessageempty'),
      'error',
    );
    return;
  }
  var lock = this.display_message(
    rcmail.gettext('mel_suggestion_box.suggestionboxmessagesend'),
    'loading',
  );
  this.http_post(
    'plugin.mel_suggestion_box_send',
    {
      _suggestion: $('textarea#suggestion-text').val(),
    },
    lock,
  );
};
