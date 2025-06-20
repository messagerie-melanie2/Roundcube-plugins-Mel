/**
 * Événement personnalisé signalant le changement d'un élément.
 *
 * @template T Type du nouvel élément.
 * @template Y Type de l'ancien élément.
 * @template {HTMLElement} TCaller Type de l'élément ayant déclenché l'événement (doit hériter de HTMLElement).
 * @extends {CustomEvent}
 */
export default class ElementChangedEvent extends CustomEvent {
  #_new;
  #_old;
  #_caller;

  /**
   * Crée une nouvelle instance d'ElementChangedEvent.
   *
   * @param {string} type Le type de changement.
   * @param {T} newElement Le nouvel élément.
   * @param {Y} oldElement L'ancien élément.
   * @param {TCaller} caller L'élément ayant déclenché l'événement.
   * @param {CustomEventInit} [initDict={}] Options d'initialisation de l'événement.
   */
  constructor(type, newElement, oldElement, caller, initDict = {}) {
    super(`custom:element-changed.${type}`, initDict);

    this.#_new = newElement;
    this.#_old = oldElement;
    this.#_caller = caller;
  }

  /**
   * Retourne le nouvel élément.
   * @type {T}
   * @readonly
   */
  get newElement() {
    return this.#_new;
  }

  /**
   * Retourne l'ancien élément.
   * @type {Y}
   * @readonly
   */
  get oldElement() {
    return this.#_old;
  }

  /**
   * Retourne l'élément qui a déclenché l'événement.
   * @type {TCaller}
   * @readonly
   */
  get caller() {
    return this.#_caller;
  }
}
