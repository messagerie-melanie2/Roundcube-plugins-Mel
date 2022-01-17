if (window.rcmail) {
    rcmail.addEventListener('init', function() {
        rcmail.set_book_actions();
        if (rcmail.gui_objects.editform && rcmail.env.action.match(/^plugin\.book/)) {
            rcmail.enable_command('book-save', true);
        }
    });
    rcmail.addEventListener('listupdate', function() {
        rcmail.set_book_actions();
    });
}

// Search only addressbooks
rcube_webmail.prototype.contacts_search_only = function()
{
    $('#contacts_search_only').show();
    $('#contacts_search_only').text(this.env.source == 'all' ? this.get_label('mel.contacts_search_only_all') : this.get_label('mel.contacts_search_only'));
};

// Hide search only addressbooks
rcube_webmail.prototype.contacts_search_only_hide = function()
{
    $('#contacts_search_only').hide();
};

// (De-)activates address book management commands
rcube_webmail.prototype.set_book_actions = function()
{
    var source = this.env.source,
        sources = this.env.address_sources;
    this.enable_command('book-create', true);
    this.enable_command('book-edit', source && sources[source] && sources[source].mel && sources[source].editable);
    this.enable_command('book-delete', source && sources[source] && sources[source].mel && sources[source].deletable);
    this.enable_command('book-showurl', source && sources[source] && sources[source].carddavurl);
};

rcube_webmail.prototype.book_create = function()
{
    this.book_show_contentframe('create');
};

rcube_webmail.prototype.book_edit = function()
{
    this.book_show_contentframe('edit');
};

rcube_webmail.prototype.book_delete = function()
{
    if (this.env.source != '' && confirm(this.get_label('mel_contacts.bookdeleteconfirm'))) {
        var lock = this.set_busy(true, 'mel_contacts.bookdeleting');
        this.http_request('plugin.book', '_act=delete&_source='+urlencode(this.book_id()), lock);
    }
};

rcube_webmail.prototype.book_showurl = function()
{
    var source = this.env.source ? this.env.address_sources[this.env.source] : null;
    if (source && source.carddavurl) {
        $('div.showurldialog:ui-dialog').dialog('close');

        var $dialog = $('<div>').addClass('showurldialog').append('<p>'+rcmail.gettext('carddavurldescription', 'mel_contacts')+'</p>'),
            textbox = $('<textarea>').addClass('urlbox').css('width', '100%').attr('rows', 2).appendTo($dialog);

          $dialog.dialog({
            resizable: true,
            closeOnEscape: true,
            title: rcmail.gettext('bookshowurl', 'mel_contacts'),
            close: function() {
              $dialog.dialog("destroy").remove();
            },
            width: 520
          }).show();

          textbox.val(source.carddavurl).select();
    }
};

// displays page with book edit/create form
rcube_webmail.prototype.book_show_contentframe = function(action, framed)
{
    var add_url = '', target = window;

    // unselect contact
    this.contact_list.clear_selection();
    this.enable_command('edit', 'delete', 'compose', false);

    if (this.env.contentframe && window.frames && window.frames[this.env.contentframe]) {
        add_url = '&_framed=1';
        target = window.frames[this.env.contentframe];
        this.show_contentframe(true);
    }
    else if (framed)
        return false;

    if (action) {
        this.lock_frame();
        this.location_href(this.env.comm_path+'&_action=plugin.book&_act='+action
            +'&_source='+urlencode(this.book_id())+'&_name='+urlencode(this.book_name())
            +add_url, target);
    }

    return true;
};

// submits book create/update form
rcube_webmail.prototype.book_save = function()
{
    var form = this.gui_objects.editform,
        input = $("input[name='_name']", form)

    if (input.length && input.val() == '') {
        alert(this.get_label('mel_contacts.nobooknamewarning'));
        input.focus();
        return;
    }

    input = this.display_message(this.get_label('mel_contacts.booksaving'), 'loading');
    $('<input type="hidden" name="_unlock" />').val(input).appendTo(form);

    form.submit();
};

// action executed after book delete
rcube_webmail.prototype.book_delete_done = function(id, recur)
{
    var n, groups = this.env.contactgroups,
        sources = this.env.address_sources,
        olddata = sources[id];

    this.treelist.remove(id);

    for (n in groups)
        if (groups[n].source == id) {
            delete this.env.contactgroups[n];
            delete this.env.contactfolders[n];
        }

    delete this.env.address_sources[id];
    delete this.env.contactfolders[id];

    if (recur)
        return;

    this.enable_command('group-create', 'book-edit', 'book-delete', false);

    // remove subfolders
    for (n in sources)
        if (sources[n].realname && sources[n].realname.indexOf(olddata.realname) == 0)
            this.book_delete_done(n, true);
};

// action executed after book create/update
rcube_webmail.prototype.book_update = function(data, type, recur)
{
    var n, i, id, len, link, row, prop, olddata, oldid, name, sources, level,
        folders = [], classes = ['addressbook'],
        groups = this.env.contactgroups;

    this.env.contactfolders[data.id] = this.env.address_sources[data.id] = data;
    this.show_contentframe(false);

    // update (remove old row)
    if (type == 'update') {
        olddata = this.env.address_sources[data.id];
        //delete this.env.address_sources[data.id];
        //delete this.env.contactfolders[data.id];
        this.treelist.remove(data.id);
    }

    sources = this.env.address_sources;

    // set row attributes
    if (data.readonly)
        classes.push('readonly');
    if (data.class_name)
        classes.push(data.class_name);
    // updated currently selected book
    if (this.env.source != '' && this.env.source == data.id) {
        classes.push('selected');
        this.env.source = data.id;
    }

    link = $('<a>').html(data.name)
      .attr({
        href: './?_task=addressbook&_source=' + data.id, rel: data.id,
        onclick: "return rcmail.command('list', '" + data.id + "', this)"
      });

    // add row at the end of the list
    // treelist widget is not very smart, we need
    // to do sorting and add groups list by ourselves
    this.treelist.insert({id: data.id, html:link, classes: classes, childlistclass: 'groups'}, '', false);
    row = $(this.treelist.get_item(data.id));
    row.append($('<ul class="groups">').hide());

    // we need to sort rows because treelist can't sort by property
    $.each(sources, function(i, v) {
        if (v.mel && v.realname)
            folders.push(v.realname);
    });
    folders.sort();

    for (n=0, len=folders.length; n<len; n++)
        if (folders[n] == data.realname)
           break;

    // find the row before and re-insert after it
    if (n && n < len - 1) {
        name = folders[n-1];
        for (n in sources)
            if (sources[n].realname && sources[n].realname == name) {
                row.detach().insertAfter(this.treelist.get_item(n));
                break;
            }
    }

    if (olddata) {
        // update groups
        for (n in groups) {
            if (groups[n].source == data.id) {
                prop = groups[n];
                prop.type = 'group';
                prop.source = data.id;
                id = 'G' + prop.source + prop.id;

                link = $('<a>').text(prop.name)
                  .attr({
                    href: '#', rel: prop.source + ':' + prop.id,
                    onclick: "return rcmail.command('listgroup', {source: '"+prop.source+"', id: '"+prop.id+"'}, this)"
                  });

                this.treelist.insert({id:id, html:link, classes:['contactgroup']}, prop.source, true);

                this.env.contactfolders[id] = this.env.contactgroups[id] = prop;
                delete this.env.contactgroups[n];
                delete this.env.contactfolders[n];
            }
        }
    }
};

// returns real book name
rcube_webmail.prototype.book_realname = function()
{
    var source = this.env.source, sources = this.env.address_sources;
    return source != '' && sources[source] && sources[source].realname ? sources[source].realname : '';
};

// returns book id
rcube_webmail.prototype.book_id = function()
{
    var source = this.env.source, sources = this.env.address_sources;
    return source != '' && sources[source] && sources[source].id ? sources[source].id : '';
};

// returns book name
rcube_webmail.prototype.book_name = function()
{
	var source = this.env.source, sources = this.env.address_sources;
    return sources[source] && sources[source].name ? sources[source].name : '';
};
