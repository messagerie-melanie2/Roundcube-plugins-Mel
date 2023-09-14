import { Calendar_Alarm } from "../calendar/calendar_alarm.js";
import { CalendarLoader } from "../calendar/calendar_loader.js";
import { WaitSomething } from "../mel_promise.js";
import { MetapageModule } from "./metapage_module.js";

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

        //Alarmes obsolètes
        if (this.load(mel_metapage.Storage.last_calendar_update) === moment().format(CONST_DATE_FORMAT_BNUM))
        {
            await new WaitSomething(() => !!rcmail._events['plugin.display_alarms']);
            await this._generate_alarms();
        }

        this.add_event_listener(mel_metapage.EventListeners.calendar_updated.after, () => {
            this._generate_alarms();
        }, {callback_key:'generate_alarms'});
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

    async _generate_alarms() {
        const events = await this.calendarLoader().force_load_all_events_from_storage()
        this.alarm_manager.generate(events);
    }

    /**
     * Récupère l'instance de Calendarloader
     * @returns
     */
    calendarLoader() {
        return CalendarLoader.Instance;
    }

}