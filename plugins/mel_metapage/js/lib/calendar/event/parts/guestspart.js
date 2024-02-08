import { MelEnumerable } from "../../../classes/enum.js";
import { EMPTY_STRING } from "../../../constants/constants.js";
import { BnumException } from "../../../exceptions/bnum_base_exceptions.js";
import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { BnumEvent } from "../../../mel_events.js";
import { FakePart, Parts } from "./parts.js";

class GuestPartFieldException extends BnumException {
    constructor(part, $field) {
        super(part, `Le champ ${$field.attr('id') || 'sans identifiant'} ne possède pas de parent !`);
        this.$field = null;
        Object.defineProperty(this, '$field', {
            get() { return $field; }
        });
    }
}

class GuessPartAddException extends BnumException {
    constructor(part, value) {
        super(part, `Une adresse email est obligatoire !`);
        this.value = null;
        Object.defineProperty(this, 'value', {
            get() { return value; }
        });
    }
}

class GuestButton extends Parts {
    constructor($button) {
        super($button, Parts.MODE.click);
        this.clicked = new BnumEvent();
        this._state = false;
    }

    onUpdate(){
        this._state = !this._state;

        if (this._state) this._$field.find('span').html('expand_less');
        else this._$field.find('span').html('expand_more');
    }

    onClick(...args) {
        this.clicked.call(!this._state);
        this.onUpdate();
    }

    click() {
        this.onClick();
    }
}

class Guest {
    constructor(name, email) {
        this._init()._setup(name, email);
    }

    _init() {
        this.name = EMPTY_STRING;
        this.email = EMPTY_STRING;

        return this;
    }

    _setup(name, email) {
        Object.defineProperties(this, {
            name: {
                get() { return name.replaceAll('\"', EMPTY_STRING); }
            },
            email: {
                get() { return email; }
            }
        });
    }

    async get_dispo(start, end, allDay = false) {
        let dispo = EMPTY_STRING;
        const date2servertime = cal.date2ISO8601;
        const clone_date = function (date, adjust) {
            var d = 'toDate' in date ? date.toDate() : new Date(date.getTime());
        
            // set time to 00:00
            if (adjust == 1) {
              d.setHours(0);
              d.setMinutes(0);
            }
            // set time to 23:59
            else if (adjust == 2) {
              d.setHours(23);
              d.setMinutes(59);
            }
        
            return d;
          };

        await $.ajax({
            type: 'GET',
            dataType: 'html',
            //Pamela - correction de l'url
            url: rcmail.get_task_url("calendar&_action=freebusy-status", window.location.origin + window.location.pathname),//rcmail.url('freebusy-status'),
            data: { email: this.email, start: date2servertime(clone_date(start, allDay ? 1 : 0)), end: date2servertime(clone_date(end, allDay ? 2 : 0)), _remote: 1 },
            success: function (status) {
              var avail = String(status).toLowerCase();
              //console.log('avail', avail);
              dispo = avail;
              //icon.removeClass('loading').addClass(avail).attr('title', rcmail.gettext('avail' + avail, 'calendar'));

            },
            error: function () {
                dispo = 'unknown';
              //icon.removeClass('loading').addClass('unknown').attr('title', rcmail.gettext('availunknown', 'calendar'));
            }
          });

          return dispo;
    }

    _close_button_click(e) {
        $(`div.mel-attendee[data-email="${$(e.currentTarget).attr('data-parent')}"]`).remove();
    }

    _formated() {
        if (!!(this.name || false)) return `${this.name} <${this.email}>`;

        else return this.email;
    }

    toHtml(event) {
        let html = MelHtml.start
        .div({class:'mel-attendee', title:this._formated(), 'data-email':this.email, 'data-name':this.name})
            .span({class:'availability'})
                .span({class:'availabilityicon loading'})
                .end()
            .end()
            .span({class:'attendee-name'}).text(this.name || this.email).end()
            .button({type:'button', class:'close-button btn btn-secondary for-attendee', 'data-parent':this.email, onclick:this._close_button_click.bind(this)}).removeClass('mel-button').removeClass('no-button-margin').removeClass('no-margin-button').icon('close').end().end()
        .end().generate();

        this.get_dispo(event.start, event.end, event.AllDay).then((dispo) => {
            html.find('.availabilityicon').removeClass('loading').addClass(dispo).attr('title', rcmail.gettext('avail' + dispo, 'calendar'));
        });

        return html;
    }

}

export class GuestsPart extends FakePart{
    constructor($addInput, $neededInput, $optionalInput, $animatorsInput, $switchButton){
        super($addInput, $neededInput, Parts.MODE.change);
        this._$optionnals = $optionalInput;
        this._$animators = $animatorsInput;
        this._switchButton = new GuestButton($switchButton);
    }

    init(event){
        let it = 0;
        const fields = [this._$fakeField, this._$optionnals, this._$animators];
        const main_field_index = 0;


        for (const $field of fields) {
            if (0 === $(`[data-linked="${$field.attr('id')}"]`).length) throw new GuestPartFieldException(this, $field);

            this._add_focus_if_not_exist($field);
            rcmail.init_address_input_events($field);

            if (it++ !== main_field_index) this._p_try_add_event($field, 'change', this.onChange.bind(this, $field));

            this._p_try_add_event($field, 'input', this.onChange.bind(this, $field));
        }

        if (0 === this._switchButton.clicked.count()) {
            this._switchButton.clicked.push(this._on_switch.bind(this));
        }

        this._switchButton._state = true;
        this._switchButton.click();
    }  

    onUpdate(val, $field) {
        if (val.includes(',')) {
            const event = cal.selected_event;
            val = val.split(',');

            for (const iterator of MelEnumerable.from(val).where(x => x.trim() !== EMPTY_STRING).select(this._slice_user_datas.bind(this))) {
                if (iterator.email === EMPTY_STRING) throw new GuessPartAddException(this, iterator.email);
                
                if (0 === $(`div.mel-attendee[data-email="${iterator.email}"`).length) {
                    var $attendee_field = $attendee_field || $(`.mel-show-attendee[data-linked="${$field.attr('id')}"]`);

                    $field.before(new Guest(iterator.name, iterator.email).toHtml(event).attr('data-parent', $field.attr('id')));
                }
                else rcmail.display_message(`Le participant ${iterator.name || iterator.email} éxiste déjà !`, 'error');
            }

            $field.val(EMPTY_STRING);
            $field.focus();
        }
    }

    _slice_user_datas(val) {
        let data = {
            name:EMPTY_STRING,
            email:EMPTY_STRING
        };

        if (val.includes('<')) {
            val = val.split('<');
            data.name = val[0].trim();
            data.email = val[1].replace('>', EMPTY_STRING).trim();
        }

        return data;
    }

    onChange(...args) {
        const [e, $field] = this._get_args(args);
        this.onUpdate($(e.currentTarget).val(), ($field?.click ? $field : null) ?? this._$fakeField);
    }

    _get_args(args) {
        let [event, $field] = args;

        if (!!event.val) {
            return [$field, event];
        }

        return args;
    }

    _add_focus_if_not_exist($field) {
        if (!$._data($field[0], 'events' )?.focus) $field.on('focus', (e) => {
            $(`[data-linked="${$(e.currentTarget).attr('id')}"]`).addClass('forced-focus');
        });

        if (!$._data($field[0], 'events' )?.focusout) $field.on('focusout', (e) => {
            $(`[data-linked="${$(e.currentTarget).attr('id')}"]`).removeClass('forced-focus');
        });
        return this;
    }

    _on_switch(state) {
        if (state) {
            this._$fakeField.attr('placeholder', 'Participants obligatoires');
            this._$optionnals.parent().css('display', EMPTY_STRING);
            this._$animators.parent().css('display', EMPTY_STRING);

            for (const iterator of this._$fakeField.parent().find('.mel-attendee')) {
                $(`#${$(iterator).attr('data-parent')}`).before($(iterator));
            }
        }
        else {
            this._$fakeField.attr('placeholder', 'Ajoutez des participants');
            this._$optionnals.parent().css('display', 'none');
            this._$animators.parent().css('display', 'none');    

            const fields = [this._$optionnals, this._$animators];

            for (const $field of fields) {
                for (const iterator of $field.parent().find('.mel-attendee')) {
                    this._$fakeField.before($(iterator));
                }
            }
        }
    }
}