import { Calendar_Alarm } from "../calendar/calendar_alarm";
import { CalendarLoader } from "../calendar/calendar_loader";
import { WaitSomething } from "../mel_promise";
import { MetapageModule } from "./metapage_module";

export class MetapageCalendarModule extends MetapageModule {
    constructor() {
        super();
    }

    /**
     * @protected
     * @async Actions principales
     */
    async main() {
        super.main();

        this._init();

        this.alarm_manager.clearTimeouts();

        await new WaitSomething(() => !!rcmail._events['plugin.display_alarms']);

        this.alarm_manager.generate(await CalendarLoader.Instance.force_load_all_events_from_storage());
    }

    /**
     * Initialise la classe
     * @private
     * @returns Chaîne
     */
    _init() {
        this.alarm_manager = new Calendar_Alarm();

        return this;
    }

}