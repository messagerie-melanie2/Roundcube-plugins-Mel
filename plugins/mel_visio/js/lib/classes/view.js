import { SELECTOR_KEY_INPUT } from '../consts.js';
import { ChannelPart } from './channel_part.js';
import { PasswordPart } from './password_part.js';

export { VisioView };

/**
 * Contient la classe utile à la gestion de la vue de création d'une visio
 * @module Visio/View
 */

/**
 * @class
 * @classdesc Gestion de la vue de la création d'une visio
 */
class VisioView {
  /**
   * Initialise la classe
   */
  constructor() {
    this._init()._setup();
  }

  /**
   *
   * @private
   */
  _init() {
    /**
     * @type {external:jQuery}
     * @member
     * @readonly
     */
    this.$room = null;
    /**
     * @type {ChannelPart}
     * @member
     * @frommodule Visio/Parts/Channel
     */
    this.linked_to = new ChannelPart();
    /**
     * @type {PasswordPart}
     * @member
     * @frommodule Visio/Parts/PasswordPart
     */
    this.password = new PasswordPart();

    return this;
  }

  /**
   *
   * @private
   */
  _setup() {
    Object.defineProperty(this, '$room', {
      get() {
        return $(SELECTOR_KEY_INPUT);
      },
    });

    return this;
  }

  /**
   * Clé de la visio
   * @returns {!string}
   */
  value() {
    return this.$room.val();
  }
}
