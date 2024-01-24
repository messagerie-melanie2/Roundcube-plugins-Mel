import { create_modale_template, zones } from "../../../../../skins/mel_elastic/js_templates/create_modal.js";
import { RcmailDialog } from "../../../classes/modal.js";
import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { module_bnum } from "../module_bnum.js";

class ZonesManager {
    constructor() {
        this._zones = {
            main:0,
            center:0,
            bottom:0
        };
    }

    add(zone) {
        switch (zone) {
            case 'main':
                if (this._zones.main + 1 <= 1) this._zones.main++;
                break;

            case 'top_left':
            case 'top_center':
            case 'top_right':
                if (this._zones.center + 1 <= 3) this._zones.center++;
                break;

            case 'bottom_left_corner':
            case 'bottom_right_corner':
            case 'bottom_left':
            case 'bottom_right':
                if (this._zones.bottom + 1 <= 4) this._zones.bottom++;
                break;
        
            default:
                break;
        }
    }

    get() {
        return {
            main:    ~~(12/this._zones.main),
            center:  ~~(12/this._zones.center),
            bottom:  ~~(12/this._zones.bottom)
        }
    }

    update(template) {
        const result = this.get();

        let zones;
        let iterator;
        for (const key in result) {
            zones = template.find_from_data('zones', key);//.where(x => key === x.attrib['data-zones']);

            if (zones.any()) {
                for (iterator of zones) {
                    iterator.attribs['class'] = `col-${result[key]}`;
                }

                iterator = null;
            }
        }

        zones = null;

        return template;
    }
}

export class CreateManager extends module_bnum {
    constructor() {
        super();
    }
    
    main() {
        super.main();

        let config = zones;
        
        for (const key in config) {
            if (Object.hasOwnProperty.call(config, key)) {
                config[key] = MelHtml.start;
            }
        }
        
        config = this.trigger_event('create_modal.init', {config, manager:this})?.config ?? zones;
        config = this.rcmail().triggerEvent('create_modal.init', {config, manager:this})?.config ?? zones;

        this._init()._setup(config);
    }

    _init() {
        this._js_html_modal = null;
        /**
         * @type {RcmailDialog}
         */
        this.modal = null;
        /**
         * @type {symbol | string}
         */
        this.current_page = CreateManager.CREATE_PAGE;

        return this;
    }

    _setup(config) {
        let template = create_modale_template;

        let result;
        let iterator;
        let zones_manager = new ZonesManager();
        for (const key in config) {
            if (Object.hasOwnProperty.call(config, key)) {
                const element = config[key];

                result = template.find_from_data('zone', key.replaceAll('_', '-'));

                if (result.any()) {
                    for (iterator of result) {
                        if (!!element && !!element.childs && element.childs.length > 0)
                        {
                            iterator.childs.push(...element.childs);
                            zones_manager.add(key);
                        }
                        else {
                            iterator.css('display', 'none');
                        }

                    }

                    iterator = null;
                }

                result = null;

            }
        }

        this._js_html_modal = zones_manager.update(template);     

        let modal = null;
        Object.defineProperty(this, 'modal', {
            get:() => {
                if (modal === null) {
                    modal = this._generate_dialog();
                }

                return modal;
            }
        });
    }

    _generate_dialog() {
        return new RcmailDialog(this._js_html_modal.generate(), {
            title:'Que souhaitez-vous créer ?',
            options: {
                width:800
            }
        });
    }

    show() {
        this.modal.show();

        return this;
    }

    hide() {
        this.modal.hide();

        return this;
    }

    update_dialog_page(content) {
        this.modal.contents = content;
        return this;
    }

    update_dialog_title(title) {
        this.modal.title = title;
        return this;
    }

    push_dialog_button(...buttons) {
        this.modal.buttons.push(...buttons);
        return this;
    }

    clear_dialog_buttons() {
        this.modal.buttons = [];
        return this;
    }

    update_dialog_buttons(buttons) {
        this.modal.buttons = buttons;
        return this;
    }

    go_to_home() {
        this.current_page = CreateManager.CREATE_PAGE;
        this.update_dialog_title('Que souhaitez-vous créer ?');
        this.update_dialog_page(this._js_html_modal.generate());
        this.update_dialog_buttons([]);
        return this;
    }

    create_button(icon, text, onclick, block = true) {
        return MelHtml.start.button({class:'btn btn-block btn-secondary btn-mel', onclick}).removeClass('mel-button').icon(icon, {class:(block ? 'block' : 'noclass')}).end().text(text).end();
    }

    fromWindow() {
        return CreateManager.FromWindow();
    }

    static FromWindow() {
        return window.mel_button_create_manager;
    }
}

CreateManager.CREATE_PAGE = Symbol();