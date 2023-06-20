export class AlarmManager {
    constructor() {
        this.alarms = {};
    }

    push(event) {
        this.alarms[event.uid] = event;
        return this;
    }

    has(event) {
        return !!this.alarms[event.uid]
    }

    remove(event) {
        delete this.alarms[event.uid];
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
            if (!!this.alarms[key]) array.push(this.alarms[key]);
        }

        return array;
    }
}

