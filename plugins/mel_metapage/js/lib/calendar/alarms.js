
export {Alarm};

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