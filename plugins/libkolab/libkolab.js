/**
 * Kolab groupware utilities
 *
 * @author Thomas Bruederli <bruederli@kolabsys.com>
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) 2015-2018, Kolab Systems AG <contact@kolabsys.com>
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

var libkolab_audittrail = {}, libkolab = {};

libkolab_audittrail.quote_html = function(str)
{
    return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

// show object changelog in a dialog
libkolab_audittrail.object_history_dialog = function(p)
{
    // render dialog
    var $dialog = $(p.container);

    // close show dialog first
    if ($dialog.is(':ui-dialog'))
        $dialog.dialog('close');

    // hide and reset changelog table
    $dialog.find('div.notfound-message').remove();
    $dialog.find('.changelog-table').show().children('tbody')
        .html('<tr><td colspan="4"><span class="loading">' + rcmail.gettext('loading') + '</span></td></tr>');

    // open jquery UI dialog
    $dialog.dialog({
        modal: true,
        resizable: true,
        closeOnEscape: true,
        title: p.title,
        open: function() {
            $dialog.attr('aria-hidden', 'false');
        },
        close: function() {
            $dialog.dialog('destroy').attr('aria-hidden', 'true').hide();
        },
        buttons: [
            {
                text: rcmail.gettext('close'),
                click: function() { $dialog.dialog('close'); },
                'class': 'cancel',
                autofocus: true
            }
        ],
        minWidth: 450,
        width: 650,
        height: 350,
        minHeight: 200
    })
    .show().children('.compare-button').hide();

    // initialize event handlers for history dialog UI elements
    if (!$dialog.data('initialized')) {
      // compare button
      $dialog.find('.compare-button input').click(function(e) {
        var rev1 = $dialog.find('.changelog-table input.diff-rev1:checked').val(),
          rev2 = $dialog.find('.changelog-table input.diff-rev2:checked').val();

          if (rev1 && rev2 && rev1 != rev2) {
            // swap revisions if the user got it wrong
            if (rev1 > rev2) {
              var tmp = rev2;
              rev2 = rev1;
              rev1 = tmp;
            }

            if (p.comparefunc) {
                p.comparefunc(rev1, rev2);
            }
          }
          else {
              alert('Invalid selection!')
          }

          if (!rcube_event.is_keyboard(e) && this.blur) {
              this.blur();
          }
          return false;
      });

      // delegate handlers for list actions
      $dialog.find('.changelog-table tbody').on('click', 'td.actions a', function(e) {
          var link = $(this),
            action = link.hasClass('restore') ? 'restore' : 'show',
            event = $('#eventhistory').data('event'),
            rev = link.attr('data-rev');

            // ignore clicks on first row (current revision)
            if (link.closest('tr').hasClass('first')) {
                return false;
            }

            // let the user confirm the restore action
            if (action == 'restore' && !confirm(rcmail.gettext('revisionrestoreconfirm', p.module).replace('$rev', rev))) {
                return false;
            }

            if (p.listfunc) {
                p.listfunc(action, rev);
            }

            if (!rcube_event.is_keyboard(e) && this.blur) {
                this.blur();
            }
            return false;
      })
      .on('click', 'input.diff-rev1', function(e) {
          if (!this.checked) return true;

          var rev1 = this.value, selection_valid = false;
          $dialog.find('.changelog-table input.diff-rev2').each(function(i, elem) {
              $(elem).prop('disabled', elem.value <= rev1);
              if (elem.checked && elem.value > rev1) {
                  selection_valid = true;
              }
          });
          if (!selection_valid) {
              $dialog.find('.changelog-table input.diff-rev2:not([disabled])').last().prop('checked', true);
          }
      });

      $dialog.addClass('changelog-dialog').data('initialized', true);
    }

    return $dialog;
};

// callback from server with changelog data
libkolab_audittrail.render_changelog = function(data, object, folder)
{
    var Q = libkolab_audittrail.quote_html;

    var $dialog = $('.changelog-dialog')
    if (data === false || !data.length) {
        return false;
    }

    var i, change, accessible, op_append,
      first = data.length - 1, last = 0,
      is_writeable = !!folder.editable,
      op_labels = {
          RECEIVE:   'actionreceive',
          APPEND:    'actionappend',
          MOVE:      'actionmove',
          DELETE:    'actiondelete',
          READ:      'actionread',
          FLAGSET:   'actionflagset',
          FLAGCLEAR: 'actionflagclear'
      },
      actions = '<a href="#show" class="iconbutton preview" title="'+ rcmail.gettext('showrevision','libkolab') +'" data-rev="{rev}" /> ' +
          (is_writeable ? '<a href="#restore" class="iconbutton restore" title="'+ rcmail.gettext('restore','libkolab') + '" data-rev="{rev}" />' : ''),
      tbody = $dialog.find('.changelog-table tbody').html('');

    for (i=first; i >= 0; i--) {
        change = data[i];
        accessible = change.date && change.user;

        if (change.op == 'MOVE' && change.mailbox) {
            op_append = ' ⇢ ' + change.mailbox;
        }
        else if ((change.op == 'FLAGSET' || change.op == 'FLAGCLEAR') && change.flags) {
            op_append = ': ' + change.flags;
        }
        else {
            op_append = '';
        }

        $('<tr class="' + (i == first ? 'first' : (i == last ? 'last' : '')) + (accessible ? '' : 'undisclosed') + '">')
            .append('<td class="diff">' + (accessible && change.op != 'DELETE' ? 
                '<input type="radio" name="rev1" class="diff-rev1" value="' + change.rev + '" title="" '+ (i == last ? 'checked="checked"' : '') +' /> '+
                '<input type="radio" name="rev2" class="diff-rev2" value="' + change.rev + '" title="" '+ (i == first ? 'checked="checked"' : '') +' /></td>'
                : ''))
            .append('<td class="revision">' + Q(i+1) + '</td>')
            .append('<td class="date">' + Q(change.date || '') + '</td>')
            .append('<td class="user">' + Q(change.user || 'undisclosed') + '</td>')
            .append('<td class="operation" title="' + op_append + '">' + Q(rcmail.gettext(op_labels[change.op] || '', 'libkolab') + op_append) + '</td>')
            .append('<td class="actions">' + (accessible && change.op != 'DELETE' ? actions.replace(/\{rev\}/g, change.rev) : '') + '</td>')
            .appendTo(tbody);
    }

    if (first > 0) {
        $dialog.find('.compare-button').fadeIn(200);
        $dialog.find('.changelog-table tr.last input.diff-rev1').click();
    }

    // set dialog size according to content
    libkolab_audittrail.dialog_resize($dialog.get(0), $dialog.height() + 15, 600);

    return $dialog;
};

// resize and reposition (center) the dialog window
libkolab_audittrail.dialog_resize = function(id, height, width)
{
    var win = $(window), w = win.width(), h = win.height();
    $(id).dialog('option', { height: Math.min(h-20, height+130), width: Math.min(w-20, width+50) });
};

/**
 * Open an attachment either in a browser window for inline view or download it
 */
libkolab.load_attachment = function(query, attachment)
{
    query._frame = 1;

    // open attachment in frame if it's of a supported mimetype similar as in app.js
    if (attachment.id && attachment.mimetype && $.inArray(attachment.mimetype, rcmail.env.mimetypes) >= 0) {
        if (rcmail.open_window(rcmail.url('get-attachment', query), true, true)) {
            return;
        }
    }

    query._frame = null;
    query._download = 1;
    rcmail.goto_url('get-attachment', query, false);
};

/**
 * Build attachments list element
 */
libkolab.list_attachments = function(list, container, edit, data, ondelete, onload)
{
    var ul = $('<ul>').addClass('attachmentslist');

    $.each(list || [], function(i, elem) {
        var li = $('<li>').addClass(elem.classname);

        // name/link
        $('<a>').attr({href: '#load', 'class': 'filename'})
            .append($('<span class="attachment-name">').text(elem.name))
            .click({record: data, attachment: elem}, function(e) {
                if (onload) {
                    onload(e.data);
                }
                return false;
            })
            .appendTo(li);

        if (edit) {
            rcmail.env.attachments[elem.id] = elem;
            // delete link
            $('<a>').attr({href: '#delete', title: rcmail.gettext('delete'), 'class': 'delete'})
                .click({id: elem.id}, function(e) {
                    $(this.parentNode).hide();
                    delete rcmail.env.attachments[e.data.id];
                    if (ondelete) {
                        ondelete(e.data.id);
                    }
                    return false;
                })
                .appendTo(li);
        }

        ul.append(li);
    });

    if (edit && rcmail.gui_objects.attachmentlist) {
        ul.id = rcmail.gui_objects.attachmentlist.id;
        rcmail.gui_objects.attachmentlist = ul.get(0);
    }

    container.empty().append(ul);
};


function kolab_folderlist(node, p)
{
    // extends treelist.js
    rcube_treelist_widget.call(this, node, p);

    // private vars
    var me = this;
    var search_results;
    var search_results_widget;
    var search_results_container;
    var listsearch_request;
    var search_messagebox;

    var Q = rcmail.quote_html;

    // render the results for folderlist search
    function render_search_results(results)
    {
        if (results.length) {
          // create treelist widget to present the search results
          if (!search_results_widget) {
              var list_id = (me.container.attr('id') || p.id_prefix || '0');

              search_results_container = $('<div class="searchresults"></div>')
                  .html(p.search_title ? '<h2 class="boxtitle" id="st:' + list_id + '">' + p.search_title + '</h2>' : '')
                  .insertAfter(me.container);

              search_results_widget = new rcube_treelist_widget('<ul>', {
                  id_prefix: p.id_prefix,
                  id_encode: p.id_encode,
                  id_decode: p.id_decode,
                  selectable: false
              });

              // copy classes from main list
              search_results_widget.container.addClass(me.container.attr('class')).attr('aria-labelledby', 'st:' + list_id);

              // register click handler on search result's checkboxes to select the given item for listing
              search_results_widget.container
                  .appendTo(search_results_container)
                  .on('click', 'input[type=checkbox], a.subscribed, span.subscribed', function(e) {
                      var node, has_children, li = $(this).closest('li'),
                          id = li.attr('id').replace(new RegExp('^'+p.id_prefix), '');

                      if (p.id_decode)
                          id = p.id_decode(id);
                      node = search_results_widget.get_node(id);
                      has_children = node.children && node.children.length;

                      e.stopPropagation();
                      e.bubbles = false;

                      // activate + subscribe
                      if ($(e.target).hasClass('subscribed')) {
                          search_results[id].subscribed = true;
                          $(e.target).attr('aria-checked', 'true');
                          li.children().first()
                              .toggleClass('subscribed')
                              .find('input[type=checkbox]').get(0).checked = true;

                          if (has_children && search_results[id].group == 'other user') {
                              li.find('ul li > div').addClass('subscribed')
                                  .find('a.subscribed').attr('aria-checked', 'true');;
                          }
                      }
                      else if (!this.checked) {
                          return;
                      }

                      // copy item to the main list
                      add_result2list(id, li, true);

                      if (has_children) {
                          li.find('input[type=checkbox]').first().prop('disabled', true).prop('checked', true);
                          li.find('a.subscribed, span.subscribed').first().hide();
                      }
                      else {
                          li.remove();
                      }

                      // set partial subscription status
                      if (search_results[id].subscribed && search_results[id].parent && search_results[id].group == 'other') {
                          parent_subscription_status($(me.get_item(id, true)));
                      }

                      // set focus to cloned checkbox
                      if (rcube_event.is_keyboard(e)) {
                          $(me.get_item(id, true)).find('input[type=checkbox]').first().focus();
                      }
                  })
                  .on('click', function(e) {
                      var prop, id = String($(e.target).closest('li').attr('id')).replace(new RegExp('^'+p.id_prefix), '');
                      if (p.id_decode)
                          id = p.id_decode(id);

                      if (!rcube_event.is_keyboard(e) && e.target.blur)
                        e.target.blur();

                      // forward event
                      if (prop = search_results[id]) {
                        e.data = prop;
                        if (me.triggerEvent('click-item', e) === false) {
                          e.stopPropagation();
                          return false;
                        }
                      }
                  });
          }

          // add results to list
          for (var prop, item, i=0; i < results.length; i++) {
              prop = results[i];
              item = $(prop.html);
              search_results[prop.id] = prop;
              search_results_widget.insert({
                  id: prop.id,
                  classes: [ prop.group || '' ],
                  html: item,
                  collapsed: true,
                  virtual: prop.virtual
              }, prop.parent);

              // disable checkbox if item already exists in main list
              if (me.get_node(prop.id) && !me.get_node(prop.id).virtual) {
                  item.find('input[type=checkbox]').first().prop('disabled', true).prop('checked', true);
                  item.find('a.subscribed, span.subscribed').hide();
              }

              prop.li = item.parent().get(0);
              me.triggerEvent('add-item', prop);
          }

          search_results_container.show();
        }
    }

    // helper method to (recursively) add a search result item to the main list widget
    function add_result2list(id, li, active)
    {
        var node = search_results_widget.get_node(id),
            prop = search_results[id],
            parent_id = prop.parent || null,
            has_children = node.children && node.children.length,
            dom_node = has_children ? li.children().first().clone(true, true) : li.children().first(),
            childs = [];

        // find parent node and insert at the right place
        if (parent_id && me.get_node(parent_id)) {
            dom_node.children('span,a').first().html(Q(prop.editname || prop.listname));
        }
        else if (parent_id && search_results[parent_id]) {
            // copy parent tree from search results
            add_result2list(parent_id, $(search_results_widget.get_item(parent_id)), false);
        }
        else if (parent_id) {
            // use full name for list display
            dom_node.children('span,a').first().html(Q(prop.name));
        }

        // replace virtual node with a real one
        if (me.get_node(id)) {
            $(me.get_item(id, true)).children().first()
                .replaceWith(dom_node)
                .removeClass('virtual');
        }
        else {
            // copy childs, too
            if (has_children && prop.group == 'other user') {
                for (var cid, j=0; j < node.children.length; j++) {
                    if ((cid = node.children[j].id) && search_results[cid]) {
                        childs.push(search_results_widget.get_node(cid));
                    }
                }
            }

            // move this result item to the main list widget
            me.insert({
                id: id,
                classes: [ prop.group || '' ],
                virtual: prop.virtual,
                html: dom_node,
                level: node.level,
                collapsed: true,
                children: childs
            }, parent_id, prop.group);
        }

        delete prop.html;
        prop.active = active;
        me.triggerEvent('insert-item', { id: id, data: prop, item: li });

        // register childs, too
        if (childs.length) {
            for (var cid, j=0; j < node.children.length; j++) {
                if ((cid = node.children[j].id) && search_results[cid]) {
                    prop = search_results[cid];
                    delete prop.html;
                    prop.active = false;
                    me.triggerEvent('insert-item', { id: cid, data: prop });
                }
            }
        }
    }

    // update the given item's parent's (partial) subscription state
    function parent_subscription_status(li)
    {
        var top_li = li.closest(me.container.children('li')),
            all_childs = $('li > div:not(.treetoggle)', top_li),
            subscribed = all_childs.filter('.subscribed').length;

        if (subscribed == 0) {
            top_li.children('div:first').removeClass('subscribed partial');
        }
        else {
            top_li.children('div:first')
                .addClass('subscribed')[subscribed < all_childs.length ? 'addClass' : 'removeClass']('partial');
        }
    }

    // do some magic when search is performed on the widget
    this.addEventListener('search', function(search) {
        // hide search results
        if (search_results_widget) {
            search_results_container.hide();
            search_results_widget.reset();
        }
        search_results = {};

        if (search_messagebox)
            rcmail.hide_message(search_messagebox);

        // send search request(s) to server
        if (search.query && search.execute) {
            // require a minimum length for the search string
            if (rcmail.env.autocomplete_min_length && search.query.length < rcmail.env.autocomplete_min_length && search.query != '*') {
                search_messagebox = rcmail.display_message(
                    rcmail.get_label('autocompletechars').replace('$min', rcmail.env.autocomplete_min_length));
                return;
            }

            if (listsearch_request) {
                // ignore, let the currently running request finish
                if (listsearch_request.query == search.query) {
                    return;
                }
                else { // cancel previous search request
                    rcmail.multi_thread_request_abort(listsearch_request.id);
                    listsearch_request = null;
                }
            }

            var sources = p.search_sources || [ 'folders' ];
            var reqid = rcmail.multi_thread_http_request({
                items: sources,
                threads: rcmail.env.autocomplete_threads || 1,
                action:  p.search_action || 'listsearch',
                postdata: { action:'search', q:search.query, source:'%s' },
                lock: rcmail.display_message(rcmail.get_label('searching'), 'loading'),
                onresponse: render_search_results,
                whendone: function(data){
                  listsearch_request = null;
                  me.triggerEvent('search-complete', data);
                }
            });

            listsearch_request = { id:reqid, query:search.query };
        }
        else if (!search.query && listsearch_request) {
            rcmail.multi_thread_request_abort(listsearch_request.id);
            listsearch_request = null;
        }
    });

    this.container.on('click', 'a.subscribed, span.subscribed', function(e) {
        var li = $(this).closest('li'),
            id = li.attr('id').replace(new RegExp('^'+p.id_prefix), ''),
            div = li.children().first(),
            is_subscribed;

        if (me.is_search()) {
            id = id.replace(/--xsR$/, '');
            li = $(me.get_item(id, true));
            div = $(div).add(li.children().first());
        }

        if (p.id_decode)
            id = p.id_decode(id);

        div.toggleClass('subscribed');
        is_subscribed = div.hasClass('subscribed');
        $(this).attr('aria-checked', is_subscribed ? 'true' : 'false');
        me.triggerEvent('subscribe', { id: id, subscribed: is_subscribed, item: li });

        // update subscribe state of all 'virtual user' child folders
        if (li.hasClass('other user')) {
            $('ul li > div', li).each(function() {
                $(this)[is_subscribed ? 'addClass' : 'removeClass']('subscribed');
                $('.subscribed', div).attr('aria-checked', is_subscribed ? 'true' : 'false');
            });
            div.removeClass('partial');
        }
        // propagate subscription state to parent  'virtual user' folder
        else if (li.closest('li.other.user').length) {
            parent_subscription_status(li);
        }

        e.stopPropagation();
        return false;
    });

    this.container.on('click', 'a.remove', function(e) {
        var li = $(this).closest('li'),
            id = li.attr('id').replace(new RegExp('^'+p.id_prefix), '');

        if (me.is_search()) {
            id = id.replace(/--xsR$/, '');
            li = $(me.get_item(id, true));
        }

        if (p.id_decode)
            id = p.id_decode(id);

        me.triggerEvent('remove', { id: id, item: li });

        e.stopPropagation();
        return false;
    });
}

// link prototype from base class
if (window.rcube_treelist_widget) {
    kolab_folderlist.prototype = rcube_treelist_widget.prototype;
}


window.rcmail && rcmail.addEventListener('init', function(e) {
    var loading_lock;

    if (rcmail.env.task == 'mail') {
        rcmail.register_command('kolab-mail-history', function() {
            var dialog, uid = rcmail.get_single_uid(), rec = { uid: uid, mbox: rcmail.get_message_mailbox(uid) };
            if (!uid || !window.libkolab_audittrail) {
                return false;
            }

            // render dialog
            $dialog = libkolab_audittrail.object_history_dialog({
                module: 'libkolab',
                container: '#mailmessagehistory',
                title: rcmail.gettext('objectchangelog','libkolab')
            });

            $dialog.data('rec', rec);

            // fetch changelog data
            loading_lock = rcmail.set_busy(true, 'loading', loading_lock);
            rcmail.http_post('plugin.message-changelog', { _uid: rec.uid, _mbox: rec.mbox }, loading_lock);

        }, rcmail.env.action == 'show');

        rcmail.addEventListener('plugin.message_render_changelog', function(data) {
            var $dialog = $('#mailmessagehistory'),
                rec = $dialog.data('rec');

            if (data === false || !data.length || !rec) {
              // display 'unavailable' message
              $('<div class="notfound-message dialog-message warning">' + rcmail.gettext('objectchangelognotavailable','libkolab') + '</div>')
                  .insertBefore($dialog.find('.changelog-table').hide());
              return;
            }

            data.module = 'libkolab';
            libkolab_audittrail.render_changelog(data, rec, {});
        });

        rcmail.env.message_commands.push('kolab-mail-history');
    }

    if (rcmail.env.action == 'get-attachment') {
        if (rcmail.gui_objects.attachmentframe) {
            rcmail.gui_objects.messagepartframe = rcmail.gui_objects.attachmentframe;
            rcmail.enable_command('image-scale', 'image-rotate', !!/^image\//.test(rcmail.env.mimetype));
            rcmail.register_command('print-attachment', function() {
                var frame = rcmail.get_frame_window(rcmail.gui_objects.attachmentframe.id);
                if (frame) frame.print();
            }, true);
        }

        if (rcmail.env.attachment_download_url) {
            rcmail.register_command('download-attachment', function() {
                rcmail.location_href(rcmail.env.attachment_download_url, window);
            }, true);
        }
    }
});
