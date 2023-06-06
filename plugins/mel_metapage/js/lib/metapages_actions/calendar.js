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
        const startOfDay = moment().startOf('day');

        super.main();

        this._init();

        this.alarm_manager.clearTimeouts();

        await new WaitSomething(() => !!rcmail._events['plugin.display_alarms']);

        let events = await this.calendarLoader().force_load_all_events_from_storage()
        events = Enumrable.from(events).where(x => moment(x.start) > startOfDay).toArray();

        this.alarm_manager.generate(events);
        events = null;
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

    /**
     * Récupère l'instance de Calendarloader
     * @returns
     */
    calendarLoader() {
        return CalendarLoader.Instance;
    }

}