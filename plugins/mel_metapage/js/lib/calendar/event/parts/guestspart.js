import { MelEnumerable } from "../../../classes/enum.js";
import { EMPTY_STRING } from "../../../constants/constants.js";
import { BnumException } from "../../../exceptions/bnum_base_exceptions.js";
import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { BnumEvent } from "../../../mel_events.js";
import { MelObject } from "../../../mel_object.js";
import { Mel_Promise } from "../../../mel_promise.js";
import { FreeBusyGuests } from "./guestspart.free_busy.js";
import { FakePart, Parts } from "./parts.js";
import { TimePartManager } from "./timepart.js";

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

    _dragStart(ev) {
        ev = !!ev.dataTransfer ? ev : ev.originalEvent;
        ev.dataTransfer.dropEffect = "move";
        ev.dataTransfer.setData("text/plain", JSON.stringify({name:this.name, email:this.email, string:this.toString()}));

        $('.mel-show-attendee-container, [data-linked="attendee-input"]').addClass('mel-guest-drag-started');
    } 

    _dragEnd(ev) {
        $('.mel-show-attendee-container, [data-linked="attendee-input"]').removeClass('mel-guest-drag-started');
    }

    toHtml(event) {
        let html = MelHtml.start
        .div({class:'mel-attendee', title:this._formated(), 'data-email':this.email, 'data-name':this.name, draggable:true, ondragstart:this._dragStart.bind(this), ondragend:this._dragEnd.bind(this)})
            .span({class:'availability'}).css({'margin-left':'5px', 'margin-right':'5px'})
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

    toString() {
        return this._formated();
    }

    toAttendee(role = 'REQ-PARTICIPANT'){
        return {
            role,
            name:this.name,
            email:this.email
        }
    }

    /**
     * 
     * @param {*} $attendee 
     * @param {GuestsPart} parent 
     */
    static From($attendee, parent) {
        return {name:$attendee.attr('data-name'), email:$attendee.attr('data-email'), role:Guest._GuestRole($attendee.attr('data-parent'), parent)};
    }

    static _GuestRole(id, parent) {
        let role = EMPTY_STRING;

        switch (id) {
            case null:
            case parent._$fakeField.attr('id'):
                role = 'REQ-PARTICIPANT';
                break;

            default:
                role = 'OPT-PARTICIPANT';
                break;

            case parent._$animators.attr('id'):
                role = 'CHAIR';
                break;
        }

        return role;
    }

}

export class GuestsPart extends FakePart{
    /**
     * 
     * @param {*} $addInput 
     * @param {*} $neededInput 
     * @param {*} $optionalInput 
     * @param {*} $animatorsInput 
     * @param {*} $switchButton 
     * @param {TimePartManager} datePart 
     */
    constructor($addInput, $neededInput, $optionalInput, $animatorsInput, $switchButton, datePart){
        super($addInput, $neededInput, Parts.MODE.change);
        GuestsPart.stop = true;
        this._$optionnals = $optionalInput;
        this._$animators = $animatorsInput;
        this._switchButton = new GuestButton($switchButton);
        this._datePart = datePart;
        this.cant_modify = false;

        GuestsPart.INSTANCE = this;

        const ids = {
            start_date:this._datePart._$start_date.attr('id'),
            end_date:this._datePart._$end_date.attr('id'),
            start_time:this._datePart.start._$fakeField.attr('id'),
            end_time:this._datePart.end._$fakeField.attr('id')
        }

        if (!rcmail.has_guest_dialog_attendees_save)
        {
            const fnc = function (date) {
                const {start, end} = date;

                let update_options = function update_options(select, value) {
                    if ($(`#${select} [value="${value}"]`).length === 0) 
                    {
                        const current = moment(value, 'HH:mm');
    
                        for (const e of $(`#${select} option`)) {
                            if (current < moment($(e).val(), 'HH:mm')) {
                                $(e).before($('<option>').val(value).text(value));
                                break;
                            }
                        }
                    }
                }
    
                GuestsPart.can = false;
                $(`#${this.start_date}`).val(start.date).change();
                update_options(this.start_time, start.time);
                $(`#${this.start_time}`).val(start.time).change();
                $(`#${this.end_date}`).val(end.date).change();
                update_options(this.end_time, end.time);
                $(`#${this.end_time}`).val(end.time).change();
                update_options = null;
                GuestsPart.can = true;

                GuestsPart.INSTANCE.update_free_busy();
            };

            rcmail.addEventListener('dialog-attendees-save', fnc.bind(ids));

            rcmail.has_guest_dialog_attendees_save = true;   
        }

        $('#edit-attendees-donotify').removeClass('manually-changed').off('change').on('change', () => {
            if (!$('#edit-attendees-donotify').hasClass('manually-changed')) {
                $('#edit-attendees-donotify').addClass('manually-changed');
            }
        });

    }

    init(event){
        let it = 0;
        const fields = [this._$fakeField, this._$optionnals, this._$animators];
        const main_field_index = 0;
        const cant_modify = (event?.attendees?.length || 0) > 0 && !cal.is_internal_organizer(event);

        $('.mel-attendee').remove();
        $('#emel-free-busy').html('');

        for (const $field of fields) {
            if (0 === $(`[data-linked="${$field.attr('id')}"]`).length) throw new GuestPartFieldException(this, $field);

            this._add_focus_if_not_exist($field);
            rcmail.init_address_input_events($field);

            if (it++ !== main_field_index) this._p_try_add_event($field, 'change', this.onChange.bind(this, $field));

            this._p_try_add_event($field, 'input', this.onChange.bind(this, $field));

            if (cant_modify) $field.attr('disabled', 'disabled').addClass('disabled');
            else $field.removeAttr('disabled').removeClass('disabled');
        }

        if (0 === this._switchButton.clicked.count()) {
            this._switchButton.clicked.push(this._on_switch.bind(this));
        }

        if ((event?.attendees?.length ?? 0) > 0) {
            let $field;
            for (const iterator of event.attendees) {
                switch (iterator.role) {
                    case 'REQ-PARTICIPANT':
                        $field = this._$fakeField;
                        break;

                    case 'NON-PARTICIPANT':
                    case 'OPT-PARTICIPANT':
                        $field = this._$optionnals;
                        break;

                    case 'CHAIR':
                        $field = this._$animators;
                        break;
                
                    default:
                        continue;
                }

                $field.before(new Guest(iterator.name, iterator.email).toHtml(event).attr('data-parent', $field.attr('id')));
            }

            $field = null;
        }

        this._switchButton._state = true;
        this._switchButton.click();
        $('#edit-attendees-donotify').prop('checked', false);

        if (cant_modify) {
            $('#showcontacts_attendee-input').attr('disabled', 'disabled').addClass('disabled');
        }
        else {
            $('#showcontacts_attendee-input').removeAttr('disabled').removeClass('disabled');

            if ((event?.attendees?.length ?? 0) > 0) {
                $('#edit-attendees-donotify').prop('checked', true);
                this.update_free_busy();
            } 
        }
        
        this.cant_modify = cant_modify;
    }  

    async update_free_busy() {
        await GuestsPart.UpdateFreeBusy(this._datePart);
    }

    static async UpdateFreeBusy(timePart) {
        if (GuestsPart.can === false) return;

        if (GuestsPart.stop) GuestsPart.stop = false;

        const start = timePart.date_start;
        const end = timePart.date_end;
        const attendees = MelEnumerable.from($('.mel-attendee')).select(x => Guest.From($(x), GuestsPart.INSTANCE)).aggregate([
            this.GetMe().toAttendee()
        ]).toArray();

        if (attendees.length > 1 && !GuestsPart.INSTANCE.cant_modify) {
            let $main_div = $('#emel-free-busy').html($('<center><span class="spinner-border"><span class="sr-only">Loading...</span></span></center>'));
            let promise = new Mel_Promise(async () => await new FreeBusyGuests().load_freebusy_data({start, end, attendees}));

            while (promise.isPending()) {
                await Mel_Promise.Sleep(10);

                if (GuestsPart.stop) {
                    $('#emel-free-busy').html('');
                    GuestsPart.stop = false;
                    console.info('Stopped !');
                    return;
                }
            }

            const slots = await promise;
            promise = null;
            let $find_next = MelHtml.start        
            .button({class:'slot', type:'button', onclick:() => $('#edit-attendee-schedule').click()}).css('height', '100%')
                .text("Trouver d'autres disponibilités")
            .end().generate();
    
            if (slots.length > 0)
            {
                $('#emel-free-busy').find('.spinner-border').addClass('text-success');
                let $div = $('<div>').addClass('row');
    
                for (const slot of slots) {
                    slot.generate(timePart).generate().appendTo($('<div>').addClass('col-md-3').appendTo($div));
                }
    
                $find_next.appendTo($('<div>').addClass('col-md-3').appendTo($div));
    
                $main_div.html($div);
            }
            else $main_div.html($find_next.appendTo($('<div>').addClass('col-md-3')));
    
            $('<div>').addClass('dispo-freebusy-text').text('Premières disponibilité commune').css('margin-bottom', '5px').prependTo($main_div);
        }
    }

    static GetMe() {
        const cal = rcmail.env.calendars[$('#edit-calendar').val()];

        return new Guest((cal?.owner_name || EMPTY_STRING), cal.owner_email);
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

            if (!$('#edit-attendees-donotify').hasClass('manually-changed')) $('#edit-attendees-donotify').prop('checked', true);

            $field.val(EMPTY_STRING);
            $field.focus();

            this.update_free_busy();
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
        else if (val.includes('@')) data.email = val.trim();

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

GuestsPart.can = true;
GuestsPart.stop = false;