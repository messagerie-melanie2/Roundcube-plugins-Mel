import { BnumEvent } from '../mel_events.js';

/**
 * Ajoute des fonctionnalités pour obsrever les changements de propriétés.
 */
export class NotifierObject {
  constructor() {
    /**
     * Callbacks apelés lorsq'une propriété est mise à jour.
     * @type {BnumEvent}
     */
    this.on_prop_update = new BnumEvent();
  }

  /**
   * Ajoute une propriété à cet objet et appèle un callback lorsqu'elle est mise à jour.
   * @protected
   * @param {string} name Nom de la propriété
   * @param {Object} param1 Configuration de la propriété
   * @param {*} param1.value Valeur par défaut
   * @param {boolean} param1.configurable Si la propriété est configurable
   * @param {function} param1.set Callback appelé lorsqu'on met à jour la propriété
   * @param {function} param1.get Callback appelé lorsqu'on lit la propriété
   */
  _p_addProp(
    name,
    { value = null, configurable = true, set = null, get = null },
  ) {
    let _value = value;
    Object.defineProperty(this, name, {
      get() {
        return get ? get(value) : _value;
      },
      set: (value) => {
        _value = set ? set(value) : value;
        this.on_prop_update.call(name, this[name], this);
      },
      enumerable: true,
      configurable,
    });
  }
}
