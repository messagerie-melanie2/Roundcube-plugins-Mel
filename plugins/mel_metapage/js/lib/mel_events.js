export {MelConditionnalEventItem, MelConditionnalEvent};

class MelConditionnalEventItem {
    constructor({
        action = (...args) => args,
        aditionnalDatas = null
    }) {
        this._init()._setup(action, aditionnalDatas);
    }

    _init() {
        this.action = (...args) => args;
        this.datas = null;
        return this;
    }

    _setup(...args) {
        const {action, datas} = args;
        this.action = action;
        this.datas = datas;
        return this;
    }
}

class MelConditionnalEvent extends MelEvent {
    constructor() {
        super();
    }

    *yieldCall(validCondition, ...args) {
        const keys = Object.keys(this.events);

        if (0 !== keys.length)
        {
            for (let index = 0, len = keys.length; index < len; ++index) {
                const key = keys[index];
                const element = this.events[key]

                if (!!element && validCondition(key, element.datas)) yield element.action(...args);
            }
        }
    }

    call(validCondition, ...args) {
        [...this.yieldCall(validCondition, ...args)];
    }

    pushConditionnalItem({
        action = (...args) => args,
        additionnalDatas = null
    }) {
        this.push(new MelConditionnalEventItem(action, additionnalDatas));
        return this;
    }
}