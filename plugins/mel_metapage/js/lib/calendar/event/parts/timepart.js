import { EMPTY_STRING } from "../../../constants/constants.js";
import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { GuestsPart } from "./guestspart.js";
import { FakePart, Parts } from "./parts.js";

export class TimePartManager {
    constructor($start_date, $start_time, $start_select, $end_date, $end_time, $end_select, $allDay) {
        this.start = new TimePart($start_time, $start_select);
        this.end = new TimePart($end_time, $end_select);
        this._$start_date = $start_date;
        this._$end_date = $end_date;
        this.$allDay = $allDay;
        this.base_diff = 0;

        Object.defineProperties(this, {
            date_start: {
                get:() => {
                    return moment(`${this._$start_date.val()} ${this.start._$fakeField.val()}`, 'DD/MM/YYYY HH:mm');
                }
            },
            date_end:{
                get:() => {
                    return moment(`${this._$end_date.val()} ${this.end._$fakeField.val()}`, 'DD/MM/YYYY HH:mm');
                }
            }
        })
    }

    init(event) {
        if (event.allDay) {
            this.start.init(moment().startOf('day'), this.base_diff);
            this.end.init(moment().startOf('day'), this.base_diff);
            this.$allDay[0].checked = true;
        }
        else {
            if (!event.start || !event.end) {
                const now = moment();
                
                if (!event.start) event.start = now;

                if (!event.end) {
                    event.end = moment(event.start).add(TimePart.INTERVAL, 'm');

                    if (event.start.format('DD/MM/YYYY') !== event.end.format('DD/MM/YYYY')) {
                        event.end = moment(event.start).endOf('d');

                        if (event.start.format('DD/MM/YYYY HH:mm') === event.end.format('DD/MM/YYYY HH:mm')) event.start = event.start.remove(1, 'm');
                    }
                }
            }

            this.start.init(moment(event.start), this.base_diff);
            this.end.reinit(moment(event.end), this.base_diff, (moment(event.start).format('DD/MM/YYYY') === moment(event.end).format('DD/MM/YYYY') ? moment(event.start).format('HH:mm')  : null));
            this.$allDay[0].checked = false;
        }

        if (($._data(this.start._$fakeField[0], 'events' )?.change?.length ?? 0) <= 1) {
            this.start._$fakeField.on('change', this._update_date.bind(this));
        }

        if (($._data(this.$allDay[0], 'events' )?.change?.length ?? 0) === 0) {
            this.$allDay.on('change', (e) => {
                if ($(e.currentTarget)[0].checked) {
                    this.start._$fakeField.css('display', 'none').parent().parent().addClass('all-day');
                    this.end._$fakeField.css('display', 'none').parent().parent().addClass('all-day');

                }
                else {
                    this.start._$fakeField.css('display', '').parent().parent().removeClass('all-day');
                    this.end._$fakeField.css('display', '').parent().parent().removeClass('all-day');
                }
            });
        }

        rcmail.addEventListener('calendar.event_times_changed', this._update_date.bind(this));

        const _base_diff = (moment(`${this._$end_date.val()} ${this.end._$fakeField.val()}`, 'DD/MM/YYYY HH:mm') - moment(`${this._$start_date.val()} ${this.start._$fakeField.val()}`, 'DD/MM/YYYY HH:mm'));///60/1000;

        Object.defineProperty(this, 'base_diff', {
            get() {return _base_diff;}
        });
    }

    is_valid() {
        return this.start.is_valid() && this.end.is_valid() && moment(this._$start_date.val(), 'DD/MM/YYYY').isValid() && moment(this._$end_date.val(), 'DD/MM/YYYY').isValid()
    }

    invalid_action() {
        this._invalid_action_date(this._$start_date, 'début') || 
        this._invalid_action_date(this._$end_date, 'fin') ||
        this._invalid_action_time(this.start, 'début') ||
        this._invalid_action_time(this.end, 'fin');
    }

    _invalid_action_date($field, word) {
        if (!moment($field.val(), 'DD/MM/YYYY').isValid()) {
            rcmail.display_message(`Le date de ${word} n'est pas valide !`, 'error');
            $field.focus();
            return true;
        }

        return false;
    }

    _invalid_action_time(part, word) {
        if (!part.is_valid()) {
            rcmail.display_message(`L'heure de ${word} n'est pas valide !`, 'error');
            part._$fakeField.focus();
            return true;
        }

        return false;
    }

    _update_date() {
        if (true === this._update_date.started) return;
        else this._update_date.started = true;

        let start = moment(`${this._$start_date.val()} ${this.start._$fakeField.val()}`, 'DD/MM/YYYY HH:mm');
        let end = moment(`${this._$end_date.val()} ${this.end._$fakeField.val()}`, 'DD/MM/YYYY HH:mm');

        if (start >= end) {
            end = moment(`${this._$start_date.val()} ${this.end._$fakeField.val()}`, 'DD/MM/YYYY HH:mm');//.add(TimePart.INTEVERVAL, 'm');
            this.end.reinit(end, this.base_diff, start.format('HH:mm'));
            this._$end_date.val(start.format('DD/MM/YYYY')).change();

            if (!(this.end._$fakeField.val() || false)) {
                end = start.add(1, 'd').startOf('d').add(this.base_diff);
                this._$end_date.val(end.format('DD/MM/YYYY'));
                this.end._$fakeField.val(end.format('HH:mm'));
                this._update_date.started = false;
                this._update_date();
            }
        }
        else {
            let is_same_day = moment(start).startOf('day').format('DD/MM/YYYY') === moment(end).startOf('day').format('DD/MM/YYYY');
            let need_reinit = this.end._$fakeField.children().first().val() !== (is_same_day ? start.format('HH:mm') : '00:00');

            if (need_reinit) this.end.reinit(end, this.base_diff, (is_same_day ? start.format('HH:mm') : null));
        }

        GuestsPart.UpdateFreeBusy(this);

        this._update_date.started = false;
    }

    static UpdateOption(select, value) {
        TimePart.UpdateOption(select, value);
    }

}

class TimePart extends FakePart{
    constructor($time_field, $time_select) {
        super($time_field, $time_select, Parts.MODE.change);
    }

    init(val, base_interval, min = null) {
        if (0 === this._$fakeField.children().length) {
            if (!!min) {
                min = min.split(':');
                min = moment().startOf('day').add(+min[0], 'H').add(+min[1], 'm');
            }

            let base = moment().startOf('day');
            let next = moment().startOf('day').add(1, 'd');
            let formatted_text = null;

            while (base < next) {
                if (!min || base > min) {
                    formatted_text = base.format('HH:mm')
                    this._$fakeField.append(MelHtml.start.option({value:formatted_text}).text(formatted_text).end().generate());
                }

                base = base.add(TimePart.INTERVAL, 'm');
            }
        }

 
        val = this._toTimeMoment(val);
        min = !!min ? this._toTimeMoment(min) : null;
        const formatted = !!min && val <= min ? moment(min).add(base_interval).format('HH:mm') : val.format('HH:mm');

        TimePart.UpdateOption(this._$fakeField.attr('id'), formatted);

        $(`#${this._$fakeField.attr('id')}`).val(formatted);

        if (this._$field.val() !== $(`#${this._$fakeField.attr('id')}`).val()) {
            this._$field.val(formatted);
        }
    }

    static UpdateOption(select, value) {
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

    _toTimeMoment(val) {
        return moment(`${moment().startOf('year').format('DD/MM/YYYY')} ${val.format('HH:mm')}`);
    }

    reinit(val, base_interval, min){
        this._$fakeField.empty();
        this.init(val, base_interval, min);
    } 

    onChange(e) {

    }

    is_valid() {
        return this._$fakeField.val() !== EMPTY_STRING;
    }
}

TimePart.INTERVAL = 15;