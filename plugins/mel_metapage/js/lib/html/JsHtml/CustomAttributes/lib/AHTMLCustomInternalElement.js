import { BnumEvent } from '../../../../mel_events.js';
import {
  EWebComponentMode,
  HtmlCustomDataTag,
} from '../js_html_base_web_elements.js';

export default class AHTMLCustomInternalElement extends HtmlCustomDataTag {
  #_internals;
  constructor({ mode = EWebComponentMode.span } = {}) {
    super({ mode });
    this.#_internals = this.attachInternals();
    this.oninternaladded = new BnumEvent();
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
}
