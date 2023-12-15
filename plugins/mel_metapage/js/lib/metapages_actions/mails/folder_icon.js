import { Color } from "../../classes/color.js";
import { MelEnumerable } from "../../classes/enum.js";
import { BnumConnector } from "../../helpers/bnum_connections/bnum_connections.js";
import { MelForLoopObject } from "../../helpers/loops.js";
import { MelHtml } from "../../html/JsHtml/MelHtml.js";
import { AFolderModifier } from "./afolder_modifier.js";

export class FolderIcon extends AFolderModifier {
    constructor() {
        super();

    }

    async generate_context_menu() {
        await super.generate_context_menu();
        this.rcmail().register_command('update-icon-folder', (args) => {
            const $link = $('.popover .color-folder');
            const folder = $link.attr('rel');
            const default_classes = MelEnumerable.from($(`a[rel="${folder}"]`)[0].classList).toArray().join(' ');

            let html = MelHtml.start
            .div({id:'bnum-folder-icon'})
                .centered_flex_container({id:'bnum-folder-main-icon-container'})
                    .span({id:'bnum-folder-main-icon'}).end()
                .end()
                .separate().css({'margin-top':'10px', 'margin-bottom':'10px'})
                .ul({id:'bnum-folder-icons-container', class:'folderlist ignore-bullet'}).css({'flex-wrap': 'wrap', 'justify-content':'center', 'display':'flex'})
                    .li()
                        .a({class:`active mel-button no-button-margin no-margin-button ${default_classes}`}).css({'border-radius':'5px', 'margin-right':'5px', 'margin-bottom':'5px'})
                        .end()
                    .end();


            for (const iterator of FolderIcon.ICONS) {
                html = html.li()
                        .button().css({'border-radius':'5px', 'margin-right':'5px', 'margin-bottom':'5px'})
                            .icon(iterator).end()
                        .end()
                    .end();
            }
                    
               html =  html.end()
            .end();


            this.rcmail().show_popup_dialog(html.generate(), 'Changement de l\'icône du dossier');


        }, true);

        // this.rcmail().register_command('cancel-color-folder', (args) => {

        // }, true);

       // this.update_visuel();
    }

    update_context_menu(folder) {
        let $link = $('.popover .icon-folder').show();

        if (!folder) {
            $link.hide();
        }
        else {
            $link.attr('rel', folder);
        }

        $link = null;
    }

    update_visuel() {

    }

    async set_to_server(folder, start_color, updated_color = FolderColor.DEFAULT_COLOR) {
        
    }

    async get_from_server() {
    }

    _get_data() {

    }

    _preview(folder, event) {

    }

    static is_default_color(color) {
    }
}

FolderIcon.ICONS = ['home', 'settings', 'favorite', 'bolt', 'key', '123', 'saved_search', 'deployed_code', 'person', 'group', 'groups', 'public', 'thumb_down', 'cookie', 'flood', 'calendar_month', 'lock', 'bookmark', 'priority_high', 'label', 'mail', 'alternate_email', 'package', 'local_post_office', 'attach_email', 'markunread_mailbox'];