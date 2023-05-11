import { MailBaseModel } from "../mails/mail_base_model";
import { MelObject } from "../mel_object";

export class mail_html extends mel_html2{
    /**
     * Constructeur de la classe
     * @param {MailBaseModel} model 
     */
    constructor(model) {
        super('div', {});
        this._init();
        let mail = model;
        Object.defineProperties(this, {
            mail: {
                get: function() {
                    return mail;
                },
                set: (value) => {
                    mail = value;
                    this.refresh();
                },
                configurable: true
            },
        });
    }

    _init() {
        /**
         * @type {MailBaseModel}
         */
        this.mail = null;
        return this;
    }

    refresh() {
        const id = this.attribs['id'];
        const have_id = !!id;

        if (have_id) {
            const have_mail = !!this.mail;
            let $element = $(`#${id}`);

            if (have_mail) {
                $element[0].outerHTML = this.generate()[0].outerHTML;
                this.bind_events($(`#${id}`)).css('display', EMPTY_STRING);
            }
            else $element.css('display', 'none');
        }

        return this;
    }

    _before_generate() {
        this._create_content();

        if (!this.hasClass('melv2-mail')) {
            this.addClass('melv2-mail');
            this.onclick.add('mail',() => {
                this._action_on_click();
            })
        }

    }

    _create_content() {
        const from = this._generate_from();
        const subject = this._generate_subject();
        const date = this._generate_date();
        const left = new mel_html2('div', {
            attribs:{class:'melv2-mail-left'},
            contents:[from, subject]
        });
        const right = new mel_html2('div', {
            attribs:{class:'melv2-mail-right'},
            contents:[date]
        });

        this.jcontents[0] = left;
        this.jcontents[1] = right;
    }

    _generate_div({text, base_class}) {
        return mel_html.div({class:`melv2-mail-${base_class}`}, text);
    }

    _generate_from() {
        const from = this.mail?.from ?? EMPTY_STRING;
        const base_class = 'from';

        return this._generate_div({text: from, base_class: base_class});
    }

    _generate_subject() {
        const subject = this.mail?.subject ?? EMPTY_STRING;
        const base_class = 'subject';

        return this._generate_div({text: subject, base_class: base_class});
    }

    _generate_date() {
        const now = moment();
        const base_date = this.mail?.date ?? now;
        const base_class = 'melv2-mail-date';

        let date = EMPTY_STRING;

        if (moment(base_date).startOf('day').format() === moment(now).startOf('day').format()) date = new mel_html('span', {class:base_class},  moment(base_date).format('HH:mm'));
        else {
            date = moment(base_date);

            let left_date;
            const ellapsed_days =  ~~((moment() - moment(base_date))/ 1000 / 3600 / 24);
            if (ellapsed_days < 7) {
                date.locale('fr');
                left_date = mel_html.div({class:`${base_class}-left`}, (rcube_calendar.mel_metapage_misc.GetDateFr(date.format('dddd')).slice(0,3) + ' -'));
            }
            else if (moment(base_date).startOf('year').format() !== moment(now).startOf('year').format()) left_date = mel_html.div({class:`${base_class}-left`}, date.format('DD/MM/YYYY -'));
            else left_date = mel_html.div({class:`${base_class}-left`}, date.format('DD/MM -'));

            const right_date = mel_html.div({class:`${base_class}-right`}, date.format('HH:mm'));

            date = new mel_html2('div', {attribs:{class:base_class}, contents:[left_date, right_date]});
            date.addClass('melv2-mail-old');
        }

        return date;
    }

    async _action_on_click() {
        const page_manager = MelObject.Empty();
        const uid = this.mail.uid;
        let have_frame = page_manager.have_frame('mail');

        let config = {
            force_update:false,
            update:false
        };

        if (!have_frame) config.params = {_uid:uid}
        else if (page_manager.select_frame('mail')[0].contentWindow.rcmail.env.mailbox !== 'INBOX') {
            config.force_update = true;
            config.update = true;
            have_frame = false;
        }
        
        await page_manager.change_frame('mail', config);

        if (have_frame) {
            page_manager.select_frame('mail')[0].contentWindow.rcmail.message_list.select(uid); 
        }
    }
}