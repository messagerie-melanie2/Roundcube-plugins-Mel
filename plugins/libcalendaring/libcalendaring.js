/**
 * Basic Javascript utilities for calendar-related plugins
 *
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this page.
 *
 * Copyright (C) 2012-2015, Kolab Systems AG <contact@kolabsys.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 */

function rcube_libcalendaring(settings)
{
    // member vars
    this.settings = settings || {};
    this.alarm_ids = [];
    this.alarm_dialog = null;
    this.snooze_popup = null;
    this.dismiss_link = null;
    this.group2expand = {};

    // abort if env isn't set
    if (!settings || !settings.date_format)
      return;

    // private vars
    var me = this;
    var gmt_offset = (new Date().getTimezoneOffset() / -60) - (settings.timezone || 0) - (settings.dst || 0);
    var client_timezone = new Date().getTimezoneOffset();
    var color_map = {};

    // general datepicker settings
    this.datepicker_settings = {
        // translate from fullcalendar (MomentJS) format to datepicker format
        dateFormat: settings.date_format.replace(/M/g, 'm').replace(/mmmm/, 'MM').replace(/mmm/, 'M')
            .replace(/dddd/, 'DD').replace(/ddd/, 'D').replace(/DD/, 'dd').replace(/D/, 'd')
            .replace(/Y/g, 'y').replace(/yyyy/, 'yy'),
        firstDay : settings.first_day,
        dayNamesMin: settings.days_short,
        monthNames: settings.months,
        monthNamesShort: settings.months,
        showWeek: settings.show_weekno >= 0,
        changeMonth: false,
        showOtherMonths: true,
        selectOtherMonths: true
    };


    /**
     * Quote html entities
     */
    var Q = this.quote_html = function(str)
    {
      return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    /**
     * Create a nice human-readable string for the date/time range
     */
    this.event_date_text = function(event, voice)
    {
      if (!event.start)
        return '';
      if (!event.end)
        event.end = event.start;

      // Support Moment.js objects
      var start = 'toDate' in event.start ? event.start.toDate() : event.start,
        end = event.end && 'toDate' in event.end ? event.end.toDate() : event.end;

      var fromto, duration = end.getTime() / 1000 - start.getTime() / 1000,
        until = voice ? ' ' + rcmail.gettext('until','libcalendaring') + ' ' : ' — ';

      if (event.allDay) {
        // fullcalendar end dates of all-day events are exclusive
        end = new Date(end.getTime() - 1000*60*60*24*1);
        duration = end.getTime() / 1000 - start.getTime() / 1000;
        fromto = this.format_datetime(start, 1, voice)
          + (duration > 86400 || start.getDay() != end.getDay() ? until + this.format_datetime(end, 1, voice) : '');
      }
      else if (duration < 86400 && start.getDay() == end.getDay()) {
        fromto = this.format_datetime(start, 0, voice)
          + (duration > 0 ? until + this.format_datetime(end, 2, voice) : '');
      }
      else {
        fromto = this.format_datetime(start, 0, voice)
          + (duration > 0 ? until + this.format_datetime(end, 0, voice) : '');
      }

      return fromto;
    };

    /**
     * Checks if the event/task has 'real' attendees, excluding the current user
     */
    this.has_attendees = function(event)
    {
        return !!(event.attendees && event.attendees.length && (event.attendees.length > 1 || String(event.attendees[0].email).toLowerCase() != settings.identity.email));
    };

    /**
     * Check if the current user is an attendee of this event/task
     */
    this.is_attendee = function(event, role, email)
    {
        var i, emails = email ? ';' + email.toLowerCase() : settings.identity.emails;

        for (i=0; event.attendees && i < event.attendees.length; i++) {
            if ((!role || event.attendees[i].role == role) && event.attendees[i].email && emails.indexOf(';'+event.attendees[i].email.toLowerCase()) >= 0) {
                return event.attendees[i];
            }
        }

        return false;
    };

    /**
     * Checks if the current user is the organizer of the event/task
     */
    this.is_organizer = function(event, email)
    {
        return this.is_attendee(event, 'ORGANIZER', email) || !event.id;
    };

    /**
     * Check permissions on the given folder object
     */
    this.has_permission = function(folder, perm)
    {
        // multiple chars means "either of"
        if (String(perm).length > 1) {
            for (var i=0; i < perm.length; i++) {
                if (this.has_permission(folder, perm[i])) {
                    return true;
                }
            }
        }

        if (folder.rights && String(folder.rights).indexOf(perm) >= 0) {
            return true;
        }

        return (perm == 'i' && folder.editable) || (perm == 'v' && folder.editable);
    };


    /**
     * From time and date strings to a real date object
     */
    this.parse_datetime = function(time, date)
    {
        // we use the utility function from datepicker to parse dates
        var date = date ? $.datepicker.parseDate(this.datepicker_settings.dateFormat, date, this.datepicker_settings) : new Date();

        var time_arr = time.replace(/\s*[ap][.m]*/i, '').replace(/0([0-9])/g, '$1').split(/[:.]/);
        if (!isNaN(time_arr[0])) {
            date.setHours(time_arr[0]);
        if (time.match(/p[.m]*/i) && date.getHours() < 12)
            date.setHours(parseInt(time_arr[0]) + 12);
        else if (time.match(/a[.m]*/i) && date.getHours() == 12)
            date.setHours(0);
      }
      if (!isNaN(time_arr[1]))
            date.setMinutes(time_arr[1]);

      return date;
    }

    /**
     * Convert an ISO 8601 formatted date string from the server into a Date object.
     * Timezone information will be ignored, the server already provides dates in user's timezone.
     */
    this.parseISO8601 = function(s)
    {
        // already a Date object?
        if (s && s.getMonth) {
            return s;
        }

        // force d to be on check's YMD, for daylight savings purposes
        var fixDate = function(d, check) {
            if (+d) { // prevent infinite looping on invalid dates
                while (d.getDate() != check.getDate()) {
                    d.setTime(+d + (d < check ? 1 : -1) * 3600000);
                }
            }
        }

        // derived from http://delete.me.uk/2005/03/iso8601.html
        var m = s && s.match(/^([0-9]{4})(-([0-9]{2})(-([0-9]{2})([T ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2})(:?([0-9]{2}))?))?)?)?)?$/);
        if (!m) {
            return null;
        }

        var date = new Date(m[1], 0, 2),
            check = new Date(m[1], 0, 2, 9, 0);
        if (m[3]) {
            date.setMonth(m[3] - 1);
            check.setMonth(m[3] - 1);
        }
        if (m[5]) {
            date.setDate(m[5]);
            check.setDate(m[5]);
        }
        fixDate(date, check);
        if (m[7]) {
            date.setHours(m[7]);
        }
        if (m[8]) {
            date.setMinutes(m[8]);
        }
        if (m[10]) {
            date.setSeconds(m[10]);
        }
        if (m[12]) {
            date.setMilliseconds(Number("0." + m[12]) * 1000);
        }
        fixDate(date, check);

        return date;
    }

    /**
     * Turn the given date into an ISO 8601 date string understandable by PHPs strtotime()
     */
    this.date2ISO8601 = function(date)
    {
        if (!date)
            return null;

        if ('toDate' in date)
            return date.format('YYYY-MM-DD[T]HH:mm:ss'); // MomentJS

        var zeropad = function(num) { return (num < 10 ? '0' : '') + num; };

        return date.getFullYear() + '-' + zeropad(date.getMonth()+1) + '-' + zeropad(date.getDate())
            + 'T' + zeropad(date.getHours()) + ':' + zeropad(date.getMinutes()) + ':' + zeropad(date.getSeconds());
    };

    /**
     * Format the given date object according to user's prefs
     */
    this.format_datetime = function(date, mode, voice)
    {
        var res = '';
        if (!mode || mode == 1) {
          res += $.datepicker.formatDate(voice ? 'MM d yy' : this.datepicker_settings.dateFormat, date, this.datepicker_settings);
        }
        if (!mode) {
            res += voice ? ' ' + rcmail.gettext('at','libcalendaring') + ' ' : ' ';
        }
        if (!mode || mode == 2) {
            res += this.format_time(date, voice);
        }

        return res;
    }

    /**
     * Clone from fullcalendar.js
     */
    this.format_time = function(date, voice)
    {
        var zeroPad = function(n) { return (n < 10 ? '0' : '') + n; }
        var formatters = {
            s   : function(d) { return d.getSeconds() },
            ss  : function(d) { return zeroPad(d.getSeconds()) },
            m   : function(d) { return d.getMinutes() },
            mm  : function(d) { return zeroPad(d.getMinutes()) },
            h   : function(d) { return d.getHours() % 12 || 12 },
            hh  : function(d) { return zeroPad(d.getHours() % 12 || 12) },
            H   : function(d) { return d.getHours() },
            HH  : function(d) { return zeroPad(d.getHours()) },
            a   : function(d) { return d.getHours() < 12 ? 'am' : 'pm' },
            A   : function(d) { return d.getHours() < 12 ? 'AM' : 'PM' }
        };

        var i, i2, c, formatter, res = '',
          format = voice ? settings['time_format'].replace(':',' ').replace('HH','H').replace('hh','h').replace('mm','m').replace('ss','s') : settings['time_format'];
        for (i=0; i < format.length; i++) {
            c = format.charAt(i);
            for (i2=Math.min(i+2, format.length); i2 > i; i2--) {
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

    /**
     * Convert the given Date object into a unix timestamp respecting browser's and user's timezone settings
     */
    this.date2unixtime = function(date)
    {
        var dt = date && 'toDate' in date ? date.toDate() : date,
            dst_offset = (client_timezone - dt.getTimezoneOffset()) * 60;  // adjust DST offset

        return Math.round(dt.getTime()/1000 + gmt_offset * 3600 + dst_offset);
    }

    /**
     * Turn a unix timestamp value into a Date object
     */
    this.fromunixtime = function(ts)
    {
        ts -= gmt_offset * 3600;
        var date = new Date(ts * 1000),
            dst_offset = (client_timezone - date.getTimezoneOffset()) * 60;
        if (dst_offset)  // adjust DST offset
            date.setTime((ts + 3600) * 1000);
        return date;
    }

    /**
     * Finds text color for specified background color
     */
    this.text_color = function(color)
    {
        var res = '#222';

        if (!color) {
            return res;
        }

        if (!color_map[color]) {
            color_map[color] = '#fff';

            // Convert 3-char to 6-char
            if (/^#?([a-f0-9]{1})([a-f0-9]{1})([a-f0-9]{1})$/i.test(color)) {
                color = '#' + RegExp.$1 + RegExp.$1 + RegExp.$2 + RegExp.$2 + RegExp.$3 + RegExp.$3;
            }

            if (/^#?([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/i.test(color)) {
                // use information about brightness calculation found at
                // http://javascriptrules.com/2009/08/05/css-color-brightness-contrast-using-javascript/
                brightness = (parseInt(RegExp.$1, 16) * 299 + parseInt(RegExp.$2, 16) * 587 + parseInt(RegExp.$3, 16) * 114) / 1000;
                if (brightness > 125) {
                    color_map[color] = res;
                }
            }
        }

        return color_map[color];
    }

    /**
     * Simple plaintext to HTML converter, makig URLs clickable
     */
    this.text2html = function(str, maxlen, maxlines)
    {
        var html = Q(String(str));

        // limit visible text length
        if (maxlen) {
            var morelink = '<span>... <a href="#more" onclick="$(this).parent().hide().next().show();return false" class="morelink">'+rcmail.gettext('showmore','libcalendaring')+'</a></span><span style="display:none">',
                lines = html.split(/\r?\n/),
                words, out = '', len = 0;

            for (var i=0; i < lines.length; i++) {
                len += lines[i].length;
                if (maxlines && i == maxlines - 1) {
                    out += lines[i] + '\n' + morelink;
                    maxlen = html.length * 2;
                }
                else if (len > maxlen) {
                    len = out.length;
                    words = lines[i].split(' ');
                    for (var j=0; j < words.length; j++) {
                        len += words[j].length + 1;
                        out += words[j] + ' ';
                        if (len > maxlen) {
                            out += morelink;
                            maxlen = html.length * 2;
                            maxlines = 0;
                        }
                    }
                    out += '\n';
                }
                else
                    out += lines[i] + '\n';
            }

            if (maxlen > str.length)
                out += '</span>';

            html = out;
        }

        // simple link parser (similar to rcube_string_replacer class in PHP)
        var utf_domain = '[^?&@"\'/\\(\\)\\s\\r\\t\\n]+\\.([^\x00-\x2f\x3b-\x40\x5b-\x60\x7b-\x7f]{2,}|xn--[a-z0-9]{2,})';
        var url1 = '.:;,', url2 = 'a-z0-9%=#@+?&/_~\\[\\]-';
        var link_pattern = new RegExp('([hf]t+ps?://)('+utf_domain+'(['+url1+']?['+url2+']+)*)', 'ig');
        var mailto_pattern = new RegExp('([^\\s\\n\\(\\);]+@'+utf_domain+')', 'ig');
        var link_replace = function(matches, p1, p2) {
          var title = '', text = p2;
          if (p2 && p2.length > 55) {
            text = p2.substr(0, 45) + '...' + p2.substr(-8);
            title = p1 + p2;
          }
          return '<a href="'+p1+p2+'" class="extlink" target="_blank" title="'+title+'">'+p1+text+'</a>'
        };

        return html
            .replace(link_pattern, link_replace)
            .replace(mailto_pattern, '<a href="mailto:$1">$1</a>')
            .replace(/(mailto:)([^"]+)"/g, '$1$2" onclick="rcmail.command(\'compose\', \'$2\');return false"')
            .replace(/\n/g, "<br/>");
    };

    this.init_alarms_edit = function(prefix, index)
    {
        var edit_type = $(prefix+' select.edit-alarm-type'),
          dom_id = edit_type.attr('id');

        // register events on alarm fields
        edit_type.change(function(){
            $(this).parent().find('span.edit-alarm-values')[(this.selectedIndex>0?'show':'hide')]();
        });
        $(prefix+' select.edit-alarm-offset').change(function(){
            var val = $(this).val(),
                parent = $(this).parent(),
                class_map = {'0': 'ontime', '@': 'ondate'};

            parent.find('.edit-alarm-date, .edit-alarm-time')[val === '@' ? 'show' : 'hide']();
            parent.find('.edit-alarm-value')[val === '@' || val === '0' ? 'hide' : 'show']();
            parent.find('.edit-alarm-related')[val === '@' ? 'hide' : 'show']();
            parent.removeClass('offset-ontime offset-ondate offset-default')
                .addClass('offset-' + (class_map[val] || 'default'));
        });

        $(prefix+' .edit-alarm-date').removeClass('hasDatepicker').removeAttr('id').datepicker(this.datepicker_settings);

        if (rcmail.env.action != 'print')
            this.init_time_autocomplete($(prefix+' .edit-alarm-time')[0], {});

        // set a unique id attribute and set label reference accordingly
        if ((index || 0) > 0 && dom_id) {
            dom_id += ':' + (new Date().getTime());
            edit_type.attr('id', dom_id);
            $(prefix+' label:first').attr('for', dom_id);
        }

        // Elastic
        if (window.UI && UI.pretty_select) {
            $(prefix + ' select').each(function() { UI.pretty_select(this); });
        }

        if (index)
            return;

        $(prefix)
            .on('click', 'a.delete-alarm', function(e){
                if ($(this).closest('.edit-alarm-item').siblings().length > 0) {
                    $(this).closest('.edit-alarm-item').remove();
                }
                return false;
            })
            .on('click', 'a.add-alarm', function(e) {
                var orig = $(this).closest('.edit-alarm-item'),
                    i = orig.siblings().length + 1,
                    item = orig.clone(false)
                      .removeClass('first')
                      .appendTo(orig.parent());

                  me.init_alarms_edit(prefix + ' .edit-alarm-item:eq(' + i + ')', i);
                  $('select.edit-alarm-type, select.edit-alarm-offset', item).change();
                  return false;
            });
    }

    this.set_alarms_edit = function(prefix, valarms)
    {
        $(prefix + ' .edit-alarm-item:gt(0)').remove();

        var i, alarm, domnode, val, offset;
        for (i=0; i < valarms.length; i++) {
          alarm = valarms[i];

          if (!alarm.action)
              alarm.action = 'DISPLAY';

          domnode = $(prefix + ' .edit-alarm-item').eq(0);

          if (i > 0) {
            domnode = domnode.clone(false).removeClass('first').insertAfter(domnode);
            this.init_alarms_edit(prefix + ' .edit-alarm-item:eq(' + i + ')', i);
          }

          $('select.edit-alarm-type', domnode).val(alarm.action);
          $('select.edit-alarm-related', domnode).val(/END/i.test(alarm.related) ? 'end' : 'start');

          if (String(alarm.trigger).match(/@(\d+)/)) {
              var ondate = this.fromunixtime(parseInt(RegExp.$1));
              $('select.edit-alarm-offset', domnode).val('@');
              $('input.edit-alarm-value', domnode).val('');
              $('input.edit-alarm-date', domnode).val(this.format_datetime(ondate, 1));
              $('input.edit-alarm-time', domnode).val(this.format_datetime(ondate, 2));
          }
          else if (String(alarm.trigger).match(/^[-+]*0[MHDS]$/)) {
              $('input.edit-alarm-value', domnode).val('0');
              $('select.edit-alarm-offset', domnode).val('0');
          }
          else if (String(alarm.trigger).match(/([-+])(\d+)([MHDS])/)) {
              val = RegExp.$2; offset = ''+RegExp.$1+RegExp.$3;
              $('input.edit-alarm-value', domnode).val(val);
              $('select.edit-alarm-offset', domnode).val(offset);
          }
        }

        // set correct visibility by triggering onchange handlers
        $(prefix + ' select.edit-alarm-type, ' + prefix + ' select.edit-alarm-offset').change();
    };

    this.serialize_alarms = function(prefix)
    {
        var valarms = [];

        $(prefix + ' .edit-alarm-item').each(function(i, elem) {
            var val, offset, alarm = {
                    action: $('select.edit-alarm-type', elem).val(),
                    related: $('select.edit-alarm-related', elem).val()
                };

            if (alarm.action) {
                offset = $('select.edit-alarm-offset', elem).val();
                if (offset == '@') {
                    alarm.trigger = '@' + me.date2unixtime(me.parse_datetime($('input.edit-alarm-time', elem).val(), $('input.edit-alarm-date', elem).val()));
                }
                else if (offset === '0') {
                    alarm.trigger = '0S';
                }
                else if (!isNaN((val = parseInt($('input.edit-alarm-value', elem).val()))) && val >= 0) {
                    alarm.trigger = offset[0] + val + offset[1];
                }

                valarms.push(alarm);
            }
        });

        return valarms;
    };

    // format time string
    var time_autocomplete_format = function(hour, minutes, start) {
        var time, diff, unit, duration = '', d = new Date();

        d.setHours(hour);
        d.setMinutes(minutes);
        time = me.format_time(d);

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

    var time_autocomplete_list = function(p, callback) {
        // Time completions
        var st, h, step = 15, result = [], now = new Date(),
            id = String(this.element.attr('id')),
            m = id.match(/^(.*)-(starttime|endtime)$/),
            start = (m && m[2] == 'endtime'
                && (st = $('#' + m[1] + '-starttime').val())
                && $('#' + m[1] + '-startdate').val() == $('#' + m[1] + '-enddate').val())
                ? me.parse_datetime(st, '') : null,
            full = p.term - 1 > 0 || p.term.length > 1,
            hours = start ? start.getHours() : (full ? me.parse_datetime(p.term, '') : now).getHours(),
            minutes = hours * 60 + (full ? 0 : now.getMinutes()),
            min = Math.ceil(minutes / step) * step % 60,
            hour = Math.floor(Math.ceil(minutes / step) * step / 60);

        // list hours from 0:00 till now
        for (h = start ? start.getHours() : 0; h < hours; h++)
            result.push(time_autocomplete_format(h, 0, start));

        // list 15min steps for the next two hours
        for (; h < hour + 2 && h < 24; h++) {
            while (min < 60) {
                result.push(time_autocomplete_format(h, min, start));
                min += step;
            }
            min = 0;
        }

        // list the remaining hours till 23:00
        while (h < 24)
            result.push(time_autocomplete_format((h++), 0, start));

        return callback(result);
    };

    var time_autocomplete_open = function(event, ui) {
        // scroll to current time
        var $this = $(this),
            widget = $this.autocomplete('widget')
            menu = $this.data('ui-autocomplete').menu,
            amregex = /^(.+)(a[.m]*)/i,
            pmregex = /^(.+)(p[.m]*)/i,
            val = $(this).val().replace(amregex, '0:$1').replace(pmregex, '1:$1');

        widget.css('width', '10em');

        if (val === '')
            menu._scrollIntoView(widget.children('li:first'));
        else
            widget.children().each(function() {
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
    this.init_time_autocomplete = function(elem, props)
    {
        var default_props = {
                delay: 100,
                minLength: 1,
                appendTo: props.container || $(elem).parents('form'),
                source: time_autocomplete_list,
                open: time_autocomplete_open,
                // change: time_autocomplete_change,
                select: function(event, ui) {
                    $(this).val(ui.item[0]).change();
                    return false;
                }
            };

        $(elem).attr('autocomplete', "off")
            .autocomplete($.extend(default_props, props))
            .click(function() {  // show drop-down upon clicks
                $(this).autocomplete('search', $(this).val() ? $(this).val().replace(/\D.*/, "") : " ");
            });

        $(elem).data('ui-autocomplete')._renderItem = function(ul, item) {
            return $('<li>')
                .data('ui-autocomplete-item', item)
                .append('<a>' + item[0] + item[1] + '</a>')
                .appendTo(ul);
        };
    };

    /*****  Alarms handling  *****/

    /**
     * Display a notification for the given pending alarms
     */
    this.display_alarms = function(alarms)
    {
        // clear old alert first
        if (this.alarm_dialog)
            this.alarm_dialog.dialog('destroy').remove();

        var i, actions, adismiss, asnooze, alarm, html, type,
            audio_alarms = [], records = [], event_ids = [], buttons = [];

        for (i=0; i < alarms.length; i++) {
            alarm = alarms[i];
            alarm.start = this.parseISO8601(alarm.start);
            alarm.end = this.parseISO8601(alarm.end);

            if (alarm.action == 'AUDIO') {
                audio_alarms.push(alarm);
                continue;
            }

            event_ids.push(alarm.id);

            type = alarm.id.match(/^task/) ? 'type-task' : 'type-event';

            html = '<h3 class="event-title ' + type + '">' + Q(alarm.title) + '</h3>';
            html += '<div class="event-section">' + Q(alarm.location || '') + '</div>';
            html += '<div class="event-section">' + Q(this.event_date_text(alarm)) + '</div>';

            adismiss = $('<a href="#" class="alarm-action-dismiss"></a>')
                .text(rcmail.gettext('dismiss','libcalendaring'))
                .click(function(e) {
                    me.dismiss_link = $(this);
                    me.dismiss_alarm(me.dismiss_link.data('id'), 0, e);
                });
            asnooze = $('<a href="#" class="alarm-action-snooze"></a>')
                .text(rcmail.gettext('snooze','libcalendaring'))
                .click(function(e) {
                    me.snooze_dropdown($(this), e);
                    e.stopPropagation();
                    return false;
                });

            actions = $('<div>').addClass('alarm-actions').append(adismiss.data('id', alarm.id)).append(asnooze.data('id', alarm.id));
            records.push($('<div>').addClass('alarm-item').html(html).append(actions));
        }

        if (audio_alarms.length)
            this.audio_alarms(audio_alarms);

        if (!records.length)
            return;

        this.alarm_dialog = $('<div>').attr('id', 'alarm-display').append(records);

        buttons.push({
            text: rcmail.gettext('dismissall','libcalendaring'),
            click: function(e) {
                // submit dismissed event_ids to server
                me.dismiss_alarm(me.alarm_ids.join(','), 0, e);
                $(this).dialog('close');
            },
            'class': 'delete'
        });

        buttons.push({
            text: rcmail.gettext('close'),
            click: function() {
                $(this).dialog('close');
            },
            'class': 'cancel'
        });

        this.alarm_dialog.appendTo(document.body).dialog({
            modal: true,
            resizable: true,
            closeOnEscape: false,
            dialogClass: 'alarms',
            title: rcmail.gettext('alarmtitle','libcalendaring'),
            buttons: buttons,
            open: function() {
              setTimeout(function() {
                me.alarm_dialog.parent().find('button:not(.ui-dialog-titlebar-close)').first().focus();
              }, 5);
            },
            close: function() {
              $('#alarm-snooze-dropdown').hide();
              $(this).dialog('destroy').remove();
              me.alarm_dialog = null;
              me.alarm_ids = null;
            },
            drag: function(event, ui) {
              $('#alarm-snooze-dropdown').hide();
            }
        });

        this.alarm_dialog.closest('div[role=dialog]').attr('role', 'alertdialog');

        this.alarm_ids = event_ids;
    };

    /**
     * Display a notification and play a sound for a set of alarms
     */
    this.audio_alarms = function(alarms)
    {
        var elem, txt = [],
            src = rcmail.assets_path('plugins/libcalendaring/alarm'),
            plugin = navigator.mimeTypes ? navigator.mimeTypes['audio/mp3'] : {};

        // first generate and display notification text
        $.each(alarms, function() { txt.push(this.title); });

        rcmail.display_message(rcmail.gettext('alarmtitle','libcalendaring') + ': ' + Q(txt.join(', ')), 'notice', 10000);

        // Internet Explorer does not support wav files,
        // support in other browsers depends on enabled plugins,
        // so we use wav as a fallback

        src += bw.ie || (plugin && plugin.enabledPlugin) ? '.mp3' : '.wav';

        // HTML5
        try {
            elem = $('<audio>').attr('src', src);
            elem.get(0).play();
        }
        // old method
        catch (e) {
            elem = $('<embed id="libcalsound" src="' + src + '" hidden=true autostart=true loop=false />');
            elem.appendTo($('body'));
            window.setTimeout("$('#libcalsound').remove()", 10000);
        }
    };

    /**
     * Show a drop-down menu with a selection of snooze times
     */
    this.snooze_dropdown = function(link, event)
    {
        if (!this.snooze_popup) {
            this.snooze_popup = $('#alarm-snooze-dropdown');
            // create popup if not found
            if (!this.snooze_popup.length) {
                this.snooze_popup = $('<div>').attr('id', 'alarm-snooze-dropdown').addClass('popupmenu').appendTo(document.body);
                this.snooze_popup.html(rcmail.env.snooze_select)
            }
            $('#alarm-snooze-dropdown a').click(function(e){
                var time = String(this.href).replace(/.+#/, '');
                me.dismiss_alarm($('#alarm-snooze-dropdown').data('id'), time, e);
                return false;
            });
        }

        // hide visible popup
        if (this.snooze_popup.is(':visible') && this.snooze_popup.data('id') == link.data('id')) {
            rcmail.command('menu-close', 'alarm-snooze-dropdown', link.get(0), event);
            this.dismiss_link = null;
        }
        else {  // open popup below the clicked link
            rcmail.command('menu-open', 'alarm-snooze-dropdown', link.get(0), event);
            this.snooze_popup.data('id', link.data('id'));
            this.dismiss_link = link;
        }
    };

    /**
     * Dismiss or snooze alarms for the given event
     */
    this.dismiss_alarm = function(id, snooze, event)
    {
        rcmail.command('menu-close', 'alarm-snooze-dropdown', null, event);
        rcmail.http_post('utils/plugin.alarms', { action:'dismiss', data:{ id:id, snooze:snooze } });

        // remove dismissed alarm from list
        if (this.dismiss_link) {
            this.dismiss_link.closest('div.alarm-item').hide();
            var new_ids = jQuery.grep(this.alarm_ids, function(v){ return v != id; });
            if (new_ids.length)
                this.alarm_ids = new_ids;
            else
                this.alarm_dialog.dialog('close');
        }

        this.dismiss_link = null;
    };


    /*****  Recurrence form handling  *****/

    /**
     * Install event handlers on recurrence form elements
     */
    this.init_recurrence_edit = function(prefix)
    {
        // toggle recurrence frequency forms
        $('#edit-recurrence-frequency').change(function(e){
            var freq = $(this).val().toLowerCase();
            $('.recurrence-form').hide();
            if (freq) {
              $('#recurrence-form-'+freq).show();
              if (freq != 'rdate')
                $('#recurrence-form-until').show();
            }
        });
        $('#recurrence-form-rdate input.button.add').click(function(e){
            var dt, dv = $('#edit-recurrence-rdate-input').val();
            if (dv && (dt = me.parse_datetime('12:00', dv))) {
                me.add_rdate(dt);
                me.sort_rdates();
                $('#edit-recurrence-rdate-input').val('')
            }
            else {
                $('#edit-recurrence-rdate-input').select();
            }
        });
        $('#edit-recurrence-rdates').on('click', 'a.delete', function(e){
            $(this).closest('li').remove();
            return false;
        });

        $('#edit-recurrence-enddate').datepicker(this.datepicker_settings).click(function(){ $("#edit-recurrence-repeat-until").prop('checked', true) });
        $('#edit-recurrence-repeat-times').change(function(e){ $('#edit-recurrence-repeat-count').prop('checked', true); });
        $('#edit-recurrence-rdate-input').datepicker(this.datepicker_settings);
    };

    /**
     * Set recurrence form according to the given event/task record
     */
    this.set_recurrence_edit = function(rec)
    {
        var date, recurrence = $('#edit-recurrence-frequency').val(rec.recurrence ? rec.recurrence.FREQ || (rec.recurrence.RDATE ? 'RDATE' : '') : '').change(),
            interval = $('.recurrence-form select.edit-recurrence-interval').val(rec.recurrence ? rec.recurrence.INTERVAL || 1 : 1),
            rrtimes = $('#edit-recurrence-repeat-times').val(rec.recurrence ? rec.recurrence.COUNT || 1 : 1),
            rrenddate = $('#edit-recurrence-enddate').val(rec.recurrence && rec.recurrence.UNTIL ? this.format_datetime(this.parseISO8601(rec.recurrence.UNTIL), 1) : '');
        $('.recurrence-form input.edit-recurrence-until:checked').prop('checked', false);
        $('#edit-recurrence-rdates').html('');

        var weekdays = ['SU','MO','TU','WE','TH','FR','SA'],
            rrepeat_id = '#edit-recurrence-repeat-forever';
        if      (rec.recurrence && rec.recurrence.COUNT) rrepeat_id = '#edit-recurrence-repeat-count';
        else if (rec.recurrence && rec.recurrence.UNTIL) rrepeat_id = '#edit-recurrence-repeat-until';
        $(rrepeat_id).prop('checked', true);

        if (rec.recurrence && rec.recurrence.BYDAY && rec.recurrence.FREQ == 'WEEKLY') {
            var wdays = rec.recurrence.BYDAY.split(',');
            $('input.edit-recurrence-weekly-byday').val(wdays);
        }
        if (rec.recurrence && rec.recurrence.BYMONTHDAY) {
            $('input.edit-recurrence-monthly-bymonthday').val(String(rec.recurrence.BYMONTHDAY).split(','));
            $('input.edit-recurrence-monthly-mode').val(['BYMONTHDAY']);
        }
        if (rec.recurrence && rec.recurrence.BYDAY && (rec.recurrence.FREQ == 'MONTHLY' || rec.recurrence.FREQ == 'YEARLY')) {
            var byday, section = rec.recurrence.FREQ.toLowerCase();
            if ((byday = String(rec.recurrence.BYDAY).match(/(-?[1-4])([A-Z]+)/))) {
                $('#edit-recurrence-'+section+'-prefix').val(byday[1]);
                $('#edit-recurrence-'+section+'-byday').val(byday[2]);
            }
            $('input.edit-recurrence-'+section+'-mode').val(['BYDAY']);
        }
        else if (rec.start) {
            date = 'toDate' in rec.start ? rec.start.toDate() : rec.start;
            $('#edit-recurrence-monthly-byday').val(weekdays[date.getDay()]);
        }
        if (rec.recurrence && rec.recurrence.BYMONTH) {
            $('input.edit-recurrence-yearly-bymonth').val(String(rec.recurrence.BYMONTH).split(','));
        }
        else if (rec.start) {
            date = 'toDate' in rec.start ? rec.start.toDate() : rec.start;
            $('input.edit-recurrence-yearly-bymonth').val([String(date.getMonth()+1)]);
        }
        if (rec.recurrence && rec.recurrence.RDATE) {
            $.each(rec.recurrence.RDATE, function(i,rdate){
                me.add_rdate(me.parseISO8601(rdate));
            });
        }
    };

    /**
     * Gather recurrence settings from form
     */
    this.serialize_recurrence = function(timestr)
    {
        var recurrence = '',
            freq = $('#edit-recurrence-frequency').val();

        if (freq != '') {
            recurrence = {
                FREQ: freq,
                INTERVAL: $('#edit-recurrence-interval-'+freq.toLowerCase()).val()
            };

            var until = $('input.edit-recurrence-until:checked').val();
            if (until == 'count')
                recurrence.COUNT = $('#edit-recurrence-repeat-times').val();
            else if (until == 'until')
                recurrence.UNTIL = me.date2ISO8601(me.parse_datetime(timestr || '00:00', $('#edit-recurrence-enddate').val()));

            if (freq == 'WEEKLY') {
                var byday = [];
                $('input.edit-recurrence-weekly-byday:checked').each(function(){ byday.push(this.value); });
                if (byday.length)
                    recurrence.BYDAY = byday.join(',');
            }
            else if (freq == 'MONTHLY') {
                var mode = $('input.edit-recurrence-monthly-mode:checked').val(), bymonday = [];
                if (mode == 'BYMONTHDAY') {
                    $('input.edit-recurrence-monthly-bymonthday:checked').each(function(){ bymonday.push(this.value); });
                    if (bymonday.length)
                        recurrence.BYMONTHDAY = bymonday.join(',');
                }
                else
                    recurrence.BYDAY = $('#edit-recurrence-monthly-prefix').val() + $('#edit-recurrence-monthly-byday').val();
            }
            else if (freq == 'YEARLY') {
                var byday, bymonth = [];
                $('input.edit-recurrence-yearly-bymonth:checked').each(function(){ bymonth.push(this.value); });
                if (bymonth.length)
                    recurrence.BYMONTH = bymonth.join(',');
                if ((byday = $('#edit-recurrence-yearly-byday').val()))
                    recurrence.BYDAY = $('#edit-recurrence-yearly-prefix').val() + byday;
            }
            else if (freq == 'RDATE') {
                recurrence = { RDATE:[] };
                // take selected but not yet added date into account
                if ($('#edit-recurrence-rdate-input').val() != '') {
                    $('#recurrence-form-rdate input.button.add').click();
                }
                $('#edit-recurrence-rdates li').each(function(i, li){
                    recurrence.RDATE.push($(li).attr('data-value'));
                });
            }
        }

        return recurrence;
    };

    // add the given date to the RDATE list
    this.add_rdate = function(date)
    {
        var li = $('<li>')
            .attr('data-value', this.date2ISO8601(date))
            .html('<span>' + Q(this.format_datetime(date, 1)) + '</span>')
            .appendTo('#edit-recurrence-rdates');

        $('<a>').attr({href: '#del', 'class': 'iconbutton delete icon button', title: rcmail.get_label('delete', 'libcalendaring')})
            .append($('<span class="inner">').text(rcmail.get_label('delete', 'libcalendaring')))
            .appendTo(li);
    };

    // re-sort the list items by their 'data-value' attribute
    this.sort_rdates = function()
    {
        var mylist = $('#edit-recurrence-rdates'),
            listitems = mylist.children('li').get();
        listitems.sort(function(a, b) {
            var compA = $(a).attr('data-value');
            var compB = $(b).attr('data-value');
            return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
        })
        $.each(listitems, function(idx, item) { mylist.append(item); });
    };


    /*****  Attendee form handling  *****/

    // expand the given contact group into individual event/task attendees
    this.expand_attendee_group = function(e, add, remove)
    {
        var id = (e.data ? e.data.email : null) || $(e.target).attr('data-email'),
            role_select = $(e.target).closest('tr').find('select.edit-attendee-role option:selected');

        this.group2expand[id] = { link: e.target, data: $.extend({}, e.data || {}), adder: add, remover: remove }

        // copy group role from the according form element
        if (role_select.length) {
            this.group2expand[id].data.role = role_select.val();
        }

        // register callback handler
        if (!this._expand_attendee_listener) {
            this._expand_attendee_listener = this.expand_attendee_callback;
            rcmail.addEventListener('plugin.expand_attendee_callback', function(result) {
                me._expand_attendee_listener(result);
            });
        }

        rcmail.http_post('libcal/plugin.expand_attendee_group', { id: id, data: e.data || {} }, rcmail.set_busy(true, 'loading'));
    };

    // callback from server to expand an attendee group
    this.expand_attendee_callback = function(result)
    {
        var attendee, id = result.id,
            data = this.group2expand[id],
            row = $(data.link).closest('tr');

        // replace group entry with all members returned by the server
        if (data && data.adder && result.members && result.members.length) {
            for (var i=0; i < result.members.length; i++) {
                attendee = result.members[i];
                attendee.role = data.data.role;
                attendee.cutype = 'INDIVIDUAL';
                attendee.status = 'NEEDS-ACTION';
                data.adder(attendee, null, row);
            }

            if (data.remover) {
                data.remover(data.link, id)
            }
            else {
                row.remove();
            }

            delete this.group2expand[id];
        }
        else {
            rcmail.display_message(result.error || rcmail.gettext('expandattendeegroupnodata','libcalendaring'), 'error');
        }
    };


    // Render message reference links to the given container
    this.render_message_links = function(links, container, edit, plugin)
    {
        var ul = $('<ul>').addClass('attachmentslist linkslist');

        $.each(links, function(i, link) {
            if (!link.mailurl)
                return true;  // continue

            var li = $('<li>').addClass('link')
                .addClass('message eml')
                .append($('<a>')
                    .attr({href: link.mailurl, 'class': 'messagelink filename'})
                    .text(link.subject || link.uri)
                )
                .appendTo(ul);

            // add icon to remove the link
            if (edit) {
                $('<a>')
                    .attr({href: '#delete', title: rcmail.gettext('removelink', plugin), 'data-uri': link.uri, 'class': 'delete'})
                    .append($('<span class="inner">').text(rcmail.gettext('delete')))
                    .appendTo(li);
            }
        });

        container.empty().append(ul);
    }

    // resize and reposition (center) the dialog window
    this.dialog_resize = function(id, height, width)
    {
        var win = $(window), w = win.width(), h = win.height(),
            dialog = $('.ui-dialog:visible'),
            h_delta = dialog.find('.ui-dialog-titlebar').outerHeight() + dialog.find('.ui-dialog-buttonpane').outerHeight() + 30,
            w_delta = 50;

        $(id).dialog('option', {
            height: Math.min(h-20, height + h_delta),
            width: Math.min(w-20, width + w_delta)
        });
    };
}

//////  static methods

// render HTML code for displaying an attendee record
rcube_libcalendaring.attendee_html = function(data)
{
    var name, tooltip = '', context = 'libcalendaring',
        dispname = data.name || data.email,
        status = data.role == 'ORGANIZER' ? 'ORGANIZER' : data.status;

    if (status)
        status = status.toLowerCase();

    if (data.email) {
        tooltip = data.email;
        name = $('<a>').attr({href: 'mailto:' + data.email, 'class': 'mailtolink', 'data-cutype': data.cutype})

        if (status)
            tooltip += ' (' + rcmail.gettext('status' + status, context) + ')';
    }
    else {
        name = $('<span>');
    }

    if (data['delegated-to'])
        tooltip = rcmail.gettext('libcalendaring.delegatedto') + ' ' + data['delegated-to'];
    else if (data['delegated-from'])
        tooltip = rcmail.gettext('libcalendaring.delegatedfrom') + ' ' + data['delegated-from'];

    return $('<span>').append(
            $('<span>').attr({'class': 'attendee ' + status, title: tooltip}).append(name.text(dispname))
        ).html();
};

/**
 *
 */
rcube_libcalendaring.add_from_itip_mail = function(mime_id, task, status, dom_id)
{
    // ask user to delete the declined event from the local calendar (#1670)
    var del = false;
    if (rcmail.env.rsvp_saved && status == 'declined') {
        del = confirm(rcmail.gettext('itip.declinedeleteconfirm'));
    }

    // open dialog for iTip delegation
    if (status == 'delegated') {
        rcube_libcalendaring.itip_delegate_dialog(function(data) {
            rcmail.http_post(task + '/itip-delegate', {
                _uid: rcmail.env.uid,
                _mbox: rcmail.env.mailbox,
                _part: mime_id,
                _to: data.to,
                _rsvp: data.rsvp ? 1 : 0,
                _comment: data.comment,
                _folder: data.target
            }, rcmail.set_busy(true, 'itip.savingdata'));
        }, $('#rsvp-'+dom_id+' .folder-select'));
        return false;
    }

    var noreply = 0, comment = '';
    if (dom_id) {
      noreply = $('#noreply-'+dom_id+':checked').length ? 1 : 0;
      if (!noreply)
        comment = $('#reply-comment-'+dom_id).val();
    }

    rcmail.http_post(task + '/mailimportitip', {
        _uid: rcmail.env.uid,
        _mbox: rcmail.env.mailbox,
        _part: mime_id,
        _folder: $('#itip-saveto').val(),
        _status: status,
        _del: del?1:0,
        _noreply: noreply,
        _comment: comment
      }, rcmail.set_busy(true, 'itip.savingdata'));

    return false;
};

/**
 * Helper function to render the iTip delegation dialog
 * and trigger a callback function when submitted.
 */
rcube_libcalendaring.itip_delegate_dialog = function(callback, selector)
{
    // show dialog for entering the delegatee address and comment
    var dialog, buttons = [];
    var form = $('<form class="itip-dialog-form propform" action="javascript:void()">' +
        '<div class="form-section form-group">' +
            '<label for="itip-delegate-to">' + rcmail.gettext('itip.delegateto') + '</label>' +
            '<input type="text" id="itip-delegate-to" class="text" size="40" value="" />' +
        '</div>' +
        '<div class="form-section form-group form-check">' +
            '<label><input type="checkbox" id="itip-delegate-rsvp" value="1" />' + rcmail.gettext('itip.delegatersvpme') + '</label>' +
        '</div>' +
        '<div class="form-section form-group">' +
            '<textarea id="itip-delegate-comment" class="itip-comment" cols="40" rows="8" placeholder="' +
                rcmail.gettext('itip.itipcomment') + '"></textarea>' + 
        '</div>' +
    '</form>');

    if (selector && selector.length) {
        form.append(
            $('<div class="form-section form-group">')
                .append($('<label for="itip-saveto">').text(rcmail.gettext('libcalendaring.savein')))
                .append($('select', selector).clone(true))
        );
    }

    buttons.push({
        text: rcmail.gettext('itipdelegated', 'itip'),
        'class': 'save mainaction',
        click: function() {
            var doc = window.parent.document,
                delegatee = String($('#itip-delegate-to', doc).val()).replace(/(^\s+)|(\s+$)/, '');

            if (delegatee != '' && rcube_check_email(delegatee, true)) {
                callback({
                    to: delegatee,
                    rsvp: $('#itip-delegate-rsvp', doc).prop('checked'),
                    comment: $('#itip-delegate-comment', doc).val(),
                    target: $('#itip-saveto', doc).val()
                });

                setTimeout(function() { dialog.dialog("close"); }, 500);
            }
            else {
                rcmail.alert_dialog(rcmail.gettext('itip.delegateinvalidaddress'));
                $('#itip-delegate-to', doc).focus();
            }
        }
    });

    buttons.push({
        text: rcmail.gettext('cancel'),
        'class': 'cancel',
        click: function() {
            dialog.dialog('close');
        }
    });

    dialog = rcmail.show_popup_dialog(form, rcmail.gettext('delegateinvitation', 'itip'), buttons, {
        width: 460,
        open: function(event, ui) {
            $(this).parent().find('button:not(.ui-dialog-titlebar-close)').first().addClass('mainaction');
            $(this).find('#itip-saveto').val('');

            // initialize autocompletion
            var ac_props, rcm = rcmail.is_framed() ? parent.rcmail : rcmail;
            if (rcmail.env.autocomplete_threads > 0) {
                ac_props = {
                    threads: rcmail.env.autocomplete_threads,
                    sources: rcmail.env.autocomplete_sources
                };
            }
            rcm.init_address_input_events($(this).find('#itip-delegate-to').focus(), ac_props);
            rcm.env.recipients_delimiter = '';
        },
        close: function(event, ui) {
            rcm = rcmail.is_framed() ? parent.rcmail : rcmail;
            rcm.ksearch_blur();
            $(this).remove();
        }
    });

    return dialog;
};

/**
 * Show a menu for selecting the RSVP reply mode
 */
rcube_libcalendaring.itip_rsvp_recurring = function(btn, callback, event)
{
    var list, menu = $('#itip-rsvp-menu'), action = btn.attr('rel');

    if (!menu.length) {
        menu = $('<div>').attr({'class': 'popupmenu', id: 'itip-rsvp-menu', 'aria-hidden': 'true'}).appendTo(document.body);
        list = $('<ul>').attr({'class': 'toolbarmenu menu', role: 'menu'}).appendTo(menu);

        $.each(['all','current'/*,'future'*/], function(i, mode) {
            var link = $('<a>').attr({'class': 'active', rel: mode})
                .text(rcmail.get_label('rsvpmode' + mode))
                .on('click', function() { callback(action, $(this).attr('rel')); });

            $('<li>').attr({role: 'menuitem'}).append(link).appendTo(list);
        });
    }

    rcmail.show_menu('itip-rsvp-menu', true, event);
};

/**
 *
 */
rcube_libcalendaring.remove_from_itip = function(event, task, title)
{
    rcmail.confirm_dialog(rcmail.gettext('itip.deleteobjectconfirm').replace('$title', title), 'delete', function() {
        rcmail.http_post(task + '/itip-remove', event, rcmail.set_busy(true, 'itip.savingdata'));
    });
};

/**
 *
 */
rcube_libcalendaring.decline_attendee_reply = function(mime_id, task)
{
    // show dialog for entering a comment and send to server
    var html = '<div class="itip-dialog-confirm-text">' + rcmail.gettext('itip.declineattendeeconfirm') + '</div>' +
        '<textarea id="itip-decline-comment" class="itip-comment" cols="40" rows="8"></textarea>';

    var dialog, buttons = [];
    buttons.push({
        text: rcmail.gettext('declineattendee', 'itip'),
        click: function() {
            rcmail.http_post(task + '/itip-decline-reply', {
                _uid: rcmail.env.uid,
                _mbox: rcmail.env.mailbox,
                _part: mime_id,
                _comment: $('#itip-decline-comment', window.parent.document).val()
            }, rcmail.set_busy(true, 'itip.savingdata'));
          dialog.dialog("close");
        }
    });

    buttons.push({
        text: rcmail.gettext('cancel', 'itip'),
        click: function() {
          dialog.dialog('close');
        }
    });

    dialog = rcmail.show_popup_dialog(html, rcmail.gettext('declineattendee', 'itip'), buttons, {
        width: 460,
        open: function() {
            $(this).parent().find('button:not(.ui-dialog-titlebar-close)').first().addClass('mainaction');
            $('#itip-decline-comment').focus();
        }
    });

    return false;
};

/**
 *
 */
rcube_libcalendaring.fetch_itip_object_status = function(p)
{
  p.mbox = rcmail.env.mailbox;
  p.message_uid = rcmail.env.uid;
  rcmail.http_post(p.task + '/itip-status', { data: p });
};

/**
 *
 */
rcube_libcalendaring.update_itip_object_status = function(p)
{
  rcmail.env.rsvp_saved = p.saved;
  rcmail.env.itip_existing = p.existing;

  // hide all elements first
  $('#itip-buttons-'+p.id+' > div').hide();
  $('#rsvp-'+p.id+' .folder-select').remove();

  if (p.html) {
    // append/replace rsvp status display
    $('#loading-'+p.id).next('.rsvp-status').remove();
    $('#loading-'+p.id).hide().after(p.html);
  }

  // enable/disable rsvp buttons
  if (p.action == 'rsvp') {
    $('#rsvp-'+p.id+' input.button').prop('disabled', false)
      .filter('.'+String(p.status||'unknown').toLowerCase()).prop('disabled', p.latest);
  }

  // show rsvp/import buttons (with calendar selector)
  $('#'+p.action+'-'+p.id).show().find('input.button').last().after(p.select);

  // highlight date if date change detected
  if (p.rescheduled)
    $('.calendar-eventdetails td.date').addClass('modified');

  // show itip box appendix after replacing the given placeholders
  if (p.append && p.append.selector) {
    var elem = $(p.append.selector);
    if (p.append.replacements) {
      $.each(p.append.replacements, function(k, html) {
        elem.html(elem.html().replace(k, html));
      });
    }
    else if (p.append.html) {
      elem.html(p.append.html)
    }
    elem.show();
  }

  if (window.UI && UI.pretty_select) {
    $('#rsvp-'+p.id+' select').each(function() { UI.pretty_select(this); });
  }
};

/**
 * Callback from server after an iTip message has been processed
 */
rcube_libcalendaring.itip_message_processed = function(metadata)
{
  if (metadata.after_action) {
    setTimeout(function(){ rcube_libcalendaring.itip_after_action(metadata.after_action); }, 1200);
  }
  else {
    rcube_libcalendaring.fetch_itip_object_status(metadata);
  }
};

/**
 * After-action on iTip request message. Action types:
 *     0 - no action
 *     1 - move to Trash
 *     2 - delete the message
 *     3 - flag as deleted
 *     folder_name - move the message to the specified folder
 */
rcube_libcalendaring.itip_after_action = function(action)
{
  if (!action) {
    return;
  }

  var rc = rcmail.is_framed() ? parent.rcmail : rcmail;

  if (action === 2) {
    rc.permanently_remove_messages();
  }
  else if (action === 3) {
    rc.mark_message('delete');
  }
  else {
    rc.move_messages(action === 1 ? rc.env.trash_mailbox : action);
  }
};

/**
 * Open the calendar preview for the current iTip event
 */
rcube_libcalendaring.open_itip_preview = function(url, msgref)
{
  if (!rcmail.env.itip_existing)
    url += '&itip=' + escape(msgref);

  var win = rcmail.open_window(url);
};


// extend jQuery
(function($){
  $.fn.serializeJSON = function(){
    var json = {};
    jQuery.map($(this).serializeArray(), function(n, i) {
      json[n['name']] = n['value'];
    });
    return json;
  };
})(jQuery);


/* libcalendaring plugin initialization */
window.rcmail && rcmail.addEventListener('init', function(evt) {
  if (rcmail.env.libcal_settings) {
    var libcal = new rcube_libcalendaring(rcmail.env.libcal_settings);
    rcmail.addEventListener('plugin.display_alarms', function(alarms){ libcal.display_alarms(alarms); });
  }

  rcmail.addEventListener('plugin.update_itip_object_status', rcube_libcalendaring.update_itip_object_status)
    .addEventListener('plugin.fetch_itip_object_status', rcube_libcalendaring.fetch_itip_object_status)
    .addEventListener('plugin.itip_message_processed', rcube_libcalendaring.itip_message_processed);
});
