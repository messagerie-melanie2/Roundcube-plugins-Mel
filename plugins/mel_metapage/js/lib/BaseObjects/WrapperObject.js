export { WrapperObject };

/**
 * @class
 * @classdesc Contient une instance d'un objet, utile pour la création d'un singleton.
 * @template {!Tt} T
 */
class WrapperObject {
  /**
   * Instance de la classe
   * @private
   * @type {?T}
   */
  #_instance = null;
  /**
   * Arguments par défaut
   * @private
   * @type {?{TypeOfItem: typeof T, args:any[]}}
   */
  #_args = null;

  /**
   * Constructeur de la classe
   * @param {typeof T} TypeOfItem Classe
   * @param  {...any} args Argument pour instancier la classe
   */
  constructor(TypeOfItem, ...args) {
    this.#_args = {
      TypeOfItem,
      args,
    };
  }

  /**
   * Renvoie un instance de classe
   * @type {T}
   * @readonly
   */
  get Instance() {
    if (!this.#_instance) {
      const { TypeOfItem, args } = this.#_args;
      this.#_instance = new TypeOfItem(...args);
      this.#_args = undefined;
    }

    return this.#_instance;
  }

  /**
   * Contient une instance d'un objet, utile pour la création d'un singleton.
   * @static
   * @param {typeof T} typeofitem
   * @param  {...any} args
   * @returns {WrapperObject<T>}
   */
  static Create(typeofitem, ...args) {
    return new WrapperObject(typeofitem, ...args);
  }
}
