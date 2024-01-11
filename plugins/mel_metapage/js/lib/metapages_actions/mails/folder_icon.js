import { MelIconPrevisualiser } from "../../../../skins/mel_elastic/js_templates/blocks/icon_previsualiser.js";
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
            const base_icon = this.get_env('folders_icons')?.[folder];
            const icon = base_icon === 'default' ? null : base_icon;

            let popup = new MelIconPrevisualiser({});

            popup.on_create_default_items.push(() => {
                return MelHtml.start.li({class:default_classes})
                    .a({class:`${!!icon ? '' : 'selected-item'} mel-button no-button-margin no-margin-button bnum-initial-button`})
                    .css({'border-radius':'5px', 'margin-right':'5px', 'margin-bottom':'5px', 'line-height':'initial', 'padding':'5px 10px'})
                    .attr('onmouseenter', this._default_button_on_hover.bind(this, selector))
                    .attr('onmouseleave', this._default_button_on_leave.bind(this, selector))
                    .attr('onclick', this._default_click.bind(this, selector))
                    .end()
                .end();
            });

            if (!!icon) {
                popup.on_create_set_selected.push((html, from_icon, popup) => {
                    if (from_icon === icon) {
                        html = popup.select_item(html);
                    }

                    return html;
                });
            }
            else { 
                popup.on_after_generate_jquery.push(($html, popup) => {
                    $html.find(`#${popup.previsu_id} bnum-icon`).text('');

                    return $html;
                });
            }

            popup.on_button_hover.push((icon, popup) => {
                this.get_skin().css_rules.remove('previsu-update-folder-icon-default');
            });

            popup.on_button_leave.push((icon, popup) => {
                let $previsu = popup.get_previsu();
                console.log($previsu.find('bnum-icon').text(), $previsu.data('starticon'));
                if ($previsu.find('bnum-icon').text() === '') {
                    this._default_button_on_hover(selector, null);
                    $previsu.data('starticon', '');
                }
            });

            popup.on_create_show_selected.push((html, popup) => {
                if (!!icon) return icon;
                else return 'default';
            });

            //Ajoute une règle css pour que le bouton "par défaut" soit afficher correctement
            const icon_key = 'folder-icon-before-modifier';
            if (!this.get_skin().css_rules.ruleExist(icon_key)){
                this.get_skin().css_rules.addAdvanced(icon_key, `#${popup.list_container_id}.folderlist li a::before`, //bnum-folder-icons-container
                 'margin: 0 !important;',
                 'font-size: 24px !important;',
                 'float: unset;',
                 'display: inline;',
                 'font-variation-settings: unset !important;',
                 'text-align: unset;'
                );
            }

            popup.on_save.push(async (popup, dialog) => {
                    const icon = popup.get_selected_icon() || 'default';
                    const folder_to_save = folder;

                    let config = BnumConnector.connectors.mail_set_folder_icon.needed;
                    config['_folder'] = folder_to_save;
                    config['_icon'] = icon;

                    const busy = this.rcmail().set_busy(true, 'loading');

                    $(dialog).parent().find('button').addClass('disabled').attr('disabled', 'disabled');
                    $(dialog).parent().find('a').addClass('disabled').attr('disabled', 'disabled');
                    
                    const result = await BnumConnector.connect(BnumConnector.connectors.mail_set_folder_icon, {params:config});
                    this.rcmail().set_busy(false, 'loading', busy);

                    if (!result.has_error){
                        rcmail.env.folders_icons = result.datas; 
                    }

                    this.update_visuel();
                    $(dialog).dialog('destroy');
            });

            const func_id = popup.on_close.push((popup, dialog) => {
                this.update_visuel();
            });

            popup.on_cancel.push(popup.on_close.events[func_id].callback.bind(this))

            const key = 'previsu-update-folder-icon-default';
            this.get_skin().css_rules.remove(key);

            popup.create_popup('Changement de l\'icône du dossier');

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

    _default_button_on_leave(selector) {
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