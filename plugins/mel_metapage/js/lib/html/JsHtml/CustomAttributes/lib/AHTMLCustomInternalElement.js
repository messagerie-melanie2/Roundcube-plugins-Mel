import { BnumEvent } from '../../../../mel_events.js';
import {
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../js_html_base_web_elements.js';

/**
 * @callback OnStatusUpdatedCallback
 * @param {string} state
 * @param {T} caller
 * @returns {void}
 * @template {AHTMLCustomInternalElement} T
 */

/**
 * @class
 * @classdesc Classe abstraite qui gère les états interne de l'élément html
 * @extends HtmlCustomDataTag
 * @abstract
 */
export default class AHTMLCustomInternalElement extends HtmlCustomDataTag {
  #_internals;
  /**
   *
   * @param {Object} [options={}]
   * @param {EWebComponentMode} [options.mode=EWebComponentMode.span]
   */
  constructor({ mode = EWebComponentMode.span } = {}) {
    super({ mode });
    this.#_internals = this.attachInternals();
    /**
     * Est appelé lorsque qu'un état est ajouté
     * @type {BnumEvent<OnStatusUpdatedCallback<this>>}
     * @event
     */
    this.oninternaladded = new BnumEvent();
    /**
     * Est appelé lorsque qu'un état est supprimé
     * @type {BnumEvent<OnStatusUpdatedCallback<this>>}
     * @event
     */
    this.oninternalremoved = new BnumEvent();

    this.oninternaladded.add('default', (state, caller) => {
      this.dispatchEvent(
        new CustomEvent('event:custom:internals.add', {
          detail: { state, caller },
        }),
      );
    });

    this.oninternalremoved.add('default', (state, caller) => {
      this.dispatchEvent(
        new CustomEvent('event:custom:internals.remove', {
          detail: { state, caller },
        }),
      );
    });
  }

  /**
   * Eléments internes
   * @type {ElementInternals}
   * @readonly
   */
  get internals() {
    return this.#_internals;
  }

  /**
   * Les états de l'élément
   * @type {CustomStateSet}
   * @readonly
   */
  get state() {
    return this.internals.states;
  }

  /**
   * Met un état
   * @param {string} state
   * @returns {this} Chaînage
   */
  setState(state) {
    this.internals.states.add(state);
    this.oninternaladded.call(state, this);
    return this;
  }

  /**
   * Supprimer un état
   * @param {string} state Etat à supprimer
   * @returns {this} Chaînage
   */
  removeState(state) {
    this.internals.states.delete(state);
    this.oninternalremoved.call(state, this);
    return this;
  }

  /**
   * Désactive une node
   * @param {Object} [param0={}]
   * @param {?T} [param0.node=null]
   * @returns {T | this}
   * @template {HTMLElement} T
   */
  disable({ node = null } = {}) {
    node = super.disable({ node });

    this.setState('disabled');
    return node;
  }

  /**
   * Active une node
   * @param {Object} [param0={}]
   * @param {?T} [param0.node=null]
   * @returns {T | this}
   * @template {HTMLElement} T
   */
  enable({ node = null } = {}) {
    node = super.enable({ node });

    this.removeState('disabled');
    return node;
  }
}
