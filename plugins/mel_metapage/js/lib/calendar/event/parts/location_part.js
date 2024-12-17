/**
 * @module EventView/Parts/Location
 * @local IDestroyable
 * @local ALocationPart
 * @local VisioManager
 * @local AVisio
 * @local IntegratedVisio
 * @local AExternalLocationPart
 */

import { MelEnumerable } from '../../../classes/enum.js';
import { EMPTY_STRING } from '../../../constants/constants.js';
import {
  REG_ALPHANUM,
  REG_NUMBER,
  REG_URL,
} from '../../../constants/regexp.js';
import { MelHtml } from '../../../html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../mel_events.js';
import { Mel_Promise } from '../../../mel_promise.js';
import { EventView } from '../event_view.js';
// eslint-disable-next-line no-unused-vars
import { CategoryPart } from './categoryparts.js';
import {
  INTEGRATED_VISIO_MIN_NUMBER_COUNT,
  INTEGRATED_VISIO_MIN_SIZE,
  LOCATION_AUDIO_OPTION_VALUE,
  LOCATION_OPTION_VALUE,
  LOCATION_SEPARATOR,
  LOCATION_VISIO_EXTERNAL_OPTION_VALUE,
  LOCATION_VISIO_INTERNAL_OPTION_VALUE,
  LOCATION_VISIO_OPTION_VALUE,
  SEPARATOR_AUDIO_PIN,
  SEPARATOR_AUDIO_URL_LOCATION,
  SEPARATOR_END_LOCATION_VISIO_INTEGRATED_PHONE,
  SEPARATOR_LOCATION_VISIO_INTEGRATED_PHONE,
  SEPARATOR_LOCATION_VISIO_INTEGRATED_PIN_PHONE,
  TAG_WSP_CATEGORY,
} from './parts.constants.js';

export { ALocationPart, AExternalLocationPart };

MelHtml.start.constructor.prototype.foreach = function () {
  return MelHtml.start;
};

MelHtml.extend('foreach', function (callback, ...items) {
  let self = this;
  for (const item of items) {
    self = callback(self, item);
  }

  return self;
});

/**
 * Interface pour les classes qui doivent être détruites à la fin de leurs utilisations.
 * @interface
 * @package
 * @hideconstructor
 */
class IDestroyable {
  constructor() {}

  /**
   * Libère les données en mémoire
   * @abstract
   */
  destroy() {}
}

/**
 * @abstract
 * @class
 * @classdesc Représente une partie de la localisation d'un évènement.
 * @implements {IDestroyable}
 * @package
 */
class ALocationPart extends IDestroyable {
  /**
   *
   * @param {string} location Localisation de l'évènement
   * @param {number} index Id de la localisation
   */
  constructor(location, index) {
    super();
    /**
     * Id de la localisation
     * @type {number}
     * @readonly
     * @member
     */
    this.id;

    /**
     * Sera appelé lorsque la localisation change
     * @event
     * @type {BnumEvent}
     * @member
     */
    this.onchange = new BnumEvent();
    Object.defineProperty(this, 'id', {
      value: index,
      writable: false,
      configurable: false,
    });

    this._init(location);
  }

  /**
   * Initialise la localisation
   * @private
   */
  _init(location) {
    /**
     * Données de cette partie de localisation
     * @type {!string}
     */
    this.location = location;
  }

  /**
   * Récupère la valeur qui sera utilisé dans l'option pour le select
   * @returns {string} Valeur de l'option
   */
  option_value() {
    return this.constructor.OptionValue();
  }

  /**
   * Génère cette partie de la localisation sous forme html
   * @virtual
   * @param {external:jQuery} $parent Parent qui contiendra le html
   * @returns {ALocationPart} Chaîne
   */
  // eslint-disable-next-line no-unused-vars
  generate($parent) {
    return this;
  }

  /**
   * Si la localisation est valide et correspond à ce que l'on attend
   * @virtual
   * @returns {boolean}
   */
  is_valid() {
    return false;
  }

  /**
   * Action à faire si la localisation n'est pas valide
   * @virtual
   */
  invalid_action() {}

  /**
   * Libère les données en mémoire
   * @abstract
   * @override
   */
  destroy() {}

  /**
   * Vérifie si la localisation est de se type
   * @virtual
   * @static
   * @param {string} location Localisation de l'évènement
   * @returns {boolean}
   */
  // eslint-disable-next-line no-unused-vars
  static Has(location) {
    return false;
  }

  /**
   * Valeur de l'option qui désigne cette classe.
   * @abstract
   * @static
   * @returns {string}
   */
  static OptionValue() {}

  /**
   * Nombre maximum de cette classe qui peut être utilisé
   * @virtual
   * @returns {number}
   */
  static Max() {
    return 0;
  }
}

class AExternalLocationPart extends ALocationPart {
  constructor(event, index) {
    super(EMPTY_STRING, index);

    /**
     * Evènement de base du plugin `Calendar`
     * @protected
     */
    this._p_base_event = event;
  }

  /**
   * Génère cette partie de la localisation sous forme html
   * @virtual
   * @param {external:jQuery} $parent Parent qui contiendra le html
   * @returns {ALocationPart} Chaîne
   */
  generate($parent) {
    return super.generate($parent);
  }

  /**
   * Si la localisation est valide et correspond à ce que l'on attend
   * @virtual
   * @returns {boolean}
   */
  is_valid() {
    return super.is_valid();
  }

  /**
   * Action à faire si la localisation n'est pas valide
   * @virtual
   */
  invalid_action() {
    return super.invalid_action();
  }

  /**
   * Libère les données en mémoire
   * @abstract
   * @override
   */
  destroy() {
    super.destroy();
  }

  /**
   * @virtual
   * @static
   * @param {*} event Event du plugin calendar
   * @returns {Array<Tuple<typeof AExternalLocationPart, *>>}
   */
  static Instantiate(event) {
    return [];
  }

  /**
   * Vérifie si la localisation est de se type
   * @virtual
   * @static
   * @override
   * @param {*} event Event du plugin calendar
   * @returns {boolean}
   */
  // eslint-disable-next-line no-unused-vars
  static Has(event) {
    return false;
  }

  /**
   * Valeur de l'option qui désigne cette classe.
   * @abstract
   * @static
   * @returns {string}
   */
  static OptionValue() {}

  /**
   * Nombre maximum de cette classe qui peut être utilisé
   * @virtual
   * @returns {number}
   */
  static Max() {
    return 0;
  }

  /**
   * Plugin qui contient la localisation
   * @virtual
   * @returns {string}
   */
  static PluginName() {
    return 'mel_metapage';
  }
}

/**
 * @class
 * @classdesc Représente la partie de la localisation qui gère les visioconférences.
 * @augments ALocationPart
 * @package
 */
class VisioManager extends ALocationPart {
  /**
   *
   * @param {string} location Localisation de l'évènement
   * @param {number} index Id de la partie
   * @param {CategoryPart} categoryPart Partie lié à la catégorie
   */
  constructor(location, index, categoryPart) {
    super(location, index);

    if (
      (EMPTY_STRING === location || IntegratedVisio.Has(location)) &&
      IntegratedVisio.VisioEnabled()
    )
      this._current = new IntegratedVisio(location, index, categoryPart);
    else this._current = new ExternalVisio(location, index);

    this._current.onchange.push(this._on_change_action.bind(this));
    this._on_change_action();

    this.categoryPart = categoryPart;
  }

  /**
   * @inheritdoc
   * @override
   */
  _init(location) {
    super._init(location);

    /**
     * Localisation de type visioconférence
     * @private
     * @type {AVisio}
     * @member
     */
    this._current = null;
    /**
     * Localisation de type visioconférence qui ont été généré et mis en cache si jamais on change de localisation.
     * @private
     * @type {!Object<string, AVisio>}
     * @member
     */
    this._cached = {};

    /**
     * Données de cette partie de localisation
     * @override
     * @type {string}
     * @readonly
     */
    this.location = EMPTY_STRING;

    Object.defineProperty(this, 'location', {
      get() {
        return this._current?.location ?? EMPTY_STRING;
      },
    });
  }

  /**
   * Change le type de visio courant pour correspondre à ce qui est affiché sur le select lié.
   * @private
   * @param {Event} event
   */
  _on_select_change(event) {
    const val = $(event.currentTarget).val();

    $('.visio-mode').css('display', 'none');

    this._cached[this._current.option_value()] = this._current;

    if (this._cached[val]) {
      this._current = this._cached[val];
      this._cached[val] = null;
    } else {
      this._current = new ([IntegratedVisio, ExternalVisio].find(
        (x) => x.OptionValue() === val,
      ))('', this.id, this.categoryPart).generate(
        $(`#visio-${this.id}-container`),
      );
      this._current.onchange.push(this._on_change_action.bind(this));
    }

    this._on_change_action();
  }

  /**
   * Appelle l'évènement "onchange"
   * @private
   */
  _on_change_action() {
    this.onchange.call();
  }

  /**
   * Génère cette partie de la localisation sous forme html
   * @override
   * @param {external:jQuery} $parent Parent qui contiendra le html
   * @returns {VisioManager} Chaîne
   */
  generate($parent) {
    super.generate($parent);

    let $tmp = MelHtml.start
      .div({ class: 'location-mode', 'data-locationmode': this.option_value() })
      .select({
        id: `visio-${this.id}`,
        onchange: this._on_select_change.bind(this),
      })
      .option({ value: IntegratedVisio.OptionValue() })
      .text(`event-${IntegratedVisio.OptionValue()}`)
      .end()
      .option({ value: ExternalVisio.OptionValue() })
      .text(`event-${ExternalVisio.OptionValue()}`)
      .end()
      .end()
      .div({ id: `visio-${this.id}-container`, class: 'visio-container mt-2' })
      .end()
      .end()
      .generate()
      .appendTo($parent);

    $tmp.find('select').val(this._current.option_value());

    if (!IntegratedVisio.VisioEnabled()) $tmp.find('select').hide();

    this._current.generate($tmp.find('.visio-container'));

    return this;
  }

  /**
   * Attend que les données d'un type de visio soit chargée.
   * @async
   * @return {Promise<void>}
   */
  async wait() {
    if (this._current.wait) await this._current.wait();
  }

  /**
   * Libère les données en mémoire.
   * @override
   */
  destroy() {
    this._current = this._current.destroy();

    for (const iterator of Object.keys(this._cached)) {
      this._cached[iterator]?.destroy?.();
    }

    this._cached = null;
    this.categoryPart = null;
  }

  /**
   * Si la localisation est valide et correspond à ce que l'on attend
   * @return {Boolean}
   * @see {@link IntegratedVisio}
   * @see {@link ExternalVisio}
   */
  is_valid() {
    return this._current.is_valid();
  }

  /**
   * Action à faire si la localisation n'est pas valide
   * @see {@link IntegratedVisio}
   * @see {@link ExternalVisio}
   */
  invalid_action() {
    this._current.invalid_action();
  }

  /**
   * Si la localisation est de type "Visioconférence"
   * @return {Boolean}
   * @override
   * @static
   */
  static Has(location) {
    return IntegratedVisio.Has(location) || ExternalVisio.Has(location);
  }

  /**
   * Valeur de l'option qui désigne cette classe.
   * @overload
   * @returns {string}
   * @default 'visio'
   * @see {@link LOCATION_VISIO_OPTION_VALUE}
   */
  static OptionValue() {
    return LOCATION_VISIO_OPTION_VALUE;
  }

  /**
   * Nombre maximum de cette classe qui peut être utilisé
   * @override
   * @return {number}
   * @default 1
   * @static
   */
  static Max() {
    return 1;
  }
}

/**
 * @abstract
 * @class
 * @classdesc Représente une partie de la localisation d'un évènement qui est une visioconférence.
 * @extends {ALocationPart}
 * @package
 */
class AVisio extends ALocationPart {
  /**
   *
   * @param {string} location Emplacement de l'évènement
   * @param {number} index Id de la partie
   */
  constructor(location, index) {
    super(location, index, null);
  }

  /**
   * Attend que les données de la visioconférence soit chargée.
   * @async
   * @returns {Promise<void>}
   */
  async wait() {}
}

/**
 * @class
 * @classdesc Représente une partie de la localisation d'un évènement qui est une visioconférence interne.
 * @augments AVisio
 * @package
 */
class IntegratedVisio extends AVisio {
  /**
   *
   * @param {string} location Localisation de l'évènement
   * @param {number} index Id de la partie
   * @param {CategoryPart} categoryPart Partie
   */
  constructor(location, index, categoryPart) {
    super(location, index);

    /**
     * Nom de la room
     * @package
     * @type {string}
     * @readonly
     */
    this._room;
    /**
     * @inheritdoc
     * @type {string}
     * @readonly
     * @override
     */
    this.location;

    Object.defineProperty(this, 'location', {
      get: () => {
        let config = {
          _key: location,
        };

        if (categoryPart._$fakeField.val().includes(TAG_WSP_CATEGORY)) {
          config['_wsp'] = categoryPart._$fakeField
            .val()
            .replace(TAG_WSP_CATEGORY, EMPTY_STRING);
        }

        if (this._pass || false) config['_pass'] = this._pass;

        return `${mel_metapage.Functions.public_url('webconf', config)} ${this.get_phone()}`;
      },
      set: (value) => {
        location = value;
      },
    });

    Object.defineProperty(this, '_room', {
      get() {
        return location;
      },
    });

    const link = WebconfLink.create({ location });
    this.location = link.key;
    this._pass = link.pass ?? EMPTY_STRING;

    if (this._pass.includes(SEPARATOR_LOCATION_VISIO_INTEGRATED_PHONE)) {
      let split = this._pass.split(SEPARATOR_LOCATION_VISIO_INTEGRATED_PHONE);
      this._pass = split[0];
      split = split[1].split(SEPARATOR_LOCATION_VISIO_INTEGRATED_PIN_PHONE);
      this._phone = split[0];
      this._pin = split[1].replace(
        SEPARATOR_END_LOCATION_VISIO_INTEGRATED_PHONE,
        EMPTY_STRING,
      );
    } else if (
      this.location.includes(SEPARATOR_LOCATION_VISIO_INTEGRATED_PHONE)
    ) {
      let split = this.location
        .split(SEPARATOR_LOCATION_VISIO_INTEGRATED_PHONE)
        .split(SEPARATOR_LOCATION_VISIO_INTEGRATED_PIN_PHONE);
      this._phone = split[0];
      this._pin = split[1].replace(
        SEPARATOR_END_LOCATION_VISIO_INTEGRATED_PHONE,
        EMPTY_STRING,
      );
    }
  }

  /**
   * @inheritdoc
   * @override
   */
  _init(location) {
    super._init(location);

    /**
     * Ancienne nom de la room
     * @type {string}
     * @package
     */
    this._last_room = EMPTY_STRING;
    /**
     * Mot de passe de la room
     * @type {string}
     * @package
     */
    this._pass = EMPTY_STRING;
    /**
     * Numéro de téléphone de la room
     * @type {string}
     * @package
     */
    this._phone = EMPTY_STRING;
    /**
     * Code pin de la room
     * @type {string}
     * @package
     */
    this._pin = EMPTY_STRING;
    /**
     * Div qui contient les champs de la visioconférence
     * @type {external:jQuery}
     * @package
     */
    this._$div = null;
    /**
     * Contient une promesse qui sera résolu ultérieurement
     * @type {Mel_Promise}
     * @package
     */
    this._current_promise = Mel_Promise.Resolved();
  }

  /**
   * Si la localisation est valide et correspond à ce que l'on attend
   * @returns {boolean}
   * @override
   */
  is_valid() {
    return (
      EMPTY_STRING !== this._room &&
      !(
        this._room.length < 10 ||
        MelEnumerable.from(this._room)
          .where((x) => /\d/.test(x))
          .count() < 3 ||
        !/^[0-9a-zA-Z]+$/.test(this._room)
      )
    );
  }
  /**
   * Action à faire si la localisation n'est pas valide
   * @override
   */
  invalid_action() {
    if (EMPTY_STRING === this._room) {
      rcmail.display_message(
        rcmail.gettext('error_empty_event_visio_room', 'mel_metapage'),
        'error',
      );
    } else if (this._room.length < INTEGRATED_VISIO_MIN_SIZE) {
      rcmail.display_message(
        rcmail.gettext('error_too_small_event_visio_room', 'mel_metapage'),
        'error',
      );
    } else if (
      MelEnumerable.from(this._room)
        .where((x) => REG_NUMBER.test(x))
        .count() < INTEGRATED_VISIO_MIN_NUMBER_COUNT ||
      REG_ALPHANUM.test(this._room)
    ) {
      rcmail.display_message(
        rcmail.gettext('error_less_number_event_visio_room', 'mel_metapage'),
        'error',
      );
    } else
      rcmail.display_message(
        rcmail.gettext('unknown_error', 'mel_metapage'),
        'error',
      );

    this._$div.find(`#integrated-${this.id}`).focus();
  }

  /**
   * Génère cette partie de la localisation sous forme html
   * @param {external:jQuery} $parent Parent qui contiendra le html
   * @returns {IntegratedVisio} Chaînage
   * @override
   */
  generate($parent) {
    super.generate($parent);

    this._$div = MelHtml.start
      .div({ class: 'visio-mode', 'data-locationmode': this.option_value() })
      .row()
      .col_6({ class: 'd-flex pr-1' })
      .css('position:relative')
      .icon('match_case', { class: 'align-self-center' })
      .end()
      .input_text({
        id: `integrated-${this.id}`,
        value: this._room || mel_metapage.Functions.generateWebconfRoomName(),
        onchange: this._on_room_updated.bind(this),
        oninput: this._on_room_input.bind(this),
      })
      .icon('edit', { class: 'event-mel-icon-absolute mr-2' })
      .end()
      .end()
      .col_6({ class: 'd-flex pl-1' })
      .icon('lock', { class: 'align-self-center' })
      .end()
      .input_text({
        id: `integrated-pass-${this.id}`,
        value: this._pass,
        onchange: this._on_pass_updated.bind(this),
      })
      .icon('add', { class: 'event-mel-icon-absolute mr-2' })
      .end()
      .end()
      .end()
      .row({ class: 'mt-2' })
      .col_6({ class: 'd-flex pr-1' })
      .icon('call', { class: 'align-self-center mr-2' })
      .end()
      .input_text({ id: `integrated-phone-${this.id}`, value: this._phone })
      .disable()
      .end()
      .col_6({ class: 'd-flex pl-1' })
      .icon('key', { class: 'align-self-center mr-2' })
      .end()
      .input_text({ id: `integrated-key-${this.id}`, value: this._pin })
      .disable()
      .end()
      .end()
      .end()
      .generate()
      .appendTo($parent);

    this._on_room_updated({
      currentTarget: this._$div.find(`#integrated-${this.id}`),
    });
    this.onchange.call();
    return this;
  }

  /**
   * Désactiver le bouton "Sauvegarder" lors de l'input.
   */
  _on_room_input(event) {
    event = $(event.currentTarget);
    //Si il y a une url dans le champs, on récupère la clé contenue dans l'url
    {
      const detected =
        mel_metapage.Functions.webconf_url(event.val().toLowerCase()) || false;
      if (detected && detected !== event.val()) {
        event.val(detected).change();
        return;
      }
    }

    let dialog = EventView.INSTANCE.get_dialog();

    if (EventView.INSTANCE.is_jquery_dialog()) {
      dialog
        .parent()
        .find('.ui-dialog-buttonset .mainaction')
        .attr('disabled', 'disabled')
        .addClass('disabled');
    } else {
      dialog.footer.buttons.save
        .attr('disabled', 'disabled')
        .addClass('disabled');
    }
  }

  /**
   * Est appelé lorsque le champ de room est modifié.
   *
   * Change la localisation et récupère le code pin et le numéro de téléphone de la visio.
   * @async
   * @param {Event} event
   * @returns {Promise<void>}
   * @package
   */
  async _on_room_updated(event) {
    event = $(event.currentTarget);

    this._last_room = this._room;
    this.location = event.val();

    // //Si il y a une url dans le champs, on récupère la clé contenue dans l'url
    // {
    //   const detected =
    //     mel_metapage.Functions.webconf_url(this.location.toLowerCase()) ||
    //     false;
    //   if (detected) {
    //     this.location = detected;
    //     event.val(detected);
    //   }
    // }

    if (this._room !== '') {
      this.get_phone();
      await this.wait();

      this._$div.find(`#integrated-phone-${this.id}`).val(this._phone);
      this._$div.find(`#integrated-key-${this.id}`).val(this._pin);
    } else {
      const charCode = String.fromCharCode('9940');
      this._$div.find(`#integrated-phone-${this.id}`).val(charCode);
      this._$div.find(`#integrated-key-${this.id}`).val(charCode);
    }

    this.onchange.call();

    let dialog = EventView.INSTANCE.get_dialog();

    if (EventView.INSTANCE.is_jquery_dialog()) {
      dialog
        .parent()
        .find('.ui-dialog-buttonset .mainaction')
        .removeAttr('disabled')
        .removeClass('disabled');
    } else {
      dialog.footer.buttons.save.removeAttr('disabled').removeClass('disabled');
    }
  }

  /**
   * Est appelé lorsque le champs mot de passe est modifié.
   * @param {Event} event
   * @package
   */
  _on_pass_updated(event) {
    event = $(event.currentTarget);

    this._pass = event.val();
    this.onchange.call();
  }

  /**
   * Récupère le numéro de téléphone et le code pin de la visioconférence.
   *
   * Si ils ne sont pas encore chargé, et qu'on souhaite attendre qu'ils soient chargés, il faudra appeler {@link IntegratedVisio~wait}.
   * @returns {string}
   */
  get_phone() {
    if (this._last_room !== this._room) {
      this._last_room = this._room;
      const busy = rcmail.set_busy(true, 'loading');
      this._current_promise = new Mel_Promise((current, room) => {
        current.start_resolving();

        (async () => {
          try {
            const data = await webconf_helper.phone.getAll(room);
            const { number, pin } = data;

            this._phone = number || 'ERROR';
            this._pin = pin || 'NOPIN';

            rcmail.set_busy(false, 'loading', busy);
          } catch (error) {
            this._phone = 'XX-XX-XX-XX-XX';
            this._pin = '0123456789';
            rcmail.set_busy(false, 'loading', busy);
          }

          window.disable_x_roundcube = false;
          current.resolve();
        })();
      }, this._room);
    }

    if (this._current_promise.isPending()) return 'loading....';
    else return `(${this._phone} | ${this._pin})`;
  }

  /**
   * Libère les données en mémoire
   * @override
   */
  destroy() {
    this._$div = null;
    this._current_promise = null;
  }

  /**
   * @inheritdoc
   */
  async wait() {
    await this._current_promise;
  }

  /**
   * Valeur de l'option qui désigne cette classe.
   * @static
   * @returns {string}
   * @override
   * @default 'visio-internal'
   * @see {@link LOCATION_VISIO_INTERNAL_OPTION_VALUE}
   */
  static OptionValue() {
    return LOCATION_VISIO_INTERNAL_OPTION_VALUE;
  }

  /**
   * Vérifie si la localisation est de ce type
   * @static
   * @param {string} location — Localisation de l'évènement
   * @returns {boolean}
   * @override
   */
  static Has(location) {
    return !!(WebconfLink.create({ location }).key || false);
  }

  static VisioEnabled() {
    return (
      !!rcmail.env.plugin_list_visio || !!parent.rcmail.env.plugin_list_visio
    );
  }
}

/**
 * @class
 * @classdesc Représente une partie de la localisation d'un évènement qui est une visioconférence externe.
 * @augments AVisio
 * @package
 */
class ExternalVisio extends AVisio {
  /**
   *
   * @param {string} location Emplacement de l'évènement
   * @param {number} index Id de la partie
   */
  constructor(location, index) {
    super(location, index);
  }

  /**
   * @inheritdoc
   */
  _init(location) {
    super._init(location);

    Object.defineProperty(this, 'location', {
      get() {
        return location;
      },
      set: (value) => {
        location = value;
      },
    });
  }

  /**
   * @inheritdoc
   */
  generate($parent) {
    super.generate($parent);

    MelHtml.start
      .div({
        class: 'visio-mode d-flex',
        'data-locationmode': this.option_value(),
      })
      .css('position', 'relative')
      .icon('link', { class: 'align-self-center mr-2' })
      .end()
      .input_text({
        id: `external-${this.id}`,
        value: this.location,
        onchange: this._on_update.bind(this),
      })
      .icon('edit', { class: 'event-mel-icon-absolute' })
      .end()
      .end()
      .generate()
      .appendTo($parent);

    return this;
  }

  /**
   * Est appelé lorsque le champs de la visioconférence externe est modifié.
   *
   * Change la localisation par la nouvelle donnée.
   * @param {Event} event
   * @package
   */
  _on_update(event) {
    event = $(event.currentTarget);
    const val = event.val();

    this.location = val;

    this.onchange.call();
  }

  /**
   * Si la localisation est valide et correspond à ce que l'on attend
   * @override
   * @returns {boolean}
   */
  is_valid() {
    return EMPTY_STRING !== this.location;
  }

  /**
   * Action à faire si la localisation n'est pas valide
   * @override
   */
  invalid_action() {
    rcmail.display_message(
      rcmail.gettext('error_empty_event_visio_room', 'mel_metapage'),
      'error',
    );

    $(`#external-${this.id}`).focus();
  }

  /**
   * Valeur de l'option qui désigne cette classe.
   * @static
   * @returns {string}
   * @override
   * @default 'visio-external'
   * @see {@link LOCATION_VISIO_EXTERNAL_OPTION_VALUE}
   */
  static OptionValue() {
    return LOCATION_VISIO_EXTERNAL_OPTION_VALUE;
  }

  /**
   * Vérifie si la localisation est de ce type
   * @static
   * @param {string} location — Localisation de l'évènement
   * @returns {boolean}
   * @override
   */
  static Has(location) {
    return (
      !IntegratedVisio.Has(location) &&
      (location.includes('@visio') || location.match(new RegExp(REG_URL)))
    );
  }
}

/**
 * @class
 * @classdesc Représente une partie de la localisation d'un évènement qui est une audioconférence
 * @augments ALocationPart
 * @package
 */
class Phone extends ALocationPart {
  /**
   *
   * @param {string} location Emplacement de l'évènement
   * @param {index} index Id de la partie
   */
  constructor(location, index) {
    super(location, index);

    if (location.includes(Phone.Url())) {
      let data = location.split(SEPARATOR_AUDIO_URL_LOCATION)[1];
      const [phone, pin] = data.split(SEPARATOR_AUDIO_PIN);
      this._phone = phone;
      this._pin = pin || EMPTY_STRING;
    }
  }

  /**
   * @inheritdoc
   */
  _init(location) {
    super._init(location);

    /**
     * Numéro de téléphone
     * @type {string}
     * @package
     */
    this._phone = EMPTY_STRING;
    /**
     * Code pin
     * @type {string}
     * @package
     */
    this._pin = EMPTY_STRING;

    Object.defineProperty(this, 'location', {
      get: () =>
        `${Phone.Url()}${SEPARATOR_AUDIO_URL_LOCATION}${this._phone}${SEPARATOR_AUDIO_PIN}${this._pin}`,
    });
  }

  /**
   * Si la localisation est valide et correspond à ce que l'on attend
   * @override
   * @returns {boolean}
   */
  is_valid() {
    return EMPTY_STRING !== this._phone;
  }

  /**
   * Action à faire si la localisation n'est pas valide
   * @override
   */
  invalid_action() {
    rcmail.display_message(
      rcmail.gettext('error_empty_event_audio', 'mel_metapage'),
      'error',
    );

    $(`#phone-${this.id}`).focus();
  }

  /**
   * @inheritdoc
   */
  generate($parent) {
    super.generate($parent);

    MelHtml.start
      .div({ class: 'location-mode', 'data-locationmode': this.option_value() })
      .row()
      .a({
        class: 'mel-button no-button-margin col-md-6',
        href: Phone.Url(),
        target: '_blank',
      })
      .css({
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
      })
      .text('mel_metapage.found_audio_date')
      .icon('open_in_new')
      .css('font-size', '21px')
      .end()
      .end()
      .end()
      .row({ class: 'mt-2' })
      .div({ class: 'col-md-6 d-flex pl-0 pr-1' })
      .icon('call', { class: 'align-self-center mr-2' })
      .end()
      .input_text({
        id: `phone-${this.id}`,
        class: 'field-phone',
        value: this._phone,
        onchange: this._on_update.bind(this),
      })
      .end()
      .div({ class: 'col-md-6 d-flex pl-1 pr-0' })
      .icon('pin', { class: 'align-self-center mr-2' })
      .end()
      .input_text({
        id: `phone-pin-${this.id}`,
        class: 'field-pin',
        value: this._pin,
        onchange: this._on_update.bind(this),
      })
      .end()
      .end('row')
      .end()
      .generate()
      .appendTo($parent);

    return this;
  }

  /**
   * Est appelé lorsqu'un champ de l'audioconférence a été modifié.
   *
   * Change la localisation par la nouvelle donnée.
   * @param {Event} event
   * @package
   */
  _on_update(event) {
    event = $(event.currentTarget);
    const val = event.val();

    if (event.hasClass('field-phone')) this._phone = val;
    else this._pin = val;

    this.onchange.call();
  }

  /**
   * Vérifie si la localisation est de ce type
   * @static
   * @param {string} location — Localisation de l'évènement
   * @returns {boolean}
   * @override
   */
  static Has(location) {
    return location.includes(this.Url());
  }

  /**
   * Valeur de l'option qui désigne cette classe.
   * @static
   * @returns {string}
   * @override
   * @default 'audio'
   * @see {@link LOCATION_AUDIO_OPTION_VALUE}
   */
  static OptionValue() {
    return LOCATION_AUDIO_OPTION_VALUE;
  }

  /**
   * Nombre maximum de cette classe qui peut être utilisé
   * @override
   * @return {number}
   * @default 1
   * @static
   */
  static Max() {
    return 1;
  }

  /**
   * Récupère l'url du site qui permet de réserver l'audio conférence.
   * @static
   * @returns {string}
   */
  static Url() {
    return rcmail.env.mel_metapage_audio_url;
  }
}

/**
 * @class
 * @classdesc Représente une partie de la localisation d'un évènement qui est un emplacement.
 * @augments ALocationPart
 * @package
 */
class Location extends ALocationPart {
  /**
   *
   * @param {string} location Localisation de l'évènement
   * @param {number} index Id de la partie
   */
  constructor(location, index) {
    super(location, index);
    this._$field = $(`#location-text-${index}`);
  }

  /**
   * @inheritdoc
   */
  _init(location) {
    super._init(location);
  }

  /**
   * @inheritdoc
   */
  generate($parent) {
    super.generate($parent);

    if (this._$field.length === 0) {
      this._$field = MelHtml.start
        .div({
          class: 'location-mode d-flex',
          'data-locationmode': this.option_value(),
        })
        .icon('location_on', { class: 'align-self-center mr-2' })
        .end()
        .input({
          type: 'text',
          id: `location-text-${this.id}`,
          value: this.location,
          onchange: this._on_update.bind(this),
        })
        .end()
        .generate()
        .appendTo($parent);
    }

    return this;
  }

  /**
   * Est appelé lorsque le champ de l'emplacement.
   *
   * Change la localisation par la nouvelle donnée.
   * @param {Event} event
   * @package
   */
  _on_update(event) {
    const val = $(event.currentTarget).val();

    this.location = val;

    this.onchange.call();
  }

  /**
   * Si la localisation est valide et correspond à ce que l'on attend
   *
   * Un emplacement est TOUJOURS valide.
   * @returns {boolean}
   * @override
   * @default true
   */
  is_valid() {
    return true;
  }

  /**
   * Action à faire si la localisation n'est pas valide
   * @override
   */
  invalid_action() {}

  /**
   * Vérifie si la localisation est de se type
   * @param {string} location
   * @returns {boolean}
   * @static
   */
  static Has(location) {
    return !Phone.Has(location) && !VisioManager.Has(location);
  }

  /**
   * Valeur de l'option qui désigne cette classe.
   * @static
   * @returns {string}
   * @override
   * @default 'location'
   * @see {@link LOCATION_OPTION_VALUE}
   */
  static OptionValue() {
    return LOCATION_OPTION_VALUE;
  }

  /**
   * Nombre maximum de cette classe qui peut être utilisé
   * @override
   * @return {number}
   * @default Number.POSITIVE_INFINITY
   * @static
   */
  static Max() {
    return Number.POSITIVE_INFINITY;
  }
}

/**
 * @class
 * @classdesc Gère l'emplacement de la réunion avec les différents types d'emplacement. Les emplacements sont cumulables, il peut en avoir des différents. Les différents select et différentes valeurs du select seront générer via les différentes classes qui héritent de {@link ALocationPart} et qui se trouve dans le tableau {@link LocationPartManager.PARTS}.
 */
export class LocationPartManager extends IDestroyable {
  /**
   *
   * @param {external:jQuery} $locations Div qui contient les emplacements
   * @param {external:jQuery} $field Champ qui contient l'emplacement et qui sera sauvegardé
   * @param {CategoryPart} categoryPart Partie de la catégorie
   */
  constructor($locations, $field, categoryPart) {
    super();
    /**
     * Contient les données des différents emplacements
     * @type {Object<number, ALocationPart>}
     * @member
     */
    this.locations = {};
    /**
     * Contient les données des différents emplacements qui ont été généré et mis en cache si jamais on change de localisation.
     * @type {Object<number, Object<number, ALocationPart>>}
     * @member
     * @package
     */
    this._cached = {};

    /**
     * Champ qui contient l'emplacement et qui sera sauvegardé
     * @type {external:jQuery}
     * @package
     * @member
     */
    this._$field = $field;
    /**
     * Div qui contient les emplacements
     * @type {external:jQuery}
     * @package
     * @member
     */
    this._$locations = $locations;
    /**
     * Partie de la catégorie
     * @type {CategoryPart}
     * @package
     * @member
     */
    this._category = categoryPart;
  }

  /**
   * Initialise la partie.
   *
   * Si un ou plusieurs emplacements existent déjà, les parties d'emplacements (hérite de {@link ALocationPart}) seront générer.
   *
   * Sinon, un emplacement de type {@link Location} sera généré.
   * @param {*} event Evènement du plugin `Calendar`
   */
  init(event) {
    let no_location = true;
    this._$locations.html(EMPTY_STRING);

    if (event.location?.trim?.() || false) {
      let location = event.location.split(LOCATION_SEPARATOR);

      for (const location_type of location) {
        for (const part of LocationPartManager.PARTS) {
          if (part.Has(location_type)) {
            if (no_location) no_location = false;

            this.add(part, location_type);
            break;
          }
        }
      }
    }

    let tmp;
    for (const ExtraPart of LocationPartManager.FAKE_LOCATION_PART) {
      if (ExtraPart.Has(event)) {
        if (no_location) no_location = false;

        tmp = ExtraPart.Instantiate(event);

        for (const tuple of tmp) {
          this.add(tuple.item1, tuple.item2);
        }
      }
    }

    if (tmp) tmp = null;

    if (no_location) {
      this.add(Location, EMPTY_STRING);
    } else this._update_all_selects();
  }

  /**
   * Génère un index pour les emplacements.
   * @package
   * @returns {number}
   */
  _generateIndex() {
    let index;
    let length = MelEnumerable.from(this.locations).count();
    do {
      index = !index ? length + 1 : index + 1;
    } while (this.locations[index]);

    return index;
  }

  /**
   * Ajoute un emplacement.
   *
   * L'emplacement sera générer le html et les données seront sauvegardé dans {@link LocationPartManager.locations}.
   * @param {typeof ALocationPart} Part Classe qui hérite de {@link ALocationPart} et qui se trouve dans le tableau {@link LocationPartManager.ALL_PARTS}
   * @param {string} location Emplacement de l'évènement lié à la classe correspondante
   */
  add(Part, location) {
    const id = this._generateIndex();
    //Generate_select
    let $generated = this._generate_select(id, Part.OptionValue());
    //generate_part
    this.locations[id] = new Part(location, id, this._category).generate(
      $generated.find('.location-container'),
    );
    this.locations[id].onchange.push(this._on_change_action.bind(this));
    //Link select link
    $generated
      .find('select')
      .on('change', this._on_select_changed.bind(this))
      .val(Part.OptionValue());

    $generated = null;
  }

  /**
   * Supprime un emplacement.
   *
   * Supprime le html et les données sauvegardé liés ainsi que les données liés en cache si elles existent.
   * @param {number} id Id de l'emplacement à supprimer
   */
  remove(id) {
    $(`#location-${id}`).parent().parent().remove();
    this.locations[id].destroy();
    delete this.locations[id];

    for (const iterator of Object.keys(this._cached)) {
      this._cached[iterator]?.destroy?.();
    }
    delete this._cached[id];

    this._update_selects(id);

    this._on_change_action();
  }

  /**
   * Est appelé lorsque le select d'un emplacement est modifié.
   *
   * Cache les emplacements qui ne sont pas séléctionné et affiche celui qui est séléctionné.
   *
   * Désactive les options des sélects qui ont atteint leur nombre maximum d'utilisation. Ou réactive les options si possible.
   * @param {Event} event
   * @package
   */
  _on_select_changed(event) {
    const VISIBLE = '';

    let $select = $(event.target);
    const id = $select.data('id');
    const val = $select.val() || '';

    //On cache toutes les locations
    $(`#location-${id}-container .location-mode`)
      .css('display', 'none')
      .each((i, e) => {
        e = $(e);

        if (e.hasClass('d-flex'))
          e.removeClass('d-flex').addClass('has-d-flex');
      });

    //On affiche si celle qui est séléctionné si elle existe sinon on la génère
    if (
      $(`#location-${id}-container [data-locationmode="${val}"]`).length > 0
    ) {
      let $querry = $(
        `#location-${id}-container [data-locationmode="${val}"]`,
      ).css('display', VISIBLE);

      if ($querry.hasClass('has-d-flex'))
        $querry.removeClass('has-d-flex').addClass('d-flex');

      $querry = null;
    }

    //On gère le cache. Tout les modes qui éxistent sont garder en mémoire.
    const last = this.locations[id];
    if (!this._cached[id]) this._cached[id] = {};
    this._cached[id][this.locations[id].option_value()] = this.locations[id];

    if (this._cached[id]?.[val]) {
      this.locations[id] = this._cached[id][val];
      this._cached[id][val] = null;
    } else {
      this.locations[id] = new (LocationPartManager.ALL_PARTS.find(
        (x) => x.OptionValue() === val,
      ))('', id, this._category).generate($(`#location-${id}-container`));
      this.locations[id].onchange.push(this._on_change_action.bind(this));
    }

    if (this.locations[id].changed_to_this)
      this.locations[id].changed_to_this();

    const new_loc = this.locations[id];

    rcmail.triggerEvent('location.changed', {
      oe: event,
      manager: this,
      id,
      new: new_loc,
      last,
    });

    this._update_selects(id);
    this._on_change_action();
  }

  /**
   * On désactives les options des selects qui ont atteind leurs nombre maximale d'utilisation et on réactive celles qui ne l'ont pas atteinte.
   *
   * Les selects n'ayant qu'une seule option seront désactivés.
   * @package
   * @param {number} id Index du select qui est modifié. Celui-ci ne pourra pas être désactivé.
   */
  _update_selects(id) {
    let $select;
    let $tmp;
    for (const iterator of $('.event-location-select')) {
      $select = $(iterator);

      for (const part of LocationPartManager.ALL_PARTS) {
        $tmp = $select.find(`option[value="${part.OptionValue()}"]`);
        if (
          MelEnumerable.from(this.locations)
            .where((x) => x.value.option_value() === part.OptionValue())
            .count() >= part.Max()
        ) {
          $tmp.addClass('disabled').attr('disabled', 'disabled');
        } else $tmp.removeClass('disabled').removeAttr('disabled');
      }

      $select.removeClass('disabled').removeAttr('disabled');

      if ($select.data('id') !== id) {
        const nb_infinity = MelEnumerable.from(LocationPartManager.ALL_PARTS)
          .where((x) => Number.POSITIVE_INFINITY === x.Max())
          .count();
        const val = $select[0].value;

        //Désactive le select si il ne lui reste qu'une seule option disponible.
        if (
          nb_infinity === 1 &&
          nb_infinity ===
            $select.children().length - $select.find('.disabled').length &&
          MelEnumerable.from(LocationPartManager.ALL_PARTS)
            .where((x) => x.OptionValue() === val)
            .first()
            .Max() === Number.POSITIVE_INFINITY
        ) {
          $select.addClass('disabled').attr('disabled', 'disabled');
        } else $select.removeClass('disabled').removeAttr('disabled');
      }
    }

    $select = null;
    $tmp = null;

    $select = $('.event-location-select');
    let $icon = $select.parent().find('button.no-background bnum-icon');
    if ($select.length === 1 && $icon.text() === 'delete') {
      $icon.text('forms_add_on').parent().attr('title', 'Ajouter');
    }
  }

  /**
   * Met à jour les selects.
   * @package
   */
  _update_all_selects() {
    for (const iterator of Object.keys(this.locations)) {
      this._update_selects(iterator);
    }
  }

  /**
   * Génère le select en htm
   * @param {number} id Id du select
   * @param {string} selected Valeur par défaut
   * @returns {external:jQuery}
   */
  _generate_select(id, selected) {
    const has_locations = MelEnumerable.from(this.locations).count() >= 1;
    let is_selected;
    let is_disabled;
    let html = MelHtml.start
      .div({ class: has_locations ? 'mt-2' : 'mel-placeholder-div' })
      .div({ class: 'd-flex' })
      .select({
        id: `location-${id}`,
        class: 'event-location-select',
        'data-id': id,
      })
      .foreach(
        (parent_html, item) => {
          is_selected = false;
          is_disabled = true;
          if (
            MelEnumerable.from(this.locations)
              .where((x) => x.value.option_value() === item.OptionValue())
              .count() < item.Max()
          ) {
            is_selected = item.OptionValue() === selected;
            is_disabled = false;
          }

          parent_html = parent_html
            .option({ value: item.OptionValue() })
            .attr(
              is_selected ? 'selected' : 'not_selected',
              is_selected ? 'selected' : 'not_selected',
            )
            .text(
              rcmail.gettext(
                `event-location-${item.OptionValue()}`,
                item.PluginName?.() ?? 'mel_metapage',
              ),
            );

          if (is_disabled)
            parent_html = parent_html
              .attr('disabled', 'disabled')
              .addClass('disabled');

          return parent_html.end();
        },
        ...LocationPartManager.ALL_PARTS,
      )
      .end()
      .button({
        type: 'button',
        class: 'no-background ml-2',
        title: has_locations
          ? rcmail.gettext('mel_metapage.delete')
          : rcmail.gettext('mel_metapage.add'),
      })
      .removeClass('mel-button')
      .removeClass('no-margin-button')
      .removeClass('no-button-margin')
      .attr('onclick', (e) => {
        if ($(e.currentTarget).children().first().html() === 'delete')
          this.remove($(e.currentTarget).parent().find('select').data('id'));
        else this.add(Location, '');
      })
      .icon(has_locations ? 'delete' : 'forms_add_on')
      .css('vertical-align', 'middle')
      .end()
      .end()
      .end()
      .div({ id: `location-${id}-container`, class: 'location-container mt-2' })
      .end()
      .end();

    return html.generate().appendTo(this._$locations);
  }

  /**
   * Si les emplacements sont correspondent à leurs valeurs attendus ou non.
   * @returns {boolean}
   */
  is_valid() {
    return !MelEnumerable.from(this.locations).any((x) => !x.value.is_valid());
  }

  /**
   * Action à faire si un des emplacements n'est pas valide.
   */
  invalid_action() {
    for (const key in this.locations) {
      if (Object.hasOwnProperty.call(this.locations, key)) {
        const element = this.locations[key];
        if (!element.is_valid()) {
          element.invalid_action();
          break;
        }
      }
    }
  }

  /**
   * Change ma vaeur du premier select trouver
   * @param {string} val
   * @returns {external:jQuery}
   */
  update_first_location(val) {
    return this._$locations.find('select').first().val(val).change();
  }

  /**
   * Est appelé lorsqu'un champ ou un select est modifié.
   *
   * Ecrit et formatte les données des champ visuels dans le champ de sauvegarde.
   *
   * Attend que toutes les promesses liés aux différents champs soient résolus.
   * @package
   * @async
   * @returns {Promise<void>}
   */
  async _on_change_action() {
    await this.waitComplete();
    let str = EMPTY_STRING;

    for (const id of Object.keys(this.locations)) {
      if (
        (this.locations[id].location + LOCATION_SEPARATOR).trim() !==
        EMPTY_STRING
      )
        str += this.locations[id].location + LOCATION_SEPARATOR;
    }

    if (str.trim() === EMPTY_STRING) str = EMPTY_STRING;
    else str = str.slice(0, str.length - 1);

    this._$field.val(str).change();
  }

  /**
   * Attend que toutes les promesses liés aux différents champs soient résolus.
   * @async
   * @returns {Promise<void>}
   */
  async waitComplete() {
    await Promise.allSettled(
      MelEnumerable.from(this.locations)
        .where((x) => !!x.value.wait)
        .select((x) => x.value.wait()),
    );
  }

  destroy() {
    for (const id of Object.keys(this.locations)) {
      this.locations[id].destroy();
      delete this.locations[id];

      for (const iterator of Object.keys(this._cached)) {
        this._cached[iterator]?.destroy?.();
      }
      delete this._cached[id];
    }
  }

  /**
   * Ajoute un type de localisation
   * @param {typeof ALocationPart} location_type Type de localisation
   */
  static AddLocationType(location_type) {
    this.PARTS.push(location_type);
  }

  /**
   * Ajoute un type de localisation qui ne se pbase pas sur la localisation
   * @param {typeof AExternalLocationPart} extra
   */
  static AddExtraLocationType(extra) {
    this.FAKE_LOCATION_PART.push(extra);
  }
}

/**
 * Liste des différentes classes qui gère les différentes parties des emplacements
 * @type {Array<typeof ALocationPart>}
 * @static
 */
LocationPartManager.PARTS = [Location, Phone, VisioManager];
/**
 * Liste des différentes classes qui gère les différentes parties des emplacements, sans se baser sur la localisation
 * @type {Array<typeof AExternalLocationPart>}
 * @static
 */
LocationPartManager.FAKE_LOCATION_PART = [];

LocationPartManager.ALL_PARTS = [];
Object.defineProperty(LocationPartManager, 'ALL_PARTS', {
  get() {
    return [
      ...LocationPartManager.PARTS,
      ...LocationPartManager.FAKE_LOCATION_PART,
    ];
  },
});
