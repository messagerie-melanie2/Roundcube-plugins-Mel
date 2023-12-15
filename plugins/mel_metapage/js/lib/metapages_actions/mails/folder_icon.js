import { Color } from "../../classes/color.js";
import { MelEnumerable } from "../../classes/enum.js";
import { BnumConnector } from "../../helpers/bnum_connections/bnum_connections.js";
import { MelForLoopObject } from "../../helpers/loops.js";
import { JsHtml } from "../../html/JsHtml/JsInputsHtml.js";
import { AFolderModifier } from "./afolder_modifier.js";

export class FolderIcon extends AFolderModifier {
    constructor() {
        super();

    }

    async generate_context_menu() {
        await super.generate_context_menu();
        this.rcmail().register_command('update-icon-folder', (args) => {

            


        }, true);

        // this.rcmail().register_command('cancel-color-folder', (args) => {

        // }, true);

       // this.update_visuel();
    }

    update_context_menu(folder) {
        let $link = $('.popover .color-folder').show();

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

FolderIcon.ICONS = ['home', 'settings', 'favorite', 'bolt', 'key', 'html', '123', 'saved_search', 'deployed_code', 'person', 'group', 'groups', 'public', 'thumb_down', 'cookie', 'flood', 'calendar_month', 'lock', 'bookmark', 'priority_high', 'label', 'mail', 'alternate_email', 'package', 'local_post_office', 'attach_email', 'markunread_mailbox'];