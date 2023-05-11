import { MelObject } from "../mel_object";
import { InvalidRoom, Room, Unreads } from "./chat";

export class BaseChatConnector extends MelObject {
    constructor() {
        super();
    }

    main() {
        super.main();
    }

    connect(...args) {}

    _returned_template() {}
}

export class LastRoomConnector extends BaseChatConnector {
    constructor() {
        super();
    }

    main() {
        super.main();
    }

    connect(last_room) {
        super.connect(last_room);
        const connected = this.connect_to_room(last_room);

        if (connected === false) return new InvalidRoom();
        else return new Room(connected.name, connected.type);
    }

    connect_to_room(last_room) {
        return this._returned_template();
    }

    _returned_template() {
        return {name:EMPTY_STRING, type:EMPTY_STRING};
    }
}

export class StatusConnector extends BaseChatConnector {
    constructor() {
        super();
    }

    main() {
        super.main();
    }

    connect(status) {
        super.connect(status);
        const connected = this.connect_to_status(status);
        return connected;
    }

    connect_to_status(status) {
        return this._returned_template();
    }

    _returned_template() {
        return EMPTY_STRING;
    }
}

export class UnreadsConnector extends BaseChatConnector {
    constructor() {
        super();
    }

    main() {
        super.main();
    }

    connect(key, value) {
        super.connect(key, value);
        const connected = this.connect_to_unreads(key, value);
        return connected;
    }

    connect_to_unreads(key, value) {
        return this._returned_template();
    }

    _returned_template() {
        return {
            key:null,
            value:null,
            unreads:false
        };
    }
}

export class UnreadDictionnary {
    constructor() {}

    add(key, value) {
        if (typeof value !== 'number') throw 'Only number accepted';

        this[key] = value;
    }

    remove(key) {
        delete this[key];
        return this;
    }

    get(key) {
        return this[key];
    }

    *[Symbol.iterator]() {
        for (const key in this) {
            if (Object.hasOwnProperty.call(this, key)) {
                const element = this[key];
                yield {key, value:element};
            }
        }
    }
}

export class UnreadItem {
    constructor(unread, have) {
        this.unread = unread;
        this.have = have;
    }
}

export class UnreadItemDatas extends UnreadItem{
    constructor(unread) {
        super(unread, undefined);
    }
} 

export class UnreadItemHave extends UnreadItem{
    constructor(have) {
        super(undefined, have);
    }
} 