import { AlarmManager } from "./alarms_manager.js";
import { Alarm } from "./alarms.js";
import { MelObject } from "../mel_object.js";
import { MelEnumerable } from "../classes/enum.js";

/**
 * Gère les alarmes de l'agenda
 */
export class Calendar_Alarm extends MelObject
{
    /**
     * 
     * @param {JSON} args {timeouts:{}, showed_alarms[]}
     */
    constructor(args = {})
    {
        super(args)
    }

    main(...args) {
        super.main(...args);

        const [config] = args;

        this.init();
        this.assign(config);
    }

    /**
     * Initialise l'objet.
     */
    init()
    {
        this.timeouts = {};
        this.showed_alarms = new AlarmManager();
    }

    /**
     * Assigne les différents paramètres aux propriétés de l'objet.
     * @param {JSON} args Idem construtor
     */
    assign(args)
    {
        if (args !== undefined && args !== null)
        {
            for (const key in args) {
                if (Object.hasOwnProperty.call(args, key)) {
                    const element = args[key];
                    this[key] = element;
                }
            }
        }
    }

    _generate_listeners() {
        this.rcmail().addEventListener()
    }

    /**
     * Mantis 0008412
     * Planifie les rappels d'un évènement pour plusieurs rappels
     * @param {JSON} event Evènement de l'agenda
     * @param {Moment|null} snoozeDate Date de fin du report, si l'évènement est reporté
     * @returns {null}
     */
    create_alarm(event, snoozeDate = null)
    {
        const now = moment();
        const lastAck = event.x_moz_lastack
            ? moment.utc(event.x_moz_lastack, 'YYYYMMDD[T]HHmmss[Z]')
            : null;

        if (snoozeDate !== null) this._push(snoozeDate - now, event);

        let pastPushed = false;
        for (const alarm of Alarm.listFromEvent(event)) {
            if (alarm.mode !== Alarm.enums.mode.display || alarm.time === 0) continue;

            const fireAt = alarm.type === Alarm.enums.type.after
                ? moment(event.end).add(alarm.time, 'm')
                : moment(event.start).subtract(alarm.time, 'm');

            // Déjà acquitté, ou couvert par le report
            if (lastAck && fireAt.isSameOrBefore(lastAck)) continue;
            if (snoozeDate !== null && fireAt.isSameOrBefore(snoozeDate)) continue;

            const time = fireAt - now;

            // Un seul rappel "en retard" par évènement
            if (time <= 0) {
                if (pastPushed) continue;
                pastPushed = true;
            }

            this._push(time, event);
        }

        return null;
    }

    /**
     * Ajoute un rappel s'il est dans la fenêtre de planification
     * @param {number} time Délai en ms
     * @param {JSON} event
     * @private
     */
    _push(time, event)
    {
        if (time < Calendar_Alarm.max_time) this.showed_alarms.push(time, event);
    }

    /**
     * Génère un id via un uid si il existe déjà.
     * @param {string} uid 
     * @returns {string} uid ou nouvel uid
     */
    generate_id(uid)
    {
        let returnId;
        if (Enumerable.from(this.timeouts).where(x => x.key === uid).any())
        {
            let txt = EMPTY_STRING;
            for (let index = 0; index < 10; ++index) {
                if (Math.floor(Math.random() * 100) + 1 > 50)
                    txt +=  String.fromCharCode(...[...Math.floor(Math.random() * 100) + 1 + ''].map(c => (+c || 10) | 64))
                else
                    txt += Math.floor(Math.random() * 100) + 1;
            }
            returnId = this.generate_id(uid + txt);
        }
        else
            returnId = uid;

        return returnId;
    }

    /**
     * Supprime la liste des timeouts.
     */
    clearTimeouts()
    {
        for (const key in this.timeouts) {
            if (Object.hasOwnProperty.call(this.timeouts, key)) {
                const element = this.timeouts[key];
                clearTimeout(element);
                delete this.timeouts[key];
            }
        }
        this.showed_alarms.clear();
    }

    /**
     * Affiche l'évènement
     * @param {JSON} event Evènement de l'agenda
     */
    show(time)
    {
        const trigger_key = "plugin.display_alarms";

        const alarms = MelEnumerable.from(this.showed_alarms.alarms[time]).where(x => ![true, 'true'].includes(x.alarm_dismissed)).select((x) => {
            x.id = this.setCalId(x.id);
            x.uid = this.setCalId(x.uid);

            return x;
        }).toArray();

        if (alarms.length > 0) {
            this.showed_alarms.remove(time);

            this.rcmail().triggerEvent(trigger_key, alarms);
            this.trigger_event(trigger_key, alarms);
    
            setTimeout(() => {
                this.update_links();
            }, 100);
        }
    }


    setCalId(id)
    {
        if (id.includes("@DATE")) id = id.split("@DATE")[0];

        if (!id.includes('cal:')) id = `cal:${id}`;
        return id;
    }

    update_links()
    {
        try {
            let querry = this.select("#alarm-display .event-section")[0];
            if (querry?.firstChild?.className != "external-webconf")
                querry.innerHTML = this.urlify(querry.innerHTML);
        } catch (error) {
            console.error("###[update_links()]", error);
        }
    }

    urlify(text) {
        const kLINK_DETECTION_REGEX = /(https?:\/\/[^\s]+)/gi;

        return text.replace(kLINK_DETECTION_REGEX, function(url) {
            return '<a href="' + url + '">' + url + '</a>';
        })
        // or alternatively
        // return text.replace(urlRegex, '<a href="$1">$1</a>')
    }

    /**
     * Génère les alarmes via une liste d'évènements
     * @param {Array<JSON>} events 
     */
    generate(events = [])
    {
        if (events === undefined || events === null) return;
        else if (window !== parent) return;

        this.clearTimeouts();

        for (let index = 0; index < events.length; ++index) {
            const element = events[index];
            if (this.is_alarm_valid(element))
            {
                if (rcmail.env.calendars[element.calendar].showalarms === 1)
                {
                    if (!element.alarm_dismissed || element.alarm_dismissed === false)
                        this.create_alarm(element);
                    else
                        this.create_alarm(element, moment(element.alarm_dismissed*1000));
                }
            }
        }

        for (const iterator of this.showed_alarms) {
            if (iterator <= 0) this.show(iterator);
            else this.timeouts[iterator] = setTimeout((time) => {
                this.show(time);
            }, iterator, iterator);
        }
    }

    is_alarm_valid(event) {
        //const alarm_is_defined = event.alarms !== undefined && event.alarms !== null;
        const  alarm_is_defined = (event.valarms?.length ?? 0) > 0 ||
          (event.alarms !== undefined && event.alarms !== null);
        const alarm_not_dismissed = event.alarm_dismissed !== true;
        const event_not_annulated = event.status !== "CANCELLED";

        return alarm_is_defined && alarm_not_dismissed && event_not_annulated;
    }

}

Object.defineProperties(Calendar_Alarm, {
    max_time: {
        get: function() {
            return 703607907; //Une semaine
        },
        configurable: false
    }
});