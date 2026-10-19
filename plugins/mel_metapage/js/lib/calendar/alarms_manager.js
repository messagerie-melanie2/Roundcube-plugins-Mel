export class AlarmManager {
    constructor() {
        this.alarms = {};
    }

    push(time, event) {
        time = this._time_modifier(time);
        if (!this.has(time)) this.alarms[time] = [];

        //this.alarms[time].push(event);
        //Un même évènement ne doit pas être notifié 2 fois au même instant
        if (!this.alarms[time].includes(event)) this.alarms[time].push(event);
        return this;
    }

    has(time) {
        time = this._time_modifier(time);
        return !!this.alarms[time]
    }

    remove(time) {
        time = this._time_modifier(time);
        delete this.alarms[time];
    }

    clear() {
        this.alarms = {};
        return this;
    }

    _time_modifier(time) {
        return time <= 0 ? 0 : time;
    }

    toArray() {
        let array = [];
        const keys = Object.keys(this.alarms);

        for (let index = 0; index < keys.length; ++index) {
            const key = keys[index];
            if (!!this.alarms[key]) array.push(this.alarms[key]);
        }

        return array;
    }

    *[Symbol.iterator]() {
        yield * Object.keys(this.alarms);
    }
}

