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

        Object.defineProperty(this, 'rel', {
            get: () => {               
                return this.target.parent().attr('rel');
            }
        });

        Object.defineProperty(this, 'relative_path', {
            get: () => {
                const rel = this.rel;
                if (rel.includes('favourite')) rel = rel.replace('favourite/', '');
                if (rel.includes(this.get_env('current_user').full)) rel = rel.replace(`${this.get_env('current_user').full}/`, '');
               
                return rel
            }
        });
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

        this.unreads = undefined;

        this.main_async();
        this.setup_command();
    }

    async main_async() {
        await this.startup();
        await this.startup_context_menu();
        await this._update_favorites();

        if (!this.unreads && !!this.get_env('unread_counts')) this.unreads = this.get_env('unread_counts');
        this._setup_listeners();
    }

    _setup_listeners() {
        this.rcmail().addEventListener('responseaftergetunread', () => {
            this.unreads = this.get_env('unread_counts');
            this._update_unreads();
        });
        this._update_unreads();
    }

    _update_unreads() {
        const unreads = Object.keys(this.unreads ?? {});

        if (unreads.length > 0) {
            const unread_count = this.get_env('unread_counts');
            for (let index = 0, len = unreads.length; index < len; ++index) {
                const key = unreads[index];
                const count = unread_count[key];
                
                console.log('rel', this._toRel(key));
                var rel = $(`[rel="${this._toRel(key)}"]`);

                if (rel.length > 0) {
                    rel.find('.unreadcount').first().text(count);
                }

            }
        }

        this._update_count_collapsed();
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
            let count = 0;

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
            this._set_link();
        });
    }

    async startup_context_menu() {
        (await this.await_folder_list_content()).find('#mailboxlist ul[role="group"] a').on('contextmenu', (...args) => {
            console.log('contextmenu', args);
            const [event] = args;
            const folder = $(event.currentTarget).attr('rel');

            this._set_link(folder);
        });
    }

    _set_link(folder = null) {
        const current_folder = folder || this.current_folder();

        if (!!current_folder) {
            let $link = $('.popover .folder-to.favorite').removeClass('disabled').addClass('active');

            const favorites_folders = this.get_env('favorites_folders');
            if (!!favorites_folders) {
                if (!!favorites_folders[current_folder]) {
                    $link.find('span.inner').text(this.gettext('unset-to-favorite', 'mel_metapage')).data('favorite', true).data('rel', current_folder);
                }
                else {
                    $link.find('span.inner').text(this.gettext('set-to-favorite', 'mel_metapage')).data('favorite', false).data('rel', current_folder);
                }
            }
            else $link.find('span.inner').text(this.gettext('set-to-favorite', 'mel_metapage')).data('favorite', false).data('rel', current_folder);
        }
        else {
            $('.popover .folder-to.favorite').removeClass('active').addClass('disabled');
        }
    }

    async _update_favorites() {
        const balp = 'Boite partag&AOk-e';

        if ($('#favorite-folders').length === 0) {
            (await this.await_folder_list_content()).before($('<div>').attr('id', 'favorite-folders').css('padiing-left', '20px'));
        }

        $('#favorite-folders').html('');

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
        for (const iterator of MelEnumerable.from(favorites_folders).orderBy((x) => x.key === 'INBOX' ? 0 : 1).then(x => x.key).select(x => new MelKeyValuePair(x.key.replace(`${this.balp()}/`, `${this.balp()}\\`), x.value))) {
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
        //debugger;
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
        //debugger;
        let html = tree_html || JsHtml.start 
        .ul({class:'treelist listing folderlist'});

        let enum_tree = MelEnumerable.from(tree);

        if (level === 2) enum_tree = enum_tree.orderBy((x) => (x.id?.includes?.(`${this.balp()}`) ?? true) ? 1 : 0).then((x) => x?.id);
        else enum_tree = enum_tree.orderBy((x) => (x.id?.includes?.('INBOX') ?? true) ? 0 : 1).then((x) => x?.id);

        for (let element of enum_tree) {
            var rel = `favourite/${element.get_full_path()}`;
            var have_child_len = element.hasChildren();
            
            html = html.li({'aria-level':level, class:'mailbox', rel}).css('margin-bottom', (level === 2 ? '10px' : EMPTY_STRING)).addClass((level === 2 ? 'boite' : (have_child_len ? '' : 'drafts')))
                            .a()
                                .span()
                                    .text(element.name)
                                .end('span')
                                .span({class:'unreadcount skip-content'}).end()
                            .end()
                            .div({class:`treetoggle ${this._is_collapsed_rel(rel) ? 'collapsed' : 'expanded'}`, onclick:this._toggle_folder.bind(this)});

                            if (!have_child_len) html = html.css('color', 'var(--invisible)');

                            html = html.end();

                            console.log('html1', html);

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

    _create_html_tree(tree) {
        let html = JsHtml.start
        .ul({class:'treelist listing folderlist'})
            .li({'aria-level':1, class:'mailbox', rel:"favourite"})
                .a()
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
        console.log('toggle', ...args);
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
            const is_favorite = $('.popover .folder-to.favorite span.inner').data('favorite');
            const folder = $('.popover .folder-to.favorite span.inner').data('rel');
            const datas = await BnumConnector.connect(BnumConnector.connectors.mail_toggle_favorite, {
                params:{
                    _folder: folder,
                    _state: !is_favorite
                }
            })
            
            console.log('arguments', ...args, is_favorite, folder, datas);
        }, true);
    }
}