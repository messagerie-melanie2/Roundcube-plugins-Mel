class MelEvent {
    constructor() {
        this.events = {};
        this._count = 0;
    }

    push(event) {
        this.events[this._generateKey()] = event;
        ++this._count;
    }

    add(key, event) {
        if (!this.events[key]) ++this._count;

        this.events[key] = event;
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
        const keys = Object.keys(this.events);

        if (0 !== keys.length)
        {
            for (let index = 0, len = keys.length; index < len; ++index) {
                const key = keys[index];
                const element = this.events[key]
    
                if (!!element) element(...args);
            }
        }
    }

    async asyncCall(...args) {
        let asyncs = [];
        for (const key in this.events) {
            if (Object.hasOwnProperty.call(this.events, key)) {
                const element = this.events[key];
                if (!!element) asyncs.push(element(...args));
            }
        }

        await Promise.allSettled(asyncs);
    }
}