import { MelEnumerable } from "../../classes/enum.js";
import { AlarmPart } from "./parts/alarmpart.js";
import { CategoryPart } from "./parts/categoryparts.js";
import { GuestsPart } from "./parts/guestspart.js";
import { LocationPartManager } from "./parts/location_part.js";
import { RecPart } from "./parts/recpart.js";
import { SensitivityPart } from "./parts/sensitivitypart.js";
import { StatePart } from "./parts/statepart.js";
import { TimePartManager } from "./parts/timepart.js";

class EventField {
    constructor(name, selector) {
        this.name = null;
        this.selector = null;
        Object.defineProperties(this, {
            name:{
                get() {return name;}
            },
            selector:{
                get() {return selector;}
            }
        })
    }


}

class EventManager {
    constructor(...events) {
        this._events = events ?? [];
    }

    add(event) {
        this._events.push(event);
    }

    generate() {
        let config = {};

        for (const iterator of this._events) {
            config[iterator.name] = {
                get(){return $(iterator.selector);}
            };
        }

        Object.defineProperties(this, config);
        config = null;
        this._events = null;

        return this;
    }
}

class EventParts {
    constructor(inputs, fakes, dialog) {
        this.status = new StatePart(inputs.select_status, inputs.select_status.parent().find('span.material-symbols-outlined'));
        this.sensitivity = new SensitivityPart(inputs.select_sensivity, fakes.button_sensivity, fakes.button_sensivity.children().first(), dialog);
        this.alarm = new AlarmPart(inputs.select_alarm, inputs.text_alarm, inputs.select_alarm_offset, fakes.select_alarm);
        this.category = new CategoryPart(inputs.select_category, fakes.select_category, fakes.check_category, fakes.span_category_icon, fakes.button_add_members);
        this.date = new TimePartManager(inputs.date_startdate, inputs.text_starttime, fakes.select_starttime, inputs.date_enddate, inputs.text_endtime, fakes.select_endtime, inputs.check_all_day);
        this.guests = new GuestsPart(inputs.form_attendee, fakes.text_attendee, fakes.text_attedee_optional, fakes.text_attendee_animators, fakes.button_attendee_switch, this.date);
        this.location = new LocationPartManager(fakes.div_eventtype, inputs.text_location, this.category);
        this.recurrence = new RecPart(inputs.select_recurrence, fakes.select_recurrence);
    }
}

export class EventView {
    constructor(event, dialog) {
        this._event = event;
        this._dialog = dialog;

        if (!$._data(this._dialog[0], 'events' )?.dialogbeforeclose){
            this._dialog.on('dialogbeforeclose', () => {
                $('#mel-event-form').css('opacity', '0');
                $('#mel-form-absolute-center-loading-event').css('display', '');
                this.inputs = null;
                this.fakes = null;
                this.parts = null;
            });
        }

        this.inputs = new EventManager(...EventView.true_selectors).generate();
        this.fakes = new EventManager(...EventView.false_selectors).generate();
        this.parts = new EventParts(this.inputs, this.fakes, dialog);
        this.InitializeView();

        $('#mel-event-form').css('opacity', '1');
        $('#mel-form-absolute-center-loading-event').css('display', 'none');

        if (!this._dialog[0].ondrop){
            this._dialog[0].ondrop = (ev) => {
                const autorized = [this.fakes.text_attendee, this.fakes.text_attedee_optional, this.fakes.text_attendee_animators];
                ev = !!ev.dataTransfer ? ev : ev.originalEvent;
                let data = JSON.parse(ev.dataTransfer.getData('text/plain'));

                ev.preventDefault();
                if (MelEnumerable.from(autorized).select(x => x.attr('id')).where(x => ev.target.id === x).any()) {
                    $(`.mel-attendee[data-email="${data.email}"]`).remove();
                    $(ev.target).val(`${data.string},`).change();
                }

                $('.mel-show-attendee-container, [data-linked="attendee-input"]').removeClass('mel-guest-drag-started');
            };
        }
    }

    InitializeView() {
        const ev = this._event;
        // this.inputs.text_title.val(ev.title);
        // this.inputs.select_calendar_owner.val(ev.calendar);
        this.parts.status.onUpdate(ev.status);
        this.parts.sensitivity.onUpdate(!ev.id ? SensitivityPart.STATES.public :  ev.sensitivity);
        this.parts.alarm.init(ev);
        this.parts.category.init(ev);
        this.parts.date.init(ev);
        this.parts.location.init(ev);
        this.parts.guests.init(ev);
        this.parts.recurrence.init(ev);
    }

    static Create(name, selector) {
        return new EventField(name, selector);
    }
}

EventView.true_selectors = [
    EventView.Create('select_calendar_owner', '#edit-calendar'),
    EventView.Create('select_alarm', '#edit-alarm-item'),
    EventView.Create('text_alarm', 'input[name="alarmvalue[]"]'),
    EventView.Create('select_alarm_offset', 'select[name="alarmoffset[]"]'),
    EventView.Create('select_status', '#edit-event-status'),
    EventView.Create('text_title', '#edit-title'),
    EventView.Create('select_category', '#edit-categories'),
    EventView.Create('form_attendee', '#edit-attendees-form'),
    EventView.Create('date_startdate', '#edit-startdate'),
    EventView.Create('text_starttime', '#edit-starttime'),
    EventView.Create('date_enddate', '#edit-enddate'),
    EventView.Create('text_endtime', '#edit-endtime'),
    EventView.Create('form_recurrence', '.event-real-recs'),
    EventView.Create('text_location', '#edit-location'),
    EventView.Create('textarea_description', '#edit-description'),
    EventView.Create('select_sensivity', '#edit-sensitivity'),
    EventView.Create('check_all_day', '#edit-allday'),
    EventView.Create('select_recurrence', '#edit-recurrence-frequency')
];

EventView.false_selectors = [
    EventView.Create('select_alarm', '#mel-calendar-alarm'),
    EventView.Create('check_category', '#edit-wsp'),
    EventView.Create('span_category_icon', '#event-category-icon'),
    EventView.Create('select_category', '#mel-event-category'),
    EventView.Create('button_add_members', '#event-add-member'),
    EventView.Create('check_notify_user', '#notify-users'),
    EventView.Create('text_attendee', '#attendee-input'),
    EventView.Create('text_attedee_optional', '#attendee-input-optional'),
    EventView.Create('text_attendee_animators', '#attendee-animators'),
    EventView.Create('button_attendee_switch', '#mel-attendee-switch'),
    EventView.Create('select_starttime', '#mel-edit-starttime'),
    EventView.Create('select_endtime', '#mel-edit-endtime'),
    EventView.Create('select_recurrence', '#fake-event-rec'),
    EventView.Create('div_eventtype', '#events-type'),
    EventView.Create('button_sensivity', '#update-sensivity'),
];