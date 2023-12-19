import { MelEnumerable } from "../../classes/enum.js";
import { BnumConnector } from "../../helpers/bnum_connections/bnum_connections.js";
import { MelHtml } from "../../html/JsHtml/MelHtml.js";
import { AFolderModifier } from "./afolder_modifier.js";

export class FolderIcon extends AFolderModifier {
    constructor() {
        super();
    }

    async generate_context_menu() {
        await super.generate_context_menu();
        this.rcmail().register_command('update-icon-folder', (args) => {
            //Constantes
            const $link = $('.popover .icon-folder');
            const folder = $link.attr('relativeto');
            const selector = `li a[rel="${folder}"]`;

            this._remove_visuals($(selector).parent());

            const default_classes = MelEnumerable.from($(selector).parent()[0].classList).toArray().join(' ');
            const icon = this.get_env('folders_icons')?.[folder];

            //Générer la modale
            let html = MelHtml.start
            .div({id:'bnum-folder-icon'})
                .centered_flex_container({id:'bnum-folder-main-icon-container'})
                    .span({id:'bnum-folder-main-icon', class:'square-item px25'}).end()
                .end()
                .separate().css({'margin-top':'10px', 'margin-bottom':'10px'})
                .ul({id:'bnum-folder-icons-container', class:'folderlist ignore-bullet'}).css({'flex-wrap': 'wrap', 'justify-content':'center', 'display':'flex'})
                    .li({class:default_classes})
                        .a({class:`${!!icon ? '' : 'selected-item'} mel-button no-button-margin no-margin-button`})
                        .css({'border-radius':'5px', 'margin-right':'5px', 'margin-bottom':'5px', 'line-height':'initial', 'padding':'5px 10px'})
                        .attr('onmouseenter', this._default_button_on_hover.bind(this, selector))
                        .attr('onmouseleave', this._button_on_leave.bind(this, selector))
                        .attr('onclick', this._default_click.bind(this, selector))
                        .end()
                    .end();

            //Générer les boutons
            for (const iterator of FolderIcon.ICONS) {
                html = html.li()
                        .button({class:(iterator === icon ? 'selected-item' : '')})
                        .attr('onmouseenter', this._button_on_hover.bind(this))
                        .attr('onmouseleave', this._button_on_leave.bind(this, selector))
                        .attr('onclick', this._on_click.bind(this))
                        .css({'border-radius':'5px', 'margin-right':'5px', 'margin-bottom':'5px'})
                            .icon(iterator).end()
                        .end()
                    .end();
            }
                    
            //finir le ul et la div
               html =  html.end('ul')
            .end('div');

            //Ajoute une règle css pour que le bouton "par défaut" soit afficher correctement
            const icon_key = 'folder-icon-before-modifier';
            if (!this.get_skin().css_rules.ruleExist(icon_key)){
                this.get_skin().css_rules.addAdvanced(icon_key, '#bnum-folder-icons-container.folderlist li a::before', 
                 'margin: 0 !important;',
                 'font-size: 24px !important;',
                 'float: unset;',
                 'display: inline;',
                 'font-variation-settings: unset !important;',
                 'text-align: unset;'
                );
            }

            html = html.generate();

            //Si il y a une icône par défaut, on affiche l'icône.
            if (!!icon) {
                html.find('#bnum-folder-main-icon').html(MelHtml.start.icon(icon ?? 'default').generate());
            }

            let self = this;
            this.rcmail().show_popup_dialog(html, 'Changement de l\'icône du dossier', [{
                text:'Annuler',
                class: 'mel-button no-margin-button no-button-margin',
                click() {
                    $(this).dialog('destroy');
                    self.update_visuel();
                    self = null;
                }
            }, {
                text: 'Sauvegarder',
                class: 'mel-button no-margin-button no-button-margin',
                async click() {
                    const icon = $('#bnum-folder-main-icon').children().first()?.text?.() || 'default';
                    const folder_to_save = folder;

                    let config = BnumConnector.connectors.mail_set_folder_icon.needed;
                    config['_folder'] = folder_to_save;
                    config['_icon'] = icon;

                    const busy = self.rcmail().set_busy(true, 'loading');

                    $(this).parent().find('button').addClass('disabled').attr('disabled', 'disabled');
                    $(this).parent().find('a').addClass('disabled').attr('disabled', 'disabled');
                    
                    const result = await BnumConnector.connect(BnumConnector.connectors.mail_set_folder_icon, {params:config});
                    self.rcmail().set_busy(false, 'loading', busy);

                    if (!result.has_error){
                        rcmail.env.folders_icons = result.datas; 
                    }

                    self.update_visuel();
                    self = null;
                    $(this).dialog('destroy');
                }
            }], {close() {
                self?.update_visuel?.();
                self = null;
                $(this).dialog('destroy');
            }});

            //Si il n'y a pas de boutons défini, on affiche l'icône par défaut.
            if (!icon) {
                setTimeout(() => {
                    this._default_button_on_hover(selector);
                }, 10);
            }
        }, true);


       this.update_visuel();
    }

    _default_button_on_hover(selector, e) {
        const content =    window.getComputedStyle(
            document.querySelector(selector), ':before'
        ).getPropertyValue('content').replace(/"/g, '').charCodeAt(0).toString(16);
        const font =    window.getComputedStyle(
            document.querySelector(selector), ':before'
        ).getPropertyValue('font-family');

        let $previsu = this._save_default_icon().html(MelHtml.start.icon('default').end().generate());
        $previsu.children().first().text('');
        const key = 'previsu-update-folder-icon-default';
        this.get_skin().css_rules.remove(key);
        this.get_skin().css_rules.addAdvanced(key, `#${$previsu.attr('id')} bnum-icon:before`, 
        `content:"\\${content}"`,
        `font-family:${font}`
        );

    }

    _button_on_hover(e) {
        let $previsu = this._save_default_icon();
        e = $(e.currentTarget);

        this.get_skin().css_rules.remove('previsu-update-folder-icon-default');
        $previsu.html(MelHtml.start.icon(e.children().first().text()).generate());
        $previsu = null;
    }

    _button_on_leave(selector) {
        let $previsu = $('#bnum-folder-main-icon');

        if(!!($previsu.data('starticon') || false)) {
            this.get_skin().css_rules.remove('previsu-update-folder-icon-default');
            $previsu.html(MelHtml.start.icon($previsu.data('starticon')).generate());
        }
        else {
            this._default_button_on_hover(selector, null);
        }

        $previsu.data('starticon', '');
    }

    _save_default_icon() {
        let $previsu = $('#bnum-folder-main-icon');

        if(!($previsu.data('starticon') || false)) $previsu.data('starticon', $previsu.text());

        return $previsu;
    }

    _on_click(e) {
        this._button_on_hover(e);
        e = $(e.currentTarget);
        $('#bnum-folder-icons-container .selected-item').removeClass('selected-item');
        e.addClass('selected-item');
        $('#bnum-folder-main-icon').data('starticon', e.children().first().text());
    }

    _default_click(selector, e) {
        this._default_button_on_hover(selector, e);
        e = $(e.currentTarget);
        $('#bnum-folder-icons-container .selected-item').removeClass('selected-item');
        e.addClass('selected-item');
        $('#bnum-folder-main-icon').data('starticon', '');
    }

    update_context_menu(folder) {
        let $link = $('.popover .icon-folder').show();

        if (!folder) {
            $link.hide();
        }
        else {
            $link.attr('relativeto', folder);
        }

        $link = null;
    }

    _remove_visuals($item = null) {
        ($item ?? $('#folderlist-content li')).each((i, e) => {
            i = MelEnumerable.from(e.classList).where(x => x.includes('bnum-updated-'));

            if (i.any()) {
                $(e).removeClass(i.first());
            }

            i = null;
        });
    }

    update_visuel() {
        const folders = this.get_env('folders_icons');

        this._remove_visuals();

        for (const key in folders) {
            if (Object.hasOwnProperty.call(folders, key)) {
                const icon = folders[key];
                
                $(`#mailboxlist a[rel="${key}"]`).parent().addClass(`bnum-updated-${icon}`);
                $(`#favorite-folders li[mailid="${this._get_true_key(key)}"]`).addClass(`bnum-updated-${icon}`);
            }
        }
    }

    async get_from_server() {
        await BnumConnector.connect(BnumConnector.connectors.mail_get_folders_icon, {});
    }

}

FolderIcon.ICONS = ['home', 'settings', 'favorite', 'bolt', 'key', '123', 'saved_search', 'deployed_code', 'person', 'group', 'groups', 'public', 'thumb_down', 'cookie', 'flood', 'calendar_month', 'lock', 'bookmark', 'priority_high', 'label', 'mail', 'alternate_email', 'package', 'local_post_office', 'attach_email', 'markunread_mailbox'];