import { MainIconHtml, MaterialSymbolHtml } from "../html/html_icon.js";
import { modal_html } from "../html/html_modal.js";

const BACKDROP = 'dialog-backdrop';
export class MelModal extends modal_html {
    constructor(id, $parent, focus_when_exit, {
        show_at_start = false,
        footer_buttons = MelModal.default,
        title_content = EMPTY_STRING,
        header_content = MelModal.default,
        body_content = EMPTY_STRING
    }) {
        super(EMPTY_STRING, EMPTY_STRING, id);

        this.show_at_start = show_at_start;
        this.onshow = new MelEvent();
        this.onhide = new MelEvent();
        this.onmainaction = new MelEvent();
        this.onsecondaryaction = new MelEvent();

        let _footer_buttons = footer_buttons;
        let _title_content = title_content;
        let _header_content = header_content;
        let _body_content = body_content;

        Object.defineProperties(this, {
            focus_when_exit: {
                get: function() {
                    return focus_when_exit;
                },
                configurable: true
            },
            title_content: {
                get:function () {
                    return _title_content;
                },
                set:(val) => {
                    _title_content = val;
                },
                configurable: true
            },
            header_content: {
                get:function () {
                    return _header_content;
                },
                set:(val) => {
                    _header_content = val;
                },
                configurable: true
            },
            body_content: {
                get:function () {
                    return _body_content;
                },
                set:(val) => {
                    _body_content = val;
                },
                configurable: true
            },
            footer_buttons: {
                get:function () {
                    return (_footer_buttons === MelModal.default ? this._generate_default_footers() : (_footer_buttons || []));
                },
                set:(val) => {
                    _footer_buttons = Array.isArray(val) ? val : [val];
                    this.select_footer().remove();
                    this._generate_footer().create(this.$modal);
                },
                configurable: true
            }
        });

        let $modal = this.create($parent);
        this.$modal = $();
        Object.defineProperties(this, {
            $modal: {
                get: function() {
                    return $modal;
                },
                configurable: true
            },
        });

        this._dispose_modal = () => $modal = null;

        this._initialized = false;

        if (this.show_at_start) {
            this.show();
        }

        MelModal._modals[this.id] = this;
    }

    _regenerate($parent) {
        this.$modal.remove();
        let $generated = this.create($parent);
        this._initialized = false;
        return this.$modal;
    }

    _before_generate() {
        super._before_generate();

        if (!this.show_at_start)
        {
            this.css('display', 'none');
        }

        this.css('position', 'absolute');
        this.css('top', '60px');
        this.css('left', '60px');

        this._generate_content();
    }

    _generate_content() {
        const header = this._generate_header();
        const body = this._generate_body();
        const footer = this._generate_footer();

        this.push_element(header);
        this.push_element(body);
        this.push_element(footer);
    }

    _generate_header() {
        return new mel_html2('div', {attribs:{class:'modal-header'}, contents:(MelModal.default === this.header_content ? this._generate_title() : this.header_content)});
    }

    _generate_title() {
        return new mel_html('h2', {}, this.title_content);
    }

    _generate_body() {
        return new mel_html2('div', {attribs:{class:'modal-body'}, contents:this.body_content || []});
    }

    _generate_footer() {
        let footer = new mel_html2('div', {
            attribs:{class:'modal-footer'},
            contents:this.footer_buttons
        });

        if (0 === this.footer_buttons.length) footer.css('display', 'none');

        return footer;
    }

    _generate_default_footers() {
        return [this.generate_cancel_button({
            action:() => {
                this.onsecondaryaction.call();
                this.hide();
            }
        }), this.generate_save_button({})];
    }

    generate_save_button({action = MelModal.default, text = 'Sauvegarder', icon = 'save'}) {
        let save = new mel_html2('div', {
            attribs:{
                class:mel_button.html_base_class_full
            },
            contents:new mel_html2('span', {contents: [new mel_html('span', {style:'vertical-align: super;'}, text), new MainIconHtml(icon, {}, {})]})
        })

        if (MainIconHtml === MaterialSymbolHtml) {
            save.addClass(MaterialSymbolHtml.get_class_fill_on_hover());
        }

        if (action !== false) {
            save.onclick.push(() => {
                if (action === MelModal.default) this.onmainaction.call();
                else action();
            });
        }

        return save;
    }

    generate_cancel_button({action = MelModal.default, text = 'Annuler', icon = 'cancel'}) {
        let cancel = this.generate_save_button({text, icon, action:() => {
            if (action === MelModal.default) this.onsecondaryaction.call();
            else action();
        }});

        cancel.addClass(mel_button.html_base_class_danger);

        return cancel;
    }

    _p_on_title_change(new_title){
        this.select_aria_title().text(new_title);
    }

    _p_on_desc_change(new_desc){
        this.select_aria_desc().text(new_desc);
    }

    set_title(title) {
        this.title = title;
        this.title_content = title;

        return this;
    }

    show() {
        if (!this._initialized) {
            modal_html.attach(this.$modal[0], this.focus_when_exit, this.title_id);
            this._initialized = true;
        }

        this.$modal.css('display', '');
        this.select_backdrop().css('display', '');

        this.onshow.call();
    }

    hide() {
        this.$modal.css('display', 'none');
        this.select_backdrop().css('display', 'none');

        this.onhide.call();
    }

    select(selector) {
        return $(selector);
    }

    select_modal({from_id=false}) {
        return (from_id ? this.select(`#${this.id}`) : this.$modal);
    }

    select_backdrop() {
        return this.select(`.${BACKDROP}`);
    }

    select_aria_title() {
        return this.select_modal({}).find(`#${this.title_id}`);
    }

    select_aria_desc() {
        return this.select_modal({}).find(`#${this.desc_id}`);
    }

    select_header() {
        return this.select_modal({}).find('.modal-header');
    }

    select_title() {
        return this.select_header().find('h2');
    }

    select_body() {
        return this.select_modal({}).find('.modal-body');
    }

    select_footer() {
        return this.select_modal({}).find('.modal-footer');
    }

    dispose() {
        this._dispose_modal();
        this._initialized = null;
        this.show_at_start = show_at_start;
        this.onshow.clear();
        this.onshow = null;
        this.onhide.clear();
        this.onhide = null;

        delete MelModal._modals[this.id];
    }

    static from_selected($selected) {
        return MelModal._modals[$selected.attr('id')];
    }
}

MelModal._modals = {};
MelModal.default = Symbol('default');

if (typeof $ !== 'undefined' && !!$.fn && !$.fn.mel_modal) {

    function mel_modal($selected, action, ...args) {
        let modal;
        let $modal;
        for (const iterator of $selected) {
            $modal = $(iterator);
            modal = MelModal.from_selected($modal);

            switch (action) {
                case 'show':
                    modal.show();
                    break;
            
                case 'hide':
                    modal.hide();
                    break;

                case 'on_hide':
                case 'on_show':
                    const [event] = args;

                    ('on_show' === action ? modal.onshow : modal.onhide).push(event); 
                    break;

                case 'update_title':
                case 'update_desc':
                    const [text] = args;

                    if ('update_desc' === action) modal.desc = text;
                    else modal.title = text;
                default:
                    break;
            }
        }
    }

    $.fn.extend({
        mel_modal: function() {
            const actions = ['show', 'on_show', 'hide', 'on_hide', 'update_title', 'update_desc'];

            let list_of_actions = {};

            for (let index = 0, len = actions.length; index < len; ++index) {
                const element = actions[index];
                list_of_actions[element] = (...args) => mel_modal(this, element, ...args);
            }

            return list_of_actions;
        }
    })
}