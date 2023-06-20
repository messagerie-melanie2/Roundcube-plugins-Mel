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

<<<<<<< HEAD
    remove(event) {
        delete this.alarms[event.uid];
    }

=======
>>>>>>> 2ec228c26f87ae8b8bbb68a4b3ca4aace2a32962
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

