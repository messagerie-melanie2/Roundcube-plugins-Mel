import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events';
import { IVisioPart } from '../interfaces/IVisioPart';

export { ACheckBox };

/**
 * @class
 * @classdesc Action sur un champs checkbox
 * @abstract
 * @implements {IVisioPart}
 */
class ACheckBox extends IVisioPart {
	/**
	 *
	 * @param {string} selector Selecteur de la checkbox
	 */
	constructor(selector) {
		super();
		this._A_init()._A_setup(selector)._A_main();
	}

	/**
	 * @private
	 * @returns {ACheckBox}
	 */
	_A_init() {
		/**
		 * @type {external:jQuery}
		 * @member
		 * @readonly
		 * @protected
		 */
		this._p_$checkbox = null;
		/**
		 * @type {BnumEvent}
		 * @member
		 * @protected
		 */
		this._p_on_change = new BnumEvent();

		return this;
	}

	/**
	 * @private
	 * @param {*} selector
	 * @returns {ACheckBox}
	 */
	_A_setup(selector) {
		Object.defineProperty(this, '_p_$checkbox', {
			get() {
				return $(selector);
			},
		});
		return this;
	}

	/**
	 * @private
	 * @returns {ACheckBox}
	 */
	_A_main() {
		this._p_$checkbox.on('change', this._on_change.bind(this));
		return this;
	}

	/**
	 * Vérifie si la checkbox est coché ou non
	 * @returns {boolean}
	 */
	is_checked() {
		return this._p_$checkbox.prop('checked');
	}

	/**
	 * Coche la checkbox
	 */
	check() {
		this._p_$checkbox.prop('checked', true);
		this._p_on_change.call(true);
	}

	/**
	 * Décoche la checkbox
	 */
	uncheck() {
		this._p_$checkbox.prop('checked', false);
		this._p_on_change.call(false);
	}

	/**
	 * Inverse l'état de la checkbox
	 */
	toggle() {
		const state = !this._p_$checkbox.prop('checked');
		this._p_$checkbox.prop('checked', state);
		this._p_on_change.call(state);
	}

	/**
	 * Récupère la checkbox
	 * @returns {external:jQuery}
	 */
	get() {
		return this._p_$checkbox;
	}

	/**
	 * Désactive les champs
	 * @override
	 */
	disable() {
		super.disable();
		this._p_disable(this._p_$checkbox);
	}

	/**
	 * Active les champs
	 * @override
	 */
	enable() {
		super.enable();
		this._p_enable(this._p_$checkbox);
	}

	/**
	 * Retourne la valeur du champ
	 * @returns {boolean}
	 * @override
	 */
	value() {
		super.value();
		return this.is_checked();
	}

	/**
	 * @private
	 */
	_on_change() {
		this._p_on_change.call(this.is_checked());
	}
}
