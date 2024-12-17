/**
 * @module VisioView
 * @local VisioData
 * @local VisioCreator
 */

import { FramesManager } from '../../../mel_metapage/js/lib/classes/frame_manager.js';
import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { Locks } from './classes/locks.js';
import { VisioView } from './classes/view.js';
import { SELECTOR_BUTTON_QUIT, SELECTOR_BUTTON_START } from './consts.js';
import { VisioFunctions } from './helpers.js';
export { VisioCreator };

/**
 * @typedef {Object} VisioData
 * @property {?string} room
 * @property {?string} wsp
 * @property {?string} channel
 * @property {?string} password
 * @property {!boolean} need_config
 */

/**
 * @typedef {Object} AjaxVisioData
 * @property {?string} _key
 * @property {?string} _wsp
 * @property {?string} _channel
 * @property {?string} _pass
 * @property {!boolean} _from_config
 */

/**
 * @class
 * @classdesc Classe permettant de gérer la création d'une visio
 * @extends MelObject
 */
class VisioCreator extends MelObject {
  constructor() {
    super();
  }

  /**
   * Code principale de la classe
   * @override
   */
  main() {
    super.main();
    this._init()._setup();

    //Mettre les données par défauts
    if (this.data?.need_config) {
      this.view.$room.val(
        this.data.room || VisioFunctions.generateWebconfRoomName(),
      );

      if (this.data.wsp) this.view.linked_to.check();

      if (this.data.wsp || this.data.channel)
        this.view.linked_to.$field.val(this.data.wsp ?? this.data.channel);

      if (this.data.password) {
        this.view.password.check();
        this.view.password.$field.val(this.data.password);
      }
    } else if (this.view.$room.val() === EMPTY_STRING)
      this.view.$room.val(VisioFunctions.generateWebconfRoomName());

    //Désactivé les champs qui ont besoins d'être désactivés
    if (this.locks.room) this._disable(this.view.$room);

    if (this.locks.channel) this.view.linked_to.disable();

    if (this.locks.password) this.view.password.disable();

    //$(SELECTOR_DIV_WSP).find('select').val('test-9');

    $(SELECTOR_BUTTON_START).click(this._on_button_click.bind(this)); //.click();
    $(SELECTOR_BUTTON_QUIT).click(() => {
      FramesManager.Instance.get_window()._history.back({
        defaultFrame: 'bureau',
      });
    });

    this.view.$room.on('input change', this._check_validity.bind(this));

    if (this.view.$room.val() === EMPTY_STRING) {
      $(SELECTOR_BUTTON_START)
        .addClass('disabled')
        .attr('disabled', 'disabled');
    } else this._check_validity();
  }

  _check_validity() {
    const val = this.view.$room.val();

    if (VisioFunctions.CheckKeyIsValid(val)) {
      $('.webconf-error-text').css('display', 'none');
      $(SELECTOR_BUTTON_START).removeClass('disabled').removeAttr('disabled');
    } else {
      $(SELECTOR_BUTTON_START)
        .addClass('disabled')
        .attr('disabled', 'disabled');

      if (val === EMPTY_STRING) $('.webconf-error-text').css('display', 'none');
      else $('.webconf-error-text').css('display', EMPTY_STRING);
    }
  }

  /**
   * @private
   */
  _init() {
    /**
     * @type {VisioData}
     * @readonly
     */
    this.data = null;
    /**
     * @type {VisioView}
     */
    this.view = null;
    /**
     * @type {Locks}
     */
    this.locks = null;

    return this;
  }

  /**
   * @private
   */
  _setup() {
    Object.defineProperty(this, 'data', {
      get() {
        return rcmail.env['visio.data'];
      },
    });

    this.view = new VisioView();
    this.locks = new Locks();
  }

  /**
   * Désactive un élément
   * @param {external:jQuery} $item
   * @returns {external:jQuery}
   * @package
   */
  _disable($item) {
    return $item.attr('disabled', 'disabled').addClass('disabled');
  }

  /**
   * Active un élément
   * @param {external:jQuery} $item
   * @returns {external:jQuery}
   * @package
   */
  _enable($item) {
    return $item.removeAttr('disabled', 'disabled').removeClass('disabled');
  }

  /**
   * Récupère la configuration de la visio
   * @returns {AjaxVisioData}
   */
  get_config() {
    let config = {
      _key: this.view.$room.val(),
      _from_config: true,
    };

    if (this.view.linked_to.value() !== 'home')
      config[this.view.linked_to.is_checked() ? '_wsp' : '_channel'] =
        this.view.linked_to.value();

    if (this.view.password.is_checked())
      config._pass = this.view.password.value();

    return config;
  }

  /**
   * Action à faire au clique sur le bouton de validation
   */
  _on_button_click() {
    //window.location.href = this.url('webconf', { params: this.get_config() });
    FramesManager.Instance.start_mode('visio', 'visio', this.get_config());
  }
}
