export { Locks, LOCKS };

/**
 * @class
 * @classdesc Classe permettant de gérer les verrous de la visio
 */
class Locks {
	constructor() {
		this._init()._setup();
	}

	/**
	 *
	 * @private
	 */
	_init() {
		/**
		 * Si le nom de la visio est bloqué ou non
		 * @type {!boolean}
		 * @readonly
		 */
		this.room = false;
		/**
		 * Si le channel est bloqué ou  non
		 * @type {!boolean}
		 * @readonly
		 */
		this.channel = false;
		/**
		 * Si le mot de passe est bloqué ou non
		 * @type {!boolean}
		 * @readonly
		 */
		this.password = false;

		return this;
	}

	/**
	 * @private
	 */
	_setup() {
		const _room =
			rcmail.env['webconf.locks']?.includes?.(LOCKS.room) ?? this.room;
		const _channel =
			rcmail.env['webconf.locks']?.includes?.(LOCKS.mode) ?? this.channel;
		const _password =
			rcmail.env['webconf.locks']?.includes?.(LOCKS.password) ?? this.password;
		Object.defineProperties(this, {
			room: {
				value: _room,
				writable: false,
				configurable: false,
			},
			channel: {
				value: _channel,
				writable: false,
				configurable: false,
			},
			password: {
				value: _password,
				writable: false,
				configurable: false,
			},
		});
	}
}

/**
 * @enum {number}
 */
const LOCKS = {
	room: 0,
	mode: 1,
	password: 2,
};
