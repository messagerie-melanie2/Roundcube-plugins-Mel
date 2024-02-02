import { AlarmPart } from "./parts/alarmpart.js";
import { FreeBusyPart } from "./parts/freebusypart.js";
import { StatePart } from "./parts/statepart.js";

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
        this.freebusy = new FreeBusyPart(inputs.select_sensivity, fakes.button_sensivity, fakes.button_sensivity.children().first(), dialog);
        this.alarm = new AlarmPart(inputs.select_alarm, inputs.text_alarm, inputs.select_alarm_offset, fakes.select_alarm);
    }
}

export class EventView {
    constructor(event, dialog) {
        this._event = event;
        this._dialog = dialog;
        this.inputs = new EventManager(...EventView.true_selectors).generate();
        this.fakes = new EventManager(...EventView.false_selectors).generate();
        this.parts = new EventParts(this.inputs, this.fakes, dialog);
        this.InitializeView();
    }

    InitializeView() {
        const ev = this._event;
        this.inputs.text_title.val(ev.title);
        this.inputs.select_calendar_owner.val(ev.calendar);
        this.parts.status.onUpdate(ev.status);
        this.parts.freebusy.onUpdate(!ev.id ? 'free' :  ev.free_busy);
        this.parts.alarm.init(ev);

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
];

EventView.false_selectors = [
    EventView.Create('select_alarm', '#mel-calendar-alarm'),
    EventView.Create('check_category', '#edit-wsp'),
    EventView.Create('span_category_icon', '#event-category-icon'),
    EventView.Create('select_category', '#event-category'),
    EventView.Create('button_add_members', '#event-add-member'),
    EventView.Create('select_category', '#edit-categories'),
    EventView.Create('check_notify_user', '#notify-users'),
    EventView.Create('text_attendee', '#attendee-input'),
    EventView.Create('text_attedee_optional', '#attendee-input-optional'),
    EventView.Create('text_attendee_animators', '#attendee-input-animators'),
    EventView.Create('select_starttime', '#mel-edit-starttime'),
    EventView.Create('select_endtime', 'mel-edit-endtime'),
    EventView.Create('select_recurrence', '#fake-event-rec'),
    EventView.Create('div_eventtype', '#events-type'),
    EventView.Create('button_sensivity', '#update-sensivity'),
];