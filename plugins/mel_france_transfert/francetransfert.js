/**
 * francetransfert.js
 * 
 * Permet la détection de la taille des pièces jointes pour savoir si le message
 * doit être envoyé par France Transfert ou non
 * 
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License version 2 as published by the
 * Free Software Foundation.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 51
 * Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 * 
 */

// Variables globales
var timer;
var total_size = 0;
var ft_error_timeout = 300000;

$(document).ready(function() {
  // binds to click event of your input send button
  $("#toolbar-menu a.send").bind('click', function(event) {
    var lock = rcmail.display_message(rcmail.gettext('loading'), 'loading');
    rcmail.http_post('plugin.test_francetransfert', {
      _id : rcmail.env.compose_id
    }, lock);
  });
});

if (window.rcmail) {
  rcmail.addEventListener('init', function(evt) {
    // Supprime le onclick des boutons pour intercepter le click
    $("#toolbar-menu a.send").prop('onclick', null);
  });

  rcmail.addEventListener('actionbefore', function(evt) {
    if (evt.action == 'send-attachment') {
      const formInput = $('#uploadformInput')[0];
      if (formInput.files.length) {
        for (var i=0; i < formInput.files.length; i++) {
          total_size += formInput.files[i].size
          // Supprimer l'appel a l'auto save dans les brouillons pour un message Mélanissimo
          if (total_size > rcmail.env.max_attachments_size) {
            clearTimeout(rcmail.save_timer);
            rcmail.env.draft_autosave = 0;
          }
        }
      }
    }
  });

  rcmail.addEventListener('responseafterplugin.test_francetransfert', function(
      event) {
    // Tester si on est en remise différée
    if (event.response.use_francetransfert && $('#envoi_differe').length && $('#envoi_differe').val()) {
      rcmail.show_popup_dialog(
        rcmail.labels['mel_france_transfert.France Transfert remise differee error'], 
        "",
        [{
          text: rcmail.labels['mel_france_transfert.button send now'],
          'class': 'mainaction',
          click: function() {
            if (send_with_francetransfert(event))
              $(this).dialog('close');
          }
        },
        {
          text: rcmail.get_label('cancel'),
          click: function() {
            $(this).dialog('close');
          }
        }]);
    }
    else {
      send_with_francetransfert(event);
    }
  });

  rcmail.addEventListener('responseafterplugin.send_francetransfert', function(event) {
    if (event.response.success) {
      window.timer = setInterval(() => {
        rcmail.http_post('plugin.update_progressbar', {
          _id : rcmail.env.compose_id
        });
      }, 10000);
      
      // Modifier le libéllé
      $( "#send_francetransfert_dialog .dialog_text" ).text(rcmail.labels['mel_france_transfert.Download files France Transfert message']);
    }
    else {
      rcmail.display_message(
        rcmail.labels['mel_france_transfert.Send France Transfert error']  + ". " + event.response.errorMessage, 
        'error', 
        ft_error_timeout);
      $("#send_francetransfert_dialog").dialog('close');
    }
  });
  
  rcmail.addEventListener('responseafterplugin.update_progressbar', function(event) {
    if (event.response.finish) {
      // Suppression du timer
      clearInterval(timer);
      rcmail.env.is_sent = event.response.success;
      // Gestion du résultat
      if (event.response.success) {
        rcmail.remove_compose_data(rcmail.env.compose_id);
        rcmail.display_message(rcmail.labels['mel_france_transfert.Send France Transfert success'], 'confirmation');
        // Fermer la fenêtre d'envoi après 5sec
        setTimeout(function() {
          rcmail.sent_successfully('confirmation', rcmail.labels['mel_france_transfert.Send France Transfert success']);
        }, 2000);
      }
      else {
        rcmail.display_message(
          rcmail.labels['mel_france_transfert.Send France Transfert error']  + ". " + event.response.current_action, 
          'error', 
          ft_error_timeout);
      }
      // Masquer le gif de loading
      $('#send_francetransfert_dialog .uil-rolling-css').hide();
      // Masquer le dialog après 3sec
      setTimeout(function() {
        $("#send_francetransfert_dialog").dialog('close');
      }, 3000);
    }
    $( "#send_francetransfert_dialog .dialog_text" ).text(event.response.current_action);
  });
}

/**
 * Retour de l'event plugin.send_francetransfert
 */
function send_with_francetransfert(event) {
  // Réponse du serveur : envoie par France Transfert ?
  if (event.response.use_francetransfert) {
    // Est-ce que le service France Transfert est up ?
    if (!event.response.francetransfert_up) {
      rcmail.display_message(
        rcmail.labels['mel_france_transfert.France Transfert service down'] + " Error [" + event.response.httpCode + "] : " + event.response.errorMessage, 
        'error', 
        ft_error_timeout);
    }
    else {
      var buttons = {};
      buttons[rcmail.labels['mel_france_transfert.send_francetransfert']] = function () {
        if (validate_message()) {
          send_francetransfert_message();
        }
        $(this).dialog("close");
      };
      buttons[rcmail.labels['mel_france_transfert.cancel']] = function () {
        $(this).dialog("close");
      };
      $(event.response.dialog_html).dialog({
          modal: true, 
          title: rcmail.labels['mel_france_transfert.Send France Transfert title'], 
          zIndex: 10000, 
          autoOpen: true,
          width: '450px', 
          resizable: false,
          buttons: buttons,
          close: function (event, ui) {
              $(this).remove();
          }
      });
    }      
  }
  // Est-ce qu'on dépasse la limite maximum du service France Transfert ?
  else if (event.response.over_size_francetransfert) {
    rcmail.display_message(
      rcmail.labels['mel_france_transfert.Over size France Transfert error']
        .replace('%%max_francetransfert_size%%', event.response.max_francetransfert_size)
        .replace('%%size%%', event.response.size), 
      'error', 
      ft_error_timeout);
  } 
  // Envoi classique du message
  else {
    return rcmail.command('send', '', this, event);
  }
}

function francetransfert_get_compose_message_text() {
  var msg;

  if (window.tinyMCE && (ed = tinyMCE.get(rcmail.env.composebody))) {
    msg = ed.getContent({ format: 'text' });
    msg = msg.replace(/<blockquote[^>]*>(.|[\r\n])*<\/blockquote>/gmi, '');
  }
  else {
    msg = $('#' + rcmail.env.composebody).val();
    msg = msg.replace(/^>.*$/gmi, '');
  }

  return msg;
};

/**
 * Envoi du message via le service France Transfert (appel Ajax)
 */
function send_francetransfert_message() {
  // MANTIS 0005303: Problème de délai dépassé dans la requête
  rcmail.env.request_timeout = 1800;

  // set jQuery ajax options
  $.ajaxSetup({
    timeout: rcmail.env.request_timeout * 1000
  });
  
  rcmail.http_post('plugin.send_francetransfert', {
    _id : rcmail.env.compose_id,
    _nb_days: $("#use_francetransfert_dialog .dialog_select select option:selected").val(),
    _from: $("select#_from").length ? $("#_from option:selected").val() : $("#_from").val(),
    _to: $('#_to').val(),
    _cc: $('#_cc').val(),
    _bcc: $('#_bcc').val(),
    _draft_id: $('input[name=\'_draft_saveid\']').val(),
    _subject: $('#compose-subject').val(),
    _message: francetransfert_get_compose_message_text(),
  }); 

  var dialog_html = '<div id="send_francetransfert_dialog">';
      dialog_html += '<div class="dialog_title row align-items-center"><span class="col-3"><img alt="Logo République française" src="https://francetransfert.numerique.gouv.fr/assets/logos/republique_francaise_logo.svg"></span><span class="col-6"><img alt="Logo France transfert" src="https://francetransfert.numerique.gouv.fr/assets/logos/france_transfert_logo.svg"></span></div>';
      dialog_html += '<span class="dialog_text">' + rcmail.labels['mel_france_transfert.Send France Transfert message'] + '</span>';
      dialog_html += '<div class="uil-rolling-css"><div>';
      dialog_html += '</div>';
      
  $(dialog_html).dialog({
    modal: true, 
    title: rcmail.labels['mel_france_transfert.Send France Transfert title'], 
    zIndex: 10000, 
    autoOpen: true,
    width: '450px', 
    resizable: false,
    closeOnEscape: false,
    open: function(event, ui) { $(".ui-dialog-titlebar-close", ui.dialog | ui).hide(); },
    close: function (event, ui) {      
      $(this).remove();      
    }
  });
}

/**
 * Validation du message au moment de l'envoi
 * 
 * @returns {Boolean}
 */
function validate_message() {
  var input_to  = $('#_to').val();
  var input_subject = $('#compose-subject').val();
  var input_message = $('#composebody').val();

  // check for empty recipient
  var recipients = input_to;
  if (!rcube_check_email(recipients.replace(/^\s+/, '').replace(/[\s,;]+$/, ''), true)) {
    alert(rcmail.get_label('norecipientwarning'));
    return false;
  }
  else if (!input_subject.length) {
    alert(rcmail.get_label('nosubjectwarning'));
    return false;
  }
  else if (!input_message.length) {
    alert(rcmail.get_label('nobodywarning'));
    return false;
  }
  else {
    return true;
  }
}
