/**
 * melanissimo.js
 * 
 * Permet la détection de la taille des pièces jointes pour savoir si le message
 * doit être envoyé par Melanissimo ou non
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

$(document).ready(function() {
  // binds to click event of your input send button
  if (rcmail.env.ismobile) {
    $(".jqm-compose a.send").bind('click', function(event) {
      var lock = rcmail.display_message(rcmail.gettext('loading'), 'loading');
      rcmail.http_post('plugin.test_melanissimo', {
        _id : rcmail.env.compose_id
      }, lock);
    });
  }
  else {
    $("#messagetoolbar a.send").bind('click', function(event) {
      var lock = rcmail.display_message(rcmail.gettext('loading'), 'loading');
      rcmail.http_post('plugin.test_melanissimo', {
        _id : rcmail.env.compose_id
      }, lock);
    });
  }
  
  
  // binds to onchange event of your input field
  $('#uploadformFrm input[type=\'file\']').bind('change', function() {
    total_size += this.files[0].size
    // Supprimer l'appel a l'auto save dans les brouillons pour un message Mélanissimo
    if (total_size > rcmail.env.max_attachments_size) {
      clearTimeout(rcmail.save_timer);
      rcmail.env.draft_autosave = 0;
    }
  });
});

if (window.rcmail) {
  rcmail.addEventListener('init', function(evt) {
    // Supprime le onclick des boutons pour intercepter le click
    if (rcmail.env.ismobile) {
      $(".jqm-compose a.send").prop('onclick', null);
    }
    else {
      $("#messagetoolbar a.send").prop('onclick', null);
    }
    
  });

  rcmail.addEventListener('responseafterplugin.test_melanissimo', function(
      event) {
    // Tester si on est en remise différée
    if (event.response.use_melanissimo && $('#envoi_differe').length && $('#envoi_differe').val()) {
      rcmail.show_popup_dialog(
        rcmail.labels['mel_melanissimo.Melanissimo remise differee error'], 
        "",
        [{
          text: rcmail.labels['mel_melanissimo.button send now'],
          'class': 'mainaction',
          click: function() {
            if (send_with_melanissimo(event))
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
      send_with_melanissimo(event);
    }
  });
  
  rcmail.addEventListener('responseafterplugin.send_melanissimo', function(
      event) {
    // Suppression du timer
    clearInterval(timer);
    rcmail.env.is_sent = event.response.success;
    // Gestion du résultat
    if (event.response.success) {
      rcmail.remove_compose_data(rcmail.env.compose_id);
      rcmail.display_message(rcmail.labels['mel_melanissimo.Send Melanissimo success'], 'confirmation');
      $('#send_melanissimo_dialog .dialog_text').text(rcmail.labels['mel_melanissimo.Send Melanissimo success']);
      // Fermer la fenêtre d'envoi après 5sec
      setTimeout(function() {
        return rcmail.command('list', '', this, event)
      }, 5000);
    }
    else {
      rcmail.display_message(rcmail.labels['mel_melanissimo.Send Melanissimo error']  + " Error [" + event.response.httpCode + "] : " + event.response.errorMessage, 'error');
      $('#send_melanissimo_dialog .dialog_text').text(rcmail.labels['mel_melanissimo.Send Melanissimo error']  + " Error [" + event.response.httpCode + "] : " + event.response.errorMessage);
    }
    // Masquer le gif de loading
    $('#send_melanissimo_dialog .uil-rolling-css').hide();
    // Masquer le dialog après 3sec
    setTimeout(function() {
      $("#send_melanissimo_dialog").dialog('close');
    }, 3000);
  });
  
  rcmail.addEventListener('responseafterplugin.update_progressbar', function(
      event) {
    console.log('responseafterplugin.update_progressbar : ' + JSON.stringify(event.response.compose));
    $( "#send_melanissimo_dialog .progressbar" ).text(event.response.current_value + '%');
    $( "#send_melanissimo_dialog .current_action" ).text(event.response.current_action);
  });
}

/**
 * Retour de l'event plugin.send_melanissimo
 */
function send_with_melanissimo(event) {
  // Réponse du serveur : envoie par Melanissimo ?
  if (event.response.use_melanissimo) {
    // Est-ce que le service Melanissimo est up ?
    if (!event.response.melanissimo_up) {
      alert(rcmail.labels['mel_melanissimo.Melanissimo service down'] + " Error [" + event.response.httpCode + "] : " + event.response.errorMessage);      
    }
    else {
      var buttons = {};
      buttons[rcmail.labels['mel_melanissimo.send_melanissimo']] = function () {
        if (validate_message()) {
          send_melanissimo_message();
        }
        $(this).dialog("close");
      };
      buttons[rcmail.labels['mel_melanissimo.cancel']] = function () {
        $(this).dialog("close");
      };
      $(event.response.dialog_html).dialog({
          modal: true, 
          title: rcmail.labels['mel_melanissimo.Send Melanissimo title'], 
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
  // Est-ce qu'on dépasse la limite maximum du service Melanissimo ?
  else if (event.response.over_size_melanissimo) {
    alert(rcmail.labels['mel_melanissimo.Over size Melanissimo error'].replace('%%max_melanissimo_size%%', event.response.max_melanissimo_size).replace('%%size%%', event.response.size));
  } 
  // Envoi classique du message
  else {
    return rcmail.command('send', '', this, event);
  }
}

/**
 * Envoi du message via le service Melanissimo (appel Ajax)
 */
function send_melanissimo_message() {
  // MANTIS 0005303: Problème de délai dépassé dans la requête
  rcmail.env.request_timeout = 1500;
  
  rcmail.http_post('plugin.send_melanissimo', {
    _id : rcmail.env.compose_id,
    _nb_days: $("#use_melanissimo_dialog .dialog_select select option:selected").val(),
    _from: $("select#_from").length ? $("#_from option:selected").val() : $("#_from").val(),
    _to: $('#_to').val(),
    _cc: $('#_cc').val(),
    _bcc: $('#_bcc').val(),
    _draft_id: $('input[name=\'_draft_saveid\']').val(),
    _subject: $('#compose-subject').val(),
    _message: $('#composebody').val(),
  });
  
//  var compose_id = rcmail.env.compose_id;
//  timer = window.setInterval(function() {
//    // call your function here
//    rcmail.http_post('plugin.update_progressbar', {
//      _id : compose_id,
//    });
//  }, 5000);
//  rcmail.http_post('plugin.update_progressbar', {
//    _id : compose_id,
//  });
  
  var dialog_html = '<div id="send_melanissimo_dialog"><div class="dialog_title">' + rcmail.labels['mel_melanissimo.Send Melanissimo title'] + '</div>';
  dialog_html += '<span class="dialog_text">' + rcmail.labels['mel_melanissimo.Send Melanissimo message'] + '</span>';
  dialog_html += '<div class="uil-rolling-css"><div>';
  dialog_html += '</div>';
  
  $(dialog_html).dialog({
    modal: true, 
    title: rcmail.labels['mel_melanissimo.Send Melanissimo title'], 
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
  // Modifier le libéllé au bout de 5sec
  setTimeout(function() {
    $( "#send_melanissimo_dialog .dialog_text" ).text(rcmail.labels['mel_melanissimo.Download files Melanissimo message']);
  }, 5000);
  
//  $( "#send_melanissimo_dialog .progressbar" ).text('0%');
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
