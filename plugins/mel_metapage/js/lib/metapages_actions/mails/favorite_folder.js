import { MelEnumerable, MelKeyValuePair } from "../../classes/enum.js";
import { EMPTY_STRING } from "../../constants/constants.js";
import { BnumConnector } from "../../helpers/bnum_connections/bnum_connections.js";
import { JsHtml } from "../../html/JsHtml/JsHtml.js";
import { MelObject } from "../../mel_object.js";
import { WaitSomething } from "../../mel_promise.js";
import { MailModule } from "./mail_modules.js";

class tree {
    constructor() {
        this.childs = {};
        this.full_path = '';

        Object.defineProperty(this, 'full_path', {
            get: () => {
                let path = '';

                if (!!this.parent) path += this.parent.full_path;

                path += `${!!this.parent && this.parent.full_path === '' ? '' : '/'}${this.id}`;

                return path.replace('/undefined', EMPTY_STRING);
            }
        });
    }

    /**
     * 
     * @param {treeElement} child 
     */
    addChild(child) {
        child.parent = this;
        this.childs[child.id] = child;
        return this.childs[child.id];
    }

    updateChild(id, config) {
        for (const key in config) {
            if (Object.hasOwnProperty.call(config, key)) {
                const element = config[key];
                this.childs[id][key] = element;
            }
        }

        return this.childs[id];
    }

    childExist(id) {
        return !!this.childs[id];
    }

    hasChildren() {
        return Object.keys(this.childs).length > 0;
    }

    *[Symbol.iterator]() {
        for (const key in this.childs) {
            if (Object.hasOwnProperty.call(this.childs, key)) {
                const element = this.childs[key];
                yield element;
            }
        }
    };
}

class treeElement extends tree {
    constructor(id, expended) {
        super();
        this.id = id;
        this.expended = expended;
        this.parent = null;

        this.name = '';

        Object.defineProperty(this, 'name', {
            get: () => {
                if (rcmail.env.current_user.full === this.id) return this.id;
                else if (this.id === 'INBOX') return 'Courrier entrant';
                else if (this.full_path.includes(rcmail.env.current_user.full)) return rcmail.env.mailboxes[this.full_path.replace(`${rcmail.env.current_user.full}/`, '')]?.name ?? 'error';
                else return rcmail.env.mailboxes[this.get_full_path()]?.name ?? 'error';
            }
        });

        this.full_id = '';
        Object.defineProperty(this, 'full_id', {
            get: () => {
                let path = '';

                if (!!this.parent) path += this.parent.full_id;

                path += `${!!this.parent && this.parent.full_id === '' ? '' : '/'}${this.id}`;

                return path.replace('/undefined', EMPTY_STRING).replace('undefined/', EMPTY_STRING).replace(`${rcmail.env.current_user.full}/`, '').replace(`${rcmail.env.username}.-.`, `${this.balp()}/`);
            }
        });
    }

    balp() {
        if (!this.balp.const) this.balp.const = new MailModule().balp();

        return this.balp.const;
    }

    get_full_path(){
        const path = this.full_path;

        if (path.includes('.-.') && path.split('/').length > 1) return this.balp() + '/' + path.split('.-.')[1];
        else return path;
    }
}

class MailElement extends MelObject {
    constructor(event) {
        super(event);
    }

    main(event) {
        this._init(event);
    }

    _init(event) {
        this.target = $(event.currentTarget);
        this.group = this.target.parent().find('ul').first();
        this.rel = '';
        this.relative_path = '';

        Object.defineProperty(this, 'rel', {
            get: () => {               
                return this.target.parent().attr('rel');
            }
        });

        Object.defineProperty(this, 'relative_path', {
            get: () => {
                let rel = this.rel;
                if (rel.includes('favourite')) rel = rel.replace('favourite/', '');
                if (rel.includes(this.get_env('current_user').full)) rel = rel.replace(`${this.get_env('current_user').full}/`, '');
                if (rel.includes(this.balp()) && rel.includes('INBOX')) rel = rel.replace('/INBOX', '');   
                
                return rel
            }
        });
    }

    balp() {
        if (!this.balp.const) this.balp.const = new MailModule().balp();

        return this.balp.const;
    }

    is_expand() {
        return this.target.hasClass('expanded');
    }

    toggle() {
        let collapsed = true;

        if (this.is_expand()) this.collapse();
        else {
            collapsed = false;
            this.expand();
        }

        BnumConnector.connect(BnumConnector.connectors.mail_toggle_display_folder, {
            params:{
                        _value:this._update_favorite_collapsed_folder(this.rel, collapsed)
                    }
            }
        );
    }

    _update_favorite_collapsed_folder(item, state) {
        let collapsed_folders = this.get_env('favorite_folders_collapsed') || '';

        if (collapsed_folders.includes('&&')) collapsed_folders = collapsed_folders.split('&&');
        else if (collapsed_folders !== '') collapsed_folders = [collapsed_folders];
        else collapsed_folders = [];

        if (state) collapsed_folders.push(item);
        else collapsed_folders = collapsed_folders.filter(x => x !== item);

        collapsed_folders = collapsed_folders.join('&&');

        rcmail.env.favorite_folders_collapsed = collapsed_folders;

        return collapsed_folders;
    }

    collapse() {
        this.target.parent().css('margin-bottom', '3px');
        this.target.removeClass('expanded').addClass('collapsed');
        this.group.hide();
    }

    expand() {
        this.target.parent().css('margin-bottom', '10px');
        this.target.removeClass('collapsed').addClass('expanded');
        this.group.show();
    }
}

export class MailFavoriteFolder extends MailModule {
    constructor() {
        super();
    }

    main() {
        super.main();

        if (!['', 'index'].includes(rcmail.env.action)) return;

        this.unreads = undefined;

        const rcmail_folder_selector = rcmail.folder_selector;

        rcmail.folder_selector = function(...args) {
            //Si il y a des favoris
            if (!!this.env.favorites_folders && Object.keys(this.env.favorites_folders).length > 0) {
                //Text constants
                const balp = new MailModule().balp();
                //Variables "sauvegardées"
                const base_mailboxes = this.env.mailboxes; 
                const base_list = this.env.mailboxes_list;
    
                //Génération de l'énumerable de favoris
                let favourites = MelEnumerable.from(this.env.favorites_folders).where(x => true === x.value || true === x?.value?.selected).select(x => x.key);

                //Ajout des favoris manquant pour la structure
                if (favourites.any(x => !x.includes(balp))) favourites = favourites.aggregate([this.env.username]);

                if (favourites.any(x => x.includes(balp))) {
                    let mainboxes = [];
                    for (const iterator of favourites.where(x => x.includes(balp))) {
                        var box = iterator.replace(`${balp}/`, `${this.env.username}.-.`).split('/')[0];

                        if (!mainboxes.includes(box)) mainboxes.push(box);
                    }

                    box = null;

                    if (mainboxes.length > 0) favourites = favourites.aggregate(mainboxes);
                }

                //Ajout de la mailbox "favourite" pour pas que ça plante
                this.env.mailboxes['favourite'] = {
                    class: "boite",
                    id: "favourites",
                    name: "Favoris",
                    virtual: true
                }
                
                this.env.mailboxes_list = ['favourite', 
                                                ...MelEnumerable.from(favourites).orderBy(x => this.env.mailboxes_list.findIndex(r => r === x)), 
                                                ...this.env.mailboxes_list];
                const rvalue = rcmail_folder_selector.call(this, ...args);

                /**
                 * Met à jour l'indentation des dossier en fonction si ses dossiers parents sont présents ou non
                 * @param {*} mb 
                 * @returns 
                 */
                let get_indent_correction = (mb) => {
                    var tmp = '';
                    let rlen = 0;

                    if (mb.includes('/')) {
                        let splited = mb.split('/');
                        let totest = [mb];

                        //Génération du tableau de la liste des dossiers parents
                        while (totest.length < splited.length) {
                            tmp = '';

                            for (let index = 0, len = splited.length; index < len; ++index) {
                                const element = splited[index];
                                tmp += `${index === 0 ? '' : '/'}${element}`;

                                if (index + 1 < len && totest.includes(`${tmp}/${splited[index + 1]}`)) {
                                    totest.push(tmp);
                                    break
                                };
                            }
                        }

                        //On vérifie si il existe, sinon, on change son indentation
                        for (let index = 0, len = totest.length; index < len; ++index) {
                            const element = totest[index];
                            
                            if (!favourites.contains(element)) rlen -= 16;
                        }
                    }

                    tmp = null;

                    return rlen + (mb.includes(balp) ? (mb.split('/').length > 2 ? 0 : 16) : 0);
                };

                //Promise pour attendre que `folder-selector` soit chargé
                new Promise(async (ok, nok) => {
                    
                    await new WaitSomething(() => {
                        return $('#folder-selector').length > 0;
                    });

                    let $folder = $('#folder-selector');
                    for (const iterator of favourites) {
                        //On prend ceux dont le nom existe et qui n'on pas été traité, seulement le premier que l'on trouve pour ne pas indenter tout le monde.
                        var folder = $folder.find('span').filter(function() {
                            return $(this).text() ===  rcmail.env.mailboxes[iterator].name && !$(this).hasClass('favourite-traited');
                        }).first().addClass('favourite-traited').parent();

                        //MAJ DU PADDING
                        if (!!folder)
                        {
                            folder.css('padding-left', `${+folder.css('padding-left').replace('px', '') + 
                                                          (rcmail.env.mailboxes[iterator].id.includes(balp) || rcmail.env.mailboxes[iterator].id.includes(rcmail.env.username) ? 16 : 32) + 
                                                          get_indent_correction(rcmail.env.mailboxes[iterator].id)}px`);
                        }
                    }

                    //Libération des variables
                    folder = null;
                    get_indent_correction = null;

                    ok();
                });

                //On remet les anciennes valeurs
                this.env.mailboxes = base_mailboxes;
                this.env.mailboxes_list = base_list;

                return rvalue;
            }
            else {
                return rcmail_folder_selector.call(this, ...args);
            }
        };

        const rcmail_drag_move = rcmail.drag_move;

        rcmail.drag_move = function(e) {
            rcmail_drag_move.call(this, e);

            if (null === this.env.last_folder_target) {
                let $parent = $(e.target);

                while(!$parent.attr('mailid') && $parent.length > 0 && $parent[0].tagName !== 'BODY') {
                    $parent = $parent.parent();
                }

                let mailid = $parent.attr('mailid');

                if (!!mailid) {
                    if (mailid.includes(new MailModule().balp())) {
                        if (mailid.split('/').length === 2) return;
                        else mailid = mailid.replace('/INBOX', '');
                    }
                    else if (mailid === this.env.current_user.full) return;

                    if (this.env.last_folder_target !== $(`[rel="${mailid}"]`))  $('#favorite-folders .droptarget').removeClass('droptarget');

                    if (!!mailid) {
                        $parent.addClass('droptarget')
                        this.env.last_folder_target = mailid;
                    }
                    else {
                        this.env.last_folder_target = null;
                    }
                }
                else {
                    $('#favorite-folders .droptarget').removeClass('droptarget');
                    this.env.last_folder_target = null;
                }

            }
        };

        const rcmail_drag_end = rcmail.drag_end;
        rcmail.drag_end = function(e) {
            rcmail_drag_end.call(this, e);
            $('#favorite-folders .droptarget').removeClass('droptarget');
        };

        const rcmail_msglist_dbl_click = rcmail.msglist_dbl_click;

        rcmail.msglist_dbl_click = (...args) => {
            rcmail_msglist_dbl_click.call(rcmail, ...args);

            setTimeout(() => {
                this._update_unreads();
            }, 30*1000);
        }

        const rcmail_msglist_select = rcmail.msglist_select;

        rcmail.msglist_select = (...args) => {
            rcmail_msglist_select.call(rcmail, ...args);

            setTimeout(() => {
                this._update_unreads();
            }, 30*1000);
        }

        this.main_async();
        this.setup_command();
    }

    async main_async() {
        await this.startup();
        await this.startup_context_menu();
        await this._update_favorites();

        if (!this.unreads && !!this.get_env('unread_counts')) this.unreads = this.get_env('unread_counts');
        this._setup_listeners();

        this.load_finished = true;
    }

    _setup_listeners() {
        this.rcmail().addEventListener('responseaftergetunread', () => {
            this.unreads = this.get_env('unread_counts');
            this._update_unreads();
        });
        this.rcmail().addEventListener('responseafterlist', () => {
            this._update_selected();
            this._update_unreads();
        });
        this.rcmail().addEventListener('responseaftermark', () => {
            this._update_unreads();
        });
        this.rcmail().addEventListener('responseaftercheck-recent', () => {
            this._update_unreads();
        });
        this.rcmail().addEventListener('responseafterpurge', () => {
            this._update_unreads();
        });
        this.rcmail().addEventListener('mel_metapage_refresh', async () => {
            await this.get_favorites_from_serv();
            await this._update_favorites();
            this._update_unreads();
            this._update_selected();
            this.rcmail().triggerEvent('favorite_folder_updated');
        });
        this._update_unreads();
        this._update_selected();
    }

    _update_selected() {
        const current_mbox = this.get_env('mailbox'); 
        let $element = $(`[mailid="${current_mbox}"]`);

        if (current_mbox.includes(this.balp()) && current_mbox.split('/').length === 2) {
            $element = $(`[mailid="${current_mbox}/INBOX"]`);
        }
        
        $('#favorite-folders .selected').removeClass('selected');

        if ($element.length > 0) {
            $element.addClass('selected');
        }
    }

    _update_unreads() {
        const unreads = Object.keys(this.unreads ?? {});

        if (unreads.length > 0) {
            const unread_count = this.get_env('unread_counts');
            for (let index = 0, len = unreads.length; index < len; ++index) {
                const key = unreads[index];
                const count = unread_count[key];
                
                var rel = $(`[rel="${this._toRel(key)}"]`);

                if (rel.length > 0) {
                    rel.find('.unreadcount').first().text(count || '');
                }

            }
        }

        this._update_count_collapsed();
    }

    _get_folder_class(id) {
        if (id === this.get_env('current_user').full) id = this.get_env('username');

        return this.rcmail().env.mailboxes?.[id]?.class ?? '';
    }

    _toRel(key) {
        if (key.includes(this.balp())) {
            if (key.split('/').length === 2) {
                key = key + '/INBOX';
            }
        }
        else key =  rcmail.env.current_user.full + '/' + key;
        
        return 'favourite/' + key;
    }

    _update_count_collapsed() {
        const $current = $(`.treetoggle.collapsed`);

        for (const iterator of $current) {
            this._update_current_count_collapsed($(iterator));
        }
    }

    _update_current_count_collapsed($current) {
        if ($current.hasClass('treetoggle')) $current = $current.parent();

        if ($current.find('.treetoggle').first().hasClass('collapsed')) {
            let count = parseInt($current.find('.unreadcount').first().text()) || 0;

            var $it;
            for (const iterator of $current.find('.unreadcount')) {
                $it = $(iterator);
                if ($it.parent().parent().find('.treetoggle').first().hasClass('collapsed')) continue;

                count += (+($it.text()));
            }

            $current.find('.unreadcount').first().text(count || '');
        }
        else $current.find('.unreadcount').first().text('');
    }

    async startup() {
        (await this.await_folder_list_content()).find('a.sidebar-menu').on('shown.bs.popover', (event) => {
            this._set_link(this.current_folder());
        });
    }

    async startup_context_menu() {
        (await this.await_folder_list_content()).find('#mailboxlist a').on('contextmenu', (...args) => {
            const [event] = args;
            const folder = $(event.currentTarget).attr('rel');

            this._set_link(folder);
        });
    }

    _set_link(folder) {
        const current_folder = folder;

        if (!!current_folder) {
            let $link = $('.popover .folder-to.favorite').show().removeClass('disabled').addClass('active').removeClass('unset-to');

            const favorites_folders = this.get_env('favorites_folders');
            if (!!favorites_folders) {
                if (!!favorites_folders[current_folder]) {
                    $link.find('span.inner').text(this.gettext('unset-to-favorite', 'mel_metapage')).data('favorite', true).data('rel', current_folder).parent().addClass('unset-to');
                }
                else {
                    $link.find('span.inner').text(this.gettext('set-to-favorite', 'mel_metapage')).data('favorite', false).data('rel', current_folder);
                }
            }
            else $link.find('span.inner').text(this.gettext('set-to-favorite', 'mel_metapage')).data('favorite', false).data('rel', current_folder);
        }
        else {
            $('.popover .folder-to.favorite').hide();
        }
    }

    async _erase_errors() {
        let $list_content = (await this.await_folder_list_content());
        let favs = this.get_env('favorites_folders')

        for (const key in favs) {
            if (Object.hasOwnProperty.call(favs, key)) {
                //const element = favs[key];
                if ($list_content.find(`[rel="${key}"]`).length === 0) delete favs[key];
            }
        }

        rcmail.env.favorites_folders = favs;
    }

    async _update_favorites() {
        if ($('#favorite-folders').length === 0) {
            (await this.await_folder_list_content()).before($('<div>').attr('id', 'favorite-folders').css('padiing-left', '20px'));
        }

        $('#favorite-folders').html('');

        await this._erase_errors();

        const tree = this._generate_favorite_tree();

        if (tree.hasChildren()) {
            const html = this._create_html_tree(tree).generate();

            $('#favorite-folders').css('margin-top', 'var(--settings-mail-first-folder-margin-top)').html(html);
    
            $('#mailboxlist').before($('#favorite-folders')).find('li').first().css('margin-top', 0);
        }
    }

    _generate_favorite_tree() {
        const favorites_folders = this.get_env('favorites_folders');

        let favorite_tree = new tree();
        for (const iterator of MelEnumerable.from(favorites_folders).orderBy((x) =>  rcmail.env.mailboxes_list.findIndex(a => a === x.key)).select(x => new MelKeyValuePair(x.key.replace(`${this.balp()}/`, `${this.balp()}\\`), x.value))) {
            this._generate_favorite_tree_element(favorite_tree, iterator);
        }

        return favorite_tree;
    }

    /**
     * 
     * @param {tree | treeElement} tree 
     * @param {*} iterator 
     */
    _generate_favorite_tree_element(tree, iterator) {
        iterator.full_path = iterator.key + '';
        iterator.key_splited = iterator.full_path.split('/');

        for (let index = 0, len = iterator.key_splited.length; index < len; ++index) {
            var element = iterator.key_splited[index];
            const expended = (len - 1 === index ? (iterator.value.expanded ?? true) : true);

            if (element.includes(this.balp())) {
                iterator.balp = `${rcmail.env.username}.-.${element.replace(`${this.balp()}\\`, '')}`;

                if (!tree.childExist(iterator.balp)) tree = tree.addChild(new treeElement(iterator.balp, true));
                else tree = tree.childs[iterator.balp];

                element = element.replace('\\', '/');
                if (iterator.key_splited.length === 1) element = 'INBOX';
                else continue;
            }
            else if (0 === index){
                if (!tree.childExist(rcmail.env.current_user.full)) tree = tree.addChild(new treeElement(rcmail.env.current_user.full, true));
                else tree = tree.childs[rcmail.env.current_user.full];
            }

            if (!tree.childExist(element))  tree = tree.addChild(new treeElement(element, expended));
            else tree = tree.updateChild(element, {expended});
        }
    }

    _is_collapsed_rel(rel) {
        let collapsed_folders = this.get_env('favorite_folders_collapsed') || '';

        if (collapsed_folders.includes('&&')) collapsed_folders = collapsed_folders.split('&&');
        else if (collapsed_folders !== '') collapsed_folders = [collapsed_folders];
        else collapsed_folders = [];

        return collapsed_folders.includes(rel);
    }

    _generate_html_tree(tree, tree_html = null, level = 2) {
        let html = tree_html || JsHtml.start 
        .ul({class:'treelist listing folderlist'});

        let enum_tree = MelEnumerable.from(tree);

        for (let element of enum_tree) {
            var rel = `favourite/${element.get_full_path()}`;
            var have_child_len = element.hasChildren();
            {
                var is_not_in_favorite = !(this.get_env('favorites_folders')?.[element.full_id]);
                var not_contain_username = !element.get_full_path().includes(this.get_env('username'));
                var is_not_user = !element.id.includes(this.get_env('current_user').full);

                if (is_not_in_favorite && element.full_id.includes(this.balp()) && element.full_id.includes('INBOX')) is_not_in_favorite = false;

                if (is_not_in_favorite && not_contain_username && is_not_user) {
                    is_not_in_favorite = null;
                    not_contain_username = null;
                    is_not_user = null;

                    if (have_child_len) {
                        html = this._generate_html_tree(element, html.placeholder(), level + 1);
                    }
                    continue;
                }
            }
            
            html = html.li({'aria-level':level, class:'mailbox', mailid:element.full_id, rel}).css('margin-bottom', (level === 2 ? '10px' : EMPTY_STRING)).addClass(this._get_folder_class(element.id))
                            .a({oncontextmenu:(e) => this._contextmenu(e), onclick:this._onclicktree.bind(this)})
                                .span()
                                    .text(element.name)
                                .end('span')
                                .span({class:'unreadcount skip-content'}).end()
                            .end()
                            .div({class:`treetoggle ${this._is_collapsed_rel(rel) ? 'collapsed' : 'expanded'}`, onclick:this._toggle_folder.bind(this)});

                            if (!have_child_len) html = html.css('color', 'var(--invisible)');

                            html = html.end('treetoggle');

            if (have_child_len) {
                html = html.ul('role="group"');

                if (this._is_collapsed_rel(rel)) html = html.css('display', 'none');

                html = this._generate_html_tree(element, html, level + 1)
            }
            html = html.end();
        }

        html = html.end();
        
        return html;
    }

    _contextmenu(e) {
        e.preventDefault();
        const {x, y} = e.originalEvent;
        const mail = new MailElement(e);
        let $element = $(`[rel="${mail.relative_path}"]`);

        if ($element.length > 0 || (($element = $('#mailboxlist').find('a').filter(function() {return $(this).text().includes(rcmail.env.mailboxes[mail.relative_path]?.name ?? mail.relative_path);})) && $element.length > 0)) {
            if ($element.length > 1) $element = $element.last();

            $element.contextmenu();

            $('#rcm_folderlist').css('top', `${y}px`).css('left', `${x}px`);
    
            setTimeout(() => {
                $('#rcm_folderlist').css('display', '');
            }, 10);
        }
    }

    _onclicktree(e) {
        $(`[rel="${new MailElement(e).relative_path}"]`).click();
    }

    _create_html_tree(tree) {
        //debugger;
        let html = JsHtml.start
        .ul({class:'treelist listing folderlist'})
            .li({'aria-level':1, rel:"favourite", class:'mailbox boite virtual'})
                .a({class:'favourite-virtual-box'})
                    .span()
                        .text('Favoris')
                    .end()
                    .span({class:'unreadcount skip-content'}).end()
                .end()
                .div({onclick:(e) => {
                    this._toggle_folder(e);
                }, class:`treetoggle ${this._is_collapsed_rel('favourite') ? 'collapsed' : 'expanded'}`}).end();

        html = html.ul({role:"group"}).css('padding-left', '1.5em');

        if (this._is_collapsed_rel('favourite')) html = html.css('display', 'none');

        html = this._generate_html_tree(tree, html).end();

        return html;
    }

    _toggle_folder(...args) {
        const [event] = args;

        const mail_element = new MailElement(event);

        mail_element.toggle();

        this._update_current_count_collapsed(mail_element.target);

        return mail_element;
    }

    async await_folder_list_content() {
        await new WaitSomething(() => {
            return this.folder_list_content().length > 0;
        });

        if (this.folder_list_content().length === 0) {
            throw new Error('Folder list content not found');
        }
        else return this.folder_list_content();
    }

    setup_command() {
        this.rcmail().register_command('set-favorite-folder', async (...args) => {
            const busy = rcmail.set_busy(true, 'loading');
            const is_favorite = $('.popover .folder-to.favorite span.inner').data('favorite');
            const folder = $('.popover .folder-to.favorite span.inner').data('rel');
            const datas = await BnumConnector.connect(BnumConnector.connectors.mail_toggle_favorite, {
                params:{
                    _folder: folder,
                    _state: !is_favorite
                },
            })

            rcmail.env.favorites_folders = datas.datas;

            await this._update_favorites();
            this._update_unreads();
            this._update_selected();

            this.rcmail().triggerEvent('favorite_folder_updated');

            rcmail.set_busy(false, 'loading', busy);
        }, true);
    }

    async get_favorites_from_serv() {
        const datas = await BnumConnector.connect(BnumConnector.connectors.mail_get_favorite_folder, {});

        rcmail.env.favorites_folders = datas.datas;
    }
}