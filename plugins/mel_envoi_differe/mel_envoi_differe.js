/**
 * Plugin Mél Envoi différé
 *
 * Plugin d'envoi de mail différé depuis Roundcube
 * Les messages sont stocké sur un serveur jusqu'au moment de l'envoi
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
    rcmail.addEventListener('init', function (evt) {
        if (rcmail.env.task == 'mail' && rcmail.env.action == 'compose') {
            rcmail.enable_command('display_mel_envoi_differe', true);
            rcmail.env.compose_commands.push('display_mel_envoi_differe');
        };
    });
}


/**
 * Clone from fullcalendar.js
 */
var format_time = function (date, voice) {
    var zeroPad = function (n) { return (n < 10 ? '0' : '') + n; }
    var formatters = {
        s: function (d) { return d.getSeconds() },
        ss: function (d) { return zeroPad(d.getSeconds()) },
        m: function (d) { return d.getMinutes() },
        mm: function (d) { return zeroPad(d.getMinutes()) },
        h: function (d) { return d.getHours() % 12 || 12 },
        hh: function (d) { return zeroPad(d.getHours() % 12 || 12) },
        H: function (d) { return d.getHours() },
        HH: function (d) { return zeroPad(d.getHours()) },
        t: function (d) { return d.getHours() < 12 ? 'a' : 'p' },
        tt: function (d) { return d.getHours() < 12 ? 'am' : 'pm' },
        T: function (d) { return d.getHours() < 12 ? 'A' : 'P' },
        TT: function (d) { return d.getHours() < 12 ? 'AM' : 'PM' }
    };

    var i, i2, c, formatter, res = '',
        format = 'HH:mm';
    for (i = 0; i < format.length; i++) {
        c = format.charAt(i);
        for (i2 = Math.min(i + 2, format.length); i2 > i; i2--) {
            if (formatter = formatters[format.substring(i, i2)]) {
                res += formatter(date);
                i = i2 - 1;
                break;
            }
        }
        if (i2 == i) {
            res += c;
        }
    }

    return res;
}
// format time string
var time_autocomplete_format = function (hour, minutes, start) {
    var time, diff, unit, duration = '', d = new Date();

    d.setHours(hour);
    d.setMinutes(minutes);
    time = format_time(d);

    if (start) {
        diff = Math.floor((d.getTime() - start.getTime()) / 60000);
        if (diff > 0) {
            unit = 'm';
            if (diff >= 60) {
                unit = 'h';
                diff = Math.round(diff / 3) / 20;
            }
            duration = ' (' + diff + unit + ')';
        }
    }

    return [time, duration];
};

var time_autocomplete_list = function (p, callback) {
    // Time completions
    var st, h, step = 15, result = [], now = new Date(),
        id = String(this.element.attr('id')),
        m = id.match(/^(.*)-(starttime|endtime)$/),
        start = (m && m[2] == 'endtime'
            && (st = $('#' + m[1] + '-starttime').val())
            && $('#' + m[1] + '-startdate').val() == $('#' + m[1] + '-enddate').val())
            ? me.parse_datetime(st, '') : null,
        full = p.term - 1 > 0 || p.term.length > 1,
        hours = start ? start.getHours() : now.getHours(),
        minutes = hours * 60 + (full ? 0 : now.getMinutes()),
        min = 0,
        hour = Math.floor(Math.ceil(minutes / step) * step / 60);



    // list 5min steps 24 hours
    for (h = 0; h < 24; h++) {
        while (min < 60) {
            result.push(time_autocomplete_format(h, min, start));
            min += step;
        }
        min = 0;
    }

    return callback(result);
};

var time_autocomplete_open = function (event, ui) {
    // scroll to current time
    var $this = $(this),
        widget = $this.autocomplete('widget')
    menu = $this.data('ui-autocomplete').menu,
        amregex = /^(.+)(a[.m]*)/i,
        pmregex = /^(.+)(a[.m]*)/i,
        val = $(this).val().replace(amregex, '0:$1').replace(pmregex, '1:$1');

    widget.css('width', '10em');

    if (val === '')
        menu._scrollIntoView(widget.children('li:first'));
    else
        widget.children().each(function () {
            var li = $(this),
                html = li.children().first().html()
                    .replace(/\s+\(.+\)$/, '')
                    .replace(amregex, '0:$1')
                    .replace(pmregex, '1:$1');

            if (html.indexOf(val) == 0)
                menu._scrollIntoView(li);
        });
};

/**
* Initializes time autocompletion
*/
var init_time_autocomplete = function (elem, props) {
    var default_props = {
        delay: 100,
        minLength: 1,
        appendTo: props.container || $(elem).parents('form'),
        source: time_autocomplete_list,
        open: time_autocomplete_open,
        // change: time_autocomplete_change,
        select: function (event, ui) {
            $(this).val(ui.item[0]).change();
            return false;
        }
    };

    $(elem).attr('autocomplete', "off")
        .autocomplete($.extend(default_props, props))
        .click(function () {  // show drop-down upon clicks
            $(this).autocomplete('search', $(this).val() ? $(this).val().replace(/\D.*/, "") : " ");
        });

    $(elem).data('ui-autocomplete')._renderItem = function (ul, item) {
        return $('<li>')
            .data('ui-autocomplete-item', item)
            .append('<a>' + item[0] + item[1] + '</a>')
            .appendTo(ul);
    };
};







rcube_webmail.prototype.display_mel_envoi_differe = function () {

    let currentDate = new Date();

    let date = displayDate(currentDate);
    let heure = displayHour(currentDate);
    let value = parent.$('#mel_envoi_differe').text();
    if (value != "Remise différée") {
        let dateHeure = value.split(' ');
        date = dateHeure[0];
        heure = dateHeure[1];
    }
    let html = '<h1 class="boxtitle">' + rcmail.gettext('title', 'mel_envoi_differe') + '</h1><div id="envoidiffere-details" class="boxcontent"><form name="valide" action="" class="propform" id="form_envoidiffere"><fieldset><div class="warning">' + rcmail.gettext('description', 'mel_envoi_differe') + '<br>' + rcmail.gettext('description_warning', 'mel_envoi_differe') + '</div><div class="margin"><label for="envoidiffere_date">' + rcmail.gettext('date', 'mel_envoi_differe') + '</label><input type="text" name="envoidiffere_date" id="envoidiffere_date" value="' + date + '" required>' + rcmail.gettext('time', 'mel_envoi_differe') + '<input type="text" name="envoidiffere_time" id="envoidiffere_time" value="' + heure + '" required></div><div id="error_message"></div><div id="info_message">' + rcmail.gettext('description_info', 'mel_envoi_differe') + '</div></fieldset></form></div>'

    buttons = [{
        text: rcmail.gettext('save', 'mel_envoi_differe'),
        'class': 'mainaction',
        click: function () {
            if ($('#envoidiffere_date').val() && $('#envoidiffere_time').val()) {

                let date = ($('#envoidiffere_date').val()).split("/");
                let day = date[0];
                let month = date[1];
                let year = date[2];

                let time = ($('#envoidiffere_time').val()).split(":");
                let hour = time[0];
                let min = time[1];

                let DateJs = new Date(year, month - 1, day, hour, min);
                let timestamp = DateJs.getTime();

                //On vérifie que le timestamp courant n'est pas inférieur à la date choisi
                if (timestamp > new Date().getTime()) {
                    if (!$(window.parent.rcmail.gui_objects.messageform).find('input[name="envoi_differe"]').length) {
                        $(window.parent.rcmail.gui_objects.messageform).append('<input id="envoi_differe" type="hidden" name="envoi_differe" value="' + timestamp + '" /> ')
                    }
                    else {
                        parent.$('#envoi_differe').val(timestamp);
                    }

                    parent.$('#mel_envoi_differe').text($('#envoidiffere_date').val() + ' ' + $('#envoidiffere_time').val());
                    parent.$('#mel_envoi_differe').css({ width: '150px' });

                    $('.ui-dialog-content').dialog('destroy');
                }
                else {
                    dateInférieurDialog();
                }

            }
            else {
                $('#error_message').text("Merci de remplir les champs ci-dessus")
            }
        }
    },
    {
        text: rcmail.gettext('cancel', 'mel_envoi_differe'),
        click: function () {
            if ($(window.parent.rcmail.gui_objects.messageform).find('input[name ="envoi_differe"]').length) {
                parent.$('#envoi_differe').remove();
            }
            parent.$('#mel_envoi_differe').text("Remise différée");
            parent.$('#mel_envoi_differe').css({ width: '125px' });
            $(this).dialog('destroy');
        }
    }];

    rcmail.show_popup_dialog(html, rcmail.gettext('buttontitle', 'mel_envoi_differe'), buttons, { width: 400, resizable: false, height: 420 })

    $('#envoidiffere_date').datepicker({ minDate: 0, dateFormat: 'dd/mm/yy' })
        .change(function () {
            changeInput(this.value);
        });

    init_time_autocomplete($('#envoidiffere_time'), {
        container: '#envoidiffere-details'
    });
};


function displayDate(currentDate) {
    currentDate = currentDate.toLocaleString("fr-FR", { timeZone: rcmail.env.timezone });
    date = currentDate.split(' ');
    return date[0].slice(0, 10);

}

function displayHour(currentDate) {
    currentDate.setMinutes(00);
    currentDate.addHours(1);
    currentDate = currentDate.toLocaleString("fr-FR", { timeZone: rcmail.env.timezone });
    hour = currentDate.split(' ');
    return hour[hour.length - 1].slice(0, 5);
}

Date.prototype.addHours = function (h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

function dateInférieurDialog() {
    let html = '<h1 class="boxtitle">' + rcmail.gettext('title_futur', 'mel_envoi_differe') + '</h1><div id="envoidiffere-details" class="boxcontent"><div class="warning">' + rcmail.gettext('description_futur', 'mel_envoi_differe') + '</div></div>'

    buttons = [{
        text: rcmail.gettext('modify', 'mel_envoi_differe'),
        'class': 'mainaction',
        click: function () {
            $(this).dialog('destroy');

        }
    },
    {
        text: rcmail.gettext('send_normally', 'mel_envoi_differe'),
        click: function () {
            if ($(window.parent.rcmail.gui_objects.messageform).find('input[name ="envoi_differe"]').length) {
                parent.$('#envoi_differe').remove();
            }
            return rcmail.command('send', '', this, event)
        }
    }];

    rcmail.show_popup_dialog(html, rcmail.gettext('buttontitle', 'mel_envoi_differe'), buttons, { width: 410, resizable: false, height: 250 })
}