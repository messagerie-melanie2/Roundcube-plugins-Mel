/**
 * @class
 * @classdesc Classe de base pour les évènements des webcomposants
 * @abstract
 * @extends CustomEvent
 */
export class ABaseMelEvent extends CustomEvent {
  #caller = null;
  /**
   * Type correspond à l'évènement qui sera cet objet.
   * @param {string} type Type d'évènement
   */
  constructor(type, caller) {
    super(`api:${type}`);

    this.#caller = caller;
  }

  get caller() {
    return this.#caller;
  }
}
