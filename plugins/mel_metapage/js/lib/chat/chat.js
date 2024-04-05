import { EMPTY_STRING } from '../constants/constants.js';
import { MelObject } from '../mel_object.js';
import { Top } from '../top.js';
export { ChatSingleton as Chat, Room, Chat as _Chat };

/**
 * @typedef ChatStatus
 * @property {string} status
 * @property {string} message
 */

class Chat extends MelObject {
	constructor() {
		super();
		this._init();
		let raw = this.load('tchat') ?? this.load('ariane') ?? {};
		raw.lastRoom = Room.from_event(raw.lastRoom);
		raw.unreads = Unreads.from_local(raw.unreads);
		raw.unreads.onupdate.push(() => {
			this.save_state();
		});

		Object.defineProperties(this, {
			lastRoom: {
				get: function () {
					return raw?.lastRoom ?? new InvalidRoom();
				},
				set: value => {
					const tmp_room = this.connectors.room?.connect?.(value);
					if (JSON.stringify(raw?.lastRoom) !== JSON.stringify(tmp_room)) {
						raw.lastRoom = tmp_room;
						this.save_state();
					}
				},
				configurable: true,
			},
			status: {
				get: function () {
					return raw?.status ?? EMPTY_STRING;
				},
				set: value => {
					const tmp_status = this.connectors.status?.connect?.(value) ?? value;
					if (raw?.status !== tmp_status) {
						raw.status = tmp_status;
						this.save_state();
					}
				},
				configurable: true,
			},
			message_status: {
				get: function () {
					return raw?.message ?? EMPTY_STRING;
				},
				set: value => {
					if (raw?.message !== value) {
						raw.message = value;
						this.save_state();
					}
				},
			},
			unreads: {
				get: function () {
					return raw.unreads;
				},
				configurable: true,
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
		this.status = EMPTY_STRING;
		/**
		 * Liste des mentions
		 * @type {Unreads}
		 */
		this.unreads = null;

		/**
		 * Message en cours d'ariane
		 * @type {String}
		 */
		this.message_status = EMPTY_STRING;

		this.connectors = {
			status: null,
			unread: null,
			room: null,
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

	/**
	 *
	 * @returns {Promise<ChatStatus>}
	 */
	async get_status_from_server() {
		let status_datas = {
			status: undefined,
			message: EMPTY_STRING,
		};
		await mel_metapage.Functions.get(
			mel_metapage.Functions.url('discussion', 'get_status'),
			{},
			datas => {
				if ('string' === typeof datas) datas = JSON.parse(datas);

				status_datas.status = datas.content.status;
				status_datas.message = datas.content.message || EMPTY_STRING;

				this.status = status_datas.status;
				this.message_status = status_datas.message;
			},
		);

		return status_datas;
	}

	async set_status_to_server(status, message) {
		await mel_metapage.Functions.post(
			mel_metapage.Functions.url('discussion', 'set_status'),
			{
				_st: status,
				_msg: message,
			},
			datas => {
				//if ("string" === typeof datas) datas = JSON.parse(datas);
				this.status = status;
				this.message_status = message;
			},
		);
	}

	save_state() {
		const tmp = {
			lastRoom: this.lastRoom.save(),
			unreads: this.unreads.save(),
			status: this.status,
			message: this.message_status,
		};
		this.save('tchat', tmp);
	}
}

var ChatSingleton = {};

Object.defineProperties(ChatSingleton, {
	Instance: {
		get: function () {
			if (!Top.has('chatSingleton')) Top.add('chatSingleton', new Chat());
			return Top.get('chatSingleton');
		},
		configurable: false,
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

			if (!!event.public || event.public === false) isPublic = event.public;
			else {
				switch (event.t) {
					case 'c':
						isPublic = true;
						break;
					case 'p':
						isPublic = false;
						break;
					default:
						return new InvalidRoom();
				}
			}

			return new Room(event.name, isPublic);
		}
	}

	save() {
		return {
			name: this.name,
			public: this.public,
		};
	}
}

export class InvalidRoom extends Room {
	constructor() {
		super(null, null);
	}

	isValid() {
		return false;
	}

	save() {
		return null;
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
		const current_value = !this.connector
			? value
			: this.connector.connect(key, value)?.value;

		if (this.datas[key] !== current_value) {
			this.datas[key] = current_value;
			this.onupdate.call();
		}
		return this;
	}

	updateAll(value) {
		if (!this.connector) this.datas = value;
		else this.datas = this.connector.connect(value).datas ?? value;
		this.onupdate.call();
		return this;
	}

	get(key) {
		return this.datas[key];
	}

	setHaveUnreads(val) {
		const value = !this.connector
			? val
			: this.connector.connect(null, val).unreads;

		if (value !== this._unreads) {
			this._unreads = value;
			this.onupdate.call();
		}

		this.onupdate.call();

		return this;
	}

	haveUnreads() {
		return this._unreads;
	}

	haveMention() {
		return this.count();
	}

	*getHaveMentions_generator() {
		for (const iterator of this) {
			const { key, value } = iterator;

			if (value !== 0 && key !== 'haveSomeUnreads') yield iterator;
		}
	}

	getHaveMentions() {
		let mentions = {};
		for (const iterator of this.getHaveMentions_generator()) {
			const { key, value } = iterator;
			mentions[key] = value;
		}

		return mentions;
	}

	count() {
		return Enumerable.from(this)
			.where(x => x.value !== true && x.value !== false && x.value > 0)
			.count();
	}

	save() {
		return {
			datas: this.datas,
			_unreads: this._unreads,
		};
	}

	*[Symbol.iterator]() {
		for (const key in this.datas) {
			if (Object.hasOwnProperty.call(this.datas, key)) {
				const element = this.datas[key];
				yield { key, value: element };
			}
		}
		yield { key: 'haveSomeUnreads', value: this._unreads };
	}

	static from_local(value) {
		let u = new Unreads(value?.datas ?? {});
		u._unreads = value?._unreads ?? false;
		return u;
	}
}
