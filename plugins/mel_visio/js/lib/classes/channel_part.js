import {
	SELECTOR_CHECKBOX_CHANNEL,
	SELECTOR_DIV_CHANNEL,
	SELECTOR_DIV_WSP,
} from '../consts.js';
import { ACheckBox } from './abstract/ACheckBox.js';
export { ChannelPart };

/**
 * @class
 * @classdesc Récupère le champs qui correspond à l'état de la checkbox
 * @extends ACheckBox
 */
class ChannelPart extends ACheckBox {
	constructor() {
		super(SELECTOR_CHECKBOX_CHANNEL);
		this._init()._setup()._main();
	}

	/**
	 * @private
	 * @returns
	 */
	_init() {
		/**
		 * Champ qui correspond à l'état de la checkbox
		 * @type {external:jQuery}
		 * @readonly
		 * @member
		 */
		this.$field = null;

		return this;
	}

	/**
	 * @private
	 * @returns
	 */
	_setup() {
		Object.defineProperty(this, '$field', {
			get: () =>
				this.is_checked()
					? $(`${SELECTOR_DIV_WSP} select`)
					: $(`${SELECTOR_DIV_CHANNEL} select`),
		});

		return this;
	}

	/**
	 * @private
	 */
	_main() {
		this._p_on_change.bind(this._on_checkbox_change.bind(this));
		this._p_on_change.call(this.is_checked());
	}

	/**
	 * Action à faire lorsque la checkbox change d'état
	 * @param {!boolean} state
	 * @package
	 */
	_on_checkbox_change(state) {
		if (state) {
			$(SELECTOR_DIV_WSP).show();
			$(SELECTOR_DIV_CHANNEL).hide();
		} else {
			$(SELECTOR_DIV_WSP).hide();
			$(SELECTOR_DIV_CHANNEL).show();
		}
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
	 * Récupère la valeur du champ
	 * @override
	 * @overload
	 * @returns {string}
	 */
	value() {
		return this.$field.val();
	}
}
