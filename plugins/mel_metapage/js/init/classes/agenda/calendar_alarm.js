
/**
 * Représente une alarme de l'agenda
 */
class Alarm{
    /**
     * 
     * @param {string} alarmString Chaîne de charactère qui reprèsente l'alarme.
     */
    constructor(alarmString)
    {
        this.init();
        this.assign(alarmString);
    }

    /**
     * Initialise l'objet.
     */
    init()
    {
        this.type = Alarm.enums.type.before;
        this.time = 0;
        this.mode = Alarm.enums.mode.none;
        this.timeMode = Alarm.enums.time_type.minutes;
    }

    /**
     * Assigne les différents paramètres aux propriétés de l'objet.
     * @param {string} string 
     */
    assign(string)
    {
        if (string !== "" && string !== null && string !== "")
        {
            try {
                
                if (string[0] == "+") //Après, avant sinon
                    this.type = Alarm.enums.type.after;

                this.time = parseInt(string.split("PT")[1].split("M")[0]);

                //console.log("string", string, string.includes("DISPLAY"))
                if (string.includes("DISPLAY")) //Type d'alarme
                    this.mode = Alarm.enums.mode.display;

                this.timeMode = this.getTimeMode();//Début ou fin de l'évènement

            } catch (error) {
                
            }
        }
    }

    /**
     * Récupère le mode de l'alarme.
     * @returns {Symbol} Alarm.enums.time_type
     */
    getTimeMode()
    {
        const day = 24 * 60;
        const minutes = 60;

        let mode;

        if (this.time >= day)
            mode = Alarm.enums.time_type.day;
        else if (day > this.time && this.time >= minutes)
            mode = Alarm.enums.time_type.hour
        else
            mode = Alarm.enums.time_type.minutes;

        return mode;
    }

    getTime()
    {
        return this.time * 60 * 1000;
    }

    toString()
    {
        let time = this.time;
        let txt = "";

        switch (this.timeMode) {
            case Alarm.enums.time_type.minutes:
                txt += ` minute${this.time > 1 ? "s" : ""}`;
                break;
            
            case Alarm.enums.time_type.hour:
                time = this.time/60;
                txt += ` heure${time > 1 ? "s" : ""}`;
                break;
            
            case Alarm.enums.time_type.day:
                time=this.time/60/24;
                txt += ` jour${time > 1 ? "s" : ""}`;
        
            default:
                break;
        }

        if (this.type === Alarm.enums.type.before)
            txt += " avant";
        else
            txt += " après";

        return time + txt;
    }

}

/**
 * Liste des énumérations de la classe <c>Alarm</c>
 */
Alarm.enums = {
    type:{
        before:Symbol("before"),
        after:Symbol("after")
    },
    mode:{
        none:Symbol("none"),
        display:Symbol("display")
    },
    time_type:{
        day:Symbol("d"),
        hour:Symbol("h"),
        minutes:Symbol("m")
    }
};

(function calendar_alarm() {

    if (window !== parent)
        return;

    class AlarmManager {
        constructor() {
            this.alarms = {};
        }

        push(event) {
            this.alarms[event.uid] = event;
            return this;
        }

        clear() {
            this.alarms = {};
            return this;
        }

        toArray() {
            let array = [];
            const keys = Object.keys(this.alarms);

            for (let index = 0; index < keys.length; ++index) {
                const key = keys[index];
                array.push(this.alarms[key]);
            }

            return array;
        }
    }

    /**
     * Gère les alarmes de l'agenda
     */
    class Calendar_Alarm
    {
        /**
         * 
         * @param {JSON} args {timeouts:{}, showed_alarms[]}
         */
        constructor(args = {})
        {
            this.init();
            this.assign(args);
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
                let txt = "";
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

            event.id = this.setCalId(event.id);//"cal:" + event.id;
            event.uid = this.setCalId(event.uid);//"cal:" + event.uid;
            this.showed_alarms.push(event);
            rcmail.triggerEvent("plugin.display_alarms", this.showed_alarms.toArray());
            setTimeout(() => {
                this.update_links();
            }, 100);
        }

        setCalId(id)
        {
            if (id.includes("@DATE")) id = id.split("@DATE")[0];

            if (!id.includes('cal')) id = `cal:${id}`;
            return id;
        }

        update_links()
        {
            try {
                let querry = $("#alarm-display .event-section")[0];
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

    window.alarm_managment = new Calendar_Alarm();
})();
