import { MainIconHtml, MaterialSymbolHtml } from "../html/html_icon";
import { MelObject } from "../mel_object";
import { BaseStorage } from "./base_storage";

export class MelFullScreenItem extends MelObject {
    constructor(id, parent_selector, {close_on_click = true}) {
        super(id, parent_selector, close_on_click);
    }

    main(...args) {
        super.main(...args);

        const [id, parent_selector, close_on_click] = args;

        this._init()
            ._setup(id, parent_selector, close_on_click)
            ._create();
    }

    _init() {
        this.id = '';
        this.$parent = null;
        this.$element = null;
        this.$apps = null;
        this.config = {
            close_on_click:true
        };
        this.apps = new BaseStorage();
        this.onclose = new MelEvent();
        this.onshow = new MelEvent();
        this.onadd = new MelEvent();

        return this;
    }

    _setup(id, parent_selector, close_on_click) {
        this.id = id;
        this.$parent = this.select(parent_selector);
        this.config.close_on_click = close_on_click;

        return this;
    }

    _create() {
        const close_icon = new MainIconHtml('close', {}, {});
        let close_button = new mel_html2('button', {
            attribs:{class:mel_button.html_base_class_full},
            contents:close_icon
        });

        close_button.addClass(MaterialSymbolHtml.get_class_fill_on_hover())
                    .addClass('close-fs-button');

        close_button.onclick.push(() => {
            this.hide();
        });

        let app_container = new mel_html('div', {
            id:`${this.id}_container`,
            class:'fullscreen_container'
        });

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
        this.$apps = this.$element.find('.fullscreen_container');

        return this;
    }

    select_this() {
        return this.select(`#${this.id}`);
    }

    hide() {
        this.select_this().css('display', 'none');
        
        if (this.onclose.haveEvents()) this.onclose.call();

        return this;
    }

    show() {
        this.select_this().css('display', '');

        if (this.onshow.haveEvents()) this.onshow.call();

        return this;
    }

    add(app_name, $item) {
        this.apps.add(app_name, $item);
        $item.appendTo(this.$apps);

        if (this.onadd.haveEvents()) this.onadd.call(app_name, $item);

        return this;
    }

    clear() {
        for (const iterator of this.apps) {
            const {value} = iterator;
            value.remove();
        }

        this.apps.clear();
        return this;
    }
}