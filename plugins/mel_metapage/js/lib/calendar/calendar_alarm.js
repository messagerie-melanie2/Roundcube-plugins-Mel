import { AlarmManager } from "./alarms_manager.js";
import { Alarm } from "./alarms.js";
import { MelObject } from "../mel_object.js";

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

    /**
     * Créer un timeout qui va afficher l'alarme lié à l'évènement.
     * @param {JSON} event Evènement de l'agenda
     * @param {Moment} alarmDate Date pour le snooze
     * @returns {number|null}
     */
    create_alarm(event, alarmDate = null)
    {
        let start = moment(event.start);
        let end = moment(event.end);

        let retour = null;

        //mode d'alarme
        const alarm = new Alarm(event.alarms);
        switch (alarm.mode) {
            case Alarm.enums.mode.display:

                let time = 0;

                if (alarmDate === null)
                {
                    //type d'alarme
                    switch (alarm.type) {
                        case Alarm.enums.type.before:
                            time = start.subtract(alarm.time, "m") - moment();
                            break;
                        case Alarm.enums.type.after:
                            time = end.add(alarm.time, "m") - moment();
                            break;
                    
                        default:
                            break;
                    }
                }
                else
                    time = alarmDate - moment();

                if (time <= 0)
                    this.show(event);
                else
                {
                    const id = this.generate_id(event.uid);
                    this.timeouts[id] = setTimeout(() => {
                        delete this.timeouts[id];
                        this.show(event);
                    }, time);
                    retour = this.timeouts[id];
                }
                
                break;
        
            default:
                break;
        }

        return retour;

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
    show(event)
    {
        if (event.alarm_dismissed === true || event.alarm_dismissed === "true")
            return;

        const trigger_key = "plugin.display_alarms";

        event.id = this.setCalId(event.id);//"cal:" + event.id;
        event.uid = this.setCalId(event.uid);//"cal:" + event.uid;
        this.showed_alarms.push(event);

        const alarms = this.showed_alarms.toArray();

        this.rcmail().triggerEvent(trigger_key, alarms);
        this.trigger_event(trigger_key, alarms);

        setTimeout(() => {
            this.update_links();
        }, 100);
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
        
        if (events === undefined || events === null)
            return;

        for (let index = 0; index < events.length; ++index) {
            const element = events[index];
            if (element.alarms !== undefined && element.alarms !== null && element.alarm_dismissed !== true)
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
    }

}