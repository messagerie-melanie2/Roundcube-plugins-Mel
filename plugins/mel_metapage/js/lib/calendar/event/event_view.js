/**
 * @namespace EventView
 * @property {module:EventView} View
 * @property {module:EventView/Constants} Constants
 * @property {module:EventView/Parts} AbstractClassesParts
 * @property {module:EventView/Parts/CalendarOwner} CalendarOwner
 * @property {module:EventView/Parts/Alarm} Alarms
 * @property {module:EventView/Parts/Categories} Categories
 * @property {module:EventView/Parts/Guests} Guests
 * @property {module:EventView/Parts/Guests/FreeBusy} FreeBusy
 * @property {module:EventView/Parts/Location} Location
 * @property {module:EventView/Parts/Reccursivity} Reccursivity
 * @property {module:EventView/Parts/Sensitivity} Sensitivity
 * @property {module:EventView/Parts/State} State
 * @property {module:EventView/Parts/DateTime} DateTime
 * @property {module:EventView/Parts/Constants} PartsConstants
 */

/**
 * @module EventView
 * @local EventViewDialog
 */

import { MelEnumerable } from '../../classes/enum.js';
import { EMPTY_STRING } from '../../constants/constants.js';
import { MelHtml } from '../../html/JsHtml/MelHtml.js';
import {
  ATTENDEE_CONTAINER_SELECTOR,
  ATTENDEE_SELECTOR,
  CUSTOM_DIALOG_CLASS,
  FIRST_ARGUMENT,
  GUEST_DRAGG_CLASS,
  INTERNAL_LOCAL_CHANGE_WARNING_SELECTOR,
  LISTENER_SAVE_EVENT,
  LOADER_SELECTOR,
  LOCAL_CHANGE_WARNING_SELECTOR,
  MAIN_DIV_SELECTOR,
  MAIN_FORM_SELECTOR,
  RECURRING_WARNING_SELECTOR,
  WARNING_PANEL_CLICKED_CLASS,
  WARNING_PANEL_SELECTOR,
} from './event_view.constants.js';
import { AlarmPart } from './parts/alarmpart.js';
import { CalendarOwner } from './parts/calendarparts.js';
import { CategoryPart } from './parts/categoryparts.js';
import { GuestsPart } from './parts/guestspart.js';
import { LocationPartManager } from './parts/location_part.js';
import { RecPart } from './parts/recpart.js';
import { SensitivityPart } from './parts/sensitivitypart.js';
import { StatePart } from './parts/statepart.js';
import { TimePartManager } from './parts/timepart.js';

/**
 * Gère le panel d'avertissement
 * @class
 * @classdesc Gère la visibilité du panel d'avertissement
 * @package
 */
class WarningPanel {
  /**
   * Sélecteur du panel d'avertissement
   * @constructor
   * @param {string} selector La valeur par défaut est {@link WARNING_PANEL_SELECTOR}
   * @see {@link WARNING_PANEL_SELECTOR}
   */
  constructor(selector = WARNING_PANEL_SELECTOR) {
    this._init()._setup(selector);
  }

  /**
   * Initialise les variables membres de la classe
   * @private
   * @returns {WarningPanel} Chaîne
   */
  _init() {
    /**
     * Warning panel (Element jquery)
     * @readonly
     * @member
     * @type {$}
     */
    this.panel = null;

    return this;
  }

  /**
   * Assigne les variables membres de classe
   * @private
   * @param {string} selector Sélecteur du panel
   * @returns {WarningPanel} Chaîne
   */
  _setup(selector) {
    Object.defineProperty(this, 'panel', {
      get() {
        return $(selector);
      },
    });

    return this;
  }

  /**
   * Affiche le panel
   * @returns {WarningPanel} Chaîne
   */
  show() {
    this.panel.css('display', EMPTY_STRING);
    return this;
  }

  /**
   * Cache le panel
   * @returns {WarningPanel} Chaîne
   */
  hide() {
    this.panel.css('display', 'none');
    return this;
  }

  /**
   * Si le panel est affiché ou non
   * @returns {Boolean}
   */
  is_display() {
    return MelEnumerable.from(WarningPanel.CHILDS_ITEMS_SELECTORS)
      .select((x) => $(x))
      .where((x) => x.css('display') !== 'none')
      .any();
  }

  /**
   * Récupère le panel par défaut
   * @static
   * @returns {WarningPanel}
   */
  static Get() {
    return new WarningPanel();
  }

  /**
   * Réinitialise le panel par défaut
   *
   * Cache le panel et enlève la classe {@link WARNING_PANEL_CLICKED_CLASS}
   * @static
   * @returns {WarningPanel} Pannel par défaut
   * @see {@link WARNING_PANEL_CLICKED_CLASS}
   */
  static Reinit() {
    let panel = this.Get();
    panel.panel.css('display', 'none').removeClass(WARNING_PANEL_CLICKED_CLASS);
    return panel;
  }
}

/**
 * Liste des sélecteurs des enfants du panel d'avertissement
 * @static
 * @readonly
 * @type {string[]}
 */
WarningPanel.CHILDS_ITEMS_SELECTORS = [
  RECURRING_WARNING_SELECTOR,
  LOCAL_CHANGE_WARNING_SELECTOR,
  INTERNAL_LOCAL_CHANGE_WARNING_SELECTOR,
];

/**
 * Structure qui donne un nom à un sélecteur d'un champ
 * @class
 * @classdesc Structure qui donne un nom à un sélecteur d'un champ pour l'EventManager. L'idée est de générer les variables membres de l'EventManager à partir de cette classe.
 * @see {@link EventManager}
 * @package
 */
class EventField {
  /**
   *
   * @param {string} name Nom qui sera appeler pour récupérer le sélécteur dans l'EventManager
   * @param {string} selector Selecteur
   * @see {@link EventManager}
   */
  constructor(name, selector) {
    /**
     * Nom qui sera appeler pour récupérer le sélécteur dans l'EventManager
     * @member
     * @type {string}
     */
    this.name = null;
    /**
     * @member
     * @type {string}
     */
    this.selector = null;
    Object.defineProperties(this, {
      name: {
        get() {
          return name;
        },
      },
      selector: {
        get() {
          return selector;
        },
      },
    });
  }
}

/**
 * Contient tout les sélécteurs de la vue
 * @class
 * @classdesc Utilise une liste d'EventField pour générer ses variables membres. l'EventManager contient tout les sélécteurs des champs de la vue.
 * @see {@link EventField}
 * @package
 */
class EventManager {
  /**
   *
   * @param  {...EventField} events EventField qui vont générer les variables membres de cette instance
   */
  constructor(...events) {
    this._events = events ?? [];
  }

  /**
   * Ajoute un EventField
   * @param {EventField} event Ajoute un EventField qui va générer une variable membre
   */
  add(event) {
    this._events.push(event);
  }

  /**
   * Génère les variables membres à partir des EventField
   * @returns {EventManager} Chaîne
   */
  generate() {
    let config = {};

    for (const iterator of this._events) {
      config[iterator.name] = {
        get() {
          return $(iterator.selector);
        },
      };
    }

    Object.defineProperties(this, config);
    config = null;
    this._events = null;

    return this;
  }
}

/**
 * Structure qui contient les parties de la vue
 * @class
 * @classdesc Structure qui contient les parties de la vue. La class doit être initialisé via la fonction {@link EventParts~init}
 * @package
 */
class EventParts {
  /**
   *
   * @param {EventManager} inputs Champs de la vue qui seront utiliser par le plugin calendar pour envoyer les données au serveur.
   * @param {EventManager} fakes Champs visuels qui modifieront les "vrai" champs de la vue.
   * @param {$ | GlobalModal} dialog Modal qui contient la vue.
   */
  constructor(inputs, fakes, dialog) {
    this.status = new StatePart(
      inputs.select_status,
      inputs.select_status.parent().find('span.material-symbols-outlined'),
    );
    this.sensitivity = new SensitivityPart(
      inputs.select_sensivity,
      fakes.button_sensivity,
      fakes.button_sensivity.children().first(),
      dialog,
    );
    this.alarm = new AlarmPart(
      inputs.select_alarm,
      inputs.text_alarm,
      inputs.select_alarm_offset,
      fakes.select_alarm,
    );
    this.category = new CategoryPart(
      inputs.select_category,
      fakes.select_category,
      fakes.check_category,
      fakes.span_category_icon,
      fakes.button_add_members,
    );
    this.date = new TimePartManager(
      inputs.date_startdate,
      inputs.text_starttime,
      fakes.select_starttime,
      inputs.date_enddate,
      inputs.text_endtime,
      fakes.select_endtime,
      inputs.check_all_day,
    );
    this.guests = new GuestsPart(
      inputs.form_attendee,
      fakes.text_attendee,
      fakes.text_attedee_optional,
      fakes.text_attendee_animators,
      fakes.button_attendee_switch,
      this.date,
    );
    this.location = new LocationPartManager(
      fakes.div_eventtype,
      inputs.text_location,
      this.category,
    );
    this.recurrence = new RecPart(
      inputs.select_recurrence,
      fakes.select_recurrence,
    );
    this.owner = null;
  }

  /**
   * Initialise les parties de la vue
   * @param {*} ev Evènement du plugin `calendar`
   * @param {EventManager} inputs Champs visuels qui modifieront les "vrai" champs de la vue.
   */
  init(ev, inputs, fakes) {
    this.owner = new CalendarOwner(
      inputs.select_calendar_owner,
      inputs.select_calendar_owner.parent().find('span'),
      ev?.calendar_blocked ?? false,
    );
    this.status.onUpdate(ev.status ?? '');
    this.sensitivity.onUpdate(
      !ev?.id
        ? SensitivityPart.STATES.public
        : ev?.sensitivity ?? SensitivityPart.STATES.public,
    );
    this.alarm.init(ev);
    this.category.init(ev);
    this.date.init(ev);
    this.location.init(ev);
    this.guests.init(ev);
    this.recurrence.init(ev);

    this._init_no_modified(ev, inputs, fakes);
  }

  /**
   * Initialise les parties de la vue qui ne sont pas altéré par rapport à la vue par défaut du plugin calendar
   * @private
   * @param {*} ev Evènement du plugin `calendar`
   * @param {EventManager} inputs Champs visuels qui modifieront les "vrai" champs de la vue.
   */
  _init_no_modified(ev, inputs, fakes) {
    //Le bouton appèle la fonction _onButtonTitleClicked au click avec le contexte de l'élément jquery qui représente le champ du titre.
    fakes.button_erase_title.click(
      this._onButtonTitleClicked.bind(inputs.text_title),
    );
  }

  /**
   * Est appelé lorsque l'on clique sur le bouton pour effacer le titre
   *
   * Est bind dans la fonction {@link EventParts~_init_no_modified} par l'élément jquery qui représente le champ du titre.
   * @package
   * @this {external:jQuery}
   */
  _onButtonTitleClicked() {
    this.val(EMPTY_STRING);
  }

  destroy() {
    this.location.destroy();
  }
}

/**
 * @typedef {GlobalModal | external:jQuery} EventViewDialog
 */

/**
 * Gère les parties de la vue ainsi que le comportement de la dialog
 * @class
 * @classdesc Initialise la vue et gère le comportement de la dialog
 */
export class EventView {
  /**
   *
   * @param {*} event Evènement du plugin `calendar`
   * @param {EventViewDialog} dialog Modal qui contient la vue.
   */
  constructor(event, dialog) {
    EventView.INSTANCE = this;
    this._init()._setup(event, dialog)._main(event);
  }

  /**
   * Initialise les variables membres de la classe
   * @private
   * @returns {EventView} Chaîne
   */
  _init() {
    /**
     * Evènement du plugin `calendar`
     * @private
     * @member
     * @type {*}
     */
    this._event = null;
    /**
     * Dialog jquery ou GlobalModal
     * @private
     * @member
     * @type {EventViewDialog}
     */
    this._dialog = null;
    /**
     * Liste des inputs de la vue.
     *
     * Les inputs sont des éléments de la fenêtre de dialog qui sont utilisés pour récupérer des données.
     * @member
     * @type {EventManager}
     */
    this.inputs = null;
    /**
     * Liste des faux inputs de la vue.
     *
     * Ces inputs la sont seulement visuels et modifieront les "vrais" inputs.
     * @member
     * @type {EventManager}
     */
    this.fakes = null;
    /**
     * Liste des parties de la vue.
     * @member
     * @type {EventParts}
     */
    this.parts = null;

    return this;
  }

  /**
   * Assigne les variables membres de la classe
   * @private
   * @param {*} event Evènement du plugin `calendar`
   * @param {EventViewDialog} dialog Modal qui contient la vue.
   * @returns {EventView} Chaîne
   */
  _setup(event, dialog) {
    this._event = event;
    this._dialog = dialog;

    this.inputs = new EventManager(...EventView.true_selectors).generate();
    this.fakes = new EventManager(...EventView.false_selectors).generate();
    this.parts = new EventParts(this.inputs, this.fakes, dialog);

    return this;
  }

  /**
   * C'est ici que l'on va éffectuer toute les actions nécessaires à la création et l'initialisation de la fenêtre de dialog.
   * @private
   * @param {*} event Evènement du plugin `calendar`
   */
  _main(event) {
    let warning_panel = WarningPanel.Get();
    this.parts.init(event, this.inputs, this.fakes);

    this._generate_dialog_events();

    $(MAIN_FORM_SELECTOR).css('opacity', '1');
    $(LOADER_SELECTOR).css('display', 'none');

    if (this.is_jquery_dialog()) {
      if (warning_panel.is_display()) warning_panel.show();
      else warning_panel.hide();

      this._dialog.addClass(CUSTOM_DIALOG_CLASS);

      if (!this._dialog[0].ondrop)
        this._dialog[0].ondrop = this.on_drop.bind(this);

      this._update_dialog_buttons();
    } else {
      this._dialog.modal
        .find('iframe')[0]
        .contentWindow.$(MAIN_DIV_SELECTOR)
        .on('drop', this.on_drop.bind(this));
      warning_panel.hide();
    }

    this._generate_listeners();
  }

  /**
   * Génère les évènements de la dialog
   * @private
   */
  _generate_dialog_events() {
    if (
      this.is_jquery_dialog() &&
      !$._data(this._dialog[0], 'events')?.dialogbeforeclose
    ) {
      this._dialog.on(
        'dialogbeforeclose',
        this.on_dialog_before_close.bind(this),
      );
    }
  }

  /**
   * Met à jour les boutons de la dialog
   * @private
   */
  _update_dialog_buttons() {
    let $save_button = this._dialog
      .parent()
      .find('.ui-dialog-buttonpane .save')
      .hide();
    let $cancel_button = this._dialog
      .parent()
      .find('.ui-dialog-buttonpane .cancel')
      .hide();

    this._update_dialog_button(
      $save_button,
      'Sauvegarder',
      'arrow_right_alt',
    )._update_dialog_button($cancel_button, 'Annuler', 'cancel');

    if (!$save_button.hasClass('moved')) {
      $cancel_button.after($save_button);
    }

    $save_button.show();
    $cancel_button.show();
  }

  /**
   * Met à jour un bouton pour qu'il corresponde au visuel voulu
   * @param {external:jQuery} $button Boutton que l'on souhaite modifier
   * @param {string} text Texte du boutton
   * @param {string} icon Icon du bouton
   * @see {@link https://fonts.google.com/icons | Icons}
   * @returns {EventView} Chaînage
   * @private
   */
  _update_dialog_button($button, text, icon) {
    if (!$button.hasClass('mel-button')) {
      const jshtml = MelHtml.start
        .span()
        .text(text)
        .end()
        .icon(icon)
        .addClass('plus')
        .end();
      $button
        .removeClass('save')
        .removeClass('cancel')
        .addClass('mel-button')
        .html(jshtml.generate())
        .css({
          display: 'flex',
          'align-items': 'center',
        });

      if ($button.hasClass('btn-secondary'))
        $button.removeClass('btn-secondary').addClass('btn-danger');
    }

    return this;
  }

  /**
   * Génère les listeners de la vue
   * @private
   */
  _generate_listeners() {
    if ((rcmail._events?.[LISTENER_SAVE_EVENT]?.length ?? 0) > 0)
      delete rcmail._events[LISTENER_SAVE_EVENT];

    rcmail.addEventListener(LISTENER_SAVE_EVENT, this.before_save.bind(this));
  }

  /**
   * Si la dialog est une dialog jquery ou GlobalModal
   * @return {Boolean}
   */
  is_jquery_dialog() {
    return !this._dialog.on_click_minified;
  }

  /**
   * Récupère la dialog.
   * @returns {EventViewDialog}
   */
  get_dialog() {
    return this._dialog;
  }

  destroy() {
    this.parts.destroy();
  }

  /**
   * Est appelé lorsque la dialog est sur le point de se fermer
   *
   * Remet la modal dans son état d'origine et libère les variables.
   * @event
   */
  on_dialog_before_close() {
    $(MAIN_FORM_SELECTOR).css('opacity', '0');
    $(LOADER_SELECTOR).css('display', EMPTY_STRING);
    WarningPanel.Reinit();
    this.dialog_closed = true;
    this.parts.destroy();

    this.inputs = null;
    this.fakes = null;
    this.parts = null;
    EventView.INSTANCE = null;
  }

  /**
   * Est appelé lorsque l'on drop un élément dans la dialog
   * @event
   * @param {DragEvent} ev
   */
  on_drop(ev) {
    const autorized = [
      this.fakes.text_attendee,
      this.fakes.text_attedee_optional,
      this.fakes.text_attendee_animators,
    ];
    ev = ev.dataTransfer ? ev : ev.originalEvent;
    let data = JSON.parse(ev.dataTransfer.getData('text/plain'));

    ev.preventDefault();
    if (
      MelEnumerable.from(autorized)
        .select((x) => x.attr('id'))
        .where((x) => ev.target.id === x)
        .any()
    ) {
      $(ATTENDEE_SELECTOR.replaceAll(FIRST_ARGUMENT, data.email))
        .find('button')
        .click();
      $(ev.target).val(`${data.string},`).change();
    }

    $(
      `${ATTENDEE_CONTAINER_SELECTOR}, [data-linked="attendee-input"]`,
    ).removeClass(GUEST_DRAGG_CLASS);
  }

  /**
   * Est appelé avant que l'on sauvegarde l'évènement
   * @event
   * @async
   * @returns {Boolean} Si l'on peut sauvegarder ou non
   */
  async before_save() {
    let is_valid = true;

    await this.parts.location.waitComplete();

    if (!this.parts.location.is_valid()) {
      this.parts.location.invalid_action();
      is_valid = false;
    } else if (!this.parts.date.is_valid()) {
      this.parts.date.invalid_action();
      is_valid = false;
    }

    return is_valid;
  }

  /**
   * Génère une EventView. Permet d'améliorer la lisibilité du code.
   * @param {*} event Evènement du plugin `calendar`
   * @param {$ | GlobalModal} dialog Modal qui contient la vue.
   * @returns {EventView}
   */
  static Start(event, dialog) {
    return new EventView(event, dialog);
  }

  /**
   * Génère un EventField. Permet d'améliorer la lisibilité du code.
   * @param {string} name Nom qui sera appeler pour récupérer le sélécteur dans l'EventManager
   * @param {string} selector Selecteur
   * @returns {EventField}
   */
  static Create(name, selector) {
    return new EventField(name, selector);
  }
}

/**
 * Instance de la vue en cours
 * @type {EventView}
 * @static
 */
EventView.INSTANCE = null;

/**
 * Liste des sélecteurs de la vue.
 *
 * Se sont les sélecteurs des champs qui seront utiliser pour sauvegarder les données et qui seront envoyé au serveur.
 * @type {EventField[]}
 */
EventView.true_selectors = [
  EventView.Create('select_calendar_owner', '#edit-calendar'),
  EventView.Create('select_alarm', '#edit-alarm-item'),
  EventView.Create('text_alarm', 'input[name="alarmvalue[]"]'),
  EventView.Create('select_alarm_offset', 'select[name="alarmoffset[]"]'),
  EventView.Create('select_status', '#edit-event-status'),
  EventView.Create('text_title', '#edit-title'),
  EventView.Create('select_category', '#edit-categories'),
  EventView.Create('form_attendee', '#edit-attendees-form'),
  EventView.Create('date_startdate', '#edit-startdate'),
  EventView.Create('text_starttime', '#edit-starttime'),
  EventView.Create('date_enddate', '#edit-enddate'),
  EventView.Create('text_endtime', '#edit-endtime'),
  EventView.Create('form_recurrence', '.event-real-recs'),
  EventView.Create('text_location', '#edit-location'),
  EventView.Create('textarea_description', '#edit-description'),
  EventView.Create('select_sensivity', '#edit-sensitivity'),
  EventView.Create('check_all_day', '#edit-allday'),
  EventView.Create('select_recurrence', '#edit-recurrence-frequency'),
];

/**
 * Liste des sélecteurs de la vue.
 *
 * Se sont les sélecteurs des champs visuels qui seront utiliser pour modifier les "vrais" champs.
 * @type {EventField[]}
 */
EventView.false_selectors = [
  EventView.Create('select_alarm', '#mel-calendar-alarm'),
  EventView.Create('check_category', '#edit-wsp'),
  EventView.Create('span_category_icon', '#event-category-icon'),
  EventView.Create('select_category', '#mel-event-category'),
  EventView.Create('button_add_members', '#event-add-member'),
  EventView.Create('check_notify_user', '#notify-users'),
  EventView.Create('text_attendee', '#attendee-input'),
  EventView.Create('text_attedee_optional', '#attendee-input-optional'),
  EventView.Create('text_attendee_animators', '#attendee-animators'),
  EventView.Create('button_attendee_switch', '#mel-attendee-switch'),
  EventView.Create('select_starttime', '#mel-edit-starttime'),
  EventView.Create('select_endtime', '#mel-edit-endtime'),
  EventView.Create('select_recurrence', '#fake-event-rec'),
  EventView.Create('div_eventtype', '#events-type'),
  EventView.Create('button_sensivity', '#update-sensivity'),
  EventView.Create('button_erase_title', '#reset-title-button'),
];
