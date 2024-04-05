import {
	SELECTOR_CHECKBOX_PASSWORD,
	SELECTOR_FORM_PASSWORD,
	SELECTOR_PASS_INPUT,
} from '../consts.js';
import { ACheckBox } from './abstract/ACheckBox.js';
export { PasswordPart };

/**
 * @class
 * @classdesc
 * @extends ACheckBox
 */
class PasswordPart extends ACheckBox {
	constructor() {
		super(SELECTOR_CHECKBOX_PASSWORD);
		this._init()._setup()._main();
	}

	/**
	 * @private
	 */
	_init() {
		/**
		 * Div à afficher ou non
		 * @private
		 * @type {external:jQuery}
		 * @member
		 * @readonly
		 */
		this._$group = null;
		/**
		 * Champs du mot de passe
		 * @type {external:jQuery}
		 * @member
		 * @readonly
		 */
		this.$field = null;
		return this;
	}

	/**
	 * @private
	 */
	_setup() {
		Object.defineProperties(this, {
			_$group: {
				get() {
					return $(SELECTOR_FORM_PASSWORD);
				},
			},
			$field: {
				get() {
					return $(SELECTOR_PASS_INPUT);
				},
			},
		});
		return this;
	}

	/**
	 * @private
	 */
	_main() {
		this._p_on_change.push(this._on_checkbox_change.bind(this));
		this._p_on_change.call(this.is_checked());
	}

	/**
	 * Action à faire lorsque la checkbox change d'état
	 * @param {!boolean} state
	 * @package
	 */
	_on_checkbox_change(state) {
		if (state) this._$group.show();
		else this._$group.hide();
	}

	/**
	 * Désactive les champs
	 * @override
	 */
	disable() {
		super.disable();
		this._p_disable(this.$field);
	}

	/**
	 * Active les champs
	 * @override
	 */
	enable() {
		super.enable();
		this._p_enable(this.$field);
	}

	/**
	 * Valeur du champ
	 * @returns {?string}
	 * @override
	 * @overload
	 */
	value() {
		return this.is_checked() ? this.$field.val() : null;
	}
}
