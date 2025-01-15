import { eLocks } from '../enums.js';

export { Locks };

/**
 * Contient la classe lié aux locks, cad les éléments qui ne peuvent être changé dan une visio
 * @module Visio/Structures/Locks
 * @local Locks
 */

/**
 * @class
 * @classdesc Classe permettant de gérer les verrous de la visio
 */
class Locks {
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
     * Si le nom de la visio est bloqué ou non
     * @type {!boolean}
     * @readonly
     */
    this.room = false;
    /**
     * Si le channel est bloqué ou  non
     * @type {!boolean}
     * @readonly
     */
    this.channel = false;
    /**
     * Si le mot de passe est bloqué ou non
     * @type {!boolean}
     * @readonly
     */
    this.password = false;

    return this;
  }

  /**
   * @private
   */
  _setup() {
    const _room =
      rcmail.env['webconf.locks']?.includes?.(eLocks.room) ?? this.room;
    const _channel =
      rcmail.env['webconf.locks']?.includes?.(eLocks.mode) ?? this.channel;
    const _password =
      rcmail.env['webconf.locks']?.includes?.(eLocks.password) ?? this.password;
    Object.defineProperties(this, {
      room: {
        value: _room,
        writable: false,
        configurable: false,
      },
      channel: {
        value: _channel,
        writable: false,
        configurable: false,
      },
      password: {
        value: _password,
        writable: false,
        configurable: false,
      },
    });
  }
}
