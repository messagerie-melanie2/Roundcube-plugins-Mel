$(document).ready(() => {
    rcube_calendar.prototype.create_event_from_somewhere = function(event = null)
    {
        if (event === null)
        {
            event = rcmail.local_storage_get_item("tmp_calendar_event");
        }

        var url = {
            _category: event === null || event.categories === undefined || event.categories === null || event.categories.length === 0 ? null : event.categories[0], 
            _framed: true,
            _calendar_blocked: event != null && event.calendar_blocked === true,
            // _startDate: event == null || event.start === undefined ? null : event.start,
            // _endDate: event == null || event.end === undefined ? null : event.end,
        },
            buttons = {},
            button_classes = ['mainaction save', 'cancel'],
            title = rcmail.gettext('mel_metapage.new_event'),
            dialog = $('<iframe>').attr({
                id: 'kolabcalendarinlinegui',
                name: 'kolabcalendardialog',
                src: rcmail.url('mel_metapage/dialog-ui', url)
            });

        // dialog buttons
        buttons[rcmail.gettext('save')] = function() {
            var frame = rcmail.get_frame_window('kolabcalendarinlinegui');
            frame.rcmail.command('event-save');
            parent.postMessage({
                message:"update_calendar"
            });

        };

        buttons[rcmail.gettext('cancel')] = function() {
            dialog.dialog('destroy');
        };

        // open jquery UI dialog
        window.kolab_event_dialog_element = dialog = rcmail.show_popup_dialog(dialog, title, buttons, {
            button_classes: button_classes,
            minWidth: 500,
            width: 600,
            height: 600
        });
    // var sheet = window.document.styleSheets[0];
    // sheet.insertRule('.ui-datepicker .ui-state-default, .ui-datepicker.ui-widget-content .ui-state-default { color: black!important; }', sheet.cssRules.length);
     };

});