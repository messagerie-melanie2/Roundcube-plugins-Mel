/**
 * @module BaseStorage
 */

/**
 * Callback qui ajoute un item sous une clé précise
 * @callback Add
 * @param {Key} key Clé qui permettra de retrouver l'item
 * @param {any} item Item à stocker
 * @return {!BaseStorage} Chaînage
 */

/**
 * Récupère un item à partir d'une clé
 * @callback Get
 * @param {Key} key Clé qui permet de retrouver un item
 * @param {?any} default_value Valeur par défaut si on ne trouve pas l'item
 * @return {?any}
 */

/**
 * Supprime un item à partir d'une clé
 * @callback Remove
 * @param {Key} key Clé qui permet de retrouver un item
 * @return {!BaseStorage} Chaînage
 */

/**
 * Vérifie si une clé est associé à un objet
 * @callback Has
 * @param {Key} key Clé qui permet de retrouver un item
 * @return {!Boolean}
 */

/**
 * Vide le dictionnaire
 * @callback Clear
 * @return {!BaseStorage} Chaînage
 */

/**
 * Représente un dictionnaire avec les fonctions de base
 * @class
 * @classdesc Représente un dictionnaire avec les fonctions de base de celui-ci. Le stockage est privée est n'est accéssible que via l'itérateur.
 */
export class BaseStorage {
	constructor() {
		let storage = {};

		/**
		 * Ajoute un item sous une clé précise
		 * @type {Add}
		 */
		this.add = (key, item) => {
			storage[key] = item;
			return this;
		};
		/**
		 * Récupère un item à partir d'une clé
		 * @type {Get}
		 */
		this.get = (key, default_value = null) => storage[key] ?? default_value;
		/**
		 * Supprime un item à partir d'une clé
		 * @type {Remove}
		 */
		this.remove = key => {
			storage[key] = null;
			return this;
		};

		/**
		 * Vérifie si une clé est associé à un objet
		 * @type {Has}
		 */
		this.has = key =>
			!!storage[key] || storage[key] === false || storage[key] === 0;

		/**
		 * Vide le dictionnaire
		 * @type {Clear}
		 */
		this.clear = () => {
			storage = {};
			return this;
		};

		this[Symbol.iterator] = function* () {
			for (const key in storage) {
				if (Object.hasOwnProperty.call(storage, key)) {
					const value = storage[key];
					yield { key, value };
				}
			}
		};
	}
}
