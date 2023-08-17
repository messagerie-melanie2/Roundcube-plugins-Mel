import { mel_cancellable_html_timer } from "../html/html_timer.js";
import { Top } from "../top.js";
import { MetapageModule } from "./metapage_module.js";

//
export class MetapageMailModule extends MetapageModule {
    constructor() {
        super();
    }

    /**
     * @protected
     * @async Actions principales
     */
    async main() {
        super.main();

        if (!MetapageMailModule.elements) MetapageMailModule.elements = new MelEvent();

        this._init();
    }

    /**
     * Initialise la classe
     * @private
     * @returns Chaîne
     */
    _init() {
        if (!!rcmail.submit_messageform) {
            const rcmail_submit_messageform = rcmail.submit_messageform;
            rcmail.submit_messageform = function (...args) {
                const [draft, saveonly] = args;
                const delay = this.env['mail_delay'] ?? 0;
                const have_delay = delay > 0;
                
                if (true !== draft && true === have_delay) {
                    const navigator = Top.top();
                    const current_window = window;
                    let self = this;

                    let html = mel_cancellable_html_timer.Success(delay, {
                        cancel_icon:'cancel_schedule_send',
                        contents: new mel_html('span', {}, `${this.gettext('delaytimer', 'mel_metapage')} <span class="time-number">${delay}</span>...`)
                    });

                    html.attribs['data-uid'] = MetapageMailModule.elements._generateKey();

                    html.ontimerfinished.push(($element) => {
                        rcmail_submit_messageform.call(self, ...args);
                        MetapageMailModule.elements.remove($element.data('uid'));
                    });

                    html.oncancel.push((e) => {
                        e = $(e.currentTarget).parent();
                        e.break_timer();
                        
                        if (!!current_window.popup_action) {
                            current_window.popup_action(($element, box) => {
                                box.minifier.click();
                                box.title.find('h3').html(box.title.find('h3').html().replace('Envoi de : ', 'Rédaction : '));
                                box.close.removeClass('disabled').removeAttr('disabled');
                            });
                        }

                        MetapageMailModule.elements.remove(e.data('uid'));
                    });
                    
                    if (navigator.$('#messagestack').length <= 0) {
                        new mel_html('div', {id:'messagestack'}).create(navigator.$('body'));
                    }

                    let $gen = html.create(navigator.$('#messagestack'));
                    $gen.find('.mel-timer-cancel').attr('title', 'Annuler l\'envoie');

                    MetapageMailModule.elements.add(html.attribs['data-uid'], {$gen, html, rcmail});

                    if (!!window.popup_action) {
                        window.popup_action(($element, box) => {
                            box.title.find('h3').html(box.title.find('h3').html().replace('Rédaction : ', 'Envoi de : '));
                            box.close.addClass('disabled').attr('disabled', 'disabled');
                            box.minifier.click();
                        });
                    }
                }
                else rcmail_submit_messageform.call(this, ...args);
            }
        }

        if (!window.onbeforeunload) {
            const window_onbeforeunload = window.onbeforeunload;
            window.onbeforeunload = (...args) => {
                const txt = window_onbeforeunload.call(window, ...args);

                if (!!txt) return txt;
                else return this.onBeforeUnload(...args);
            };
        }
        else window.onbeforeunload = this.onBeforeUnload;
        return this;
    }

    onBeforeUnload(e) {
        if (!!MetapageMailModule.elements && MetapageMailModule.elements.haveEvents()) {
            const message = rcmail.gettext('quitdelayconfirmation', 'mel_metapage');
            (e || window.event).returnValue = message;
            return message;
        }
    }
}