/**
 * Plugin Mél Archivage
 *
 * Plugin d'archivage des messages depuis Roundcube
 * Les messages sont téléchargés sur le poste de l'utilisateur
 * Puis copié dans un dossier configuré dans 'mel_archivage_folder' 
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
    if (rcmail.env.task == 'mail') {
        rcmail.addEventListener('responseafterlist', function (evt) {
            // register command (directly enable in message view mode)
            rcmail.enable_command('plugin_archiver', rcmail.env.mailbox != rcmail.env.archive_folder);
            if (rcmail.env.mailbox == rcmail.env.archive_folder) {
                rcmail.enable_command('purge', !rcmail.is_multifolder_listing());
            }
        });
    }
    rcmail.addEventListener('init', function (evt) {
        var cookieRegistry = [];
        var datepicker_settings = {
            // translate from PHP format to datepicker format
            onChange: function () {
                getDate(this.value);
            }
        };

        $('#archivage_date').datepicker({ maxDate: 0, dateFormat: 'dd/mm/yy' })
            .change(function () {
                changeInput(this.value);
            });

        $('#nb_jours').on('keyup', function () {
            changeDatepicker(this.value);
        })
        $('#nb_jours').on('change', function () {
            changeDatepicker(this.value);
        })

        $('#form_archivage').submit(function (event) {
            if (rcmail.env.iselectron) {
                event.preventDefault();
                var params = {
                    _mbox: rcmail.env.mailbox,
                    nb_jours: $('#nb_jours').val(),
                    archivage_date: $('#archivage_date').val()
                };
                //Dans le cas d'une boite partagée
                if (rcmail.env.account) {
                    params._account = rcmail.env.account;
                }
                rcmail.http_get('mail/plugin.mel_archivage_traitement_electron', params);

                rcmail.addEventListener('responseafterplugin.mel_archivage_traitement_electron', function (event) {
                    let stringified = JSON.stringify(event.response.data);
                    let parsedObj = JSON.parse(stringified);
                    let files = [];
                    for (const mbox in parsedObj) {
                        for (let i = 0; i < parsedObj[mbox].length; i++) {
                            const uid = parsedObj[mbox][i];
                            uid.flags = (Array.isArray(uid.flags)) ? { "SEEN": false } : uid.flags;
                            if (!uid.flags.hasOwnProperty('SEEN')) {
                                uid.flags.SEEN = false;
                            }
                            
                            if (rcmail.env.mailbox.indexOf("Boitepartag&AOk-e") === 0) {
                                var path_folder = rcmail.env.mailbox.replace("Boitepartag&AOk-e/", "");
                            }
                            else {
                                var path_folder = rcmail.env.account + "/" + mbox;
                            }
                            files.push({ "url": rcmail.url('mail/viewsource', rcmail.params_from_uid(uid.message_uid)).replace(/_framed=/, '_save='), "uid": uid.message_uid, "path_folder": path_folder, "mbox": mbox, "etiquettes": uid.flags });
                        }
                        window.parent.api.send('download_eml', { "files": files, "token": rcmail.env.request_token });
                        $("#nb_mails").text(rcmail.get_label('mel_archivage.archive_downloading'));
                    }
                });
            }
            else {
                $("#submit_archivage").prop("disabled", true);
                $("body.archivage").addClass("loading");
                $("#nb_mails").text(rcmail.get_label('mel_archivage.generating_archive') + ' ' + rcmail.get_label('mel_archivage.dont_reload_page'));
                listenCookieChange("current_archivage", function () {
                    $("body.archivage").removeClass("loading");
                    $("#nb_mails").text(rcmail.get_label('mel_archivage.archive_generated'));
                    rcmail.display_message(rcmail.get_label('mel_archivage.archive_generated'), 'confirm');
                    setTimeout(() => {
                        parent.location.reload();
                    }, 5000);
                });
            }
        })

        function listenCookieChange(cookieName, callback) {
            setInterval(function () {
                if (cookieRegistry[cookieName]) {
                    if (readCookie(cookieName) != cookieRegistry[cookieName]) {
                        // update registry so we dont get triggered again
                        cookieRegistry[cookieName] = readCookie(cookieName);
                        return callback();
                    }
                } else {
                    cookieRegistry[cookieName] = readCookie(cookieName);
                }
            }, 100);
        }

        function readCookie(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for (var i = 0; i < ca.length; i++) {
                var c = ca[i];
                while (c.charAt(0) == ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
            }
            return null;
        }
    });
}

function changeInput(datepicker) {
    let start_date = $.datepicker.parseDate("dd/mm/yy", datepicker);
    let today = new Date();

    let TimeJours = today.getTime() - start_date.getTime();
    let nbJours = TimeJours / (1000 * 3600 * 24);
    $('#nb_jours').val(Math.floor(nbJours));
}

function changeDatepicker(nbJours) {
    let today = new Date();
    let datepicker = new Date(new Date().setDate(today.getDate() - nbJours));

    $('#archivage_date').datepicker('setDate', datepicker);
}

rcube_webmail.prototype.plugin_archiver = function () {
    var params = {
        _mbox: this.env.mailbox
    }
    if (rcmail.env.account) {
        params._account = rcmail.env.account;
    }
    var frame = $('<iframe>').attr('id', 'archivageframe')
        .attr('src', rcmail.url('settings/plugin.mel_archivage', params) + '&_framed=1')
        .attr('frameborder', '0')
        .appendTo(document.body);

    var buttons = {};

    frame.dialog({
        modal: true,
        resizable: false,
        closeOnEscape: true,
        title: '',
        closeText: rcmail.get_label('close'),
        close: function () {
            frame.dialog('destroy').remove();
        },
        buttons: buttons,
        width: 400,
        height: 435,
        rcmail: rcmail
    }).width(380);
};
