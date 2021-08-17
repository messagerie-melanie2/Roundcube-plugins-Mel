/**
 * Mél keyboard shortcuts
 *
 * Based on Kolab keyboard shortcuts plugin by Aleksander Machniak <machniak@kolabsys.com>
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) 2016, PNE Annuaire et Messagerie/MEDDE
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

/**
 * Configuration des raccourcis clavier basé sur Thunderbird
 * 
 * voir : https://support.mozilla.org/en-US/kb/keyboard-shortcuts
 */
var mel_shortcuts_press = { 
    ///// Receiving and reading messages
    'mail.expand-all-threads': {
      keypress: 42, // *
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) {
          return rcmail.command('expand-all', '', e.target, e);
      }
    },
    'mail.collapse-all-threads': {
      keypress: 92, // \
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) {
          return rcmail.command('collapse-all', '', e.target, e);
      }
    },
};

var mel_shortcuts_down = {
  ///// Starting a new message
  'mail.new-message' : {
    keydown: 78, // Ctrl + Shift + N
    ctrl: true,
    shift: true,
    active: function(e) { return rcmail.task == 'mail'; },
    action: function(e) { return rcmail.command('compose', '', e.target, e); }
  },
  'mail.new-message-bis' : {
    keydown: 77, // Ctrl + Shift + M
    ctrl: true,
    shift: true,
    active: function(e) { return true; },
    action: function(e) { return rcmail.command('compose', '', e.target, e); }
  },
  'mail.reply': {
    keydown: 82, // Ctrl + R
    ctrl: true,
    active: function(e) { return rcmail.task == 'mail' && rcmail.commands['reply']; },
    action: function(e) { 
      return rcmail.command('reply', '', e.target, e); 
    }
  },
  'mail.replyall': {
    keydown: 82, // Ctrl + Shift + R
    ctrl: true,
    shift: true,
    active: function(e) { return rcmail.task == 'mail' && rcmail.commands['reply-all']; },
    action: function(e) { 
      return rcmail.command('reply-all', 'sub', e.target, e); 
    }
  },
  'mail.replylist': {
    keydown: 76, // Ctrl + Shift + L
    ctrl: true,
    shift: true,
    active: function(e) { return rcmail.task == 'mail' && rcmail.commands['reply-list']; },
    action: function(e) {
        return rcmail.command('reply-list', '', e.target, e);
    }
  },
  'mail.forward-attachment': {
    keydown: 76, // Ctrl + L
    ctrl: true,
    active: function(e) { return rcmail.task == 'mail' && rcmail.commands['forward-attachment']; },
    action: function(e) { 
      return rcmail.command('forward-attachment', 'sub', e.target, e); 
    }
  },
  'mail.forward-inline': {
      keydown: 70, // Ctrl + Shift + F
      ctrl: true,
      shift: true,
      active: function(e) { return rcmail.task == 'mail' && rcmail.commands['forward-inline']; },
      action: function(e) { 
        return rcmail.command('forward-inline', 'sub', e.target, e); 
      }
  },    
  
  ///// Receiving and reading messages
  'mail.refresh': {
      keydown: 90, // Ctrl + Shift + Z
      ctrl: true,
      shift: true,
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) { return rcmail.command('checkmail', '', e.target, e); }
  },
  'mail.expand-thread': {
    keydown: 39, // ->
    active: function(e) { return rcmail.task == 'mail'; },
    action: function(e) {
        if (rcmail.message_list) {
            var row, uid = rcmail.message_list.get_single_selection();
            if (uid && (row = rcmail.message_list.rows[uid])) {
                rcmail.message_list.expand_all(row);
            }
        }
    }
  },
  'mail.collapse-thread': {
      keydown: 37, // <-
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) {
          if (rcmail.message_list) {
              var row, uid = rcmail.message_list.get_single_selection();
              if (uid && (row = rcmail.message_list.rows[uid])) {
                  rcmail.message_list.collapse_all(row);
              }
          }
      }
  },
  
  ///// Managing your messages     
  'mail.message-source': {
      keydown: 85, // Ctrl + U
      ctrl: true,
      active: function(e) { return rcmail.task == 'mail' && rcmail.commands['viewsource']; },
      action: function(e) { 
        return rcmail.commands['viewsource'] ? rcmail.command('viewsource', '', e.target, e) : false; 
      }
  },
  'mail.select-all': {
      keydown: 65, // Ctrl + A
      ctrl: true,
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) { return rcmail.command('select-all', '', e.target, e); }
  },
  
  'mail.copy': {
      keydown: 67, // Ctrl + Shift + C
      ctrl: true,
      shift: true,
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) {
          e = mel_shortcuts_menu_target(e);
          e.rcmail.command('copy', '', e.target, e);
          e.target.remove();
      }
  },
  'mail.move': {
      keydown: 77, // Ctrl + M
      ctrl: true,
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) {
          e = mel_shortcuts_menu_target(e);
          e.rcmail.command('move', '', e.target, e);
          e.target.remove();
      }
  },
  
  'mail.next-msg': {
      keydown: 78, // n
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) {
          if (rcmail.message_list)
              return rcmail.message_list.select_next();
          else
              return rcmail.command('nextmessage', '', '', e);
      }
  },
  'mail.prev-msg': {
      keydown: 80, // p
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) {
          if (rcmail.message_list)
              return rcmail.message_list.use_arrow_key(38, false);
          else
              return rcmail.command('previousmessage', '', '', e);
      }
  },
  
  ////// Tagging and marking your messages
  'mail.mark-as-read-unread': {
      keydown: 77, // m
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) {
        var list = rcmail.message_list;
        if (list) {
          var flag = 'unread', a_uids = list.get_selection();
          
          for (n=0, len=a_uids.length; n<len; n++) {
            id = a_uids[n];
            if (list.rows[id].unread) {
              flag = 'read';
              break;
            }
          }
          
          return rcmail.command('mark', flag, a_uids, e)
        }
      }
  },
  'mail.mark-as-read': {
      keydown: 82, // r
      active: function(e) { return rcmail.task == 'mail' && rcmail.commands['mark']; },
      action: function(e) {
        return rcmail.command('mark', 'read', e.target, e)
      }
  },
  'mail.add-remove-star': {
      keydown: 83, // s
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) {
        var list = rcmail.message_list;
        if (list) {
          var flag = 'unflagged', a_uids = list.get_selection();
          
          for (n=0, len=a_uids.length; n<len; n++) {
            id = a_uids[n];
            if (!list.rows[id].flagged) {
              flag = 'flagged';
              break;
            }
          }
          
          return rcmail.command('mark', flag, a_uids, e)
        }
      }
  },
  
  ////// Mail compose
  'mail.send': {
      keydown: 13, // Ctrl + Enter
      ctrl: true,
      active: function(e) { return rcmail.task == 'mail'; },
      action: function(e) {
        return rcmail.commands['send'] ? rcmail.command('send', '', e.target, e) : false;
      }
  },
  
  //////// Calendar
  'calendar.new-event': {
      keydown: 73, // Ctrl + I
      ctrl: true,
      active: function(e) { return rcmail.commands['add-event-from-shortcut'] || rcmail.commands['addevent']; },
      action: function(e) {
        return rcmail.commands['add-event-from-shortcut'] ? rcmail.command('add-event-from-shortcut', '', e.target, e) : rcmail.command('addevent', '', e.target, e);
      }
  },
  'calendar.prevday': {
      keydown: 78, // Shift + N
      shift: true,
      active: function(e) { return rcmail.task == 'calendar' && rcmail.commands['prevDay']; },
      action: function(e) {
        return rcmail.command('prevDay', '', e.target, e);
      }
  },
  'calendar.today': {
      keydown: 35, // Alt + End
      alt: true,
      active: function(e) { return rcmail.task == 'calendar' && rcmail.commands['today']; },
      action: function(e) {
        return rcmail.command('today', '', e.target, e);
      }
  },
  'calendar.nextday': {
      keydown: 80, // Shift + P
      shift: true,
      active: function(e) { return rcmail.task == 'calendar' && rcmail.commands['nextDay']; },
      action: function(e) {
        return rcmail.command('nextDay', '', e.target, e);
      }
  },
  
  //////// Escape
  'escape': {
      keydown: 27, // Escape
      active: function(e) { return true; },
      action: function(e) {
        if (rcmail.task == 'mail' && rcmail.env.action == 'compose') {
          return rcmail.commands['list'] ? rcmail.command('list', '', e.target, e) : false;
        }
        else if (rcmail.task == 'calendar' && rcmail.env.action == 'print') {
          return window.close();
        }
      }
  },
  
  //////// Menu switch
  'menu.mail': {
      keydown: 49, // Ctrl + Shift + 1
      ctrl: true,
      shift: true,
      active: function(e) { return rcmail.task != 'mail'; },
      action: function(e) {
        return rcmail.command('switch-task', 'mail', e.target, e);
      }
  },
  'menu.addressbook': {
      keydown: 50, // Ctrl + Shift + 2
      ctrl: true,
      shift: true,
      active: function(e) { return rcmail.task != 'addressbook'; },
      action: function(e) {
        return rcmail.command('switch-task', 'addressbook', e.target, e);
      }
  },
  'menu.calendar': {
      keydown: 51, // Ctrl + Shift + 3
      ctrl: true,
      shift: true,
      active: function(e) { return rcmail.task != 'calendar'; },
      action: function(e) {
        return rcmail.command('switch-task', 'calendar', e.target, e);
      }
  },
  'menu.discussion': {
    keydown: 52, // Ctrl + Shift + 4
    ctrl: true,
    active: function(e) { return rcmail.task != 'discussion'; },
    action: function(e) {
      return rcmail.command('switch-task', 'discussion', e.target, e);
    }
  },
  'menu.sondage': {
    keydown: 53, // Ctrl + Shift + 5
    ctrl: true,
    shift: true,
    active: function(e) { return rcmail.task != 'sondage'; },
    action: function(e) {
      return rcmail.command('switch-task', 'sondage', e.target, e);
    }
  },
  'menu.tasks': {
      keydown: 55, // Ctrl + Shift + 7
      ctrl: true,
      active: function(e) { return rcmail.task != 'tasks'; },
      action: function(e) {
        return rcmail.command('switch-task', 'tasks', e.target, e);
      }
  },
  'menu.stockage': {
      keydown: 54, // Ctrl + Shift + 6
      ctrl: true,
      active: function(e) { return rcmail.task != 'stockage'; },
      action: function(e) {
        return rcmail.command('switch-task', 'stockage', e.target, e);
      }
  },
  'menu.settings': {
    keydown: 56, // Ctrl + Shift + 8
    ctrl: true,
    shift: true,
    active: function(e) { return rcmail.task != 'settings' || rcmail.env.action == 'plugin.mel_moncompte'; },
    action: function(e) {
      return rcmail.command('switch-task', 'settings', e.target, e);
    }
  },
  
  
  //////// Save
  'save': {
      keydown: 83, // Ctrl + S
      ctrl: true,
      active: function(e) { return rcmail.task == 'mail' || $('#eventedit').length && $('#eventedit').is(':visible'); },
      action: function(e) {
        if ($('#eventedit').length && $('#eventedit').is(':visible')) {
          $('#eventedit').parent().parent().find('.mainaction').click();
        }
        else if (rcmail.env.action == 'list' || rcmail.env.action == 'show' || rcmail.env.action == '') {
          return rcmail.commands['download'] ? rcmail.command('download', '', e.target, e) : false;
        }
        else if (rcmail.env.action == 'compose') {
          return rcmail.commands['savedraft'] ? rcmail.command('savedraft', '', e.target, e) : false;
        }
      }
  },
  
  /////// Edit
  'edit': {
      keydown: 69, // Ctrl + E
      ctrl: true,
      active: function(e) { return rcmail.task == 'mail' && rcmail.commands['edit'] || rcmail.task == 'calendar' && $('#eventshow').length && $('#eventshow').is(':visible'); },
      action: function(e) {
        if (rcmail.task == 'calendar' && $('#eventshow').length && $('#eventshow').is(':visible')) {
          $('#eventshow').parent().find('.ui-dialog-buttonset .ui-button').click();
        }
        else if (rcmail.task == 'mail' && rcmail.commands['edit']) {
          var mode = rcmail.env.mailbox == rcmail.env.drafts_mailbox ? '' : 'new';
          return rcmail.command('edit', mode, e.target, e);
        }
      }
  },
  
  //////// Delete
  'delete': {
      keydown: 46, // Delete
      active: function(e) { return rcmail.task == 'mail' && rcmail.env.action == 'preview' || rcmail.task == 'calendar' && $('#eventshow').length && $('#eventshow').is(':visible'); },
      action: function(e) {
        if (rcmail.task == 'calendar' && $('#eventshow').length && $('#eventshow').is(':visible')) {
          $('#eventshow').parent().find('.delete').click();
        }
        else if (rcmail.task == 'mail' && rcmail.env.action == 'preview') {
          window.parent.rcmail.command('delete', '', e.target, e);
        }
      }
  },

  //////// Shift + Delete
  'shift_delete': {
    keydown: 46, // Shift + Delete
    shift: true,
    active: function(e) { return rcmail.task == 'mail' && rcmail.env.action == 'preview' },
    action: function(e) {
      if (confirm(window.parent.rcmail.get_label('deletemessagesconfirm')))
        window.parent.rcmail.permanently_remove_messages();
    }
  },
  
  //////// Print
  'print': {
      keydown: 80, // Ctrl + P
      ctrl: true,
      active: function(e) { return rcmail.commands['print']; },
      action: function(e) { 
        return rcmail.commands['print'] ? rcmail.command('print', '', e.target, e) : false; 
      }
  },   

  //////// Search
  'search.focus': {
      keydown: 75, // Ctrl + Shift + K
      ctrl: true,
      shift: true,
      active: function(e) { return true; },
      action: function(e) {
          if (!rcmail.is_framed())
              $('#quicksearchbox').focus();
          else if (window.parent && window.parent.$)
              window.parent.$('#quicksearchbox').focus();
      }
  },

};

// create a fake element centered on the page,
// so folder selector popupup appears in the center
var mel_shortcuts_menu_target = function(e)
{
    var rc, target,
        css = {visibility: 'hidden', width: 10, height: 10, margin: 'auto'};

    if (rcmail.is_framed()) {
        rc = parent.rcmail;
        target = parent.$('<div>').css(css).appendTo(parent.$('body'));
    }
    else {
        rc = rcmail;
        target = $('<div>').css(css).appendTo($('body'));
    }

    e.target = target;
    e.rcmail = rc;

    return e;
};

var mel_shortcuts_keypress = function(e)
{
    var i, handler, key = e.which;
    
    // Detect escape
    if (e.which == 0) {
      key = e.keyCode;
    }

    // console.log("### mel_shortcuts_keypress");
    // console.log(e.which);
    // console.log(e.keyCode);

    // do nothing on input elements if no ctrl
    if ($(e.target).is('textarea,input')) {
        return true;
    }

    // do nothing if any popup menu is displayed
    if ($('.popupmenu:visible').length) {
        return true;
    }

    for (i in mel_shortcuts_press) {
        handler = mel_shortcuts_press[i];        

        // check if presses key(s) match
        if (handler.keypress == key) {          
            // ... and action is active here
            if (handler.active(e)) {
                // execute action, the real check if action is active
                // will be done in .action() or in rcmail.command()
                handler.action(e);
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }

            // we can break here, there can be only one handler
            // for the specified shortcut
            break;
        }
    }

    return true;
};

var mel_shortcuts_keydown = function(e)
{
    var i, handler, key = e.which, alt = e.altKey, ctrl = e.ctrlKey, shift = e.shiftKey;
    
    // Detect escape
    if (e.which == 0) {
      key = e.keyCode;
    }

    // console.log("### mel_shortcuts_keydown");
    // console.log(e.which);
    // console.log(e.keyCode);

    // do nothing on input elements if no ctrl
    if ($(e.target).is('textarea,input')) {
        return true;
    }

    // do nothing if any popup menu is displayed
    if ($('.popupmenu:visible').length) {
        return true;
    }

    for (i in mel_shortcuts_down) {
        handler = mel_shortcuts_down[i];        

        // check if presses key(s) match
        if (handler.keydown == key
            && ((handler.ctrl && ctrl) || (!handler.ctrl && !ctrl))
            && ((handler.alt && alt) || (!handler.alt && !alt))
            && ((handler.shift && shift) || (!handler.shift && !shift))
        ) {          
            // ... and action is active here
            if (handler.active(e)) {
                // execute action, the real check if action is active
                // will be done in .action() or in rcmail.command()
                handler.action(e);
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }

            // we can break here, there can be only one handler
            // for the specified shortcut
            break;
        }
    }

    return true;
};

// register the keypress and keydown handler
window.rcmail && $(document).ready(function() {
    $(document).on('keypress', function(e) {
        return mel_shortcuts_keypress(e);
    });
    $(document).on('keydown', function(e) {
      return mel_shortcuts_keydown(e);
  });
});
