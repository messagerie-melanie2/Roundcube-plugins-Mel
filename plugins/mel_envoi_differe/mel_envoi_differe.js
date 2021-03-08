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
    var st, h, step = 5, result = [], now = new Date(),
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

if (window.rcmail) {
    rcmail.addEventListener('init', function (evt) {
        if (rcmail.env.task == 'mail' && rcmail.env.action == 'compose') {
            rcmail.enable_command('display_mel_envoi_differe', true);
        };

        $('#envoidiffere_date').datepicker({ minDate: 0, dateFormat: 'dd/mm/yy' })
            .change(function () {
                changeInput(this.value);
            });

        init_time_autocomplete($('#envoidiffere_time'), {
            container: '#envoidiffere-details'
        });

        $('#form_envoidiffere').submit(function (event) {
            event.preventDefault();
            let date = ($('#envoidiffere_date').val()).split("/");
            let day = date[0];
            let month = date[1];
            let year = date[2];

            let time = ($('#envoidiffere_time').val()).split(":");
            let hour = time[0];
            let min = time[1];

            let DateJs = new Date(year, month - 1, day, hour, min);
            let timestamp = DateJs.getTime();
            $(window.parent.rcmail.gui_objects.messageform).append('<input type="hidden" name="envoi_differe" value="'+timestamp+'" /> ')
            rcmail.command('send', '', this, event);
        });
    });
}

rcube_webmail.prototype.display_mel_envoi_differe = function () {
    var frame = $('<iframe>').attr('id', 'envoidiffereframe')
        .attr('src', rcmail.url('mail/plugin.mel_envoi_differe') + '&_framed=1')
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
        height: 450,
        rcmail: rcmail
    }).width(380);
};

