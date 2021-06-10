
    class Alarm{
        constructor(alarmString)
        {
            this.init();
            this.assign(alarmString);
        }

        init()
        {
            this.type = Alarm.enums.type.before;
            this.time = 0;
            this.mode = Alarm.enums.mode.none;
            this.timeMode = Alarm.enums.time_type.minutes;
        }

        assign(string)
        {
            if (string !== "" && string !== null && string !== "")
            {
                try {
                    
                    if (string[0] == "+")
                        this.type = Alarm.enums.type.after;

                    this.time = parseInt(string.split("PT")[1].split("M")[0]);

                    if (string.includes("DISPLAY"))
                        this.mode = Alarm.enums.mode.display;

                    this.timeMode = this.getTimeMode();

                } catch (error) {
                    
                }
            }
        }

        getTimeMode()
        {
            const day = 24 * 60;
            const minutes = 60;

            if (this.time >= day)
                return Alarm.enums.time_type.day;
            else if (day > this.time && this.time >= minutes)
                return Alarm.enums.time_type.hour
            else
                return Alarm.enums.time_type.minutes;

        }

        getTime()
        {
            return this.time * 60 * 1000;
        }

    }

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
    }
/*
(() => {




    if (window !== parent)
        return;

    class Calendar_Alarm
    {
        constructor(args = {})
        {
            this.init();
            this.assign(args);
        }

        init()
        {
            this.timeouts = {};
        }

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

        create_alarm(event)
        {
            let start = moment(event.start);
            let end = moment(event.end);

            //mode d'alarme
            const alarm = new Alarm(event.alarms);
            switch (alarm.mode) {
                case Alarm.enums.mode.display:

                    let time = 0;

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

                    console.log("[create_alarm]", time, alarm, {
                        title:event.title,
                        start:event.start,
                        end:event.end,
                        now:moment().format()
                    });

                    if (time <= 0)
                        this.show(event);
                    else
                    {
                        const id = this.generate_id(event.uid);
                        this.timeouts[id] = setTimeout(() => {
                            delete this.timeouts[id];
                            this.show(event);
                        }, time);
                    }
                    
                    break;
            
                default:
                    break;
            }
        }

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

        clearTimeouts()
        {
            for (const key in this.timeouts) {
                if (Object.hasOwnProperty.call(this.timeouts, key)) {
                    const element = this.timeouts[key];
                    clearTimeout(element);
                    delete this.timeouts[key];
                }
            }
        }

        show(event)
        {
            console.log("[SHOW]", event);
        }

        generate(events = [])
        {
            for (let index = 0; index < events.length; ++index) {
                const element = events[index];
                if (element.alarms !== undefined && element.alarms !== null)
                    this.create_alarm(element);
            }
        }

    }

    window.alarm_managment = new Calendar_Alarm();

})();*/
