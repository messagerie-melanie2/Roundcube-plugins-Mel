import { MailBaseModel } from "./mail_base_model";

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
            let $element = $(`#${id}`).css('display', EMPTY_STRING);

            if (have_mail) $element.outerHTML = this.generate()[0].outerHTML;
            else $element.css('display', 'none');
        }

        return this;
    }

    _before_generate() {
        this._create_content();
        this.addClass('melv2-mail');
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

        this.addContent(left);
        this.addContent(right);
    }

    _generate_div({text, base_class}) {
        return mel_html.div({class:`melv2-mail-${base_class}`}, text);
    }

    _generate_from() {
        const from = this.mail?.from ?? '';
        const base_class = 'from';

        this._generate_div({text: from, base_class: base_class});
    }

    _generate_subject() {
        const subject = this.mail?.subject ??;
        const base_class = 'subject';

        this._generate_div({text: subject, base_class: base_class});
    }

    _generate_date() {
        const now = moment();
        const base_date = this.mail?.date ?? now;
        const base_class = 'melv2-mail-date';

        let date = EMPTY_STRING;

        if (moment(base_date).startOf('day') === moment(now).startOf('day')) date = new mel_html('span', {class:base_class},  moment(base_date).format('HH:mm'));
        else {
            date = moment(base_date);

            const left_date = mel_html.div({class:`${base_class}-left`}, date.format('DD/MM -'));
            const right_date = mel_html.div({class:`${base_class}-right`}, date.format('HH:mm'));

            date = new mel_html2('div', {attribs:{class:base_class}, contents:[left_date, right_date]});
            date.addClass('melv2-mail-old');
        }

        return date;
    }
}