if (window.rcmail) {
    if (rcmail.env.task == 'mail') {
        rcmail.addEventListener('responseafterlist', function(evt) {
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

        $('#form_archivage').submit(function () {
            $("#submit_archivage").prop("disabled", true);
            $("body.archivage").addClass("loading");
            $("#nb_mails").text(rcmail.get_label('mel_archivage.generating_archive') + ' ' + rcmail.get_label('mel_archivage.dont_reload_page'));
            listenCookieChange("current_archivage", function() {
                $("body.archivage").removeClass("loading");
                $("#nb_mails").text(rcmail.get_label('mel_archivage.archive_generated'));
                rcmail.display_message(rcmail.get_label('mel_archivage.archive_generated'), 'confirm');
                setTimeout(() => {
                    parent.location.reload();
                }, 5000);
            });
        })

        function listenCookieChange(cookieName, callback) {
            setInterval(function() {
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
    var frame = $('<iframe>').attr('id', 'archivageframe')
        .attr('src', rcmail.url('settings/plugin.mel_archivage', { _mbox: this.env.mailbox, _account: this.env.account }) + '&_framed=1')
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

rcube_webmail.prototype.archive_mailbox_test = function()
{
    alert('archive_mailbox_test');
  return this.env.exists && this.env.mailbox == this.env.archive_folder;
};