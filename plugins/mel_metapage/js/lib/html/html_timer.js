import { BnumLog } from "../classes/bnum_log.js";
import { Mel_Promise } from "../mel_promise.js";
import {MainIconHtml, MaterialSymbolHtml } from "./html_icon.js";

/**
 * Représentation HTML d'une notification avec un timer
 * @extends {mel_html2}
 */
export class mel_html_timer extends mel_html2 {
    /**
     * Constructeur de la classe
     * @param {number} timer Temps en seconde 
     * @param {mel_html | mel_html[] | string} contents Texte écrit dans la notification
     */
    constructor(timer, contents = null) {
        super('div', {});

        /**
         * @type {mel_html | mel_html[] | string}
         * Données par défaut
         */
        this._original_contents = contents;
        /**
         * @type {number}
         * Temps en secondes
         */
        this.timer = timer;
        /**
         * @type {MelEvent}
         * Actions lorsque le timer est fini
         */
        this.ontimerfinished = new MelEvent();
    }

    /**
     * Génère sous élément Jquery
     * @param {{}} additionnal_attribs Attributs additionnels
     * @returns {$}
     */
    generate(additionnal_attribs = {}) {
        return super.generate(additionnal_attribs).init_timer(this);
    }

    /**
     * Génère en élément Jquery puis l'attache à un élement jquery parent
     * @param {$} $parent Parent de cet élément
     * @param {{}} additionnal_attribs Attributs additionnels
     * @returns {$} Element générer, pas le parent
     */
    create($parent, additionnal_attribs = []) {
        return super.create($parent, additionnal_attribs).start_timer();
    }

    /**
     * Ajoute la classe si elle n'éxiste pas déjà
     * @param {string} html_class 
     * @returns Chaîne
     */
    tryAddClass(html_class) {
        if (!this.hasClass(html_class)) return this.addClass(html_class);

        return this;
    }

    _before_generate() {
        super._before_generate();
        this.attribs['data-timer'] = this.timer;
        this.tryAddClass('mel-message-timer')
            .tryAddClass('ui')
            .tryAddClass('alert');

        //let html = this._generate_content();
        this.jcontents[0] = new mel_html2('p', {contents:this._original_contents});//html.addContent(this._generate_timer());
        this.jcontents[1] = this._generate_timer();
    }

    _generate_timer() {
        return new mel_html2('div', {
            attribs: {
                class:'mel-message-timer-bckg'
            },
            contents:new mel_html('div', {
                class:'mel-message-timer-fg',
                style:'width:0'
            })
        });
    }

    static _alert(alert_type, timer, contents = null) {
        timer = new mel_html_timer(timer, contents);
        timer.tryAddClass(`alert-${alert_type}`);

        return timer;
    }

    static Success(timer, contents = null) {
        return this._alert('success', timer, contents);
    }

    static Error(timer, contents = null) {
        return this._alert('danger', timer, contents);
    }

    static Warning(timer, contents = null) {
        return this._alert('warning', timer, contents);
    }

    static Info(timer, contents = null) {
        return this._alert('infos', timer, contents);
    }

}

/**
 * Représentation HTML d'une notification avec un timer.
 * Le timer peut être arrêter.
 * @extends {mel_html_timer}
 */
export class mel_cancellable_html_timer extends mel_html_timer {
    constructor(timer, {contents = null, cancel_icon = 'undo'}) {
        super(timer, contents);

        this.oncancel = new MelEvent();
        this.cancel_icon = cancel_icon;
    }

    _before_generate() {
        super._before_generate();

        let html_cancel = new mel_html2('button', {
            attribs:{
                class:mel_button.html_base_class_full
            },
            contents: new MainIconHtml(this.cancel_icon, {}, {})
        });

        html_cancel.addClass('mel-timer-cancel');
        html_cancel.addClass(MaterialSymbolHtml.get_class_fill_on_hover());

        html_cancel.onclick.add('cancel', (e) => {
            this.oncancel.call(e);
        });

        this.jcontents[2] = html_cancel;
    }

    /**
     * 
     * @param {*} alert_type 
     * @param {*} timer 
     * @param {*} param2 
     * @returns {mel_cancellable_html_timer}
     */
    static _alert(alert_type, timer, {contents = null, cancel_icon = 'undo'}) {
        timer = new mel_cancellable_html_timer(timer, {contents, cancel_icon});
        timer.tryAddClass(`alert-${alert_type}`);

        return timer;
    }

    static Success(timer, {contents = null, cancel_icon = 'undo'}) {
        return this._alert('success', timer, {contents, cancel_icon});
    }

    static Error(timer, {contents = null, cancel_icon = 'undo'}) {
        return this._alert('danger', timer, {contents, cancel_icon});
    }

    static Warning(timer, {contents = null, cancel_icon = 'undo'}) {
        return this._alert('warning', timer, {contents, cancel_icon});
    }

    static Info(timer, {contents = null, cancel_icon = 'undo'}) {
        return this._alert('infos', timer, {contents, cancel_icon});
    }
}

(function($) {

    $.fn.extend({
        init_timer: function(html_datas) {
            if (this.hasClass('mel-message-timer')) {
                const timers = html_datas.ontimerfinished;
                this.init_timer.ontimerfinished = timers;
                BnumLog.info('Timer initialized !');
            }

            return this;
        },

        start_timer: function() {
            if (this.hasClass('mel-message-timer')) {
                const timer = +(this.data('timer') ?? 0);
                const timers = this.init_timer.ontimerfinished

                new Mel_Promise((promise, $element, ontimerfinished, timer) => {
                    BnumLog.info('Timer started !');
                    promise.start_resolving();

                    promise.create_promise({
                        callback: async (child_promise, $element, ontimerfinished, timer) => {
                            let _break = false;
                            let $number = $element.parent().parent().find('.time-number');
                            for (let index = 0; index <= timer; ++index) {
                                if (!_break && true === this.start_timer._break) {
                                    _break = true;
                                    this.start_timer._break = false;
                                    break;
                                }

                                $element.css('width', `${index/timer*100}%`);
                                await delay(1000);
                                if ($number.length > 0) $number.text(timer - (index + 1));
                            }

                            if (_break) {
                                BnumLog.info('Timer stopped !');
                                this.remove();
                                promise.abort();
                            }
                            else {
                                this.remove();

                                if (!!ontimerfinished && ontimerfinished.haveEvents()) {
                                    ontimerfinished.call($element.parent().parent());
                                }

                                BnumLog.info('Timer finished !');

                                promise.resolve();
                            }
                        }
                    }, $element.find('.mel-message-timer-fg'), ontimerfinished, timer)
                }, this, timers, timer);
            }

            return this;
        },

        break_timer: function() {
            if (this.hasClass('mel-message-timer')) {
                this.start_timer._break = true;
            }

            return this;
        },

        destroy_timer: function() {
            if (this.hasClass('mel-message-timer')) {
                this.start_timer._break = null;
                this.init_timer.ontimerfinished = null;
            }

            return this;
        }
    });

})(jQuery);