export { BaseStorage };

/**
 * @module BaseStorage
 */

/**
 * @local BaseStorage
 */

/**
 * Représente un dictionnaire avec les fonctions de base
 * @class
 * @classdesc Représente un dictionnaire avec les fonctions de base de celui-ci. Le stockage est privée est n'est accéssible que via l'itérateur.
 * @template {T}
 */
class BaseStorage {
  constructor() {
    let storage = {};

    /**
     * Ajoute un item sous une clé précise
     * @param {string} key
     * @param {T} item
     * @returns {BaseStorage<T>} Chaînage
     */
    this.add = (key, item) => {
      storage[key] = item;
      return this;
    };

    /**
     * Récupère une valeur à partir d'une clé.
     * @param {string} key
     * @param {?T} default_value
     * @returns {?T}
     */
    this.get = (key, default_value = null) => storage[key] ?? default_value;
    /**
     * Supprime un item à partir d'une clé
     * @param {string} key
     * @returns {BaseStorage<T>} Chaînage
     */
    this.remove = (key) => {
      storage[key] = null;
      return this;
    };

    /**
     * Vérifie si une clé est associé à un objet
     * @param {string} key
     * @returns {Boolean}
     */
    this.has = (key) =>
      !!storage[key] || storage[key] === false || storage[key] === 0;

    /**
     * Vide le dictionnaire
     * @returns {BaseStorage<T>} Chaînage
     */
    this.clear = () => {
      storage = {};
      return this;
    };

    /**
     * Itérateur sur le dictionnaire
     * @generator
     * @yields {{key: string, value: T}}
     */
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
