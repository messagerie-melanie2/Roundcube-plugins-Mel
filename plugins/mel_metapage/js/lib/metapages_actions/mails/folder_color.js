import { Color } from "../../classes/color.js";
import { MelEnumerable } from "../../classes/enum.js";
import { BnumConnector } from "../../helpers/bnum_connections/bnum_connections.js";
import { MelForLoopObject } from "../../helpers/loops.js";
import { JsHtml } from "../../html/JsHtml/JsInputsHtml.js";
import { AFolderModifier } from "./afolder_modifier.js";

export class FolderColor extends AFolderModifier {
    constructor() {
        super();

        this._input_color = null;
    }

    async generate_context_menu() {
        await super.generate_context_menu();
        this.rcmail().register_command('update-color-folder', (args) => {
            const $link = $('.popover .color-folder');
            const folder = $link.attr('rel');
            const color = this.data?.[folder] || (Color.fromRGB($(`a[rel="${folder}"]`).css('color'))?.toHexa?.());
            
            $('#color-folder-changer').remove();
            this._input_color = JsHtml.start.input_color({id:'color-folder-changer', value: color, oninput:this._preview.bind(this, folder), onchange:this.set_to_server.bind(this, folder, color)}).css('display', 'none').generate().appendTo($('body'));
            this._input_color.click();

        }, true);

        this.rcmail().register_command('cancel-color-folder', (args) => {
            const $link = $('.popover .cancel-color-folder');
            const folder = $link.attr('rel');
            
            this.set_to_server(folder, null);
        }, true);

        this.update_visuel();
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
        $link = $('.popover .cancel-color-folder').attr('rel', folder).show();

        if (!this.get_env('folders_colors')[folder]) {
            $link.hide();
        }

        $link = null;
    }

    update_visuel() {
        const colors = this.get_env('folders_colors');
        
        {
            const keys_to_remove = MelEnumerable.from(this.get_skin().css_rules.getKeys()).where(key => key.startsWith('color-folder-') || key.startsWith('color-favorite-folder-'));
            keys_to_remove.any() && this.get_skin().css_rules.removeRules(...keys_to_remove);
        }

        let css_key;
        let favorite_css_key;
        MelForLoopObject.Start(colors, (color, key) => {
            css_key = `color-folder-${key}`;
            favorite_css_key = `color-favorite-folder-${key}`;
            this.get_skin().css_rules.addAdvanced(css_key, `a[rel="${key}"]::before`, `color:${color} !important;`);
            this.get_skin().css_rules.addAdvanced(favorite_css_key, `li[mailid="${this._get_true_key(key)}"] > a::before`, `color:${color} !important;`);
        }); 
    }

    async set_to_server(folder, start_color, updated_color = FolderColor.DEFAULT_COLOR) {
        if (!!updated_color.currentTarget) {
            updated_color = $(updated_color.currentTarget).val();
        }

        if (start_color === updated_color) return;

        $('#color-folder-changer').remove();
        this._input_color = null;

        let config = BnumConnector.connectors.mail_set_folder_color.needed;
        config._folder = folder;

        if (FolderColor.DEFAULT_COLOR !== updated_color) 
        {
            config._color = updated_color;
        }

        const busy = this.rcmail().set_busy(true, 'loading');
        const data = await BnumConnector.connect(BnumConnector.connectors.mail_set_folder_color, {params:config});
        this.rcmail().set_busy(false, 'loading', busy);

        this.get_skin().css_rules.remove('preview_folder_color');
        this.get_skin().css_rules.remove('preview_favorite_folder_color');

        if (!data.has_error) {
            rcmail.env.folders_colors = data.datas;
            $('.popover .cancel-color-folder').show(); //Afficher le bouton annuler si on reclique sur la même boite 
            this.update_visuel();
        }
        
    }

    async get_from_server() {
        return await BnumConnector.connect(BnumConnector.connectors.mail_get_folders_color, {});
    }

    _get_data() {
        let data = super._get_data();

        data = data || this.get_env('folders_colors');
        return data;
    }

    _preview(folder, event) {
        const color = $(event.target).val();
        this.get_skin().css_rules.remove('preview_folder_color');
        this.get_skin().css_rules.remove('preview_favorite_folder_color');
        this.get_skin().css_rules.addAdvanced('preview_folder_color', `a[rel="${folder}"]::before`, `color:${color} !important;`);
        this.get_skin().css_rules.addAdvanced('preview_favorite_folder_color', `li[mailid="${this._get_true_key(folder)}"] > a::before`, `color:${color} !important;`);
    }

    static is_default_color(color) {
        return FolderColor.DEFAULT_COLOR === color;
    }
}

FolderColor.DEFAULT_COLOR = Symbol('DEFAULT_COLOR');