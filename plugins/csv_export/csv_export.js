/**
 * Client script for the csv_export plugin
 *
 * @author Aleksander Machniak <machniak@kolabsys.com>
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) 2011-2016, Kolab Systems AG <contact@kolabsys.com>
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
 * for the JavaScript code in this file.
 */

window.rcmail && rcmail.addEventListener('init', function() {
    if (rcmail.task == 'addressbook') {
        rcmail.addEventListener('beforeexport', function(e) { return csv_export_dialog(e, 'export'); })
            .addEventListener('beforeexport-selected', function(e) { return csv_export_dialog(e, 'export-selected'); });
    }
    // for tasks export we already have dialog, add format selector there
    else if (rcmail.task == 'tasks') {
      var options = [
          $('<option>').attr({value: 'itip', selected: true}).text('iCal'),
          $('<option>').attr({value: 'csv'}).text('csv')
        ],
        entry = $('<div>').attr('class', 'form-section')
          .append($('<label>').attr('for', 'tasks-export-form-format').text(rcmail.get_label('csv_export.format')))
          .append($('<select>').attr({name: '_format', id: 'tasks-export-form-format'}).append(options));

      $('#tasks-export-form').append(entry);
    }
});

// Display dialog with format selection
function csv_export_dialog(event, action)
{
    // goto the default export if vcard format was selected
    if (rcmail.env.csv_export_bypass) {
        return;
    }

    var close_fn = function() { $(this).remove(); };

    rcmail.show_popup_dialog(
        csv_export_dialog_body(),
        rcmail.get_label('csv_export.title'),
        [{
            text: rcmail.get_label('export'),
            'class': 'mainaction',
            click: function() {
                $(this).remove();
                csv_export_dialog_action($('input:checked', this).val(), action);
            }
        },
        {
            text: rcmail.get_label('cancel'),
            click: close_fn
        }],
        {close: close_fn}
    );

    return false;
}

// Build dialog body
function csv_export_dialog_body()
{
    return [
        $('<div>').text(rcmail.get_label('csv_export.text')),
        $('<input>').attr({type: 'radio', name: 'format', value: 'vcf', id: 'csv_format_vcf'})
            .prop('checked', true),
        $('<label>').text(rcmail.get_label('csv_export.vcf')).attr({'for': 'csv_format_vcf', style: 'vertical-align: middle'}),
        $('<br>'),
        $('<input>').attr({type: 'radio', name: 'format', value: 'csv', id: 'csv_format_csv'}),
        $('<label>').text(rcmail.get_label('csv_export.csv')).attr({'for': 'csv_format_csv', style: 'vertical-align: middle'}),
    ];
}

// Execute export action
function csv_export_dialog_action(format, action)
{
    if (!rcmail.contact_list.rowcount) {
        return;
    }

    // bypass the dialog and execute default export
    if (format != 'csv') {
        rcmail.env.csv_export_bypass = true;
        rcmail.command(action);
        rcmail.env.csv_export_bypass = false;
        return;
    }

    var params = {
        _source: rcmail.env.source,
        _gid: rcmail.env.group,
        _format: 'csv',
        _token: rcmail.env.request_token
      };

    if (action == 'export') {
        params._search = rcmail.env.search_request;
    }
    else { // 'export-selected'
        params._cid = rcmail.contact_list.get_selection().join(',');
    }

    rcmail.goto_url('export', params);
}
