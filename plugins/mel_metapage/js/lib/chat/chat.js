import { MelObject } from "../mel_object";
import { Top } from "../top";
export {ChatSingleton as Chat, Room, Chat as _Chat}

class Chat extends MelObject {
    constructor() {
        super();
        this._init();
        let raw = this.load('tchat') ?? this.load('ariane') ?? {};
        raw.lastRoom = Room.from_event(raw.lastRoom);
        raw.unreads = Unreads.from_local(raw.unreads);
        const save = () => {
            const onupdate = raw.unreads.onupdate;
            raw.unreads.onupdate = null;
            this.save('tchat', raw);
            raw.unreads.onupdate = onupdate;
        };
        raw.unreads.onupdate.push(() => {
            save();
        });

        Object.defineProperties(this, {
            lastRoom: {
                get: function() {
                    return raw?.lastRoom ?? new InvalidRoom();
                },
                set: (value) => {
                    raw.lastRoom = this.connectors.room?.connect?.(value);// ?? Room.from_event(value);
                    save();
                },
                configurable: true
            },
            status: {
                get: function() {
                    return raw?.status ?? EMPTY_STRING;
                },
                set: (value) => {
                    raw.status = value;
                    save();
                },
                configurable: true
            },
            unreads: {
                get: function() {
                    return raw.unreads;
                },
                configurable: true
            },
        });


    }

    _init() {
        /**
         * Dernier canal
         * @type {Room}
         */
        this.lastRoom = new InvalidRoom();
        /**
         * Status en cours sur ariane
         * @type {string}
         */
        this.status = EMPTY_STRING
        /**
         * @type {Unreads}
         */
        this.unreads = null;

        this.connectors = {
            status:null,
            unread:null,
            room:null
        };

        return this;
    }

    setStatusConnector(connector) {
        this.connectors.status = connector;
        return this;
    }

    setUnreadsConnector(connector) {
        this.connectors.unread = connector;
        this.unreads.connector = this.connectors.unread;
        return this;
    }

    setRoomConnector(connector) {
        this.connectors.room = connector;
        return this;
    }

    isOnline() {
        return 'online' === this.status;
    }

    isAway() {
        return 'away' === this.status;
    }

    isBusy() {
        return 'busy' === this.status;
    }

    isOffline() {
        return 'offline' === this.status;
    }

    async get_status_from_server() {
        let status_datas = {
            status:undefined,
            message:''
        }
        await mel_metapage.Functions.get(
            mel_metapage.Functions.url('discussion', 'get_status'),
            {},
            (datas) => {
                if ("string" === typeof datas) datas = JSON.parse(datas);

                status_datas.status = datas.content.status;
                status_datas.message = datas.content.message || '';

                this.status = status_datas.status;
            }
        );
    
        return status_datas;
    }
    
    async set_status_to_server(status, message) {
        await mel_metapage.Functions.post(
            mel_metapage.Functions.url('discussion', 'set_status'),
            {
                _st:status,
                _msg:message
            },
            (datas) => {
                //if ("string" === typeof datas) datas = JSON.parse(datas);
                this.status = status;
            }
        );
    }
    
}

var ChatSingleton = {};

Object.defineProperties(ChatSingleton, {
    Instance: {
        get: function() {
            if (!Top.has('chatSingleton')) Top.add('chatSingleton', new Chat());
            return Top.get('chatSingleton');
        },
        configurable: false
    },
});

class Room {
    constructor(name, public_) {
        this.name = name;
        this.public = public_;
    }

    isValid() {
        return true;
    }

    static from_event(event) {
        if (!event?.name) return new InvalidRoom();
        else {
            let isPublic = null;

            if (!!event.public) isPublic = event.public;
            else {
                switch (event.t) {
                    case "c":
                        isPublic = true;
                        break;
                    case "p":
                        isPublic = false;
                        break;
                    default:
                        return new InvalidRoom();
                }
            }

            return new Room(event.name, isPublic);
        }
    }
}

export class InvalidRoom extends Room {
    constructor() {
        super(null, null);
    }

    isValid() {
        return false;
    }
}

export class Unreads {
    constructor(datas) {
        this.datas = datas;
        this._unreads = false;
        this.onupdate = new MelEvent();
        this.connector = null;
    }

    update(key, value) {
        this.datas[key] = value;
        if (!this.connector) this.datas[key] = value;
        else {
            const datas = this.connector.connect(key, value);
            this.datas[datas.key] = datas.value;
        }
        this.onupdate.call();
        return this;
    }

    updateAll(value) {
        if (!this.connector) this.datas = value;
        else this.datas = this.connector.connect(value).datas;
        this.onupdate.call();
        return this;
    }

    get(key) {
        return this.datas[key];
    }

    setHaveUnreads(val) {
        if (!this.connector) this._unreads = val;
        else this._unreads = this.connector.connect(val)._unreads;
        this.onupdate.call();
        return this;
    }

    haveUnreads() {
        return this._unreads;
    }

    haveMention() {
        return this.count();
    }

    * getHaveMentions_generator() {
        for (const iterator of this) {
            const {key, value} = iterator;

            if (value !== 0 && key !== 'haveSomeUnreads') yield iterator;
        }
    }

    getHaveMentions() {
        let mentions = {};
        for (const iterator of this.getHaveMentions_generator()) {
            const {key, value} = iterator;
            mentions[key] = value;
        }

        return mentions;
    }

    count() {
        return Enumerable.from(this).where(x => x.value !== true && x.value !== false && x.value > 0).count();
    }

    *[Symbol.iterator]() {
        for (const key in this.datas) {
            if (Object.hasOwnProperty.call(this.datas, key)) {
                const element = this.datas[key];
                yield {key, value:element};
            }
        }
        yield {key:'haveSomeUnreads', value:this._unreads};
    }

    static from_local(value) {
        let u = new Unreads(value?.datas ?? {});
        u._unreads = value?._unreads ?? false;
        return u;
    } 
}