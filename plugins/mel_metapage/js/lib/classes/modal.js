import { MelHtml } from "../html/JsHtml/MelHtml.js";
import { BnumEvent } from "../mel_events.js";
import { MelObject } from "../mel_object.js";
import { NotifierObject } from "./NotifierObject.js";
import { VisualiserObject } from "./VisualiserObject.js";

/**
 * Représente un bouton de dialog
 */
export class RcmailDialogButton extends NotifierObject{
    /**
     * Constructeur de la classe
     * @param {string} text Label du bouton
     * @param {Object} param1 Configuration du bouton
     * @param {string} param1.classes Classes css du bouton
     * @param {function} param1.click Callback appelé lorsqu'on clique sur le bouton
     * @param {function} param1.hover Callback appelé lorsqu'on survole le bouton
     * @param {function} param1.mouseenter Callback appelé lorsqu'on entre dans le bouton
     * @param {function} param1.mouseleave Callback appelé lorsqu'on sort du bouton 
     */
    constructor(text, {
        classes = '',
        click = null,
        hover = null,
        mouseenter = null,
        mouseleave = null,
    }) {
        super();
        this._init()._setup(text, classes, click, hover, mouseenter, mouseleave);
    }

    _init() {
        /**
         * text du bouton
         * @type {string}
         */
        this.text = '';
        /**
         * Classes css du bouton
         * @type {string}
         */
        this.classes = '';
        /**
         * Callback appelé lorsqu'on clique sur le bouton
         * @type {BnumEvent}
         */
        this.click = new BnumEvent();
        /**
         * Callback appelé lorsqu'on survole le bouton
         * @type {BnumEvent}
         */
        this.hover = new BnumEvent();
        /**
         * Callback appelé lorsqu'on entre dans le bouton
         * @type {BnumEvent}
         */
        this.mouseenter = new BnumEvent();
        /**
         * Callback appelé lorsqu'on sort du bouton
         * @type {BnumEvent}
         */
        this.mouseleave = new BnumEvent();

        return this;
    }

    _setup(text, classes, click, hover, mouseenter, mouseleave) {
        this._p_addProp('text', {value:text});

        if (!!click) this.click.push(click);
        if (!!hover) this.hover.push(hover);
        if (!!mouseenter) this.mouseenter.push(mouseenter);
        if (!!mouseleave) this.mouseleave.push(mouseleave);

        let _classes = classes;
        Object.defineProperty(this, 'classes', {
            get() {
                return `mel-button no-button-margin no-margin-button ${_classes}`;
            },
            set:(value) => {
                _classes = value;
                this.on_prop_update.call('classes', this.classes, this);
            }
        });

        return this;
    }

    generate() {
        return {
            text: this.text,
            class: this.classes,
            click: this.click.call.bind(this.click),
            hover: this.hover.call.bind(this.hover),
            mouseenter: this.mouseenter.call.bind(this.mouseenter),
            mouseleave: this.mouseleave.call.bind(this.mouseleave),
        };
    }
}

/**
 * Représente un "bouton de choix", il s'agit d'un bouton qui contient un texte et une icône
 */
export class RcmailDialogChoiceButton extends RcmailDialogButton {
    constructor(text, icon, {
        classes = '',
        click = null,
        hover = null,
        mouseenter = null,
        mouseleave = null,
    }) {
        super(text, {
            classes,
            click,
            hover,
            mouseenter,
            mouseleave,
        });

        this.icon = '';
        this._p_addProp('icon', {
            value:icon
        });
    }
}

class RcmailDialogChoiceButtonVisualiser extends VisualiserObject {
    constructor(button) {
        super(button);
    }

    _p_draw() {
        return super._p_draw().button({
            class:this._get_button_classes(this.ref.classes),
            click:this.ref.click.call.bind(this.ref.click),
            hover:this.ref.click.call.bind(this.ref.hover),
            mouseenter:this.ref.click.call.bind(this.ref.mouseenter),
            mouseleave:this.ref.click.call.bind(this.ref.mouseleave),
        }).icon(this.ref.icon, {class:'block'}).end().span({class:'btn-txt'}).text(this.ref.text).end().end();
    }

    _get_button_classes(classes) {
        return `${classes} btn btn-block-mel btn-secondary btn-mel`;
    }

    _prop_update_text(value, ref) {
        this.$ref.find('.btn-txt').text(value);
    }

    _prop_update_classes(value, ref) {
        this.$ref[0].classList = [];
        this.$ref.addClass(this._get_button_classes(value));
    }

    _prop_update_icon(value, ref) {
        this.$ref.find('bnum-icon').text(value);
    }
}

/**
 * Affiche une dialog
 */
export class RcmailDialog extends MelObject {
    /**
     * Constructeur de la classe
     * @param {MelHtml | $} contents html en jshtml ou jquery
     * @param {Object} param1 Configuration de la dialog
     * @param {string} param1.title Titre de la dialog
     * @param {RcmailDialogButton[]} param1.buttons Boutons de la dialog
     */
    constructor(contents, {title = '', buttons = [], options = []}) {
        super(contents, title, buttons, options);
    }

    _init() {
        this.contents = MelHtml.start;
        this.title = '';
        this.buttons = [];
        this.options = [];
        this._$dialog = $();

        return this;
    }

    _setup(contents, title, buttons, options) {
        Object.defineProperties(this, {
            contents: {
                get() {
                    return contents;
                }
            },
            title: {
                get() {
                    return title;
                }
            },
            buttons: {
                get() {
                    return buttons;
                }
            },
            options: {
                get() {
                    return options;
                }
            }
        });

        return this;
    }

    main(...args) {
        {
            super.main(...args);
            const [contents, title, buttons, options] = args;
            this._init()._setup(contents, title, buttons, options);
        }

        let $contents = !!this.contents.generate ? this.contents.generate() : this.contents;

        Object.defineProperty(this, '_$dialog', {
            get() {
                return $contents;
            }
        });

        this.rcmail().show_popup_dialog(this._$dialog, this.title, this.buttons.map(x => x.generate()));
    }

    /**
     * Cache la dialog
     * @returns Chaînage
     */
    hide() {
        this._$dialog.dialog('hide');
        return this;
    }

    /**
     * Affiche la dialog
     * @returns Chaînage
     */
    show() {
        let $contents = !!this.contents.generate ? this.contents.generate() : this.contents;

        this._$dialog = this.rcmail().show_popup_dialog($contents[0], this.title, this.buttons.map(x => x.generate()), this.options);
        return this;
    }

    /**
     * Supprime la dialog
     * @returns Chaînage
     */
    destroy() {
        this._$dialog.dialog('destroy');
        return this;
    }

    /**
     * Affiche X boutons qui permettront de faire certaines actions
     * @param {string} title Titre de la modale
     * @param  {...RcmailDialogChoiceButton} buttons Bouttons qui seront affichés
     */
    static DrawChoices(title, ...buttons) {
        let $html = MelHtml.start.flex_container().end().generate();

        for (const iterator of buttons) {
            $html.append(new RcmailDialogChoiceButtonVisualiser(iterator).$ref);
        }

        return new RcmailDialog($html, {title});
    }

    /**
     * Affiche 2 boutons qui permettront de faire certaines actions
     * @param {string} title Titre de la modale 
     * @param {RcmailDialogChoiceButton} button1 Option 1
     * @param {RcmailDialogChoiceButton} button2 Option 2
     * @returns 
     */
    static DrawChoice(title, button1, button2){
        return this.DrawChoices(title, button1, button2);
    }
}