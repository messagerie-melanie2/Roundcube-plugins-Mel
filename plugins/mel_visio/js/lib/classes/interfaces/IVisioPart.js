export { IVisioPart };

/**
 * @class
 * @classdesc Donne les fonctions utiles pour les parties de la vue de la visio
 * @interface
 */
class IVisioPart {
	constructor() {
		this._is_abstract();
	}

	/**
	 * Lance une erreur si on essaye d'instantier `IVisoPart` ou si une des fonctions n'a pas été surchargé.
	 * @returns {boolean}
	 * @private
	 */
	_is_abstract() {
		if ('IVisioPart' === this.constructor.name) {
			throw 'Cette classe est abstraite !';
		}

		return false;
	}

	/**
	 * Désactive un élément
	 * @param {external:jQuery} $item
	 * @returns {external:jQuery} Element désactivé
	 * @protected
	 */
	_p_disable($item) {
		return $item.addClass('disabled').attr('disabled', 'disabled');
	}

	/**
	 * Active un élément
	 * @param {external:jQuery} $item
	 * @returns {external:jQuery} Element activé
	 * @protected
	 */
	_p_enable($item) {
		return $item.removeClass('disabled').removeAttr('disabled');
	}

	/**
	 * Désactive les champs liés à cette partie
	 * @abstract
	 */
	disable() {
		this._is_abstract();
	}

	/**
	 * Active les champs liés à cette partie
	 * @abstract
	 */
	enable() {
		this._is_abstract();
	}

	/**
	 * Retourne la valeur du champ lié à cette partie.
	 * @abstract
	 */
	value() {
		this._is_abstract();
	}
}
