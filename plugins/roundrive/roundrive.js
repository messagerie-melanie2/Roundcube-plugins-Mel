/**
 * Kolab files plugin
 *
 * @author Aleksander Machniak <machniak@kolabsys.com>
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) 2011, Kolab Systems AG <contact@kolabsys.com>
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

window.rcmail && window.files_api && rcmail.addEventListener('init', function() {
  if (rcmail.task == 'mail') {
    // mail compose
    if (rcmail.env.action == 'compose') {
      var elem = $('#compose-attachments > div'),
        input = $('<input class="button" type="button">')
          .attr('tabindex', $('input', elem).attr('tabindex') || 0)
          .val(rcmail.gettext('roundrive.fromcloud'))
          .click(function() { roundrive_selector_dialog(); })
          .appendTo(elem);

      if (rcmail.gui_objects.filelist) {
        rcmail.file_list = new rcube_list_widget(rcmail.gui_objects.filelist, {
          multiselect: true,
          keyboard: true,
          column_movable: false,
          dblclick_time: rcmail.dblclick_time
        });
        rcmail.file_list.addEventListener('select', function(o) { roundrive_list_select(o); })
          .addEventListener('listupdate', function(e) { rcmail.triggerEvent('listupdate', e); });

        rcmail.enable_command('files-sort', 'files-search', 'files-search-reset', true);

        rcmail.file_list.init();
        roundrive_list_coltypes();
      }

      // register some commands to skip warning message on compose page
      $.merge(rcmail.env.compose_commands, ['files-list', 'files-sort', 'files-search', 'files-search-reset']);
    }
    // mail preview
    else if (rcmail.env.action == 'show' || rcmail.env.action == 'preview') {
      var attachment_list = $('#attachment-list');

      if ($('li', attachment_list).length) {
        var link = $('<a href="#" class="button filesaveall">')
          .text(rcmail.gettext('roundrive.saveall'))
          .click(function() { roundrive_directory_selector_dialog(); })
          .insertAfter(attachment_list);
      }

      rcmail.addEventListener('menu-open', roundrive_attach_menu_open);
      rcmail.enable_command('folder-create', true);
    }
    // attachment preview
    else if (rcmail.env.action == 'get') {
      rcmail.enable_command('folder-create', true);
    }

    roundrive_init();
  }
  else if (rcmail.task == 'roundrive') {
    if (rcmail.gui_objects.filelist) {
      rcmail.file_list = new rcube_list_widget(rcmail.gui_objects.filelist, {
        multiselect: true,
        draggable: true,
        keyboard: true,
        column_movable: rcmail.env.col_movable,
        dblclick_time: rcmail.dblclick_time
      });
/*
      rcmail.file_list.row_init = function(o){ roundrive_init_file_row(o); };
      rcmail.file_list.addEventListener('dblclick', function(o){ p.msglist_dbl_click(o); });
      rcmail.file_list.addEventListener('click', function(o){ p.msglist_click(o); });
      rcmail.file_list.addEventListener('keypress', function(o){ p.msglist_keypress(o); });
      rcmail.file_list.addEventListener('dragstart', function(o){ p.drag_start(o); });
      rcmail.file_list.addEventListener('dragmove', function(e){ p.drag_move(e); });
*/
      rcmail.file_list.addEventListener('dblclick', function(o) { roundrive_list_dblclick(o); })
        .addEventListener('select', function(o) { roundrive_list_select(o); })
        .addEventListener('keypress', function(o) { roundrive_list_keypress(o); })
        .addEventListener('dragend', function(e) { roundrive_drag_end(e); })
        .addEventListener('column_replace', function(e) { roundrive_set_coltypes(e); })
        .addEventListener('listupdate', function(e) { rcmail.triggerEvent('listupdate', e); });

      rcmail.enable_command('menu-open', 'menu-save', 'files-sort', 'files-search', 'files-search-reset', 'folder-create', true);

      rcmail.file_list.init();
      roundrive_list_coltypes();
      roundrive_drag_drop_init($(rcmail.gui_objects.filelist).parents('.droptarget'));
    }

    // "one file only" commands
    rcmail.env.file_commands = ['files-get'];
    // "one or more file" commands
    rcmail.env.file_commands_all = ['files-delete', 'files-move', 'files-copy'];

    roundrive_init();

    if (rcmail.env.action == 'open') {
      rcmail.enable_command('files-get', 'files-delete', rcmail.env.file);
    }
    else {
      file_api.folder_list();
      file_api.browser_capabilities_check();
      rcmail.enable_command('folder-mount', rcmail.env.external_sources);
    }
  }
});


/**********************************************************/
/*********          Shared functionality         **********/
/**********************************************************/

// Initializes API object
function roundrive_init()
{  
  if (window.file_api)
    return;

  // Initialize application object (don't change var name!)
  file_api = $.extend(new files_api(), new roundrive_ui());

  file_api.set_env({
    sort_col: 'name',
    sort_reverse: false,
    search_threads: rcmail.env.search_threads,
    resources_dir: rcmail.assets_path('program/resources'),
    supported_mimetypes: rcmail.env.file_mimetypes
  });

  file_api.translations = rcmail.labels;
};


// folder selection dialog
function roundrive_directory_selector_dialog(id)
{
  var dialog = $('#files-dialog'),
    input = $('#file-save-as-input'),
    form = $('#file-save-as'),
    list = $('#folderlistbox'),
    buttons = {}, label = 'saveto',
    win = window, fn;

  // attachment is specified
  if (id) {
    var attach = $('#attach' + id + '> a').first(),
      filename = attach.attr('title');

    if (!filename) {
      attach = attach.clone();
      $('.attachment-size', attach).remove();
      filename = attach.text();
    }

    form.show();
    dialog.addClass('saveas');
    input.val(filename);
  }
  // attachment preview page
  else if (rcmail.env.action == 'get') {
    id = rcmail.env.part;
    form.show();
    dialog.addClass('saveas');
    input.val(rcmail.env.filename);
  }
  else {
    form.hide();
    dialog.removeClass('saveas');
    label = 'saveall';
  }

  $('#foldercreatelink').attr('tabindex', 0);

  buttons[rcmail.gettext('roundrive.save')] = function () {
    var lock = rcmail.set_busy(true, 'saving'),
      request = {
        act: 'save-file',
        source: rcmail.env.mailbox,
        uid: rcmail.env.uid,
        dest: file_api.env.folder
      };

    if (id) {
      request.id = id;
      request.name = input.val();
    }

    rcmail.http_post('plugin.roundrive', request, lock);
    roundrive_dialog_close(this);
  };

  buttons[rcmail.gettext('roundrive.cancel')] = function () {
    roundrive_dialog_close(this);
  };

  if (!rcmail.env.folders_loaded) {
    fn = function() {
      file_api.folder_list();
      rcmail.env.folders_loaded = true;
    };
  }

  // show dialog window
  roundrive_dialog_show(dialog, {
    title: rcmail.gettext('roundrive.' + label),
    buttons: buttons,
    button_classes: ['mainaction'],
    minWidth: 250,
    minHeight: 300,
    height: 350,
    width: 300
  }, fn);

  // "enable" folder creation when dialog is displayed in parent window
  if (rcmail.is_framed() && !parent.rcmail.folder_create) {
    parent.rcmail.enable_command('folder-create', true);
    parent.rcmail.folder_create = function() {
      win.roundrive_folder_create_dialog();
    };
  }
};

// file selection dialog
function roundrive_selector_dialog()
{
  var dialog = $('#files-compose-dialog'), buttons = {};

  buttons[rcmail.gettext('roundrive.attachsel')] = function () {
    var list = [];
    $('#filelist tr.selected').each(function() {
      list.push($(this).data('file'));
    });

    roundrive_dialog_close(this);

    if (list.length) {
      // display upload indicator and cancel button
      var content = '<span>' + rcmail.get_label('roundrive.attaching') + '</span>',
        id = new Date().getTime();

      rcmail.add2attachment_list(id, {name:'', html:content, classname:'uploading', complete:false});

      // send request
      rcmail.http_post('plugin.roundrive', {
        act: 'attach-file',
        files: list,
        id: rcmail.env.compose_id,
        uploadid: id
      });
    }
  };

  buttons[rcmail.gettext('roundrive.cancel')] = function () {
    roundrive_dialog_close(this);
  };

  // show dialog window
  roundrive_dialog_show(dialog, {
    title: rcmail.gettext('roundrive.selectfiles'),
    buttons: buttons,
    button_classes: ['mainaction'],
    minWidth: 500,
    minHeight: 300,
    width: 700,
    height: 500
  });

  if (!rcmail.env.files_loaded) {
    file_api.folder_list();
    rcmail.env.files_loaded = true;
  }
  else {
    rcmail.file_list.clear_selection();
  }
};

function roundrive_attach_menu_open(p)
{
  if (!p || !p.props || p.props.menu != 'attachmentmenu')
    return;

  var id = p.props.id;

  $('#attachmenusaveas').unbind('click').attr('onclick', '').click(function(e) {
    return roundrive_directory_selector_dialog(id);
  });
};

// folder creation dialog
function roundrive_folder_create_dialog()
{
  var dialog = $('#files-folder-create-dialog'),
    buttons = {},
    select = $('select[name="parent"]', dialog).html(''),
    input = $('input[name="name"]', dialog).val('');

  buttons[rcmail.gettext('roundrive.create')] = function () {
    var folder = '', name = input.val(), parent = select.val();

    if (!name)
      return;

    if (parent)
      folder = parent + file_api.env.directory_separator;

    folder += name;

    file_api.folder_create(folder);
    roundrive_dialog_close(this);
  };

  buttons[rcmail.gettext('roundrive.cancel')] = function () {
    roundrive_dialog_close(this);
  };

  // show dialog window
  roundrive_dialog_show(dialog, {
    title: rcmail.gettext('roundrive.foldercreate'),
    buttons: buttons,
    button_classes: ['mainaction']
  });

  // Fix submitting form with Enter
  $('form', dialog).submit(roundrive_dialog_submit_handler);

  // build parent selector
  select.append($('<option>').val('').text('---'));
  $.each(file_api.env.folders, function(i, f) {
    var n, option = $('<option>'), name = escapeHTML(f.name);

    for (n=0; n<f.depth; n++)
      name = '&nbsp;&nbsp;&nbsp;' + name;

    option.val(i).html(name).appendTo(select);

    if (i == file_api.env.folder)
      option.attr('selected', true);
  });
};

// folder edit dialog
function roundrive_folder_edit_dialog()
{
  var dialog = $('#files-folder-edit-dialog'),
    buttons = {}, options = [],
    separator = file_api.env.directory_separator,
    arr = file_api.env.folder.split(separator),
    folder = arr.pop(),
    path = arr.join(separator),
    select = $('select[name="parent"]', dialog).html(''),
    input = $('input[name="name"]', dialog).val(folder);

  buttons[rcmail.gettext('roundrive.save')] = function () {
    var folder = '', name = input.val(), parent = select.val();

    if (!name)
      return;

    if (parent)
      folder = parent + separator;

    folder += name;

    file_api.folder_rename(file_api.env.folder, folder);
    roundrive_dialog_close(this);
  };

  buttons[rcmail.gettext('roundrive.cancel')] = function () {
    roundrive_dialog_close(this);
  };

  // show dialog window
  roundrive_dialog_show(dialog, {
    title: rcmail.gettext('roundrive.folderedit'),
    buttons: buttons,
    button_classes: ['mainaction']
  });

  // Fix submitting form with Enter
  $('form', dialog).submit(roundrive_dialog_submit_handler);

  // build parent selector
  options.push($('<option>').val('').text('---'));
  $.each(file_api.env.folders, function(i, f) {
    var n, name = escapeHTML(f.name);

    for (n=0; n<f.depth; n++)
      name = '&nbsp;&nbsp;&nbsp;' + name;

    options.push($('<option>').val(i).html(name));
  });

  select.append(options).val(path);
};

// folder mounting dialog
function roundrive_folder_mount_dialog()
{
  var args = {buttons: {}, title: rcmail.gettext('roundrive.foldermount')},
    dialog = $('#files-folder-mount-dialog'),
    input = $('#folder-mount-name').val('');

  args.buttons[rcmail.gettext('roundrive.save')] = function () {
    var args = {}, folder = input.val(),
      driver = $('input[name="driver"]:checked', dialog).val();

    if (!folder || !driver)
      return;

    args.folder = folder;
    args.driver = driver;

    $('#source-' + driver + ' input').each(function() {
      if (this.name.startsWith(driver + '[')) {
        args[this.name.substring(driver.length + 1, this.name.length - 1)] = this.value;
      }
    });

    $('.auth-options input', dialog).each(function() {
      args[this.name] = this.type == 'checkbox' && !this.checked ? '' : this.value;
    });

    file_api.folder_mount(args);
    roundrive_dialog_close(this);
  };

  args.buttons[rcmail.gettext('roundrive.cancel')] = function () {
    roundrive_dialog_close(this);
  };

  // close folderoption menu
  rcmail.hide_menu('folderoptions');

  // initialize drivers list
  if (!rcmail.drivers_list_initialized) {
    rcmail.drivers_list_initialized = true;

    $('td.source', dialog).each(function() {
      $(this).click(function() {
        $('td.selected', dialog).removeClass('selected');
        dialog.find('.driverform').hide();
        $(this).addClass('selected').find('.driverform').show();
        $('input[type="radio"]', this).prop('checked', true);
     });
   });
  }

  args.button_classes = ['mainaction'];

  // show dialog window
  roundrive_dialog_show(dialog, args, function() {
    $('td.source:first', dialog).click();
    input.focus();
  });
};

// file edition dialog
function roundrive_file_edit_dialog(file)
{
  var dialog = $('#files-file-edit-dialog'),
    buttons = {}, name = file_api.file_name(file)
    input = $('input[name="name"]', dialog).val(name);

  buttons[rcmail.gettext('roundrive.save')] = function () {
    var folder = file_api.file_path(file), name = input.val();

    if (!name)
      return;

    name = folder + file_api.env.directory_separator + name;

    // @TODO: now we only update filename
    if (name != file)
      file_api.file_rename(file, name);
    roundrive_dialog_close(this);
  };
  buttons[rcmail.gettext('roundrive.cancel')] = function () {
    roundrive_dialog_close(this);
  };

  // Fix submitting form with Enter
  $('form', dialog).submit(roundrive_dialog_submit_handler);

  // show dialog window
  roundrive_dialog_show(dialog, {
    title: rcmail.gettext('roundrive.fileedit'),
    buttons: buttons,
    button_classes: ['mainaction']
  });
};

function roundrive_dialog_show(content, params, onopen)
{
  params = $.extend({
    modal: true,
    resizable: true,
    closeOnEscape: (!bw.ie6 && !bw.ie7),  // disabled for performance reasons
    minWidth: 400,
    minHeight: 300,
    width: 500,
    height: 400
  }, params || {});

  // dialog close handler
  params.close = function(e, ui) {
    var elem, stack = rcmail.dialog_stack;

    content.appendTo(document.body).hide();
    $(this).parent().remove(); // remove dialog

    // focus previously focused element (guessed)
    stack.pop();
    if (stack.length) {
      elem = stack[stack.length-1].find('input[type!="hidden"]:not(:hidden):first');
      if (!elem.length)
        elem = stack[stack.length-1].parent().find('a[role="button"], .ui-dialog-buttonpane button').first();
    }

    (elem && elem.length ? elem : window).focus();
  };

  // display it as popup
  var dialog = rcmail.show_popup_dialog('', params.title, params.buttons, params);

  content.appendTo(dialog).show().find('input[type!="hidden"]:not(:hidden):first').focus();

  if (onopen) onopen(content);

  // save dialog reference, to handle focus when closing one of opened dialogs
  if (!rcmail.dialog_stack)
    rcmail.dialog_stack = [];

  rcmail.dialog_stack.push(dialog);
};

// Handle form submit with Enter key, click first dialog button instead
function roundrive_dialog_submit_handler()
{
  $(this).parents('.ui-dialog').find('.ui-button').first().click();
  return false;
};

// Hides dialog
function roundrive_dialog_close(dialog)
{
  (rcmail.is_framed() ? window.parent : window).$(dialog).dialog('close');
};

// smart upload button
function roundrive_upload_input(button)
{
  var link = $(button),
    file = $('<input>'),
    offset = link.offset();

  function move_file_input(e) {
    file.css({top: (e.pageY - offset.top - 10) + 'px', left: (e.pageX - offset.left - 10) + 'px'});
  }

  file.attr({name: 'file[]', type: 'file', multiple: 'multiple', size: 5, title: link.attr('title'), tabindex: "-1"})
    .change(function() { rcmail.files_upload('#filesuploadform'); })
    .click(function() { setTimeout(function() { link.mouseleave(); }, 20); })
    // opacity:0 does the trick, display/visibility doesn't work
    .css({opacity: 0, cursor: 'pointer', outline: 'none', position: 'absolute'});

  // In FF and IE we need to move the browser file-input's button under the cursor
  // Thanks to the size attribute above we know the length of the input field
  if (bw.mz || bw.ie)
    file.css({marginLeft: '-80px'});

  // Note: now, I observe problem with cursor style on FF < 4 only
  // Need position: relative (Bug #2615)
  link.css({overflow: 'hidden', cursor: 'pointer', position: 'relative'})
    .mouseenter(function() { this.__active = true; })
    // place button under the cursor
    .mousemove(function(e) {
      if (rcmail.commands['files-upload'] && this.__active)
        move_file_input(e);
      // move the input away if button is disabled
      else
        $(this).mouseleave();
    })
    .mouseleave(function() {
      file.css({top: '-10000px', left: '-10000px'});
      this.__active = false;
    })
    .attr('onclick', '') // remove default button action
    .click(function(e) {
      // forward click if mouse-enter event was missed
      if (rcmail.commands['files-upload'] && !this.__active) {
        this.__active = true;
        move_file_input(e);
        file.trigger(e);
      }
    })
    .mouseleave() // initially disable/hide input
    .append(file);
};


/***********************************************************/
/**********          Main functionality           **********/
/***********************************************************/

// for reordering column array (Konqueror workaround)
// and for setting some message list global variables
roundrive_list_coltypes = function()
{
  var n, list = rcmail.file_list;

  rcmail.env.subject_col = null;

  if ((n = $.inArray('name', rcmail.env.coltypes)) >= 0) {
    rcmail.env.subject_col = n;
    list.subject_col = n;
  }

  list.init_header();
};

roundrive_set_list_options = function(cols, sort_col, sort_order)
{
  var update = 0, i, idx, name, newcols = [], oldcols = rcmail.env.coltypes;

  if (sort_col === undefined)
    sort_col = rcmail.env.sort_col;
  if (!sort_order)
    sort_order = rcmail.env.sort_order;

  if (rcmail.env.sort_col != sort_col || rcmail.env.sort_order != sort_order) {
    update = 1;
    rcmail.set_list_sorting(sort_col, sort_order);
  }

  if (cols && cols.length) {
    // make sure new columns are added at the end of the list
    for (i=0; i<oldcols.length; i++) {
      name = oldcols[i];
      idx = $.inArray(name, cols);
      if (idx != -1) {
        newcols.push(name);
        delete cols[idx];
      }
    }
    for (i=0; i<cols.length; i++)
      if (cols[i])
        newcols.push(cols[i]);

    if (newcols.join() != oldcols.join()) {
      update += 2;
      oldcols = newcols;
    }
  }

  if (update == 1)
    rcmail.command('files-list', {sort: sort_col, reverse: sort_order == 'DESC'});
  else if (update) {
    rcmail.http_post('files/prefs', {
      roundrive_list_cols: oldcols,
      roundrive_sort_col: sort_col,
      roundrive_sort_order: sort_order
      }, rcmail.set_busy(true, 'loading'));
  }
};

roundrive_set_coltypes = function(list)
{
  var i, found, name, cols = list.list.tHead.rows[0].cells;

  rcmail.env.coltypes = [];

  for (i=0; i<cols.length; i++)
    if (cols[i].id && cols[i].id.match(/^rcm/)) {
      name = cols[i].id.replace(/^rcm/, '');
      rcmail.env.coltypes.push(name);
    }

//  if ((found = $.inArray('name', rcmail.env.coltypes)) >= 0)
//    rcmail.env.subject_col = found;
  rcmail.env.subject_col = list.subject_col;

  rcmail.http_post('files/prefs', {roundrive_list_cols: rcmail.env.coltypes});
};

roundrive_list_dblclick = function(list)
{
  rcmail.command('files-open');
};

roundrive_list_select = function(list)
{
  var selected = list.selection.length;

  rcmail.enable_command(rcmail.env.file_commands_all, selected);
  rcmail.enable_command(rcmail.env.file_commands, selected == 1);

    // reset all-pages-selection
//  if (list.selection.length && list.selection.length != list.rowcount)
//    rcmail.select_all_mode = false;

  // enable files-
  if (selected == 1) {
    // get file mimetype
    var type = $('tr.selected', list.list).data('type');
    rcmail.env.viewer = file_api.file_type_supported(type);
  }
  else
    rcmail.env.viewer = 0;
/*
    ) {
//      caps = this.browser_capabilities().join();
      href = '?' + $.param({_task: 'roundrive', _action: 'open', file: file, viewer: viewer == 2 ? 1 : 0});
      var win = window.open(href, rcmail.html_identifier('rcubefile'+file));
      if (win)
        setTimeout(function() { win.focus(); }, 10);
    }
*/
  rcmail.enable_command('files-open', rcmail.env.viewer);
};

roundrive_list_keypress = function(list)
{
  if (list.modkey == CONTROL_KEY)
    return;

  if (list.key_pressed == list.ENTER_KEY)
    rcmail.command('files-open');
  else if (list.key_pressed == list.DELETE_KEY || list.key_pressed == list.BACKSPACE_KEY)
    rcmail.command('files-delete');
};

roundrive_drag_end = function(e)
{
  var folder = $('#files-folder-list li.droptarget').removeClass('droptarget');

  if (folder.length) {
    folder = folder.data('folder');

    var modkey = rcube_event.get_modifier(e),
      menu = rcmail.gui_objects.file_dragmenu;

    if (menu && modkey == SHIFT_KEY && rcmail.commands['files-copy']) {
      var pos = rcube_event.get_mouse_pos(e);
      rcmail.env.drag_target = folder;
      $(menu).css({top: (pos.y-10)+'px', left: (pos.x-10)+'px'}).show();
      return;
    }

    rcmail.command('files-move', folder);
  }
};

roundrive_drag_menu_action = function(command)
{
  var menu = rcmail.gui_objects.file_dragmenu;

  if (menu)
    $(menu).hide();

  rcmail.command(command, rcmail.env.drag_target);
};

roundrive_selected = function()
{
  var files = [];
  $.each(rcmail.file_list.get_selection(), function(i, v) {
    var name, row = $('#rcmrow'+v);

    if (row.length == 1 && (name = row.data('file')))
      files.push(name);
  });

  return files;
};

roundrive_frame_load = function(frame)
{
  var win = frame.contentWindow;

  rcmail.file_editor = win.file_editor && win.file_editor.editable ? win.file_editor : null;

  if (rcmail.file_editor)
    rcmail.enable_command('files-edit', true);

  rcmail.enable_command('files-print', (rcmail.file_editor && rcmail.file_editor.printable) ||
    (rcmail.env.file_data && /^image\//i.test(rcmail.env.file_data.type)));

  // detect Print button and check if it can be accessed
  try {
    if ($('#fileframe').contents().find('#print').length)
      rcmail.enable_command('files-print', true);
  }
  catch(e) {};
};

// activate html5 file drop feature (if browser supports it)
roundrive_drag_drop_init = function(container)
{
  if (!window.FormData && !(window.XMLHttpRequest && XMLHttpRequest.prototype && XMLHttpRequest.prototype.sendAsBinary)) {
    return;
  }

  if (!container.length)
    return;

  $(document.body).bind('dragover dragleave drop', function(e) {
    if (!file_api.env.folder)
      return;

    e.preventDefault();
    container[e.type == 'dragover' ? 'addClass' : 'removeClass']('active');
  });

  container.bind('dragover dragleave', function(e) {
    return roundrive_drag_hover(e);
  })
  container.children('div').bind('dragover dragleave', function(e) {
    return roundrive_drag_hover(e);
  })
  container.get(0).addEventListener('drop', function(e) {
      // abort event and reset UI
      roundrive_drag_hover(e);
      return file_api.file_drop(e);
    }, false);
};

// handler for drag/drop on element
roundrive_drag_hover = function(e)
{
  if (!file_api.env.folder)
    return;

  e.preventDefault();
  e.stopPropagation();

  var elem = $(e.target);

  if (!elem.hasClass('droptarget'))
    elem = elem.parents('.droptarget');

  elem[e.type == 'dragover' ? 'addClass' : 'removeClass']('hover');
};

// returns localized file size
roundrive_file_size = function(size)
{
  var i, units = ['GB', 'MB', 'KB', 'B'];

  size = file_api.file_size(size);

  for (i = 0; i < units.length; i++)
    if (size.toUpperCase().indexOf(units[i]) > 0)
      return size.replace(units[i], rcmail.gettext(units[i]));

  return size;
};

roundrive_progress_str = function(param)
{
  var current, total = file_api.file_size(param.total).toUpperCase();

  if (total.indexOf('GB') > 0)
    current = parseFloat(param.current/1073741824).toFixed(1);
  else if (total.indexOf('MB') > 0)
    current = parseFloat(param.current/1048576).toFixed(1);
  else if (total.indexOf('KB') > 0)
    current = parseInt(param.current/1024);
  else
    current = param.current;

  total = roundrive_file_size(param.total);

  return rcmail.gettext('uploadprogress')
    .replace(/\$percent/, param.percent + '%')
    .replace(/\$current/, current)
    .replace(/\$total/, total);
};


/***********************************************************/
/**********              Commands                 **********/
/***********************************************************/

rcube_webmail.prototype.files_sort = function(props)
{
  var params = {},
    sort_order = this.env.sort_order,
    sort_col = !this.env.disabled_sort_col ? props : this.env.sort_col;

  if (!this.env.disabled_sort_order)
    sort_order = this.env.sort_col == sort_col && sort_order == 'ASC' ? 'DESC' : 'ASC';

  // set table header and update env
  this.set_list_sorting(sort_col, sort_order);

  this.http_post('files/prefs', {roundrive_sort_col: sort_col, roundrive_sort_order: sort_order});

  params.sort = sort_col;
  params.reverse = sort_order == 'DESC';

  this.command('files-list', params);
};

rcube_webmail.prototype.files_search = function()
{
  var value = $(this.gui_objects.filesearchbox).val();

  if (value)
    file_api.file_search(value, $('#search_all_folders').is(':checked'));
  else
    file_api.file_search_reset();
};

rcube_webmail.prototype.files_search_reset = function()
{
  $(this.gui_objects.filesearchbox).val('');

  file_api.file_search_reset();
};

rcube_webmail.prototype.files_folder_delete = function()
{
  if (confirm(this.get_label('roundrive.folderdeleteconfirm')))
    file_api.folder_delete(file_api.env.folder);
};

rcube_webmail.prototype.files_delete = function()
{
  if (!confirm(this.get_label('roundrive.filedeleteconfirm')))
    return;

  var files = this.env.file ? [this.env.file] : roundrive_selected();
  file_api.file_delete(files);
};

rcube_webmail.prototype.files_move = function(folder)
{
  var files = roundrive_selected();
  file_api.file_move(files, folder);
};

rcube_webmail.prototype.files_copy = function(folder)
{
  var files = roundrive_selected();
  file_api.file_copy(files, folder);
};

rcube_webmail.prototype.files_upload = function(form)
{
  if (form)
    file_api.file_upload(form);
};

rcube_webmail.prototype.files_list = function(param)
{
  // just rcmail wrapper, to handle command busy states
  file_api.file_list(param);
}

rcube_webmail.prototype.files_list_update = function(head)
{
  var list = this.file_list;

  list.clear();
  $('thead', list.fixed_header ? list.fixed_header : list.list).html(head);
  roundrive_list_coltypes();
  file_api.file_list();
};

rcube_webmail.prototype.files_get = function()
{
  var files = this.env.file ? [this.env.file] : roundrive_selected();

  if (files.length == 1)
    file_api.file_get(files[0], {'force-download': true});
};

rcube_webmail.prototype.files_open = function()
{
  var files = roundrive_selected();

  if (files.length == 1)
    file_api.file_open(files[0], rcmail.env.viewer);
};

// enable file editor
rcube_webmail.prototype.files_edit = function()
{
  if (this.file_editor) {
    this.file_editor.enable();
    this.enable_command('files-save', true);
  }
};

rcube_webmail.prototype.files_save = function()
{
  if (!this.file_editor)
    return;

  // binary files like ODF need to be updated using FormData
  if (this.file_editor.getContentCallback) {
    if (!file_api.file_uploader_support())
      return;

    file_api.req = file_api.set_busy(true, 'saving');
//    this.file_editor.disable();
    this.file_editor.getContentCallback(function(content, filename) {
      file_api.file_uploader([content], {
        action: 'file_update',
        params: {file: rcmail.env.file, info: 1, token: file_api.env.token},
        response_handler: 'file_save_response',
        fieldname: 'content',
        single: true
      });
    });

    return;
  }

  var content = this.file_editor.getContent();

  file_api.file_save(this.env.file, content);
};

rcube_webmail.prototype.files_print = function()
{
  if (this.file_editor && this.file_editor.printable)
    this.file_editor.print();
  else if (/^image\//i.test(this.env.file_data.type)) {
    var frame = $('#fileframe').get(0),
      win = frame ? frame.contentWindow : null;

    if (win) {
      win.focus();
      win.print();
    }
  }
  else {
    // e.g. Print button in PDF viewer
    try {
      $('#fileframe').contents().find('#print').click();
    }
    catch(e) {};
  }
};

rcube_webmail.prototype.files_set_quota = function(p)
{
  if (p.total && window.file_api) {
    p.used *= 1024;
    p.total *= 1024;
    p.title = file_api.file_size(p.used) + ' / ' + file_api.file_size(p.total)
        + ' (' + p.percent + '%)';
  }

  p.type = this.env.quota_type;

  this.set_quota(p);
};

rcube_webmail.prototype.folder_create = function()
{
  roundrive_folder_create_dialog();
};

rcube_webmail.prototype.folder_rename = function()
{
  roundrive_folder_edit_dialog();
};

rcube_webmail.prototype.folder_mount = function()
{
  roundrive_folder_mount_dialog();
};


/**********************************************************/
/*********          Files API handler            **********/
/**********************************************************/

function roundrive_ui()
{
  this.requests = {};
  this.uploads = [];

/*
  // Called on "session expired" session
  this.logout = function(response) {};

  // called when a request timed out
  this.request_timed_out = function() {};

  // called on start of the request
  this.set_request_time = function() {};

  // called on request response
  this.update_request_time = function() {};
*/
  // set state
  this.set_busy = function(a, message)
  {
    if (this.req)
      rcmail.hide_message(this.req);

    return rcmail.set_busy(a, message);
  };

  // displays error message
  this.display_message = function(label, type)
  {
    return rcmail.display_message(this.t(label), type);
  };

  this.http_error = function(request, status, err)
  {
    rcmail.http_error(request, status, err);
  };

  // folders list request
  this.folder_list = function()
  {
    this.req = this.set_busy(true, 'loading');
    this.request('folder_list', {}, 'folder_list_response');
  };

  // folder list response handler
  this.folder_list_response = function(response)
  {
    if (!this.response(response))
      return;

    var first, elem = $('#files-folder-list'),
      list = $('<ul class="listing"></ul>'),
      collections = !rcmail.env.action.match(/^(preview|show)$/) ? ['audio', 'video', 'image', 'document'] : [];

    // try parent window if the list element does not exist
    // i.e. called from dialog in parent window
    if (!elem.length && window.parent && parent.rcmail) {
      elem = $('#files-folder-list', window.parent.document.body);
    }

    elem.html('').append(list);

    this.env.folders = this.folder_list_parse(response.result && response.result.list ? response.result.list : response.result);

    $.each(this.env.folders, function(i, f) {
      list.append(file_api.folder_list_row(i, f));
      if (!first)
        first = i;
    });

    // add virtual collections
    $.each(collections, function(i, n) {
      var row = $('<li class="mailbox collection ' + n + '"></li>');

      row.attr({id: 'folder-collection-' + n, tabindex: 0})
        .append($('<span class="name"></span>').text(rcmail.gettext('roundrive.collection_' + n)))
        .click(function() { file_api.folder_select(n, true); });

      list.append(row);
    });

    // select first folder?
    if (this.env.folder)
      this.folder_select(this.env.folder);
    else if (this.env.collection)
      this.folder_select(this.env.collection, true);
    else if (first)
      this.folder_select(first);

    // add tree icons
    this.folder_list_tree(this.env.folders);

    // handle authentication errors on external sources
    this.folder_list_auth_errors(response.result);
  };

  this.folder_select = function(folder, is_collection)
  {
    if (rcmail.busy)
      return;

    var list = $('#files-folder-list > ul');

    // try parent window if the list element does not exist
    // i.e. called from dialog in parent window
    if (!list.length && window.parent && parent.rcmail) {
      list = $('#files-folder-list > ul', window.parent.document.body);
    }

    $('li.selected', list).removeClass('selected');

    rcmail.enable_command('files-list', true);

    if (is_collection) {
      var found = $('#folder-collection-' + folder, list).addClass('selected');

      rcmail.enable_command('files-folder-delete', 'folder-rename', 'files-upload', false);
      this.env.folder = null;
      rcmail.command('files-list', {collection: folder});
    }
    else {
      var found = $('#' + this.env.folders[folder].id, list).addClass('selected');

      rcmail.enable_command('files-folder-delete', 'folder-rename', 'files-upload', true);
      this.env.folder = folder;
      this.env.collection = null;
      rcmail.command('files-list', {folder: folder});
    }

    this.quota();
  };

  this.folder_unselect = function()
  {
    var list = $('#files-folder-list > ul');
    $('li.selected', list).removeClass('selected');
    rcmail.enable_command('files-folder-delete', 'files-upload', false);
    this.env.folder = null;
    this.env.collection = null;
  };

  this.folder_list_row = function(i, folder)
  {
    var row = $('<li class="mailbox"><span class="branch"></span></li>');

    row.attr('id', folder.id).data('folder', i)
      .append($('<span class="name"></span>').text(folder.name));

    if (folder.depth) {
      $('span.branch', row).width(15 * folder.depth);
      row.addClass('child');
    }

    if (folder.virtual)
      row.addClass('virtual');
    else
      row.attr('tabindex', 0)
        .keypress(function(e) { if (e.which == 13 || e.which == 32) file_api.folder_select(i); })
        .click(function() { file_api.folder_select(i); })
        .mouseenter(function() {
          if (rcmail.file_list && rcmail.file_list.drag_active && !$(this).hasClass('selected'))
            $(this).addClass('droptarget');
        })
        .mouseleave(function() {
          if (rcmail.file_list && rcmail.file_list.drag_active)
            $(this).removeClass('droptarget');
        });

    return row;
  };

  // folder create request
  this.folder_create = function(folder)
  {
    this.req = this.set_busy(true, 'roundrive.foldercreating');
    this.request('folder_create', {folder: folder}, 'folder_create_response');
  };

  // folder create response handler
  this.folder_create_response = function(response)
  {
    if (!this.response(response))
      return;

    this.display_message('roundrive.foldercreatenotice', 'confirmation');

    // refresh folders list
    this.folder_list();
  };

  // folder rename request
  this.folder_rename = function(folder, new_name)
  {
    if (folder == new_name)
      return;

    this.env.folder_rename = new_name;
    this.req = this.set_busy(true, 'roundrive.folderupdating');
    this.request('folder_move', {folder: folder, 'new': new_name}, 'folder_rename_response');
  };

  // folder create response handler
  this.folder_rename_response = function(response)
  {
    if (!this.response(response))
      return;

    this.display_message('roundrive.folderupdatenotice', 'confirmation');

    // refresh folders and files list
    this.env.folder = this.env.folder_rename;
    this.folder_list();
  };

  // folder mount (external storage) request
  this.folder_mount = function(data)
  {
    this.req = this.set_busy(true, 'roundrive.foldermounting');
    this.request('folder_create', data, 'folder_mount_response');
  };

  // folder create response handler
  this.folder_mount_response = function(response)
  {
    if (!this.response(response))
      return;

    this.display_message('roundrive.foldermountnotice', 'confirmation');

    // refresh folders list
    this.folder_list();
  };

  // folder delete request
  this.folder_delete = function(folder)
  {
    this.req = this.set_busy(true, 'roundrive.folderdeleting');
    this.request('folder_delete', {folder: folder}, 'folder_delete_response');
  };

  // folder delete response handler
  this.folder_delete_response = function(response)
  {
    if (!this.response(response))
      return;

    this.env.folder = null;
    rcmail.enable_command('files-folder-delete', 'folder-rename', 'files-list', false);
    this.display_message('roundrive.folderdeletenotice', 'confirmation');

    // refresh folders list
    this.folder_list();
    this.quota();
  };

  // quota request
  this.quota = function()
  {
    if (rcmail.env.files_quota)
      this.request('quota', {folder: this.env.folder}, 'quota_response');
  };

  // quota response handler
  this.quota_response = function(response)
  {
    if (!this.response(response))
      return;

    rcmail.files_set_quota(response.result);
  };

  this.file_list = function(params)
  {
    if (!rcmail.gui_objects.filelist)
      return;

    if (!params)
      params = {};

    // reset all pending list requests
    for (i in this.requests) {
      this.requests[i].abort();
      rcmail.hide_message(i);
      delete this.requests[i];
    }

    if (params.all_folders) {
      params.collection = null;
      params.folder = null;
      this.folder_unselect();
    }

    if (params.collection == undefined)
      params.collection = this.env.collection;
    if (params.folder == undefined)
      params.folder = this.env.folder;
    if (params.sort == undefined)
      params.sort = this.env.sort_col;
    if (params.reverse == undefined)
      params.reverse = this.env.sort_reverse;
    if (params.search == undefined)
      params.search = this.env.search;

    this.env.folder = params.folder;
    this.env.collection = params.collection;
    this.env.sort_col = params.sort;
    this.env.sort_reverse = params.reverse;

    rcmail.enable_command(rcmail.env.file_commands, false);
    rcmail.enable_command(rcmail.env.file_commands_all, false);

    // empty the list
    this.env.file_list = [];
    rcmail.file_list.clear(true);

    // request
    if (params.collection || params.all_folders)
      this.file_list_loop(params);
    else if (this.env.folder) {
      params.req_id = this.set_busy(true, 'loading');
      this.requests[params.req_id] = this.request('file_list', params, 'file_list_response');
    }
  };

  // file list response handler
  this.file_list_response = function(response)
  {
    if (response.req_id)
      rcmail.hide_message(response.req_id);

    if (!this.response(response))
      return;

    var i = 0, list = [], table = $('#filelist');

    $.each(response.result, function(key, data) {
      var row = file_api.file_list_row(key, data, ++i);
      rcmail.file_list.insert_row(row);
      data.row = row;
      data.filename = key;
      list.push(data);
    });

    this.env.file_list = list;
    rcmail.file_list.resize();
  };

  // call file_list request for every folder (used for search and virt. collections)
  this.file_list_loop = function(params)
  {
    var i, folders = [], limit = Math.max(this.env.search_threads || 1, 1);

    if (params.collection) {
      if (!params.search)
        params.search = {};
      params.search['class'] = params.collection;
      delete params['collection'];
    }

    delete params['all_folders'];

    $.each(this.env.folders, function(i, f) {
      if (!f.virtual)
        folders.push(i);
    });

    this.env.folders_loop = folders;
    this.env.folders_loop_params = params;
    this.env.folders_loop_lock = false;

    for (i=0; i<folders.length && i<limit; i++) {
      params.req_id = this.set_busy(true, 'loading');
      params.folder = folders.shift();
      this.requests[params.req_id] = this.request('file_list', params, 'file_list_loop_response');
    }
  };

  // file list response handler for loop'ed request
  this.file_list_loop_response = function(response)
  {
    var i, folders = this.env.folders_loop,
      params = this.env.folders_loop_params,
      limit = Math.max(this.env.search_threads || 1, 1),
      valid = this.response(response);

    if (response.req_id)
      rcmail.hide_message(response.req_id);

    for (i=0; i<folders.length && i<limit; i++) {
      params.req_id = this.set_busy(true, 'loading');
      params.folder = folders.shift();
      this.requests[params.req_id] = this.request('file_list', params, 'file_list_loop_response');
    }

    rcmail.file_list.resize();

    if (!valid)
      return;

    this.file_list_loop_result_add(response.result);
  };

  // add files from list request to the table (with sorting)
  this.file_list_loop_result_add = function(result)
  {
    // chack if result (hash-array) is empty
    if (!object_is_empty(result))
      return;

    if (this.env.folders_loop_lock) {
      setTimeout(function() { file_api.file_list_loop_result_add(result); }, 100);
      return;
    }

    // lock table, other list responses will wait
    this.env.folders_loop_lock = true;

    var n, i, len, elem, list = [], rows = [],
      index = this.env.file_list.length,
      table = rcmail.file_list;

    for (n=0, len=index; n<len; n++) {
      elem = this.env.file_list[n];
      for (i in result) {
        if (this.sort_compare(elem, result[i]) < 0)
          break;

        var row = this.file_list_row(i, result[i], ++index);
        table.insert_row(row, elem.row);
        result[i].row = row;
        result[i].filename = i;
        list.push(result[i]);
        delete result[i];
      }

      list.push(elem);
    }

    // add the rest of rows
    $.each(result, function(key, data) {
      var row = file_api.file_list_row(key, data, ++index);
      table.insert_row(row);
      result[key].row = row;
      result[key].filename = key;
      list.push(result[key]);
    });

    this.env.file_list = list;
    this.env.folders_loop_lock = false;
  };

  // sort files list (without API request)
  this.file_list_sort = function(col, reverse)
  {
    var n, len, list = this.env.file_list,
      table = $('#filelist'), tbody = $('<tbody>');

    this.env.sort_col = col;
    this.env.sort_reverse = reverse;

    if (!list || !list.length)
      return;

    // sort the list
    list.sort(function (a, b) {
      return file_api.sort_compare(a, b);
    });

    // add rows to the new body
    for (n=0, len=list.length; n<len; n++) {
      tbody.append(list[n].row);
    }

    // replace table bodies
    $('tbody', table).replaceWith(tbody);
  };

  this.file_list_row = function(file, data, index)
  {
    var c, col, row = '';

    for (c in rcmail.env.coltypes) {
      c = rcmail.env.coltypes[c];
      if (c == 'name')
        col = '<td class="name filename ' + this.file_type_class(data.type) + '">'
          + '<span>' + escapeHTML(data.name) + '</span></td>';
      else if (c == 'mtime')
        col = '<td class="mtime">' + data.mtime + '</td>';
      else if (c == 'size')
        col = '<td class="size">' + this.file_size(data.size) + '</td>';
      else if (c == 'options')
        col = '<td class="options"><span></span></td>';
      else
        col = '<td class="' + c + '"></td>';

      row += col;
    }

    row = $('<tr>')
      .html(row)
      .attr({id: 'rcmrow' + index, 'data-file': file, 'data-type': data.type});

    $('td.options > span', row).click(function(e) {
      roundrive_file_edit_dialog(file);
    });

    // collection (or search) lists files from all folders
    // display file name with full path as title
    if (!this.env.folder)
      $('td.name span', row).attr('title', file);

    return row.get(0);
  };

  this.file_search = function(value, all_folders)
  {
    if (value) {
      this.env.search = {name: value};
      rcmail.command('files-list', {search: this.env.search, all_folders: all_folders});
    }
    else
      this.search_reset();
  };

  this.file_search_reset = function()
  {
    if (this.env.search) {
      this.env.search = null;
      rcmail.command('files-list');
    }
  };

  this.file_get = function(file, params)
  {
    if (!params)
      params = {};

    rcmail.redirect(rcmail.url('roundrive/file_api') + "&method=file_get&file=" + file);
  };

  // file(s) delete request
  this.file_delete = function(files)
  {
    this.req = this.set_busy(true, 'roundrive.filedeleting');
    this.request('file_delete', {file: files}, 'file_delete_response');
  };

  // file(s) delete response handler
  this.file_delete_response = function(response)
  {
    if (!this.response(response))
      return;

    var rco, dir, self = this;

    this.display_message('roundrive.filedeletenotice', 'confirmation');

    if (rcmail.env.file) {
      rco = rcmail.opener();
      dir = this.file_path(rcmail.env.file);

      // check if opener window contains files list, if not we can just close current window
      if (rco && rco.file_list && (opener.file_api.env.folder == dir || !opener.file_api.env.folder))
        self = opener.file_api;
      else
        window.close();
    }

    // @TODO: consider list modification "in-place" instead of full reload
    self.file_list();
    self.quota();

    if (rcmail.env.file)
      window.close();
  };

  // file(s) move request
  this.file_move = function(files, folder)
  {
    if (!files || !files.length || !folder)
      return;

    var count = 0, list = {};

    $.each(files, function(i, v) {
      var name = folder + file_api.env.directory_separator + file_api.file_name(v);

      if (name != v) {
        list[v] = name;
        count++;
      }
    });

    if (!count)
      return;

    this.req = this.set_busy(true, 'roundrive.filemoving');
    this.request('file_move', {file: list}, 'file_move_response');
  };

  // file(s) move response handler
  this.file_move_response = function(response)
  {
    if (!this.response(response))
      return;

    if (response.result && response.result.already_exist && response.result.already_exist.length)
      this.file_move_ask_user(response.result.already_exist, true);
    else {
      this.display_message('roundrive.filemovenotice', 'confirmation');
      this.file_list();
    }
  };

  // file(s) copy request
  this.file_copy = function(files, folder)
  {
    if (!files || !files.length || !folder)
      return;

    var count = 0, list = {};

    $.each(files, function(i, v) {
      var name = folder + file_api.env.directory_separator + file_api.file_name(v);

      if (name != v) {
        list[v] = name;
        count++;
      }
    });

    if (!count)
      return;

    this.req = this.set_busy(true, 'roundrive.filecopying');
    this.request('file_copy', {file: list}, 'file_copy_response');
  };

  // file(s) copy response handler
  this.file_copy_response = function(response)
  {
    if (!this.response(response))
      return;

    if (response.result && response.result.already_exist && response.result.already_exist.length)
      this.file_move_ask_user(response.result.already_exist);
    else {
      this.display_message('roundrive.filecopynotice', 'confirmation');
      this.quota();
    }
  };

  // when file move/copy operation returns file-exists error
  // this displays a dialog where user can decide to skip
  // or overwrite destination file(s)
  this.file_move_ask_user = function(list, move)
  {
    var file = list[0], buttons = {},
      text = rcmail.gettext('roundrive.filemoveconfirm').replace('$file', file.dst)
      dialog = $('<div></div>');

    buttons[rcmail.gettext('roundrive.fileoverwrite')] = function() {
      var file = list.shift(), f = {},
        action = move ? 'file_move' : 'file_copy';

      f[file.src] = file.dst;
      file_api.file_move_ask_list = list;
      file_api.file_move_ask_mode = move;
      dialog.dialog('destroy').remove();
      file_api.req = file_api.set_busy(true, move ? 'roundrive.filemoving' : 'roundrive.filecopying');
      file_api.request(action, {file: f, overwrite: 1}, 'file_move_ask_user_response');
    };

    if (list.length > 1)
      buttons[rcmail.gettext('roundrive.fileoverwriteall')] = function() {
        var f = {}, action = move ? 'file_move' : 'file_copy';

        $.each(list, function() { f[this.src] = this.dst; });
        dialog.dialog('destroy').remove();
        file_api.req = file_api.set_busy(true, move ? 'roundrive.filemoving' : 'roundrive.filecopying');
        file_api.request(action, {file: f, overwrite: 1}, action + '_response');
      };

    var skip_func = function() {
      list.shift();
      dialog.dialog('destroy').remove();

      if (list.length)
        file_api.file_move_ask_user(list, move);
      else if (move)
        file_api.file_list();
    };

    buttons[rcmail.gettext('roundrive.fileskip')] = skip_func;

    if (list.length > 1)
      buttons[rcmail.gettext('roundrive.fileskipall')] = function() {
      dialog.dialog('destroy').remove();
        if (move)
          file_api.file_list();
      };

    // open jquery UI dialog
    roundrive_dialog_show(dialog.html(text), {
      close: skip_func,
      buttons: buttons,
      minWidth: 400,
      width: 400
    });
  };

  // file move (with overwrite) response handler
  this.file_move_ask_user_response = function(response)
  {
    var move = this.file_move_ask_mode, list = this.file_move_ask_list;

    this.response(response);

    if (list && list.length)
      this.file_move_ask_user(list, mode);
    else {
      this.display_message('roundrive.file' + (move ? 'move' : 'copy') + 'notice', 'confirmation');
      if (move)
        this.file_list();
    }
  };

  // file(s) rename request
  this.file_rename = function(oldfile, newfile)
  {
    this.req = this.set_busy(true, 'roundrive.fileupdating');
    this.request('file_move', {file: oldfile, 'new': newfile}, 'file_rename_response');
  };

  // file(s) move response handler
  this.file_rename_response = function(response)
  {
    if (!this.response(response))
      return;

    // @TODO: we could update metadata instead
    this.file_list();
  };

  // file upload request
  this.file_upload = function(form)
  {
    var form = $(form),
      field = $('input[type=file]', form).get(0),
      files = field.files ? field.files.length : field.value ? 1 : 0;

    if (!files || !this.file_upload_size_check(field.files))
      return;

    // submit form and read server response
    this.file_upload_form(form, 'file_upload', function(event) {
      var doc, response;
      try {
        doc = this.contentDocument ? this.contentDocument : this.contentWindow.document;
        response = doc.body.innerHTML;
        // response may be wrapped in <pre> tag
        if (response.slice(0, 5).toLowerCase() == '<pre>' && response.slice(-6).toLowerCase() == '</pre>') {
          response = doc.body.firstChild.firstChild.nodeValue;
        }
        response = eval('(' + response + ')');
      }
      catch (err) {
        response = {status: 'ERROR'};
      }

      file_api.file_upload_progress_stop(event.data.ts);

      // refresh the list on upload success
      file_api.file_upload_response(response);
    });
  };

  // refresh the list on upload success
  this.file_upload_response = function(response)
  {
    if (this.response_parse(response)) {
       this.file_list();
       this.quota();
    }
  };

  // check upload max size
  this.file_upload_size_check = function(files)
  {
    var i, size = 0, maxsize = rcmail.env.files_max_upload;

    if (maxsize && files) {
      for (i=0; i < files.length; i++)
        size += files[i].size || files[i].fileSize;

      if (size > maxsize) {
        alert(rcmail.get_label('roundrive.uploadsizeerror').replace('$size', roundrive_file_size(maxsize)));
        return false;
      }
    }

    return true;
  };

  // post the given form to a hidden iframe
  this.file_upload_form = function(form, action, onload)
  {
    var ts = new Date().getTime(),
      frame_name = 'fileupload' + ts;

    // upload progress support
    if (rcmail.env.files_progress_name) {
      var fname = rcmail.env.files_progress_name,
        field = $('input[name='+fname+']', form);

      if (!field.length) {
        field = $('<input>').attr({type: 'hidden', name: fname});
        field.prependTo(form);
      }

      field.val(ts);
      this.file_upload_progress(ts, true);
    }

    rcmail.display_progress({name: ts});

    // have to do it this way for IE
    // otherwise the form will be posted to a new window
    if (document.all) {
      var html = '<iframe id="'+frame_name+'" name="'+frame_name+'"'
        + ' src="' + rcmail.assets_path('program/resources/blank.gif') + '"'
        + ' style="width:0;height:0;visibility:hidden;"></iframe>';
      document.body.insertAdjacentHTML('BeforeEnd', html);
    }
    // for standards-compliant browsers
    else
      $('<iframe>')
        .attr({name: frame_name, id: frame_name})
        .css({border: 'none', width: 0, height: 0, visibility: 'hidden'})
        .appendTo(document.body);

    // handle upload errors, parsing iframe content in onload
    $('#'+frame_name).on('load', {ts:ts}, onload);

    $(form).attr({
      target: frame_name,
      action: this.env.url + this.url(action, {folder: this.env.folder, token: this.env.token}),
      method: 'POST'
    }).attr(form.encoding ? 'encoding' : 'enctype', 'multipart/form-data')
      .submit();
  };

  // handler when files are dropped to a designated area.
  // compose a multipart form data and submit it to the server
  this.file_drop = function(e)
  {
    var files = e.target.files || e.dataTransfer.files;

    if (!files || !files.length || !this.file_upload_size_check(files))
      return;

    // prepare multipart form data composition
    var ts = new Date().getTime(),
      formdata = window.FormData ? new FormData() : null,
      fieldname = 'file[]',
      boundary = '------multipartformboundary' + (new Date).getTime(),
      dashdash = '--', crlf = '\r\n',
      multipart = dashdash + boundary + crlf;

    // inline function to submit the files to the server
    var submit_data = function() {
      var multiple = files.length > 1;

      rcmail.display_progress({name: ts});
      if (rcmail.env.files_progress_name)
        file_api.file_upload_progress(ts, true);

      // complete multipart content and post request
      multipart += dashdash + boundary + dashdash + crlf;

      $.ajax({
        type: 'POST',
        dataType: 'json',
        url: file_api.env.url + file_api.url('file_upload', {folder: file_api.env.folder}),
        contentType: formdata ? false : 'multipart/form-data; boundary=' + boundary,
        processData: false,
        timeout: 0, // disable default timeout set in ajaxSetup()
        data: formdata || multipart,
        headers: {'X-Session-Token': file_api.env.token},
        success: function(data) {
          file_api.file_upload_progress_stop(ts);
          file_api.file_upload_response(data);
        },
        error: function(o, status, err) {
          file_api.file_upload_progress_stop(ts);
          rcmail.http_error(o, status, err);
        },
        xhr: function() {
          var xhr = jQuery.ajaxSettings.xhr();
          if (!formdata && xhr.sendAsBinary)
            xhr.send = xhr.sendAsBinary;
          return xhr;
        }
      });
    };

    // upload progress supported (and handler exists)
    // add progress ID to the request - need to be added before files
    if (rcmail.env.files_progress_name) {
      if (formdata)
        formdata.append(rcmail.env.files_progress_name, ts);
      else
        multipart += 'Content-Disposition: form-data; name="' + rcmail.env.files_progress_name + '"'
          + crlf + crlf + ts + crlf + dashdash + boundary + crlf;
    }

    // get contents of all dropped files
    var f, j, i = 0, last = files.length - 1;
    for (j = 0; j <= last && (f = files[i]); i++) {
      if (!f.name) f.name = f.fileName;
      if (!f.size) f.size = f.fileSize;
      if (!f.type) f.type = 'application/octet-stream';

      // file name contains non-ASCII characters, do UTF8-binary string conversion.
      if (!formdata && /[^\x20-\x7E]/.test(f.name))
        f.name_bin = unescape(encodeURIComponent(f.name));

      // do it the easy way with FormData (FF 4+, Chrome 5+, Safari 5+)
      if (formdata) {
        formdata.append(fieldname, f);
        if (j == last)
          return submit_data();
      }
      // use FileReader supporetd by Firefox 3.6
      else if (window.FileReader) {
        var reader = new FileReader();

        // closure to pass file properties to async callback function
        reader.onload = (function(file, j) {
          return function(e) {
            multipart += 'Content-Disposition: form-data; name="' + fieldname + '"';
            multipart += '; filename="' + (f.name_bin || file.name) + '"' + crlf;
            multipart += 'Content-Length: ' + file.size + crlf;
            multipart += 'Content-Type: ' + file.type + crlf + crlf;
            multipart += reader.result + crlf;
            multipart += dashdash + boundary + crlf;

            if (j == last)  // we're done, submit the data
              return submit_data();
          }
        })(f,j);
        reader.readAsBinaryString(f);
      }

      j++;
    }
  };

  // upload progress requests
  this.file_upload_progress = function(id, init)
  {
    if (init && id)
      this.uploads[id] = this.env.folder;

    setTimeout(function() {
      if (id && file_api.uploads[id])
        file_api.request('upload_progress', {id: id}, 'file_upload_progress_response');
    }, rcmail.env.files_progress_time * 1000);
  };

  // upload progress response
  this.file_upload_progress_response = function(response)
  {
    if (!this.response(response))
      return;

    var param = response.result;

    if (!param.id || !this.uploads[param.id])
      return;

    if (param.total) {
      param.name = param.id;

      if (!param.done)
        param.text = roundrive_progress_str(param);

      rcmail.display_progress(param);
    }

    if (!param.done && param.total)
      this.file_upload_progress(param.id);
    else
      delete this.uploads[param.id];
  };

  this.file_upload_progress_stop = function(id)
  {
    if (id) {
      delete this.uploads[id];
      rcmail.display_progress({name: id});
    }
  };

  // open file in new window, using file API viewer
  this.file_open = function(file, viewer)
  {
    var href = '?' + $.param({_task: 'roundrive', _action: 'open', file: file, viewer: viewer == 2 ? 1 : 0});
    rcmail.open_window(href, false, true);
  };

  // save file
  this.file_save = function(file, content)
  {
    rcmail.enable_command('files-save', false);
    // because we currently can edit only text files
    // and we do not expect them to be very big, we save
    // file in a very simple way, no upload progress, etc.
    this.req = this.set_busy(true, 'saving');
    this.request('file_update', {file: file, content: content, info: 1}, 'file_save_response');
  };

  // file save response handler
  this.file_save_response = function(response)
  {
    rcmail.enable_command('files-save', true);

    if (!this.response(response))
      return;

    // update file properties table
    var table = $('#fileinfobox table'), file = response.result;

    if (file) {
      $('td.filetype', table).text(file.type);
      $('td.filesize', table).text(this.file_size(file.size));
      $('td.filemtime', table).text(file.mtime);
    }
  };

  // handle auth errors on folder list
  this.folder_list_auth_errors = function(result)
  {
    if (result && result.auth_errors) {
      if (!this.auth_errors)
        this.auth_errors = {};

      $.extend(this.auth_errors, result.auth_errors);
    }

    // ask for password to the first storage on the list
    $.each(this.auth_errors || [], function(i, v) {
      file_api.folder_list_auth_dialog(i, v);
      return false;
    });
  };

  // create dialog for user credentials of external storage
  this.folder_list_auth_dialog = function(label, driver)
  {
    var args = {width: 400, height: 300, buttons: {}},
      dialog = $('#files-folder-auth-dialog'),
      content = this.folder_list_auth_form(driver);

    dialog.find('table.propform').remove();
    $('.auth-options', dialog).before(content);

    args.buttons[this.t('roundrive.save')] = function() {
      var data = {folder: label, list: 1};

      $('input', dialog).each(function() {
        data[this.name] = this.type == 'checkbox' && !this.checked ? '' : this.value;
      });

      file_api.open_dialog = this;
      file_api.req = file_api.set_busy(true, 'roundrive.authenticating');
      file_api.request('folder_auth', data, 'folder_auth_response');
    };

    args.buttons[this.t('roundrive.cancel')] = function() {
      delete file_api.auth_errors[label];
      roundrive_dialog_close(this);
      // go to the next one
      file_api.folder_list_auth_errors();
    };

    args.title = this.t('roundrive.folderauthtitle').replace('$title', label);

    // show dialog window
    roundrive_dialog_show(dialog, args, function() {
      // focus first empty input
      $('input', dialog).each(function() {
        if (!this.value) {
          this.focus();
          return false;
        }
      });
    });
  };

  // folder_auth handler
  this.folder_auth_response = function(response)
  {
    if (!this.response(response))
      return;

    var cnt = 0, folders,
      folder = response.result.folder,
      parent = $('#' + this.env.folders[folder].id);

    // try parent window if the folder element does not exist
    if (!parent.length && window.parent && window.parent.rcmail) {
      parent = $('#' + this.env.folders[folder].id, window.parent.document.body);
    }

    delete this.auth_errors[folder];
    roundrive_dialog_close(this.open_dialog);

    // go to the next one
    this.folder_list_auth_errors();

    // count folders on the list
    $.each(this.env.folders, function() { cnt++; });

    // parse result
    folders = this.folder_list_parse(response.result.list, cnt);
    delete folders[folder]; // remove root added in folder_list_parse()

    // add folders from the external source to the list
    $.each(folders, function(i, f) {
      var row = file_api.folder_list_row(i, f);
      parent.after(row);
      parent = row;
    });

    // add tree icons
    this.folder_list_tree(folders);

    $.extend(this.env.folders, folders);
  };

  // returns content of the external storage authentication form
  this.folder_list_auth_form = function(driver)
  {
    var rows = [];

    $.each(driver.form, function(fi, fv) {
      var id = 'authinput' + fi,
        attrs = {type: fi.match(/pass/) ? 'password' : 'text', size: 25, name: fi, id: id},
        input = $('<input>').attr(attrs);

      if (driver.form_values && driver.form_values[fi])
        input.attr({value: driver.form_values[fi]});

      rows.push($('<tr>')
        .append($('<td class="title">').append($('<label>').attr('for', id).text(fv)))
        .append($('<td>').append(input))
      );
    });

    return $('<table class="propform">').append(rows);
  };
};
