/**
 * Plugin Mél Envoi différé
 *
 * Afficher la pop up de droit à la déconnexion
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

var dialog;

if (window.rcmail) {
    rcmail.addEventListener('init', function (evt) {
        if (rcmail.env.deconnection_right_popup) {
            setTimeout(() => {
                rcmail.deconnection_right_popup();
            }, 500);
        }
        // Event storage pour fermer les popup
        window.addEventListener('storage', function(e) {
            if (e.key == 'disable_disconnection_popup' && e.newValue) {
                window.dialog.dialog('destroy');
            }
        });
    });
    // Gérer la pop up après le regresh
    rcmail.addEventListener('plugin.deconnection_right_popup', function (evt) {
        rcmail.deconnection_right_popup();
    });
}

rcube_webmail.prototype.deconnection_right_popup = function() {
    if ($('#disconnection_popup').length) {
        // Si la pop up est déjà affichée
        return;
    }
    // HTML
    let html = '<div id="disconnection_popup">';
    html += '<span class="title">' + this.gettext('disco_popup_title', 'mel_envoi_differe') + '</span>';
    html += '<span class="description">' + this.gettext('disco_popup_description', 'mel_envoi_differe') + '</span>';
    html += '</div>';

    // Buttons
    let buttons = [
        {
            text: this.gettext('disco_button_continue', 'mel_envoi_differe'),
            'class': 'mainaction',
            click: function () {
                rcmail.http_post('plugin.disconnection', {_act: 'continue'});
                window.localStorage.setItem('disable_disconnection_popup', true);
                window.dialog.dialog('destroy');
            }
        },
        {
            text: this.gettext('disco_button_continue_with_remise_differe', 'mel_envoi_differe'),
            click: function () {
                rcmail.http_post('plugin.disconnection', {_act: 'continue_with_remise_differe'});
                window.localStorage.setItem('disable_disconnection_popup', true);
                window.dialog.dialog('destroy');
            }
        },
        {
            text: this.gettext('disco_button_disconnect', 'mel_envoi_differe'),
            click: function (event) {
                window.dialog.dialog('destroy');
                return rcmail.command('switch-task', 'logout', this, event);
            }
        },
    ];

    // Show pop up
    window.dialog = this.show_popup_dialog(html, this.gettext('disco_popup_title', 'mel_envoi_differe'), buttons, { width: 400, resizable: false, height: 500 });
    $('#disconnection_popup').parent().parent().addClass('disconnection_popup');
    window.localStorage.removeItem('disable_disconnection_popup');
};