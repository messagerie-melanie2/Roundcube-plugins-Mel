import { SELECTOR_KEY_INPUT } from '../consts.js';
import { ChannelPart } from './channel_part.js';
import { PasswordPart } from './password_part.js';

export { VisioView };

/**
 * @class
 * @classdesc Gestion de la vue de la création d'une visio
 */
class VisioView {
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
     */
    this.linked_to = new ChannelPart();
    /**
     * @type {PasswordPart}
     * @member
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
