function roundrive_ui_init()
{
  if (rcmail.env.action == 'open') {
    var filesviewsplit = new rcube_splitter({ id:'filesopensplitter', p1:'#fileinfobox', p2:'#filecontent',
      orientation:'v', relative:true, start:226, min:150, size:12 }).init();

    rcmail.addEventListener('enable-command', roundrive_enable_command);
  }
  else
    var filesviewsplit = new rcube_splitter({ id:'filesviewsplitter', p1:'#folderlistbox', p2:'#filelistcontainer',
      orientation:'v', relative:true, start:226, min:150, size:12 }).init();

  $(document).ready(function() {
    rcmail.addEventListener('menu-open', roundrive_show_listoptions);
    rcmail.addEventListener('menu-save', roundrive_save_listoptions);
    rcmail.addEventListener('menu-close', roundrive_show_listoptions);
    rcmail.addEventListener('setquota', roundrive_update_quota);

    var menu = $('#dragfilemenu');
    if (menu.length) {
      rcmail.gui_object('file_dragmenu', 'dragfilemenu');
      UI.add_popup('dragfilemenu', {sticky: 1});
    }

    menu = $('#filesearchmenu');
    if (menu.length) {
      rcmail.gui_object('file_searchmenu', 'filesearchmenu');
    }
  });

  roundrive_upload_input('#filestoolbar a.upload');
};

function roundrive_enable_command(p)
{
  if (p.command == 'files-save') {
    var toolbar = $('#filestoolbar');
    $('a.button.edit', toolbar).hide();
    $('a.button.save', toolbar).show();
  }
};

function roundrive_update_quota(p)
{
    return UI.update_quota(p);
};

function roundrive_show_listoptions(p)
{
  if (!p || p.name != 'filelistmenu') {
    return;
  }

  var $dialog = $('#listoptions');

  // close the dialog
  if ($dialog.is(':visible')) {
    $dialog.dialog('close');
    return;
  }

  // set form values
  $('input[name="sort_col"][value="'+rcmail.env.sort_col+'"]').prop('checked', true);
  $('input[name="sort_ord"][value="DESC"]').prop('checked', rcmail.env.sort_order == 'DESC');
  $('input[name="sort_ord"][value="ASC"]').prop('checked', rcmail.env.sort_order != 'DESC');

  // set checkboxes
  $('input[name="list_col[]"]').each(function() {
    $(this).prop('checked', $.inArray(this.value, rcmail.env.coltypes) != -1);
  });

  $dialog.dialog({
    modal: true,
    resizable: false,
    closeOnEscape: true,
    close: function() { rcmail.file_list.focus(); },
    title: null,
    minWidth: 400,
    width: $dialog.width()+20
  }).show();
};

function roundrive_save_listoptions()
{
  $('#listoptions').dialog('close');

  var sort = $('input[name="sort_col"]:checked').val(),
    ord = $('input[name="sort_ord"]:checked').val(),
    cols = $('input[name="list_col[]"]:checked')
      .map(function(){ return this.value; }).get();

  roundrive_set_list_options(cols, sort, ord);
};
