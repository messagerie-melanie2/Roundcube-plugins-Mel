/**
 * Client scripts for the Tasklist plugin
 *
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) 2013-2018, Kolab Systems AG <contact@kolabsys.com>
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
 
function rcube_tasklist(settings)
{
    /* public methods */
    this.create_from_mail = create_from_mail;
    this.save_to_tasklist = save_to_tasklist;


    /**
     * Open a new task dialog prefilled with contents from the currently selected mail message
     */
    function create_from_mail(uid)
    {
        if (!uid && !(uid = rcmail.get_single_uid())) {
            return;
        }

        var url = {_mbox: rcmail.env.mailbox, _uid: uid, _framed: 1},
            buttons = {},
            button_classes = ['mainaction save', 'cancel'],
            title = rcmail.gettext('tasklist.createfrommail'),
            dialog = $('<iframe>').attr({
                id: 'kolabtasksinlinegui',
                name: 'kolabtasksdialog',
                src: rcmail.url('tasks/dialog-ui', url)
            });

        // dialog buttons
        buttons[rcmail.gettext('save')] = function() {
            var frame = rcmail.get_frame_window('kolabtasksinlinegui');
            frame.rcmail.command('save-task');
        };

        buttons[rcmail.gettext('cancel')] = function() {
            dialog.dialog('destroy');
        };

        // open jquery UI dialog
        window.kolab_task_dialog_element = dialog = rcmail.show_popup_dialog(dialog, title, buttons, {
            button_classes: button_classes,
            minWidth: 500,
            width: 600,
            height: 600
        });
    }

    // handler for attachment-save-tasklist commands
    function save_to_tasklist()
    {
      // TODO: show dialog to select the tasklist for importing
      if (this.selected_attachment && window.rcube_libcalendaring) {
        rcmail.http_post('tasks/mailimportattach', {
            _uid: rcmail.env.uid,
            _mbox: rcmail.env.mailbox,
            _part: this.selected_attachment
            // _list: $('#tasklist-attachment-saveto').val(),
          }, rcmail.set_busy(true, 'itip.savingdata'));
      }
    }

    // register event handlers on linked task items in message view
    // the checkbox allows to mark a task as complete
    if (rcmail.env.action == 'show' || rcmail.env.action == 'preview') {
        $('div.messagetasklinks input.complete').click(function(e) {
            var $this = $(this);
            $(this).closest('.messagetaskref').toggleClass('complete');

            // submit change to server
            rcmail.http_post('tasks/task', {
                action: 'complete',
                t: { id:this.value, list:$this.attr('data-list') },
                complete: this.checked?1:0
            }, rcmail.set_busy(true, 'tasklist.savingdata'));
        });
    }
}

/* tasklist plugin initialization (for email task) */
window.rcmail && rcmail.env.task == 'mail' && rcmail.addEventListener('init', function(evt) {
    var tasks = new rcube_tasklist(rcmail.env.libcal_settings);

    rcmail.register_command('tasklist-create-from-mail', function() { tasks.create_from_mail(); });
    rcmail.register_command('attachment-save-task', function() { tasks.save_to_tasklist(); });

    if (rcmail.env.action != 'show')
        rcmail.env.message_commands.push('tasklist-create-from-mail');
    else
        rcmail.enable_command('tasklist-create-from-mail', true);

    rcmail.addEventListener('beforemenu-open', function(p) {
        if (p.menu == 'attachmentmenu') {
            tasks.selected_attachment = p.id;
            var mimetype = rcmail.env.attachments[p.id],
                is_ics = mimetype == 'text/calendar' || mimetype == 'text/x-vcalendar' || mimetype == 'application/ics';

            rcmail.enable_command('attachment-save-task', is_ics);
        }
    });
});
