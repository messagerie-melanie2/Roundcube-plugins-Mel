/**
* Clone from fullcalendar.js
*/
var format_time = function(date, voice)
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
        t   : function(d) { return d.getHours() < 12 ? 'a' : 'p' },
        tt  : function(d) { return d.getHours() < 12 ? 'am' : 'pm' },
        T   : function(d) { return d.getHours() < 12 ? 'A' : 'P' },
        TT  : function(d) { return d.getHours() < 12 ? 'AM' : 'PM' }
    };
    
    var i, i2, c, formatter, res = '',
    format = 'HH:mm';
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
// format time string
var time_autocomplete_format = function(hour, minutes, start) {
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
    hours = start ? start.getHours() : now.getHours(),
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
    pmregex = /^(.+)(a[.m]*)/i,
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
var init_time_autocomplete = function(elem, props)
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

// Quand l'utilisateur check/uncheck la journée entière
function all_day_check(object) {
    var container = object.parentNode.parentNode.parentNode.parentNode.parentNode;
    if (object.checked) {
        container.querySelector('.hourstart > input').disabled = true;
        container.querySelector('.hourend > input').disabled = true;
        container.querySelector('.hourstart > input').value = '00:00';
        container.querySelector('.hourend > input').value = '00:00';
    }
    else {
        container.querySelector('.hourstart > input').disabled = false;
        container.querySelector('.hourend > input').disabled = false;
    }
}

// Ajouter une nouvelle absence hebdo
function add_new_absence() {
    var html = document.querySelector('#absence-panel-recurrence .absence.template').innerHTML;
    var div = document.createElement('div');
    $('#absence-panel-recurrence .noabsence').hide();
    div.className = 'absence new';
    div.innerHTML = html.replace(/%%template%%/g, document.querySelectorAll('#form_gest_abs .absence').length-1).trim();
    document.querySelector('#absence-panel-recurrence > fieldset').appendChild(div);
    // configure drop-down menu on time input fields based on jquery UI autocomplete
    $('#form_gest_abs .absence.new .hourstart > input, #form_gest_abs .absence.new .hourend > input').each(function() {
        init_time_autocomplete(this, {
            container: '#absence-panel-recurrence'
        });
    });
    document.querySelector('#absence-panel-recurrence .absence.new').className = 'absence';
}

// Supprimer une absence hebdo
function delete_absence(object) {
    var container = object.parentNode.parentNode.parentNode.parentNode.parentNode;
    container.querySelector('.message textarea').value = '';
    $(container).find('input').val('');
    $(container).find('input').prop('checked', false);
    $(container).hide();
}

// modifier texte au submit
$('#gest_save').click(function() {
    $('#abs_msg_mel').val($('#abs_msg_mel').val()
        .replace(/jusqu'au [\dj]{1,2}\/[\dm]{1,2}\/[\da]{2,4}/i, "jusqu'au "
                        + $('#abs_date_fin').val()));
});

if (window.rcmail) {
    rcmail.addEventListener('init', function(evt) {
        if (rcmail.env.task == 'settings' && rcmail.env.action == 'plugin.mel_moncompte' && rcmail.env.fid == 'gestionnaireabsence') {
            $.datepicker.setDefaults({
                dateFormat : "dd/mm/yy"
            });
            
            var shift_enddate = function(dateText) {
                var start_date = $.datepicker.parseDate("dd/mm/yy", dateText);
                var end_date = $.datepicker
                    .parseDate("dd/mm/yy", $('#abs_date_fin').val());
                
                if (!end_date || start_date.getTime() > end_date.getTime()) {
                    $('#abs_date_fin').val(dateText);
                    $('#abs_msg_mel').val($('#abs_msg_mel').val()
                        .replace(/jusqu'au [\dj]{1,2}\/[\dm]{1,2}\/[\da]{2,4}/i, "jusqu'au "
                        + dateText));
                    $('#abs_msg_inter').val($('#abs_msg_inter').val()
                        .replace(/jusqu'au [\dj]{1,2}\/[\dm]{1,2}\/[\da]{2,4}/i, "jusqu'au "
                        + dateText));
                    
                }
            };
            
            var shift_startdate = function(dateText) {
                var end_date = $.datepicker.parseDate("dd/mm/yy", dateText);
                var start_date = $.datepicker
                    .parseDate("dd/mm/yy", $('#abs_date_debut').val());
                
                if (!start_date || start_date.getTime() > end_date.getTime()) {
                    $('#abs_date_debut').val(dateText);
                }
                $('#abs_msg_mel').val($('#abs_msg_mel').val()
                    .replace(/jusqu'au [\dj]{1,2}\/[\dm]{1,2}\/[\da]{2,4}/i, "jusqu'au "
                    + dateText));
                $('#abs_msg_inter').val($('#abs_msg_inter').val()
                    .replace(/jusqu'au [\dj]{1,2}\/[\dm]{1,2}\/[\da]{2,4}/i, "jusqu'au "
                    + dateText));
                
            };
            
            $('#abs_date_debut').datepicker()
                .datepicker('option', 'onSelect', shift_enddate)
                .change(function() {
                    shift_enddate(this.value);
                });
            $('#abs_date_fin').datepicker()
                .datepicker('option', 'onSelect', shift_startdate)
                .change(function() {
                    shift_startdate(this.value);
                });
            
            // init absence tabs
            $('#form_gest_abs').tabs();
            
            // configure drop-down menu on time input fields based on jquery UI autocomplete
            $('#form_gest_abs .absence .hourstart > input, #form_gest_abs .absence .hourend > input').each(function() {
                init_time_autocomplete(this, {
                container: '#absence-panel-recurrence'
                });
            });
        }
    });
}