export {RotomecaEvent as BnumEvent, MelConditionnalEventItem, MelConditionnalEvent};

class RotomecaEvent {
    constructor() {
        this.events = {};
        this._count = 0;
    }

    push(event, ...args) {
        const key = this._generateKey();
        this.events[key] = {args, callback:event};
        ++this._count;
        return key;
    }

    add(key, event, ...args) {
        if (!this.events[key]) ++this._count;

        this.events[key] = {args, callback:event};;
    }

    has(key) {
        return !!this.events[key];
    }

    remove(key) {
        this.events[key] = null;

        --this._count;
    }

    rebase() {
        let rebased = Enumerable.from(this.events).where(x => !!x?.value);

        this.events = rebased.toJsonDictionnary(x => x.key, x => x.value);
        this._count = rebased.count();

        rebased = null;
        return this;
    }

    haveEvents() {
        return this.count() > 0;
    }

    count() {
        return this._count;
    }

    _generateKey() {
        const g_key = window?.mel_metapage?.Functions?.generateWebconfRoomName?.() || (Math.random() * (this._count + 10));

        let ae = false;
        for (const key in this.events) {
            if (Object.hasOwnProperty.call(this.events, key)) {
                if (key === g_key) {
                    ae = true;
                    break;
                }
            }
        }

        if (ae) return this._generateKey();
        else return g_key;
    }

    call(...params) {
        let results = {};
        const keys = Object.keys(this.events);

        if (0 !== keys.length)
        {
            for (let index = 0, len = keys.length; index < len; ++index) {
                const key = keys[index];
                const {args, callback} = this.events[key]
    
                if (!!callback) results[key] = this._call_callback(callback, ...[...args, ...params]);
            }
        }

        switch (Object.keys(results).length) {
            case 0:
                return null;
            case 1:
                return results[Object.keys(results)[0]];
            default:
                return results;
        }
    }

    _call_callback(callback, ...args) {
        return callback(...args)
    } 

    async asyncCall(...params) {
        let asyncs = [];
        for (const key in this.events) {
            if (Object.hasOwnProperty.call(this.events, key)) {
                const {args, callback} = this.events[key];
                if (!!callback) asyncs.push(this._call_callback(callback, ...[...args, ...params]));
            }
        }

        await Promise.allSettled(asyncs);
    }

    clear() {
        this.events = {};
        this._count = 0;
    }
}

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

class MelConditionnalEvent extends RotomecaEvent {
    constructor() {
        super();
    }

    *yieldCall(validCondition, ...params) {
        const keys = Object.keys(this.events);

        if (0 !== keys.length)
        {
            for (let index = 0, len = keys.length; index < len; ++index) {
                const key = keys[index];
                const {args, callback} = this.events[key]

                if (!!callback && validCondition(key, callback.datas)) yield callback.action(...[...args, ...params]);
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