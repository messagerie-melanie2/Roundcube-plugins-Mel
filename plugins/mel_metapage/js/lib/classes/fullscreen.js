import { MelObject } from "../mel_object";
import { BaseStorage } from "./base_storage";

export class MelFullScreenItem extends MelObject {
    constructor(id, parent_selector, {close_on_click = true}) {
        super(id, parent_selector, close_on_click);
    }

    main(...args) {
        super.main(...args);

        this._init()
            ._setup();
            //._create();
    }

    _init() {
        this.id = '';
        this.$parent = null;
        this.$element = null;
        this.config = {
            close_on_click:true
        };
        this.apps = new BaseStorage();

        return this;
    }

    _setup(id, parent_selector, close_on_click) {
        this.id = id;
        this.$parent = this.select(parent_selector);
        this.config.close_on_click = close_on_click;

        return this;
    }

    _create() {
        let close_button = null;

        let app_container = null;

        let flex = new mel_html2('div', {
            attribs: {
                class:'fullscreen-item',
                id:this.id,
                style:'display:none'
            },
            contents:[close_button, app_container]
        });

        if (this.config.close_on_click) {
            flex.onclick.push(() => {
                this.hide();
            });
        }

        this.$element = flex.create(this.$parent);

        return this;
    }

    select_this() {
        return this.select(`#${this.id}`);
    }

    hide() {
        this.select_this().css('display', 'none');
        return this;
    }

    show() {
        this.select_this().css('display', '');
        return this;
    }

    add(app_name, $item) {
        this.apps.add(app_name, $item);
        //$item.appendTo(this.$element);

        return this;
    }
}