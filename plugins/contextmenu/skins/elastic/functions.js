/**
 * ContextMenu plugin script
 *
 * @licstart  The following is the entire license notice for the
 * JavaScript code in this file.
 *
 * Copyright (C) Philip Weir
 *
 * The JavaScript code in this page is free software: you can redistribute it
 * and/or modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation, either version 3 of
 * the License, or (at your option) any later version.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 */

// Détection du dossier Modèles
rcube_webmail.prototype.is_templates_folder = function(folder)
{
    const name = folder || '';
    const templates_names = ['Templates', 'Modèles', 'Mod&AOg-les'];

    return templates_names.some(function(t) {
        return name === t
            || name.endsWith('/' + t)
            || name.endsWith('.' + t);
    });
};

$(document).ready(function() {
    if (window.rcmail) {
        // PAMELA - ouverture au survol des sous-menus "Télécharger" / "Déplacer" / "Copier vers" (folder-selector)
        rcmail.contextmenu.skin_funcs.popup_hover = function(ref, a) {
            var popups = {
                    'download': {
                        menu: 'zipdownload-menu',
                        open: function(el, evt) {
                            if (typeof rcmail_zipdownload_menu === 'function')
                                rcmail_zipdownload_menu(evt);
                        }
                    },
                    'move': {
                        menu: 'folder-selector',
                        open: function(el, evt) { rcmail.command('move', '', el, evt, true); }
                    },
                    'copy': {
                        menu: 'folder-selector',
                        open: function(el, evt) { rcmail.command('copy', '', el, evt, true); }
                    }
                },
                state = rcmail.contextmenu.vars.popup_hover || (rcmail.contextmenu.vars.popup_hover = { el: null, menu: null }),
                // L'élément avec une classe rcm_elem_ : le menu contextuel reste ouvert à la fermeture du popup
                make_event = function(el) { return $.Event('mouseover', { target: el, currentTarget: el }); },
                is_open = function(menu) { return !!menu && $.inArray(menu, rcmail.contextmenu.vars.popup_menus) >= 0; },
                is_open_for = function(el) { return state.el === el && is_open(state.menu); },
                is_active = function(el) { return $(el).is('.' + rcmail.contextmenu.settings.classes.button_active.replace(/ /g, ', .')); },
                close = function(el) {
                    if (is_open(state.menu)) {
                        rcmail.hide_menu(state.menu, make_event(el));
                    }
                    state.el = state.menu = null;
                },
                popup = popups[a.data('command')],
                events;

            if (popup) {
                a.on('mouseover', function() {
                    var el;

                    if (ref.mouseover_timeout < 0)
                        return;

                    el = this;
                    clearTimeout(ref.timers['popup_hover']);
                    ref.timers['popup_hover'] = window.setTimeout(function() {
                        if (!is_active(el) || !$(el).is(':visible') || is_open_for(el))
                            return;

                        close(el);
                        state.el = el;
                        state.menu = popup.menu;
                        popup.open(el, make_event(el));
                    }, ref.mouseover_timeout);
                })
                .on('mouseout', function() {
                    clearTimeout(ref.timers['popup_hover']);
                })
                .on('click', function(e) {
                    clearTimeout(ref.timers['popup_hover']);

                    // popup déjà ouvert par le survol : ne pas le fermer/réouvrir au clic
                    if (is_open_for(this)) {
                        e.stopImmediatePropagation();
                        return false;
                    }

                    state.el = this;
                    state.menu = popup.menu;
                });

                // le gestionnaire de clic doit passer avant celui du plugin contextmenu
                events = $._data(a[0], 'events');
                if (events && events.click && events.click.length > 1) {
                    events.click.unshift(events.click.pop());
                }
            }
            else if (ref.is_submenu) {
                // survol d'un autre élément du même sous-menu : fermer le popup ouvert
                a.on('mouseover', function() {
                    var el;

                    if (ref.mouseover_timeout < 0)
                        return;

                    el = this;
                    clearTimeout(ref.timers['popup_hover']);
                    ref.timers['popup_hover'] = window.setTimeout(function() { close(el); }, ref.mouseover_timeout);
                })
                .on('mouseout', function() {
                    clearTimeout(ref.timers['popup_hover']);
                });
            }
        };

        $.extend(true, rcmail.contextmenu.settings, {
            popup_attrib: 'data-popup',
            popup_func: "rcm_popup_wrapper('$2');",
            popup_pattern: /rcm_popup_wrapper\(\x27([^\x27]+)\x27|^([a-z0-9\-]+)$/i,
            classes: { container: 'contextmenu', button_remove: '', modal_overlay: 'popover-overlay' },
            menu_defaults: {
                modal: true,
                classes: {
                    ul: 'menu listing',
                    a: 'button rcmbutton',
                    sub_button_a: 'rcmsubbutton',
                    sub_button_span: null
                }
            },
            global_events: {
                'init': function(p) {
                    var label, title, class_name, header;

                    if (!p.ref.is_submenu) {
                        label = 'close';
                        title = window.rcmail.gettext(label);
                        class_name = 'button icon cancel';

                        header = $('<h3>').addClass('popover-header')
                            .append($('<a>').attr('class', class_name).text(title))
                            .on('click', function(e) {
                                rcmail.contextmenu.hide_all(e, $('div.contextmenu').filter(':visible').length >= 1);
                            });

                        $(p.ref.container).addClass('popover').prepend(header).children('ul').wrap($('<div>').addClass('popover-body'));
                    }
                    else {
                       p.ref.skinable = true;
                    }
                },
                'insertitem': function(p) {
                    var elem = p.originalElement, a = p.item.children('a');

                    if (elem.attr('data-popup') || elem.attr('aria-haspopup')) {
                        a.data('level', (p.ref.parents + 2));
                        a.attr('aria-haspopup', true);
                    }

                    // PAMELA - sous-menus Télécharger / Déplacer vers / Copier vers, ouverture au survol
                    if (rcmail.env.task === 'mail' && p.ref.list_object ==='message_list') {
                        rcmail.contextmenu.skin_funcs.popup_hover(p.ref, a);
                    }
                },
                'beforeactivate': function(p) {
                    // force toolbar display on small screens while the contextmenu renders
                    if (!$('#layout-content').is(':visible'))
                        $('#layout-content').addClass('contextmenu_content');

                    // do not show submenus on mouseover for small screens
                    p.ref.mouseover_timeout = $('html').is('.layout-small,.layout-phone') ? -1 : rcmail.env.contextmenu_mouseover_timeout;
                },
                'afteractivate': function() {
                    $('#layout-content').removeClass('contextmenu_content');
                },
                'submenu_toggle': function(p) {
                    var matches, source_id;
                    if ($(p.id).length > 0 && (matches = p.id.match(/^(#[^\s]+(\s>\s\.[a-z]+\s>)?(\sdiv)?)/)) && p.id.indexOf('#taskmenu') == -1) {
                        source_id = matches[1];

                        // make sure its a real submenu and not the toolbar on a small screen
                        if ($(source_id).is('div') && !$(source_id).hasClass('footer')) {
                            $(source_id)[p.show ? 'show' : 'hide']();
                            $(source_id)[p.show ? 'removeClass' : 'addClass']('hidden');
                        }
                    }
                },
                'hide_menu': function(p) {
                    // Hide Bootstrap popover styled sub menus
                    $.each(p.ref.submenus, function() {
                        var container, popup, button;

                        if (this.container.parents('.popover.show').length == 1) {
                            container = this.container.parents('.popover.show');
                            popup = $('.popover-body', container);
                            button = popup.children().first().data('button');

                            if (button && p.originalEvent.target != button && !$(button).find(p.originalEvent.target).length && typeof button !== 'string') {
                                $(button).popover('hide');
                            }

                            if (!button) {
                                $(container).remove();
                            }
                        }
                    });
                }
            }
        });

        // Remove any tooltips added to menu elements by Elastic UI JS
        rcmail.addEventListener('enable-command', function() { $('div.contextmenu').find('a.rcmbutton').removeAttr('title'); });

        // Ensure menus are always hidden when opening a dialog box (#114)
        rcmail.addEventListener('dialog-open', function() { rcmail.contextmenu.hide_all(event, false, true); });

        if (rcmail.env.task == 'mail' && rcmail.env.action == '') {
            rcmail.addEventListener('insertrow', function(props) { rcmail.contextmenu.init_list(props.row.id, {'menu_name': 'messagelist', 'menu_source': '#toolbar-menu > li'}); } );
            rcmail.add_onload("rcmail.contextmenu.init_folder('#mailboxlist li', {'menu_source': ['#rcmfolder-menu > ul', '#mailboxoptions-menu > ul > li']})");
        }
        else if (rcmail.env.task == 'addressbook' && rcmail.env.action == '') {
            // on small screens the compose button is not visible so use rcm-active class to ensure it shows up in the menu
            $('#taskmenu > span > a.compose').addClass('rcm-active');
            rcmail.addEventListener('insertrow', function(props) { rcmail.contextmenu.init_list(props.row.id, {'menu_name': 'contactlist', 'menu_source': ['#taskmenu > span > a.compose', '#toolbar-menu > li'], 'list_object': 'contact_list'}); } );
            rcmail.add_onload("rcmail.contextmenu.init_addressbook('#directorylist li, #savedsearchlist li', {'menu_source': '#groupoptions-menu > ul > li'})");
            rcmail.addEventListener('group_insert', function(props) { rcmail.contextmenu.init_addressbook(props.li, {'menu_source': '#groupoptions-menu > ul > li'}); } );
            rcmail.addEventListener('abook_search_insert', function(props) { rcmail.contextmenu.init_addressbook(rcmail.savedsearchlist.get_item('S' + props.id), {'menu_source': '#groupoptions-menu > ul > li'}); } );
        }
        else if (rcmail.env.task == 'settings') {

            // Protection du bouton supprimer pour le dossier Modèles
            rcmail.addEventListener('init', function() {
                if (rcmail.subscription_list) {
                    rcmail.subscription_list.addEventListener('select', () => {
                        rcmail.enable_command('delete-folder', !rcmail.is_templates_folder(rcmail.env.mailbox));
                    });
                }
            });

            rcmail.contextmenu.settings_menus([
                {'obj': 'settings-menu li', 'props': {'menu_name': 'settingslist', 'menu_source': '#rcmsettings-menu > ul', 'init_func': 'init_settings'}},
                {'obj': 'sections-table tr', 'props': {'menu_name': 'preferenceslist', 'menu_source': '#rcmsettings-menu > ul', 'list_object': 'sections_list'}},
                {'obj': 'subscription-table li', 'props': {'menu_name': 'folderlist', 'menu_source': ['#rcmfolder-menu > ul', '#rcmsettings-menu > ul', '#toolbar-menu'], 'list_object': 'subscription_list', 'init_func': 'init_settings'}},
                {'obj': 'identities-table tr', 'props': {'menu_name': 'identiteslist', 'menu_source': ['#rcmsettings-menu > ul', '#toolbar-menu'], 'list_object': 'identity_list'}},
                {'obj': 'responses-table tr', 'props': {'menu_name': 'responseslist', 'menu_source': ['#rcmsettings-menu > ul', '#toolbar-menu'], 'list_object': 'responses_list'}},
                {'obj': 'filtersetslist tr', 'props': {'menu_name': 'managesievesetlist', 'menu_source': ['#rcmsettings-menu > ul', '#filterset-menu > ul > li'], 'list_object': 'filtersets_list'}},
                {'obj': 'filterslist tr', 'props': {'menu_name': 'managesieverulelist', 'menu_source': ['#rcmsettings-menu > ul', '#toolbar-menu'], 'list_object': 'filters_list'}},
                {'obj': 'keys-table tr', 'props': {'menu_name': 'enigmakeylist', 'menu_source': ['#rcmsettings-menu > ul', '#toolbar-menu'], 'list_object': 'keys_list', 'list_id': 'keys-table'}}
            ]);
        }
    }
});