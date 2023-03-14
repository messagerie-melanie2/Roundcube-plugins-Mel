/**
 * Plugin Mél Junk
 *
 * Permet de rediriger un pourriel à l'administrateur, 
 * se base sur les plugins bounce et markasjunk
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */

if (window.rcmail) {
    rcmail.addEventListener('init', function(evt) {
        // register command (directly enable in message view mode)
        rcmail.register_command('plugin.mel_junk', mel_junk_box, rcmail.env.uid && rcmail.env.mailbox != rcmail.env.junk_folder);
        rcmail.register_command('plugin.mel_junk_send', mel_junk_send, rcmail.env.uid && rcmail.env.mailbox != rcmail.env.junk_folder);

        // add event-listener to message list
        if (rcmail.message_list) {
            rcmail.message_list.addEventListener('select', function(list) {
                rcmail.enable_command('plugin.mel_junk', list.get_selection().length > 0 && rcmail.env.mailbox != rcmail.env.junk_folder);
                rcmail.enable_command('plugin.mel_junk_send', list.get_selection().length > 0 && rcmail.env.mailbox != rcmail.env.junk_folder);
                rcmail.enable_command('plugin.markasjunk', list.get_selection().length > 0 && rcmail.env.mailbox != rcmail.env.junk_folder);
            });
        }

        // make sure the correct icon is displayed even when there is no listupdate event
        rcmail.mel_junk_toggle_button();
    });

    // rcmail.addEventListener('listupdate', function() { rcmail.mel_junk_toggle_button(); });
}

rcube_webmail.prototype.mel_junk_toggle_button = function() {
    var spamobj = $('a.junk'),
        hamobj = $('a.notjunk'),
        disp = {spam: true, ham: true};

    if (this.env.markasjunk_spam_only) {
        disp.ham = false;
    }
    else if (!this.is_multifolder_listing() && this.env.markasjunk_spam_mailbox) {
        if (this.env.mailbox.indexOf(this.env.markasjunk_spam_mailbox) === -1) {
            disp.ham = false;
        }
        else {
            disp.spam = false;
        }
    }

    // if only 1 button is visible make sure its the last one (for styling)
    // allow for multiple instances of the buttons, eg toolbar and contextmenu
    $.each(spamobj, function(i) {
        var cur_spamobj = spamobj.eq(i),
            cur_hamobj = hamobj.eq(i),
            cur_index = spamobj.eq(i).index();

        if (cur_spamobj.parent().parent('li').length > 0) {
            cur_spamobj = cur_spamobj.parent().parent();
            cur_hamobj = cur_hamobj.parent();
        }

        var evt_rtn = rcmail.triggerEvent('markasjunk-update', {objs: {spamobj: cur_spamobj, hamobj: cur_hamobj}, disp: disp});
        if (evt_rtn && evt_rtn.abort)
            return;

        disp = evt_rtn ? evt_rtn.disp : disp;

        disp.spam ? cur_spamobj.show() : cur_spamobj.hide();
        disp.ham ? cur_hamobj.show() : cur_hamobj.hide();

        if (disp.spam && !disp.ham) {
            if (cur_index < cur_hamobj.index()) {
                cur_spamobj.insertAfter(cur_hamobj);
            }
        }
        else if (cur_index > cur_hamobj.index()) {
            cur_hamobj.insertAfter(cur_spamobj);
        }
    });
}

// Open mel junk box
function mel_junk_box(prop, item, event) {
    open_dialog();
}

 /**
     * Messages list options dialog
     */
 function open_dialog()
 {
     var content = $('#mel_junk-box'),
         dialog = content.clone(true);

    //  // Fix id/for attributes
     $('input', dialog).each(function() { this.id = this.id + '_clone'; });
     $('label', dialog).each(function() { $(this).attr('for', $(this).attr('for') + '_clone'); });

     var save_func = function(e) {
        rcmail.command('plugin.mel_junk_send', dialog.find('form'))
         return true;
     };

     dialog = rcmail.simple_dialog(dialog, rcmail.gettext('mel_junk.title'), save_func, {
         closeOnEscape: true,
         minWidth: 400,
         height: 60
     });
 };

// mel junk action
function mel_junk_send(prop, item, event) {
    if ($('#mel_junk-box.popupmenu').is(':visible')) {
      var junk_folder = prop.find('#mel_junk_folder_clone').is(':checked');
      var send_admin = prop.find('#mel_junk_send_admin_clone').is(':checked');
    }
    else {
      // Si le popup est masqué c'est une action directe
      var send_admin = true;
      var junk_folder = true;
    }
    // Send message to administrator ? (bounce)
    if (send_admin) {      
        // Récupère les uid de messages sélectionnés
        var uids = rcmail.env.uid ? [rcmail.env.uid] : rcmail.message_list.get_selection();
        if (uids.length === 0) {
            return false;
        }
        for (const uid of uids) {
            // all checks passed, send message
            lock = rcmail.set_busy(true, 'sendingmessage');
            rcmail.http_post('mail/bounce', 
                                '_token='+rcmail.env.junk_token+
                                '&_id='+
                                '&_attachments='+
                                '&_from='+rcmail.env.junk_identity+
                                '&_to='+urlencode(rcmail.env.administrator_email)+
                                '&_cc=&_bcc=&_store_target='+
                                '&_uid='+uid+
                                '&_mbox='+urlencode(rcmail.env.mailbox)+
                                '&_remote=1', 
                                lock);
        }
    }
    // Put message in junk folder ? (markasjunk plugin)
    if (junk_folder) {
        rcmail.markasjunk_mark(true);
    }
    return true;
}