/**
 * @module EventView/Parts/CalendarOwner
 */

import { Parts } from './parts.js';
export { CalendarOwner };

/**
 * @class
 * @classdesc Gère le propriétaire de l'évènement.
 * @extends Parts
 * @frommodule EventView/Parts
 */
class CalendarOwner extends Parts {
	/**
	 *
	 * @param {external:jQuery} $field Select qui contient les propriétaires de l'évènement
	 * @param {external:jQuery} $icon Icône du propriétaire
	 * @param {boolean} calendar_blocked Si le propriétaire est bloqué ou non
	 */
	constructor($field, $icon, calendar_blocked) {
		super($field, Parts.MODE.change);

		const blocked = 'true' === calendar_blocked || true === calendar_blocked;

		if (blocked) $($field).attr('disabled', 'disabled').addClass('disabled');
		else $($field).removeAttr('disabled').removeClass('disabled');

		$($field).tooltip({ trigger: 'hover' });

		/**
		 * Icône du propriétaire
		 * @package
		 * @type {external:jQuery}
		 */
		this._$icon = $icon;

		this.onChange(null);
	}

	/**
	 * Met à jours la couleur de l'icône
	 * @override
	 * @param {string} owner Nouvelle valeur du champ
	 */
	onUpdate(owner) {
		this._$icon
			.css('color', '#' + rcmail.env.calendars[owner].color)
			.css('text-shadow', '0px 0px 1px black');
	}

	/**
	 * Action qui sera appelé lorsque le champ changera de valeur.
	 * @param {Event} e
	 * @returns {Event}
	 * @override
	 */
	onChange(e) {
		this.onUpdate(this._$field.val());
		return e;
	}
}
