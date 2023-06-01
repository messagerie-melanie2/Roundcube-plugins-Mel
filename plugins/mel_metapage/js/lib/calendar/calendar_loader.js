export {loader as CalendarLoader};
import { MainNav } from "../classes/main_nav";
import { MelObject } from "../mel_object";

/**
 * Sélecteur de la pastille agenda de la navigation principale
 * @type {string}
 */
const SELECTOR_CLASS_ROUND_CALENDAR = `${CONST_JQUERY_SELECTOR_CLASS}calendar`;

/**
 * @extends MelObject
 * Classe qui gère le chargement de l'agenda côté serveur
 * 
 * Donne des fonctions utiles pour charger ces données.
 */
class CalendarLoader extends MelObject{
    constructor() {
        super();
    }

    main() {
        super.main();

        const now = moment();
        MainNav.try_add_round(SELECTOR_CLASS_ROUND_CALENDAR, mel_metapage.Ids.menu.badge.calendar)
               .update_badge(this.get_next_events_day(now, {}).count(), mel_metapage.Ids.menu.badge.calendar);

        if (this.load(mel_metapage.Storage.last_calendar_update) !== moment().format(CONST_DATE_FORMAT_BNUM) || 
            null === this.load(mel_metapage.Storage.calendar_all_events)) {
            const force_refresh = true;
            this.update_agenda_local_datas(force_refresh);
        }
    }

    /**
     * Vérifie si un jour se trouve entre 2 dates
     * @param {moment} start Date de début
     * @param {moment} end Date de fin
     * @param {moment} day Jour de test
     * @returns {boolean}
     */
    is_date_okay(start, end, day) {
        return (start <= day && day <= end) || (start >= day && moment(start).startOf('day').format() === moment(day).startOf('day').format() && day <= end);
    }

    /**
     * Coupe une date de début et une date de fin si celles-ci dépassent le début ou la fin de journée
     * @param {moment} start Date de début
     * @param {moment} end Date de fin
     * @param {moment} day Jour de test
     * @returns {SplittedDate} Nouvelles dates de début et de fin si besoin.
     */
    get_date_splitted(start, end, day) {
        const o_start = start;
        const o_end = end;
        const start_of_day = moment(day).startOf('day');
        const end_of_day = moment(day).endOf('day');
        if (start < start_of_day) start = start_of_day;
        if (end > end_of_day) end = end_of_day;

        return new SplittedDate(start, end, o_start, o_end, day);
    }

    /**
     * Récupère les évènements d'une journée
     * @param {moment} day Jour 
     * @param {Array<Object> | null} loaded_events Si ce paramètre vaut null, les données seront chargés depuis le stockage local
     * @returns {Array<Object>} Evènements
     */
    get_from_day(day, loaded_events = null) {
        let return_datas = [];
        if (!day.toDate) day = moment(day).startOf('day');

        const events = loaded_events ?? this.load_all_events();

        if (0 !== events.length) {
            return_datas = Enumerable.from(events).where(x => this.is_date_okay(moment(x.start), moment(x.end), day)).toArray();
        }

        return return_datas;
    } 

    /**
     * Récupère les prochains évènements d'une journée.
     * 
     * La date ne doit pas être une date inférieur à aujourd'hui.
     * @param {moment} day Date de traitement
     * @param {Object} options Options de cette fonction
     * @param {boolean} options.enumerable Si on récupère un énumerable ou non
     * @param {Array<Object> | null} options.loaded_events Si ce paramètre vaut null, les données seront chargés depuis le stockage local
     * @returns {Generator | Array<Object>}
     */
    get_next_events_day(day, {enumerable = true, loaded_events = null}) {
        const now = moment();
        let enum_var = Enumerable.from(this.get_from_day(day, loaded_events)).where(x => moment(x.end) > now 
                                                                                         && x.free_busy !== CONST_EVENT_DISPO_FREE 
                                                                                         && x.free_busy !== CONST_EVENT_DISPO_TELEWORK);

        return enumerable ? enum_var : enum_var.toArray();
    }

    /**
     * Charge les évènements depuis le stockage local.
     * @returns {Array<Object>} Evènements
     */
    load_all_events(){
        return this.load(mel_metapage.Storage.calendar_all_events, []);
    }

    /**
     * Charge les évènements depuis le stockage local.
     * 
     * Si les évènements depuis le stockages local sont nuls, ils sont chargés depuis la base.
     * @async
     * @returns {Promise<Array<Object>>} Evènements
     */
    async force_load_all_events_from_storage(){
        let loaded = this.load(mel_metapage.Storage.calendar_all_events);

        if (!loaded) {
            const top = true;
            await this.rcmail(top).triggerEvent(mel_metapage.EventListeners.calendar_updated.get);
            loaded = this.load_all_events();
        }

        return loaded;
    }

    /**
     * Met à jours les données du stockage local depuis le serveur.
     * @async
     * @param {boolean} force Force la mise à jours des données depuis le serveur. Par défaut : `'random'`
     * @returns {Promise<Array<Objet> | null>} Evènements
     */
    async update_agenda_local_datas(force = CONST_CALENDAR_UPDATED_DEFAULT) {
        const isTop = window === top;
        const url = mel_metapage.Functions.url(PLUGIN_MEL_METAPAGE, ACTION_MEL_METAPAGE_CALENDAR_LOAD_EVENT, {
            force,
            source:mceToRcId(rcmail.env.username),
            start:this._dateNow(new Date()),
            end:this._dateNow(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7)),
            last:moment(this.load(mel_metapage.Storage.last_calendar_update), CONST_DATE_FORMAT_BNUM).unix()
        });

        this.rcmail(!isTop).triggerEvent(mel_metapage.EventListeners.calendar_updated.before);
        this.trigger_event(mel_metapage.EventListeners.calendar_updated.before);

        let events = null;
        await this.http_call({
            url, 
            on_success:(datas) => events = this._on_success(datas, isTop),
            on_error: (...args) => {},
            type: 'GET'
        });

        return events;
    }

    _on_success(datas, ...args) {
        const {forced, events, encoded} = JSON.parse(datas);
        const [isTop] = args;
        const isForcedRefresh = true === forced;
        const haveNewDatas = (encoded && (events !== EMPTY_STRING && events !== EMPTY_ARRAY_STRING)) || (!encoded && 0 !== events.length);
        datas = null;

        let loadedEvents;

        if (isForcedRefresh) loadedEvents = []
        else if (haveNewDatas) loadedEvents = this.load(mel_metapage.Storage.calendar_all_events, []);

        if (haveNewDatas || isForcedRefresh) {
            if (haveNewDatas) {
                let index;
                for (const current of this._generator_selected_events(encoded ? JSON.parse(events) : events)) {
                    index = this._getEventIndex(current.id, loadedEvents);

                    if (NO_INDEX === index) loadedEvents.push(current);
                    else loadedEvents[index] = current;
                }
            }

            const now = moment().startOf('day');
            let all_events = Enumerable.from(loadedEvents).where(x => x !== null).orderBy(x => x.order).thenBy(x => moment(x.start));
            all_events = this._events_remove_moment(all_events).toArray();
            this.save(mel_metapage.Storage.calendar_all_events, all_events);
            this.save(mel_metapage.Storage.last_calendar_update, moment().format(CONST_DATE_FORMAT_BNUM));

            MainNav.try_add_round(SELECTOR_CLASS_ROUND_CALENDAR, mel_metapage.Ids.menu.badge.calendar)
                   .update_badge(this.get_next_events_day(now, {loaded_events:all_events}).count(), mel_metapage.Ids.menu.badge.calendar);

            this.rcmail(!isTop).triggerEvent(mel_metapage.EventListeners.calendar_updated.after);
            this.trigger_event(mel_metapage.EventListeners.calendar_updated.after);

            return all_events;
        }
    }



    _getEventIndex(id, events) {
        for (let index = 0, len = events.length; index < len; ++index) {
            if (events[index].id === id) return index;                
        }

        return NO_INDEX;
    }

    _dateNow(date) {
        let set = date;
        let getDate = set.getDate().toString();
        if (getDate.length == 1) { //example if 1 change to 01
            getDate = "0" + getDate;
        }
        let getMonth = (set.getMonth() + 1).toString();
        if (getMonth.length == 1) {
            getMonth = "0" + getMonth;
        }
        let getYear = set.getFullYear().toString();
        let dateNow = getYear + "-" + getMonth + '-' + getDate + "T00:00:00";
        return dateNow;
    }

    *_generator_selected_events(events) {
        const now = moment().startOf(CONST_DATE_START_OF_DAY);
        const parse = window?.cal?.parseISO8601 ?? ((item) => item);
        const user_id = mceToRcId(rcmail.env.username);

        for (let index = 0, element, len = events.length; index < len; ++index) {
            element = events[index];

            if (user_id !== element.calendar || CONST_EVENT_ATTENDEE_STATUS_CANCELLED === element.status) continue;

            if (element.allday !== undefined && element.allday !== null && (element.allDay === undefined || element.allDay === null)) element.allDay = element.allday;
            element.order = element.allDay ? 0 : 1;

            if (STRING === typeof element.end) element.end = moment(parse(element.end));
            else if (!!element.end.date && STRING === typeof element.end.date) element.end = moment(element.end.date);

            if (STRING === typeof element.start) element.start = moment(parse(element.start));
            else if (!!element.start.date && STRING === typeof element.start.date) element.start = moment(element.start.date);


            if (element.end < now) continue;

            if (element.allDay) {
                element.end = element.end.startOf(CONST_DATE_START_OF_DAY);

                if (element.end.format(CONST_DATE_FORMAT_EN) === now.format(CONST_DATE_FORMAT_EN) 
                && element.start.startOf(CONST_DATE_START_OF_DAY).format(CONST_DATE_FORMAT_EN) !== element.end.format(CONST_DATE_FORMAT_EN)) {
                    continue;
                }
                else element.end = element.end.format();
            }

            if (!!element?.recurrence?.EXCEPTIONS) element.recurrence.EXCEPTIONS = [];

            yield element;
        }
    }

    _events_remove_moment(events) {
        return events.select(x => {
            if (typeof x.start !== 'string') x.start =  x.start.format();
            if (typeof x.end !== 'string') x.end =  x.end.format();
            return x;
        });
    }
}

/**
 * Représente une date coupée.
 */
class SplittedDate {
    /**
     * Constructeur de la classe
     * @param {moment} start Nouvelle date coupée
     * @param {moment} end Nouvelle date coupée
     * @param {moment} original_start Date original
     * @param {moment} original_end Date original
     * @param {moment} day Jour de traitement
     */
    constructor(start, end, original_start, original_end, day) {
        this._init()._setup(start, end, original_start, original_end, day);
    }

    _init() {
        const now = moment();
        this.start = now;
        this.end = now;
        this.original = {
            start:now,
            end:now
        };
        this.day = now;

        return this;
    }

    _setup(start, end, original_start, original_end, day) {
        Object.defineProperties(this, {
            start: {
                get: function() {
                    return start;
                },
                configurable: true
            },
            end: {
                get: function() {
                    return end;
                },
                configurable: true
            },
            original: {
                get: function() {
                    return {
                        start:original_start,
                        end:original_end
                    }
                },
                configurable: true
            },
            day: {
                get: function() {
                    return day.startOf('day');
                },
                configurable: true
            },
        });

        return this;
    }
}

/**
 * Instance de CalendarLoader
 * @type {{Instance:CalendarLoader}}
 */
let loader = {
    _instance:null,
    Instance:null
};

Object.defineProperties(loader, {
    Instance: {
        get: function() {
            if (!loader._instance) loader._instance = new CalendarLoader();

            return loader._instance;
        },
        configurable: true
    }
});