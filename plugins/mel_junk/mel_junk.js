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
    });
}

// Open mel junk box
function mel_junk_box(prop, item, event) {
    UI.toggle_popup('mel_junk-box', event);
}

// mel junk action
function mel_junk_send(prop, item, event) {
    if ($('#mel_junk-box').is(':visible')) {
        // Quels sont les choix de l'utilisateur dans le popup ?
        var send_admin = $('#mel_junk-box #mel_junk_send_admin').is(':checked');
        var junk_folder = $('#mel_junk-box #mel_junk_folder').is(':checked');
    }
    else {
        // Si le popup est masqué c'est une action directe
        var send_admin = true;
        var junk_folder = true;
    }
    // Send message to administrator ? (bounce plugin)
    if (send_admin) {      
        // Récupère les uid de messages sélectionnés
        var uids = rcmail.env.uid ? [rcmail.env.uid] : rcmail.message_list.get_selection();
        if (uids.length === 0) {
            return false;
        }
        for (const uid of uids) {
            // all checks passed, send message
            lock = rcmail.set_busy(true, 'sendingmessage');
            rcmail.http_post('plugin.bounce', 
                                '_uid='+uid+
                                '&_to='+urlencode(rcmail.env.administrator_email)+
                                '&_cc=&_bcc='+
                                '&_mbox='+urlencode(rcmail.env.mailbox), 
                                lock);
        }
    }
    // Put message in junk folder ? (markasjunk plugin)
    if (junk_folder) {
        rcmail_markasjunk();
    }
    if ($('#mel_junk-box').is(':visible')) {
        $('#mel_junk-box').hide();
    }
    return true;
}