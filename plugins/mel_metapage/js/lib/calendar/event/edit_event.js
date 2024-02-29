import { EventView } from "./event_view";

export class CalendarEvent {
    constructor(event, dialog) {

        if (!event) event = cal.selected_event;
        if (!dialog) dialog = top.kolab_event_dialog_element;

        this.main(event, dialog);
    }   

    main(calEvent, $dialog) {
        new EventView(calEvent, $dialog);
    }
}