class MelEvent {
    constructor() {
        this.events = {};
        this._count = 0;
    }

    push(event) {
        const key = this._generateKey();
        this.events[key] = event;
        ++this._count;
        return key;
    }

    add(key, event) {
        if (!this.events[key]) ++this._count;

        this.events[key] = event;
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

    call(...args) {
        let results = {};
        const keys = Object.keys(this.events);

        if (0 !== keys.length)
        {
            for (let index = 0, len = keys.length; index < len; ++index) {
                const key = keys[index];
                const element = this.events[key]
    
                if (!!element) results[key] = this._call_callback(element, ...args);
            }
        }

        switch (Object.keys(results)) {
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

    async asyncCall(...args) {
        let asyncs = [];
        for (const key in this.events) {
            if (Object.hasOwnProperty.call(this.events, key)) {
                const element = this.events[key];
                if (!!element) asyncs.push(this._call_callback(element, ...args));
            }
        }

        await Promise.allSettled(asyncs);
    }

    clear() {
        this.events = {};
        this._count = 0;
    }
}