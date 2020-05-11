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
  if (rcmail.task == 'roundpad') {
    if (rcmail.gui_objects.filelist) {
      rcmail.file_list = new rcube_list_widget(rcmail.gui_objects.filelist, {
        multiselect: true,
        draggable: true,
        keyboard: true,
        column_movable: rcmail.env.col_movable,
        dblclick_time: rcmail.dblclick_time
      });
/*
      rcmail.file_list.row_init = function(o){ roundpad_init_file_row(o); };
      rcmail.file_list.addEventListener('dblclick', function(o){ p.msglist_dbl_click(o); });
      rcmail.file_list.addEventListener('click', function(o){ p.msglist_click(o); });
      rcmail.file_list.addEventListener('keypress', function(o){ p.msglist_keypress(o); });
      rcmail.file_list.addEventListener('dragstart', function(o){ p.drag_start(o); });
      rcmail.file_list.addEventListener('dragmove', function(e){ p.drag_move(e); });
*/
      rcmail.file_list.addEventListener('dblclick', function(o) { roundpad_list_dblclick(o); })
        .addEventListener('select', function(o) { roundpad_list_select(o); })
        .addEventListener('keypress', function(o) { roundpad_list_keypress(o); })
        .addEventListener('dragend', function(e) { roundpad_drag_end(e); })
        .addEventListener('column_replace', function(e) { roundpad_set_coltypes(e); })
        .addEventListener('listupdate', function(e) { rcmail.triggerEvent('listupdate', e); });

      rcmail.enable_command('menu-open', 'menu-save', 'files-sort', 'files-search', 'files-search-reset', 'folder-create', 'file-create', 'files-help', true);

      rcmail.file_list.init();
      roundpad_list_coltypes();
    }

    // "one file only" commands
    rcmail.env.file_commands = ['files-get'];
    // "one or more file" commands
    rcmail.env.file_commands_all = ['files-delete', 'files-move', 'files-copy'];

    roundpad_init();

    if (rcmail.env.action == 'open') {
      rcmail.enable_command('files-get', 'files-delete', rcmail.env.file);
    }
    else {
      file_api.folder_list();
      file_api.browser_capabilities_check();
    }   
  }
});


/**********************************************************/
/*********          Shared functionality         **********/
/**********************************************************/

// Initializes API object
function roundpad_init()
{  
  if (window.file_api)
    return;

  // Initialize application object (don't change var name!)
  file_api = $.extend(new files_api(), new roundpad_ui());

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
function roundpad_directory_selector_dialog(id)
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

  buttons[rcmail.gettext('roundpad.save')] = function () {
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

    rcmail.http_post('plugin.roundpad', request, lock);
    roundpad_dialog_close(this);
  };

  buttons[rcmail.gettext('roundpad.cancel')] = function () {
    roundpad_dialog_close(this);
  };

  if (!rcmail.env.folders_loaded) {
    fn = function() {
      file_api.folder_list();
      rcmail.env.folders_loaded = true;
    };
  }

  // show dialog window
  roundpad_dialog_show(dialog, {
    title: rcmail.gettext('roundpad.' + label),
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
      win.roundpad_folder_create_dialog();
    };
  }
};

function roundpad_attach_menu_open(p)
{
  if (!p || !p.props || p.props.menu != 'attachmentmenu')
    return;

  var id = p.props.id;

  $('#attachmenusaveas').unbind('click').attr('onclick', '').click(function(e) {
    return roundpad_directory_selector_dialog(id);
  });
};

// Open compose to send file url
function roundpad_file_open_compose(url, data) {
  var type = rcmail.get_label('roundpad.'+data.type), 
    body = rcmail.get_label('roundpad.message_body').replace(/%%file_type%%/g, type).replace(/%%file_name%%/g, data.name).replace(/%%file_url%%/g, data.url),
    subject = rcmail.get_label('roundpad.message_subject').replace(/%%file_type%%/g, type).replace(/%%file_name%%/g, data.name).replace(/%%file_url%%/g, data.url);
  // Force external window
  rcmail.env.compose_extwin = 1;
  rcmail.command('compose', { subject: subject, body: body });
};

// Help dialog
function roundpad_help_dialog()
{
  var page = "/plugins/roundpad/Aide utilisateur.html";
  
  // Open the help dialog
  $('<div id="help_display_dialog"></div>').appendTo('body')
    .html('<iframe style="border: 0px; margin: 0px; " src="' + page + '" width="100%" height="100%"></iframe>')
    .dialog({
        modal: false, 
        zIndex: 10000, 
        width: 850,
        height: 600,
        resizable: true,
        title: rcmail.get_label('roundpad.help'),
        close: function (event, ui) {
            $(this).remove();
        }
    }).dialog('open');
};

// folder creation dialog
function roundpad_folder_create_dialog()
{
  var dialog = $('#files-folder-create-dialog'),
    buttons = {},
    select = $('select[name="parent"]', dialog).html(''),
    input = $('input[name="name"]', dialog).val('');

  buttons[rcmail.gettext('roundpad.create')] = function () {
    var folder = '', name = input.val(), parent = select.val();

    if (!name)
      return;

    if (parent)
      folder = parent + file_api.env.directory_separator;

    folder += name;

    file_api.folder_create(folder);
    roundpad_dialog_close(this);
  };

  buttons[rcmail.gettext('roundpad.cancel')] = function () {
    roundpad_dialog_close(this);
  };

  // show dialog window
  roundpad_dialog_show(dialog, {
    title: rcmail.gettext('roundpad.foldercreate'),
    buttons: buttons,
    button_classes: ['mainaction']
  });

  // Fix submitting form with Enter
  $('form', dialog).submit(roundpad_dialog_submit_handler);

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
function roundpad_folder_edit_dialog()
{
  var dialog = $('#files-folder-edit-dialog'),
    buttons = {}, options = [],
    separator = file_api.env.directory_separator,
    arr = file_api.env.folder.split(separator),
    folder = arr.pop(),
    path = arr.join(separator),
    select = $('select[name="parent"]', dialog).html(''),
    input = $('input[name="name"]', dialog).val(folder);

  buttons[rcmail.gettext('roundpad.save')] = function () {
    var folder = '', name = input.val(), parent = select.val();

    if (!name)
      return;

    if (parent)
      folder = parent + separator;

    folder += name;

    file_api.folder_rename(file_api.env.folder, folder);
    roundpad_dialog_close(this);
  };

  buttons[rcmail.gettext('roundpad.cancel')] = function () {
    roundpad_dialog_close(this);
  };

  // show dialog window
  roundpad_dialog_show(dialog, {
    title: rcmail.gettext('roundpad.folderedit'),
    buttons: buttons,
    button_classes: ['mainaction']
  });

  // Fix submitting form with Enter
  $('form', dialog).submit(roundpad_dialog_submit_handler);

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

//file creation dialog
function roundpad_file_create_dialog(url = null)
{
  var dialog = $('#files-file-create-dialog'),
    buttons = {},
    select_parent = $('select[name="parent"]', dialog).html(''),
    select_type = $('select[name="type"]', dialog),
    input_name = $('input[name="name"]', dialog).val(''),
    input_url = $('input[name="url"]', dialog).val(''),
    input_owner = $('input[name="owner"]', dialog).val(rcmail.env.doc_owner);

  buttons[rcmail.gettext('roundpad.create')] = function () {
    var name = input_name.val(), folder = select_parent.val(), type = select_type.val(), url = input_url.val(), owner = input_owner.val();

    if (!name) {
      file_api.display_message('roundpad.filenoname', 'error');
      return;
    }
    if (!folder) {
      file_api.display_message('roundpad.filenofolder', 'error');
      return;
    }

    file_api.file_create(folder, name, type, url, owner);
  };
  
  if (rcmail.env.doc_url) {
    buttons[rcmail.gettext('roundpad.open')] = function () {
      file_api.file_open(rcmail.env.doc_url);
    };
  }

  buttons[rcmail.gettext('roundpad.cancel')] = function () {    
    roundpad_dialog_close(this);
  };

  // show dialog window
  roundpad_dialog_show(dialog, {
    title: rcmail.gettext('roundpad.filecreate'),
    buttons: buttons,
    button_classes: ['mainaction'],
    close: function(event, ui) { 
      rcmail.env.doc_url = null;
      rcmail.env.doc_owner = null;
    }
  });

  // Fix submitting form with Enter
  $('form', dialog).submit(roundpad_dialog_submit_handler);
  
  // Add on change event
  input_url.change(function() {
    if ($(this).val().length > 1) {
      for (var key in rcmail.env.associative_files_url) {
        value = rcmail.env.associative_files_url[key];
        if ($(this).val().indexOf(key) != -1 || key == 'default') {
          select_type.val(value);
          if (input_name.val().length == 0) {
            var name = $(this).val().split('/').pop();
            try {
              var decoded = atob(name.split('_').pop());
            }
            catch (Exception) {}           
            if (decoded && decoded.indexOf('user:') != -1) {
              input_owner.val(atob(name.split('_').pop()).replace('user:', ''));
              var split = name.split('_');
              input_name.val(split.slice(0, split.length - 2).join(' '));
            }
            else if (name.split('_').pop().length == 13) {              
              var split = name.split('_');
              input_name.val(split.slice(0, split.length - 1).join(' '));
            }
            else {
              input_name.val(name.replace(/_/g, ' '));
            }
          }
          break;
        }
      };
    }
  });
  
  if (url) {  
    input_url.val(decodeURIComponent(url));
    input_url.change();
  }

  // build parent selector
  select_parent.append($('<option>').val('').text('---'));
  $.each(file_api.env.folders, function(i, f) {
    var n, option = $('<option>'), name = escapeHTML(f.name);

    for (n=0; n<f.depth; n++)
      name = '&nbsp;&nbsp;&nbsp;' + name;

    option.val(i).html(name).appendTo(select_parent);

    if (i == file_api.env.folder)
      option.attr('selected', true);
  });
};

// file edition dialog
function roundpad_file_edit_dialog(file, data)
{
  var dialog = $('#files-file-edit-dialog'),
    buttons = {}, name = data.name, url = data.url, owner = data.owner, type = data.type,
    input_name = $('input[name="name"]', dialog).val(name),
    input_url = $('input[name="url"]', dialog).val(url),
    input_owner = $('input[name="owner"]', dialog).val(owner),
    select_type = $('select[name="type"]', dialog).val(type);

  buttons[rcmail.gettext('roundpad.save')] = function () {
    var folder = data.path, 
      name = input_name.val(), 
      url = input_url.val(), 
      owner = input_owner.val(), 
      type = select_type.val();

    if (!name || !url || !type)
      return;

    file_api.file_edit(folder, file, name, type, url, owner);
    roundpad_dialog_close(this);
  };
  buttons[rcmail.gettext('roundpad.cancel')] = function () {
    roundpad_dialog_close(this);
  };

  // Fix submitting form with Enter
  $('form', dialog).submit(roundpad_dialog_submit_handler);

  // show dialog window
  roundpad_dialog_show(dialog, {
    title: rcmail.gettext('roundpad.fileedit'),
    buttons: buttons,
    button_classes: ['mainaction']
  });
};

function roundpad_dialog_show(content, params, onopen)
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
function roundpad_dialog_submit_handler()
{
  $(this).parents('.ui-dialog').find('.ui-button.mainaction').click();
  return false;
};

// Hides dialog
function roundpad_dialog_close(dialog)
{
  (rcmail.is_framed() ? window.parent : window).$(dialog).dialog('close');
};

/***********************************************************/
/**********          Main functionality           **********/
/***********************************************************/

// for reordering column array (Konqueror workaround)
// and for setting some message list global variables
roundpad_list_coltypes = function()
{
  var n, list = rcmail.file_list;

  rcmail.env.subject_col = null;

  if ((n = $.inArray('name', rcmail.env.coltypes)) >= 0) {
    rcmail.env.subject_col = n;
    list.subject_col = n;
  }

  list.init_header();
};

roundpad_set_list_options = function(cols, sort_col, sort_order)
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
    rcmail.http_post('roundpad/prefs', {
      roundpad_list_cols: oldcols,
      roundpad_sort_col: sort_col,
      roundpad_sort_order: sort_order
      }, rcmail.set_busy(true, 'loading'));
  }
};

roundpad_set_coltypes = function(list)
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

  rcmail.http_post('roundpad/prefs', {roundpad_list_cols: rcmail.env.coltypes});
};

roundpad_list_dblclick = function(list)
{
  rcmail.command('files-open');
};

roundpad_list_select = function(list)
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
      href = '?' + $.param({_task: 'roundpad', _action: 'open', file: file, viewer: viewer == 2 ? 1 : 0});
      var win = window.open(href, rcmail.html_identifier('rcubefile'+file));
      if (win)
        setTimeout(function() { win.focus(); }, 10);
    }
*/
  rcmail.enable_command('files-open', rcmail.env.viewer);
};

roundpad_list_keypress = function(list)
{
  if (list.modkey == CONTROL_KEY)
    return;

  if (list.key_pressed == list.ENTER_KEY)
    rcmail.command('files-open');
  else if (list.key_pressed == list.DELETE_KEY || list.key_pressed == list.BACKSPACE_KEY)
    rcmail.command('files-delete');
};

roundpad_drag_end = function(e)
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

roundpad_drag_menu_action = function(command)
{
  var menu = rcmail.gui_objects.file_dragmenu;

  if (menu)
    $(menu).hide();

  rcmail.command(command, rcmail.env.drag_target);
};

roundpad_selected = function()
{
  var files = [];
  $.each(rcmail.file_list.get_selection(), function(i, v) {
    var name, row = $('#rcmrow'+v);

    if (row.length == 1 && (name = row.data('url')))
      files.push(name);
  });

  return files;
};

roundpad_frame_load = function(frame)
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

  this.http_post('roundpad/prefs', {roundpad_sort_col: sort_col, roundpad_sort_order: sort_order});

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
  if (confirm(this.get_label('roundpad.folderdeleteconfirm')))
    file_api.folder_delete(file_api.env.folder);
};

rcube_webmail.prototype.files_delete = function()
{
  if (!confirm(this.get_label('roundpad.filedeleteconfirm')))
    return;

  var files = this.env.file ? [this.env.file] : roundpad_selected();
  file_api.file_delete(files, file_api.env.folder);
};

rcube_webmail.prototype.files_move = function(folder)
{
  var files = roundpad_selected();
  file_api.file_move(files, folder);
};

rcube_webmail.prototype.files_copy = function(folder)
{
  var files = roundpad_selected();
  file_api.file_copy(files, folder);
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
  roundpad_list_coltypes();
  file_api.file_list();
};

rcube_webmail.prototype.files_get = function()
{
  var files = this.env.file ? [this.env.file] : roundpad_selected();

  if (files.length == 1)
    file_api.file_get(files[0], {'force-download': true});
};

rcube_webmail.prototype.files_open = function()
{
  var files = roundpad_selected();

  if (files.length == 1)
    file_api.file_open(files[0]);
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

rcube_webmail.prototype.files_help = function()
{
  roundpad_help_dialog();
};

rcube_webmail.prototype.file_create = function()
{
  roundpad_file_create_dialog();
};

rcube_webmail.prototype.folder_create = function()
{
  roundpad_folder_create_dialog();
};

rcube_webmail.prototype.folder_rename = function()
{
  roundpad_folder_edit_dialog();
};


/**********************************************************/
/*********          Files API handler            **********/
/**********************************************************/

function roundpad_ui()
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
      collections = !rcmail.env.action.match(/^(preview|show)$/) ? ['etherpad', 'ethercalc'] : [];

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
        .append($('<span class="name"></span>').text(rcmail.gettext('roundpad.collection_' + n)))
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

      rcmail.enable_command('files-folder-delete', 'folder-rename', false);
      this.env.folder = null;
      rcmail.command('files-list', {collection: folder});
    }
    else {
      var found = $('#' + this.env.folders[folder].id, list).addClass('selected');

      rcmail.enable_command('files-folder-delete', 'folder-rename', true);
      this.env.folder = folder;
      this.env.collection = null;
      rcmail.command('files-list', {folder: folder});
    }
  };

  this.folder_unselect = function()
  {
    var list = $('#files-folder-list > ul');
    $('li.selected', list).removeClass('selected');
    rcmail.enable_command('files-folder-delete', false);
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
    this.req = this.set_busy(true, 'roundpad.foldercreating');
    this.request('folder_create', {folder: folder}, 'folder_create_response');
  };

  // folder create response handler
  this.folder_create_response = function(response)
  {
    if (!this.response(response))
      return;

    this.display_message('roundpad.foldercreatenotice', 'confirmation');

    // refresh folders list
    this.folder_list();
  };

  // folder rename request
  this.folder_rename = function(folder, new_name)
  {
    if (folder == new_name)
      return;

    this.env.folder_rename = new_name;
    this.req = this.set_busy(true, 'roundpad.folderupdating');
    this.request('folder_move', {folder: folder, 'new': new_name}, 'folder_rename_response');
  };

  // folder create response handler
  this.folder_rename_response = function(response)
  {
    if (!this.response(response))
      return;

    this.display_message('roundpad.folderupdatenotice', 'confirmation');

    // refresh folders and files list
    this.env.folder = this.env.folder_rename;
    this.folder_list();
  };

  // folder delete request
  this.folder_delete = function(folder)
  {
    this.req = this.set_busy(true, 'roundpad.folderdeleting');
    this.request('folder_delete', {folder: folder}, 'folder_delete_response');
  };

  // folder delete response handler
  this.folder_delete_response = function(response)
  {
    if (!this.response(response))
      return;

    this.env.folder = null;
    rcmail.enable_command('files-folder-delete', 'folder-rename', 'files-list', false);
    this.display_message('roundpad.folderdeletenotice', 'confirmation');

    // refresh folders list
    this.folder_list();
  };
  
  // file create request
  this.file_create = function(folder, name, type, url, owner)
  {
    this.req = this.set_busy(true, 'roundpad.filecreating');
    this.request('file_create', {folder: folder, name: name, type: type, url: url, owner: owner}, 'file_create_response');
  };

  // file create response handler
  this.file_create_response = function(response)
  {
    if (!this.response(response)) {
      return;
    }
    roundpad_dialog_close($('#files-file-create-dialog').closest('.ui-dialog-content'));
    rcmail.env.doc_url = null;
    rcmail.env.doc_owner = null;

    this.display_message('roundpad.filecreatenotice', 'confirmation');

    // refresh file list
    this.file_list();
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
      if (!row) {
        return;
      }
      rcmail.file_list.insert_row(row);
      data.row = row;
      data.filename = key;
      list.push(data);
    });

    this.env.file_list = list;
    rcmail.file_list.resize();
    
    if (rcmail.env.doc_url) {
      roundpad_file_create_dialog(rcmail.env.doc_url);
    }
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
        if (row) {
          table.insert_row(row, elem.row);
          result[i].row = row;
          result[i].filename = i;
          list.push(result[i]);
          delete result[i];
        }
      }

      list.push(elem);
    }

    // add the rest of rows
    $.each(result, function(key, data) {
      var row = file_api.file_list_row(key, data, ++index);
      if (!row) {
        return;
      }
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
    
    if (!data) {
      return;
    }

    for (c in rcmail.env.coltypes) {
      c = rcmail.env.coltypes[c];
      if (c == 'name')
        col = '<td title="' + data.name + '" class="name filename ' + this.file_type_class(data.type) + '">'
          + '<span>' + escapeHTML(data.name) + '</span></td>';
      else if (c == 'created')
        col = '<td class="created">' + data.created + '</td>';
      else if (c == 'path')
        col = '<td title="' + data.path + '" class="path">' + data.path + '</td>';
      else if (c == 'type')
        col = '<td class="type">' + rcmail.get_label('roundpad.'+data.type) + '</td>';
      else if (c == 'url')
        col = '<td title="' + data.url + '" class="url"><a target="_blank" href="' + data.url + '">' + data.url + '</td>';
      else if (c == 'owner')
        col = '<td class="owner">' + (data.owner == rcmail.env.username ? rcmail.get_label('roundpad.me') : data.owner) + '</td>';
      else if (c == 'options')
        col = '<td class="options"><span></span></td>';
      else if (c == 'email')
        col = '<td class="email"><span></span></td>';
      else
        col = '<td class="' + c + '"></td>';

      row += col;
    }

    row = $('<tr>')
      .html(row)
      .attr({id: 'rcmrow' + index, 'data-type': data.type, 'data-url': data.url, 'data-name': data.name});

    $('td.options > span', row).click(function(e) {
      roundpad_file_edit_dialog(data.url, data);
    });
    
    $('td.email > span', row).click(function(e) {
      roundpad_file_open_compose(data.url, data);
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

    rcmail.redirect(rcmail.url('roundpad/file_api') + "&method=file_get&file=" + file);
  };

  // file(s) delete request
  this.file_delete = function(files, folder)
  {
    this.req = this.set_busy(true, 'roundpad.filedeleting');
    this.request('file_delete', {file: files, folder: folder}, 'file_delete_response');
  };

  // file(s) delete response handler
  this.file_delete_response = function(response)
  {
    if (!this.response(response))
      return;

    var rco, dir, self = this;

    this.display_message('roundpad.filedeletenotice', 'confirmation');

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

    if (rcmail.env.file)
      window.close();
  };

  // file(s) move request
  this.file_move = function(files, folder)
  {
    if (!files || !files.length || !folder)
      return;

    var list = [];

    $.each(files, function(i, v) {
        list.push(v);
    });

    this.req = this.set_busy(true, 'roundpad.filemoving');
    this.request('file_move', {file: list, new_folder: folder, folder: file_api.env.folder}, 'file_move_response');
  };

  // file(s) move response handler
  this.file_move_response = function(response)
  {
    if (!this.response(response))
      return;

    if (response.result && response.result.already_exist && response.result.already_exist.length)
      this.file_move_ask_user(response.result.already_exist, true);
    else {
      this.display_message('roundpad.filemovenotice', 'confirmation');
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

    this.req = this.set_busy(true, 'roundpad.filecopying');
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
      this.display_message('roundpad.filecopynotice', 'confirmation');
    }
  };

  // when file move/copy operation returns file-exists error
  // this displays a dialog where user can decide to skip
  // or overwrite destination file(s)
  this.file_move_ask_user = function(list, move)
  {
    var file = list[0], buttons = {},
      text = rcmail.gettext('roundpad.filemoveconfirm').replace('$file', file.dst)
      dialog = $('<div></div>');

    buttons[rcmail.gettext('roundpad.fileoverwrite')] = function() {
      var file = list.shift(), f = {},
        action = move ? 'file_move' : 'file_copy';

      f[file.src] = file.dst;
      file_api.file_move_ask_list = list;
      file_api.file_move_ask_mode = move;
      dialog.dialog('destroy').remove();
      file_api.req = file_api.set_busy(true, move ? 'roundpad.filemoving' : 'roundpad.filecopying');
      file_api.request(action, {file: f, overwrite: 1}, 'file_move_ask_user_response');
    };

    if (list.length > 1)
      buttons[rcmail.gettext('roundpad.fileoverwriteall')] = function() {
        var f = {}, action = move ? 'file_move' : 'file_copy';

        $.each(list, function() { f[this.src] = this.dst; });
        dialog.dialog('destroy').remove();
        file_api.req = file_api.set_busy(true, move ? 'roundpad.filemoving' : 'roundpad.filecopying');
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

    buttons[rcmail.gettext('roundpad.fileskip')] = skip_func;

    if (list.length > 1)
      buttons[rcmail.gettext('roundpad.fileskipall')] = function() {
      dialog.dialog('destroy').remove();
        if (move)
          file_api.file_list();
      };

    // open jquery UI dialog
    roundpad_dialog_show(dialog.html(text), {
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
      this.display_message('roundpad.file' + (move ? 'move' : 'copy') + 'notice', 'confirmation');
      if (move)
        this.file_list();
    }
  };

  // file(s) edit request
  this.file_edit = function(folder, file, new_name, new_type, new_url, new_owner)
  {
    this.req = this.set_busy(true, 'roundpad.fileupdating');
    this.request('file_edit', {folder: folder, file: file, new_name: new_name, new_type: new_type, new_url: new_url, new_owner: new_owner}, 'file_edit_response');
  };

  // file(s) edit response handler
  this.file_edit_response = function(response)
  {
    if (!this.response(response))
      return;

    // @TODO: we could update metadata instead
    this.file_list();
  };

  // handler when files are dropped to a designated area.
  // compose a multipart form data and submit it to the server
  this.file_drop = function(e)
  {
    var files = e.target.files || e.dataTransfer.files;

    if (!files || !files.length)
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

  // open file in new window
  this.file_open = function(url)
  {
    window.open(url);
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

    args.buttons[this.t('roundpad.save')] = function() {
      var data = {folder: label, list: 1};

      $('input', dialog).each(function() {
        data[this.name] = this.type == 'checkbox' && !this.checked ? '' : this.value;
      });

      file_api.open_dialog = this;
      file_api.req = file_api.set_busy(true, 'roundpad.authenticating');
      file_api.request('folder_auth', data, 'folder_auth_response');
    };

    args.buttons[this.t('roundpad.cancel')] = function() {
      delete file_api.auth_errors[label];
      roundpad_dialog_close(this);
      // go to the next one
      file_api.folder_list_auth_errors();
    };

    args.title = this.t('roundpad.folderauthtitle').replace('$title', label);

    // show dialog window
    roundpad_dialog_show(dialog, args, function() {
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
    roundpad_dialog_close(this.open_dialog);

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
