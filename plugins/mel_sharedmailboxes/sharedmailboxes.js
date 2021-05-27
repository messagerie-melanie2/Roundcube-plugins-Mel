// Gérer les interractions sur les dossiers pour afficher les non lus
if (window.rcmail) {
    // Initialisation
    rcmail.addEventListener('init', function(evt) {
        if (rcmail.treelist) {
            rcmail.treelist.addEventListener('collapse', function(node) {
                if (rcmail.env.folders_display != 'unified' && node.classes.includes('boite')) {
                    folder_collapse(node.id);
                }
                else if (rcmail.env.folders_display == 'unified' && node.classes.includes('virtual') && (
                    node.classes.includes('inbox') || node.classes.includes('drafts') || node.classes.includes('models') ||
                    node.classes.includes('sent') || node.classes.includes('junk') || node.classes.includes('trash')
                )) {
                    folder_collapse_unified(node.id);
                }
            });
            rcmail.treelist.addEventListener('expand', folder_expand);
        }
    }); 
    // After getcount
    rcmail.addEventListener('responseafter', function(evt) {
        if ((evt.response.action == 'getunread' 
                    || evt.response.action == 'refresh' 
                    || evt.response.action == 'mark' 
                    || evt.response.action == 'list')
                && rcmail.treelist) {
            // Parcourir tous les dossiers collapsé
            if (rcmail.env.folders_display == 'unified') {
                $('#mailboxlist > .mailbox.virtual').each(function() {
                    if (!$(this).hasClass('boite') && $(this).find('> div.treetoggle').hasClass('collapsed')) {
                        var node_id = rcmail.html_identifier_decode($(this).attr('id').replace(/rcmli/, ''));
                        folder_collapse_unified(node_id);
                    }
                    else if ($(this).hasClass('inbox')) {
                        var node_id = rcmail.html_identifier_decode($(this).attr('id').replace(/rcmli/, ''));
                        folder_count_unified(node_id);
                    }
                });
            } else {
                var count = 0;
                $('#mailboxlist > .mailbox.boite.virtual').each(function() {
                    var node_id = rcmail.html_identifier_decode($(this).attr('id').replace(/rcmli/, ''));
                    if ($(this).find('> div.treetoggle').hasClass('collapsed')) {
                        res = folder_collapse(node_id);
                        if (res) {
                            count += res;
                        }
                    }
                    else {
                        res = folder_count(node_id);
                        if (res) {
                            count += res;
                        }
                    }
                });
                // Positionner le title
                if (count) {
                    set_title(count);
                }
            }
        }
    }); 
}

/**
 * Positionne le count dans le titre
 * 
 * @param integer count
 */
function set_title(mycount) {
    // set unread count to window title
    reg = /^\([0-9]+\)\s+/i;
    var new_title = '',
        doc_title = String(document.title);

    if (mycount && doc_title.match(reg))
        new_title = doc_title.replace(reg, '('+mycount+') ');
    else if (mycount)
        new_title = '('+mycount+') '+doc_title;
    else
        new_title = doc_title.replace(reg, '');

    rcmail.set_pagetitle(new_title);
}

/**
 * Fonction collapse du dossier unifiés pour traitement
 * @param string node_id 
 */
function folder_collapse_unified(node_id) {
    const li = rcmail.get_folder_li(node_id, '', true);
    var count = 0;
    $(li).find(' > ul > .mailbox').each(function() {
        const child_id = rcmail.html_identifier_decode($(this).attr('id').replace(/rcmli/, ''));
        if (rcmail.env.unread_counts[child_id]) {
            count += rcmail.env.unread_counts[child_id];
        }
    });
    rcmail.env.unread_counts[node_id] = count;
    rcmail.set_unread_count_display(node_id, node_id == 'virtualINBOX');
}

/**
 * Fonction count du dossier unifiés pour traitement
 * @param string node_id 
 */
 function folder_count_unified(node_id) {
    const li = rcmail.get_folder_li(node_id, '', true);
    var count = 0;
    $(li).find(' > ul > .mailbox').each(function() {
        const child_id = rcmail.html_identifier_decode($(this).attr('id').replace(/rcmli/, ''));
        if (rcmail.env.unread_counts[child_id]) {
            count += rcmail.env.unread_counts[child_id];
        }
    });
    set_title(count);
}

/**
 * Fonction collapse du dossier pour traitement
 * @param string node_id 
 */
 function folder_collapse(node_id) {
    const li = rcmail.get_folder_li(node_id, '', true);
    const child_id = rcmail.html_identifier_decode(li.querySelector('.mailbox.inbox').id.replace(/rcmli/, ''));
    const count = rcmail.env.unread_counts[child_id];
    rcmail.env.unread_counts[node_id] = count;
    rcmail.set_unread_count_display(node_id, false);
    return count;
}

/**
 * Fonction pour compter les non lus du dossier
 * @param string node_id 
 */
 function folder_count(node_id) {
    const li = rcmail.get_folder_li(node_id, '', true);
    const child_id = rcmail.html_identifier_decode(li.querySelector('.mailbox.inbox').id.replace(/rcmli/, ''));
    const count = rcmail.env.unread_counts[child_id];
    return count;
}

/**
 * Fonction expand du dossier pour traitement
 * @param {} node 
 */
 function folder_expand(node) {
    if (node.classes.includes('virtual')) {
        rcmail.env.unread_counts[node.id] = null;
        rcmail.set_unread_count_display(node.id, false);
    }
}