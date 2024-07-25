import { isNullOrUndefined } from '../../../../../mel_metapage/js/lib/mel.js';
import { Locks } from '../locks.js';

export { VisioData, ConfigVisioData, IntegratedVisioData };

class VisioData {
	constructor(data) {
		this._init()._setup(data);
	}

	_init() {
		this.key = null;
		this.wsp = null;
		this.channel = null;
		this.pass = null;

		return this;
	}

	_setup(data) {
		this.key = data.key;
		this.room = data.room;
		this.channel = data.channel;
		this.pass = data.password || data.pass;
	}

	to_ajax_params() {
		let config = {};
		for (const key in this) {
			if (Object.hasOwnProperty.call(this, key)) {
				const element = this[key];
				if (!isNullOrUndefined(element)) config[`_${key}`] = element;
			}
		}

		return config;
	}
}

class ConfigVisioData extends VisioData {
	constructor(data) {
		super(data);
	}

	_init() {
		super._init();
		this.need_config = null;
		this.locks = null;
		return this;
	}

	_setup(data) {
		super._setup();
		const locks = new Locks();
		Object.defineProperties(this, {
			locks: {
				get() {
					return locks;
				},
			},
		});

		this.need_config = data.need_config;
	}

	to_ajax_params() {
		let config = super.to_ajax_params();

		config['_locks'] = rcmail.env['webconf.locks'];

		return config;
	}
}

class IntegratedVisioData extends VisioData {
	constructor(data) {
		super(data);
	}

	_init() {
		super._init();
		this.from_config = null;
		return this;
	}

	_setup(data) {
		super._setup();
		this.from_config = data.from_config;
	}
}
