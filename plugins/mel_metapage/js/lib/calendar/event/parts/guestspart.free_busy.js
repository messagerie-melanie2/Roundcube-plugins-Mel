import { MelEnumerable } from "../../../classes/enum.js";
import { MelHtml } from "../../../html/JsHtml/MelHtml.js";
import { GuestsPart } from "./guestspart.js";
import { TimePartManager } from "./timepart.js";

const DAY_MS = 86400000;
const HOUR_MS = 3600000;
export class FreeBusyGuests {
    constructor() {
        const allday = $('#edit-allday');
        this.interval = allday.checked ? 1440 : (60 / ( cal.settings.timeslots || 1));
    }


    /**
     * 
     * @param {*} event 
     * @returns {Promise<Slot[]>}
     */
    async load_freebusy_data (event) {
        if (!FreeBusyGuests.can) return [];

        const interval = this.interval;
        var from = new Date();
        from.setTime(event.start);
        from.setHours(0); from.setMinutes(0); from.setSeconds(0); from.setMilliseconds(0);
        var event_attendees = event.attendees;
        var parseISO8601 = cal.parseISO8601;
        var date2servertime = cal.date2ISO8601;
          // fix date if jumped over a DST change
        var fix_date = function (date) {
            if (date.getHours() == 23)
            date.setTime(date.getTime() + HOUR_MS);
            else if (date.getHours() > 0)
            date.setHours(0);
        };

        // clone the given date object and optionally adjust time
        var clone_date = function (date, adjust) {
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

        var freebusy_data = { required: {}, all: {} };
        var start = new Date(from.getTime() - DAY_MS * 2);  // start 2 days before event
        fix_date(start);
        var end = new Date(start.getTime() + DAY_MS * 14);   // load min. 14 days
        freebusy_data.all = [];
        freebusy_data.required = [];

        let valid_slots = [];
        let promises = [];

        // load free-busy information for every attendee
        var domid, email, tmp;
        for (var i = 0; i < event_attendees.length; i++) {
            if ((email = event_attendees[i].email)) {
                domid = String(email).replace(rcmail.identifier_expr, '');

                tmp = $.ajax({
                type: 'GET',
                dataType: 'json',
                url: rcmail.get_task_url("calendar&_action=freebusy-times"),// rcmail.url('freebusy-times'),
                data: { email, interval, start: date2servertime(clone_date(start, 1)), end: date2servertime(clone_date(end, 2)), _remote: 1 },
                success: function (data) {
                    // find attendee
                    var i, attendee = null;
                    for (i = 0; i < event_attendees.length; i++) {
                        if (event_attendees[i].email == data.email) {
                            attendee = event_attendees[i];
                            break;
                        }
                    }

                    if (attendee.role !== 'OPT-PARTICIPANT') {
                        let slots = new Slots(data);
                        valid_slots.push(...slots.getNextFreeSlots(3, moment(event.start)));
                    }
                }
                });

                promises.push(tmp);
                tmp = null;
            }
        }
        await Promise.allSettled(promises);

        if (valid_slots.length > 0) {
            valid_slots = MelEnumerable.from(valid_slots).distinct().take(3).toArray();
        }

        return valid_slots;
    }

    static async Get(start, end, attendees) {
        return await (new FreeBusyGuests()).load_freebusy_data({start, end, attendees});
    }
}

FreeBusyGuests.can = true;

class Slots {
    constructor(data) {
        this.email = data.email;
        this.start = data.start;
        this.end = data.end;
        this.interval = data.interval;
        this.slots = [];

        for (let index = 0, len = data.slots.length; index < len; ++index) {
            const slot = data.slots[index];
            this.slots.push(new Slot(this.start, this.interval, index, slot));
        }
    }

    getNextFreeSlots(how_many, start_date_corrector = null) {
        let array = [];

        if (this.slots.length > 0) {
            array = MelEnumerable.from(this.slots);

            if (!!start_date_corrector) array = array.where(x => x.start >= start_date_corrector);

            array = array.where(x => x.isFree && !x._is_in_working_hour).take(how_many).toArray();
        }

        return array;
    }
}

class Slot {
    constructor(start, interval, index, state) {
        this.start = moment(start).add(interval * index, 'm');
        this.end;
        this.isFree = false;
        Object.defineProperty(this, 'isFree', {
            value:[Slot.STATES.free, Slot.STATES.telework, Slot.STATES.unknown].includes(state),
            writable:false,
            configurable:false
        });
        Object.defineProperty(this, 'end', {
            get:() => {
                let end = moment(this.start).add(interval, 'm');

                if (this.start.format('DD/MM/YYYY') !== end.format('DD/MM/YYYY')) {
                    end = moment(this.start).endOf('d');
                }

                return end;
            }
        });
        Object.defineProperty(this, 'state', {
            get:() => state
        });
        this._is_in_working_hour;
        Object.defineProperty(this, '_is_in_working_hour', {
            get:() => !!cal.settings.work_start && !!cal.settings.work_end && !(this.start >= moment(this.start).startOf('d').add(cal.settings.work_start, 'h') && this.start < moment(this.start).startOf('d').add(cal.settings.work_end, 'h')) || this.start.format('d') === '0' || this.start.format('d') === '6'
        });
    }


    generate(timePart) {
        return (this.start.format('DD/MM/YYYY') === this.end.format('DD/MM/YYYY')) ? this._generate_same_date(timePart) : this._generate_different_date(timePart);
    }

    _generate_same_date(timePart){
        return MelHtml.start
        .button({class:'slot', type:'button', onclick:this._onclick.bind(this, timePart)})
            .div({class:'slot-date d-flex'})
                .icon('calendar_month').end()
                .span().text(this.start.format('DD/MM/YYYY')).end()
            .end()
            .div({class:'slot-date d-flex'})
                .icon('schedule').end()
                .span().text(`${this.start.format('HH:mm')} - ${this.end.format('HH:mm')}`).end()
            .end()
        .end();
    }

    _generate_different_date(timePart) {
        return MelHtml.start
        .button({class:'slot', type:'button', onclick:this._onclick.bind(this, timePart)})
            .div({class:'slot-date d-flex'})
                .icon('date_range').end()
                .span().text(this.start.format('DD/MM/YYYY HH:mm')).end()
            .end()
            .div({class:'slot-date d-flex'})
                .icon('remove').end()
                .span().text(this.end.format('DD/MM/YYYY HH:mm')).end()
            .end()
        .end();
    }

    /**
     * 
     * @param {TimePartManager} timePart 
     */
    _onclick(timePart) {
        GuestsPart.can = false;
        timePart.start._$fakeField.val(this.start.format('HH:mm')).change();
        timePart.end._$fakeField.val(this.end.format('HH:mm')).change();
        timePart._$start_date.val(this.start.format('DD/MM/YYYY')).change();
        timePart._$end_date.val(this.start.format('DD/MM/YYYY')).change();
        GuestsPart.can = true;
        GuestsPart.INSTANCE.update_free_busy();
    }

}

Slot.STATES = {
    unknown:'0',
    free:'1',
    busy:'2',
    tentative:'3',
    oof:'4',
    telework:'5'
}