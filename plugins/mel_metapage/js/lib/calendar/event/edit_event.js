import { EventView } from "./event_view";

export class CalendarEvent {
    constructor(event, dialog) {
        this.main(event, dialog);
    }   

    main(calEvent, $dialog) {
        new EventView(calEvent, $dialog);
    }
}