import { EventView } from "./event_view.js";

export class CalendarEvent {
    constructor(event, dialog) {

        if (!event) event = cal.selected_event;
        if (!dialog) dialog = window.kolab_event_dialog_element ?? parent.kolab_event_dialog_element ?? top.kolab_event_dialog_element;

        this.main(event, dialog);
    }   

    main(calEvent, $dialog) {
        new EventView(calEvent, $dialog);
    }

    static Exist(func_name) {
        return !!window.rcube_calendar_ui?.[func_name]
    }

    static CalendarExtends(func_name, callback) {
        if (!this.Exist(func_name)) window.rcube_calendar_ui[func_name] = callback.bind(window.rcube_calendar_ui);
    }
}

