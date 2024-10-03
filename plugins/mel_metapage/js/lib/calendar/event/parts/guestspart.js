/**
 * @module EventView/Parts/Guests
 */

import { MelEnumerable } from '../../../classes/enum.js';
import { EMPTY_STRING } from '../../../constants/constants.js';
import { REG_BETWEEN_PARENTHESIS } from '../../../constants/regexp.js';
import { BnumException } from '../../../exceptions/bnum_base_exceptions.js';
import { MelHtml } from '../../../html/JsHtml/MelHtml.js';
import { BnumEvent } from '../../../mel_events.js';
import { Mel_Promise } from '../../../mel_promise.js';
import { FreeBusyGuests } from './guestspart.free_busy.js';
import {
  CLASS_MANUALLY_CHANGED,
  GUEST_SEPARATOR,
  REPLACE_CHAR,
  ROLE_ATTENDEE_OPTIONNAL,
  SELECTOR_CHECKBOX_NOTIFY,
} from './parts.constants.js';
import { FakePart, Parts } from './parts.js';
import { TimePartManager } from './timepart.js';

/**
 * @typedef User
 * @property {string} name
 * @property {string} email
 */

/**
 * @typedef Attendee
 * @property {Role} role
 * @property {string} name
 * @property {string} email
 */

/**
 * Contient les mêmes informations que Attendee mais avec l'information de la partie parente.
 * @typedef AttendeeEx
 * @property {Role} role
 * @property {string} name
 * @property {string} email
 * @property {GuestsPart} parent
 * @see {@link Attendee}
 */

/**
 * @class
 * @classdesc Exception envoyé lorsque le champ lié aux participants ne fonctionne pas correctement.
 * @extends BnumException
 * @package
 * @frommodule Exceptions
 */
class GuestPartFieldException extends BnumException {
  constructor(part, $field) {
    super(
      part,
      `Le champ ${$field.attr('id') || 'sans identifiant'} ne possède pas de parent !`,
    );

    /**
     * Champ qui pose problème
     * @type {external:jQuery}
     * @readonly
     * @member
     */
    this.$field = null;
    Object.defineProperty(this, '$field', {
      get() {
        return $field;
      },
    });
  }
}

/**
 * @class
 * @classdesc Bouton qui affiche ou non les différents champs liés aux participants.
 * @extends Parts
 * @frommodule EventView/Parts
 * @package
 */
class GuestButton extends Parts {
  constructor($button) {
    super($button, Parts.MODE.click);

    /**
     * Sera appelé lorsque l'on cliquera sur le bouton
     * @event
     * @member
     * @type {BnumEvent}
     */
    this.clicked = new BnumEvent();
    /**
     * Etat du bouton
     * @private
     * @member
     * @type {boolean}
     */
    this._state = false;
  }

  /**
   * Met à jour la visibilité des champs et change l'état interne du bouton.
   * @override
   */
  onUpdate() {
    this._state = !this._state;

    if (this._state) this._$field.find('span').html('expand_less');
    else this._$field.find('span').html('expand_more');
  }

  /**
   * Action éxecuter lors du clique sur le bouton.
   * @override
   * @overload
   */
  onClick() {
    this.clicked.call(!this._state);
    this.onUpdate();
  }

  /**
   * Simule un clique sur le bouton
   */
  click() {
    this.onClick();
  }
}

/**
 * @class
 * @classdesc Représente un participant
 * @package
 */
class Guest {
  constructor(name, email) {
    this._init()._setup(name, email);
  }

  /**
   * Initialise les membres de la classe
   * @private
   * @return {Guest}
   */
  _init() {
    /**
     * Nom du participant
     * @type {string}
     * @member
     * @readonly
     */
    this.name = EMPTY_STRING;
    /**
     * Email du participant
     * @type {string}
     * @member
     * @readonly
     */
    this.email = EMPTY_STRING;

    return this;
  }

  /**
   * Assigne les membres de la classe
   * @private
   * @param {string} name
   * @param {string} email
   */
  _setup(name, email) {
    Object.defineProperties(this, {
      name: {
        get() {
          return name.replaceAll('"', EMPTY_STRING);
        },
      },
      email: {
        get() {
          return email;
        },
      },
    });
  }

  /**
   * Récupère la disponibilité du participant
   * @async
   * @param {Date | external:moment} start Date de début de l'évènement
   * @param {Date | external:moment} end Date de fin de l'évènement
   * @param {!boolean} allDay Si l'évènement dure la journée entière ou non. `false` par défaut.
   * @return {Promise<string>}
   */
  async get_dispo(start, end, allDay = false) {
    let dispo = EMPTY_STRING;
    const date2servertime = cal.date2ISO8601;
    const clone_date = function (date, adjust) {
      var d = 'toDate' in date ? date.toDate() : new Date(date.getTime());

      // set time to 00:00
      if (adjust === 1) {
        d.setHours(0);
        d.setMinutes(0);
      }
      // set time to 23:59
      else if (adjust === 2) {
        d.setHours(23);
        d.setMinutes(59);
      }

      return d;
    };

    await $.ajax({
      type: 'GET',
      dataType: 'html',
      //Pamela - correction de l'url
      url: rcmail.get_task_url(
        'calendar&_action=freebusy-status',
        window.location.origin + window.location.pathname,
      ), //rcmail.url('freebusy-status'),
      data: {
        email: this.email,
        start: date2servertime(clone_date(start, allDay ? 1 : 0)),
        end: date2servertime(clone_date(end, allDay ? 2 : 0)),
        _remote: 1,
      },
      success: function (status) {
        var avail = String(status).toLowerCase();
        //console.log('avail', avail);
        dispo = avail;
        //icon.removeClass('loading').addClass(avail).attr('title', rcmail.gettext('avail' + avail, 'calendar'));
      },
      error: function () {
        dispo = 'unknown';
        //icon.removeClass('loading').addClass('unknown').attr('title', rcmail.gettext('availunknown', 'calendar'));
      },
    });

    return dispo;
  }

  /**
   * Supprime le participant de la liste des participants de sauvegarde.
   * @param {string} email email du participant à supprimer
   */
  _remove_from_table(email) {
    $(`#edit-attendees-table .attendee-name [title="${email}"]`)
      .closest('tr')
      .remove();
  }

  /**
   * Appeler lorsque que l'on clique sur le bouton "supprimer" lié au participant.
   * @package
   * @param {Event} e
   */
  _close_button_click(e) {
    const email = $(e.currentTarget).attr('data-parent');
    this._remove_from_table(email);
    let $querry = $(`div.mel-attendee[data-email="${email}"]`);
    const add = true;
    const attendee = this.toAttendee(
      Guest._GuestRole($querry.attr('data-parent'), GuestsPart.INSTANCE),
    );
    const attendee_list = cal.edit_update_current_event_attendee(
      attendee,
      !add,
    );
    $querry.remove();
    $querry = null;
    GuestsPart.SetAttendeesListOrganizer(attendee_list, attendee);
    GuestsPart.UpdateFreeBusy(GuestsPart.INSTANCE._datePart);
  }

  /**
   * Renvoie le participant sous forme de texte.
   * @private
   * @return {string}
   */
  _formated() {
    if (this.name || false) return `${this.name} <${this.email}>`;
    else return this.email;
  }

  /**
   * Appeler lorsque l'on démarre un drag and drop sur le participant.
   * @package
   * @param {DragEvent} ev
   */
  _dragStart(ev) {
    ev = ev.dataTransfer ? ev : ev.originalEvent;
    ev.dataTransfer.dropEffect = 'move';
    ev.dataTransfer.setData(
      'text/plain',
      JSON.stringify({
        name: this.name,
        email: this.email,
        string: this.toString(),
      }),
    );

    $('.mel-show-attendee-container, [data-linked="attendee-input"]').addClass(
      'mel-guest-drag-started',
    );
  }

  /**
   * Appeler lorsque l'on termine le drag and drop sur le participant.
   * @package
   * @param {DragEvent} ev
   */
  _dragEnd(ev) {
    $(
      '.mel-show-attendee-container, [data-linked="attendee-input"]',
    ).removeClass('mel-guest-drag-started');

    return ev;
  }

  /**
   * Convertit le participant sous une représentation html avec son comportement.
   * @param {*} event Evènement du plugin `Calendar`
   * @return {____JsHtml}
   */
  toHtml(event) {
    let html = MelHtml.start
      .div({
        class: 'mel-attendee',
        title: this._formated(),
        'data-email': this.email,
        'data-name': this.name,
        draggable: true,
        ondragstart: this._dragStart.bind(this),
        ondragend: this._dragEnd.bind(this),
      })
      .input({
        type: 'hidden',
        class: 'edit-attendee-reply',
        value: this.email,
        checked: 'checked',
      })
      .span({ class: 'availability' })
      .css({ 'margin-left': '5px', 'margin-right': '5px' })
      .span({ class: 'availabilityicon loading' })
      .end()
      .end()
      .span({ class: 'attendee-name' })
      .text(this.name || this.email)
      .end()
      .button({
        type: 'button',
        class: 'close-button btn btn-secondary for-attendee',
        'data-parent': this.email,
        onclick: this._close_button_click.bind(this),
      })
      .removeClass('mel-button')
      .removeClass('no-button-margin')
      .removeClass('no-margin-button')
      .icon('close')
      .end()
      .end()
      .end()
      .generate();

    this.get_dispo(event.start, event.end, event.AllDay).then((dispo) => {
      html
        .find('.availabilityicon')
        .removeClass('loading')
        .addClass(dispo)
        .attr('title', rcmail.gettext('avail' + dispo, 'calendar'));
    });

    return html;
  }

  checkValid($html, parent) {
    if (
      $html.data('hiddenrole') &&
      $html.data('hiddenrole') !==
        Guest._GuestRole($html.attr('data-parent'), parent)
    ) {
      $html
        .attr('draggable', false)
        .css('cursor', 'not-allowed')
        .find('.close-button')
        .remove();
      $html[0].ondragstart = null;
    }

    return $html;
  }

  /**
   * Affiche le participant sous forme de texte.
   * @return {string}
   */
  toString() {
    return this._formated();
  }

  /**
   * Change le participant en un objet qui sera lisible pour d'autre fonctions.
   * @param {!Role} role Roe du participant. "Requis" par défaut.
   * @return {!Attendee}
   */
  toAttendee(role = GuestsPart.ROLES.required) {
    return {
      role,
      name: this.name,
      email: this.email,
    };
  }

  /**
   * Récupère l'email, le nom et le rôle d'un participant à partir de son html.
   * @static
   * @param {external:jQuery} $attendee
   * @param {GuestsPart} parent
   * @return {AttendeeEx}
   */
  static From($attendee, parent) {
    return {
      name: $attendee.attr('data-name'),
      email: $attendee.attr('data-email'),
      role: Guest._GuestRole($attendee.attr('data-parent'), parent),
    };
  }

  /**
   * Récupère la dispnobilitée d'un participant à partir de son html.
   * @param {external:jQuery} $attendee
   * @param {Date | external:moment} start Date de l'évènement
   * @param {Date | external:moment} end Date de fin de l'évènement
   * @param {!boolean} allDay Si l'évènement dure toute la journée ou non. `false` par défaut.
   * @return {Promise<string>}
   * @async
   * @static
   */
  static async GetDispo($attendee, start, end, allDay = false) {
    const email = $attendee.attr('data-email');

    return await new Guest(EMPTY_STRING, email).get_dispo(start, end, allDay);
  }

  /**
   * Met à jour la disponibilitée d'un participant à partir de son html.
   * @param {external:jQuery} $attendee
   * @param {Date | external:moment} start Date de l'évènement
   * @param {Date | external:moment} end Date de fin de l'évènement
   * @param {!boolean} allDay Si l'évènement dure toute la journée ou non. `false` par défaut.
   * @return {Promise<string>}
   * @async
   * @static
   */
  static async UpdateDispo($attendee, start, end, allDay = false) {
    let $avail = $attendee.find('.availabilityicon');
    let tmp = MelEnumerable.from($avail[0].classList).toArray();
    for (const iterator of tmp) {
      if (!['availabilityicon', 'loading'].includes(iterator))
        $avail.removeClass(iterator);
    }

    $avail.attr('title', EMPTY_STRING).addClass('loading');

    const dispo = await this.GetDispo($attendee, start, end, allDay);

    $avail
      .addClass(dispo)
      .removeClass('loading')
      .attr('title', rcmail.gettext('avail' + dispo, 'calendar'));

    return dispo;
  }

  /**
   * @private
   * @param {string} id
   * @param {string} parent
   * @return {Role}
   */
  static _GuestRole(id, parent) {
    let role = EMPTY_STRING;

    switch (id) {
      case null:
      case parent._$fakeField.attr('id'):
        role = GuestsPart.ROLES.required;
        break;

      default:
        role = GuestsPart.ROLES.optional;
        break;

      case parent._$animators.attr('id'):
        role = GuestsPart.ROLES.chair;
        break;
    }

    return role;
  }
}

/**
 * @class
 * @classdesc Représente la partie des participants.
 * @extends FakePart
 * @frommodule EventView/Parts
 */
export class GuestsPart extends FakePart {
  /**
   *
   * @param {external:jQuery} $addInput
   * @param {external:jQuery} $neededInput
   * @param {external:jQuery} $optionalInput
   * @param {external:jQuery} $animatorsInput
   * @param {external:jQuery} $switchButton
   * @param {TimePartManager} datePart
   */
  constructor(
    $addInput,
    $neededInput,
    $optionalInput,
    $animatorsInput,
    $switchButton,
    datePart,
  ) {
    super($addInput, $neededInput, Parts.MODE.change);
    GuestsPart.stop = true;
    /**
     * Champ lié aux participants optionnels
     * @type {external:jquery}
     * @package
     */
    this._$optionnals = $optionalInput;
    /**
     * Champ lié aux participants qui dirige la réunion
     * @type {external:jquery}
     * @package
     */
    this._$animators = $animatorsInput;
    /**
     * Bouton qui permet d'afficher tout les champs ou non.
     * @type {GuestButton}
     * @package
     */
    this._switchButton = new GuestButton($switchButton);
    /**
     * Partie lié aux dates
     * @type {TimePartManager}
     * @package
     */
    this._datePart = datePart;
    /**
     * Si on peut modifier les participants ou non.
     * @type {boolean}
     */
    this.cant_modify = false;

    /**
     * Instance de l'évènement en cours
     * @static
     * @type {GuestsPart}
     */
    GuestsPart.INSTANCE = this;

    const ids = {
      start_date: this._datePart._$start_date.attr('id'),
      end_date: this._datePart._$end_date.attr('id'),
      start_time: this._datePart.start._$fakeField.attr('id'),
      end_time: this._datePart.end._$fakeField.attr('id'),
    };

    //Action à faire lorsque l'on quitte la dialogue "freebusy"
    if (!rcmail.has_guest_dialog_attendees_save) {
      const fnc = function (date) {
        const { start, end } = date;
        GuestsPart.can = false;
        $(`#${this.start_date}`).val(start.date).change();
        TimePartManager.UpdateOption(this.start_time, start.time);
        $(`#${this.start_time}`).val(start.time).change();
        $(`#${this.end_date}`).val(end.date).change();
        TimePartManager.UpdateOption(this.end_time, end.time);
        $(`#${this.end_time}`).val(end.time).change();
        GuestsPart.can = true;

        GuestsPart.INSTANCE.update_free_busy();
      };

      rcmail.addEventListener('dialog-attendees-save', fnc.bind(ids));

      rcmail.has_guest_dialog_attendees_save = true;
    }

    //Ajout des actions sur certains boutons.
    $(SELECTOR_CHECKBOX_NOTIFY)
      .removeClass(CLASS_MANUALLY_CHANGED)
      .off('change')
      .on('change', this.onNotificationChanged.bind(this));

    if (rcmail.env['event_prop.mails'])
      $('#event-mail-add-member')
        .off('click')
        .on('click', this.onButtonMailClicked.bind(this))
        .parent()
        .css('display', '')
        .addClass('d-flex');
    else
      $('#event-mail-add-member')
        .off('click')
        .parent()
        .css('display', 'none')
        .removeClass('d-flex');

    $('#emel-free-busy').removeClass('full-power');
  }

  /**
   * Initialise la partie
   * @param {*} event Evènement du plugin `Calendar`
   * @override
   */
  init(event) {
    let it = 0;
    const fields = [this._$fakeField, this._$optionnals, this._$animators];
    const main_field_index = 0;
    const cant_modify =
      (event?.attendees?.length || 0) > 0 && !cal.is_internal_organizer(event);

    $('.mel-attendee').remove();
    $('#emel-free-busy').html('');

    for (const $field of fields) {
      if ($(`[data-linked="${$field.attr('id')}"]`).length === 0)
        throw new GuestPartFieldException(this, $field);

      this._add_focus_if_not_exist($field);
      rcmail.init_address_input_events($field);

      if (it++ !== main_field_index)
        this._p_try_add_event(
          $field,
          'change',
          this.onChange.bind(this, $field),
        );

      this._p_try_add_event($field, 'input', this.onInput.bind(this, $field));
      this._p_try_add_event($field, 'keyup', this.onKeyUp.bind(this, $field));

      if (cant_modify) {
        $field.attr('disabled', 'disabled').addClass('disabled');
      } else {
        $field.removeAttr('disabled').removeClass('disabled');
      }
    }

    if (this._switchButton.clicked.count() === 0) {
      this._switchButton.clicked.push(this._on_switch.bind(this));
    }

    if ((event?.attendees?.length ?? 0) > 0) {
      let $field;
      for (const iterator of event.attendees) {
        switch (iterator.role) {
          case GuestsPart.ROLES.required:
            $field = this._$fakeField;
            break;

          case 'NON-PARTICIPANT':
          case GuestsPart.ROLES.optional:
            $field = this._$optionnals;
            break;

          case GuestsPart.ROLES.chair:
            $field = this._$animators;
            break;

          default:
            continue;
        }

        $field.before(
          new Guest(iterator.name, iterator.email)
            .toHtml(event)
            .attr('data-parent', $field.attr('id')),
        );
      }

      $field = null;
    }

    this._switchButton._state = true;
    this._switchButton.click();
    $(SELECTOR_CHECKBOX_NOTIFY).prop('checked', false);

    if (cant_modify) {
      $('#showcontacts_attendee-input')
        .attr('disabled', 'disabled')
        .addClass('disabled');
    } else {
      $('#showcontacts_attendee-input')
        .removeAttr('disabled')
        .removeClass('disabled');

      if ((event?.attendees?.length ?? 0) > 0) {
        $(SELECTOR_CHECKBOX_NOTIFY).prop('checked', true);
        this.update_free_busy();
      }
    }

    if (!!event.attendees && !!event.attendees.length) {
      if (
        MelEnumerable.from(event.attendees)
          .where((x) => x.email === GuestsPart.GetMe().email)
          .firstOrDefault()?.role !== 'ORGANIZER' ||
        cant_modify
      ) {
        $('#edit-attendees-donotify').parent().hide();
        $('#emel-free-busy').hide();
      } else {
        $('#edit-attendees-donotify').parent().show();
        $('#emel-free-busy').show();
      }
    }

    this.cant_modify = cant_modify;
  }

  /**
   * Récupère l'email et le nom d'un participant mis dans un champ
   * @private
   * @param {string} val Valeur récupérer dans le champ
   * @return {User}
   */
  _slice_user_datas(val) {
    if (val.includes(REPLACE_CHAR))
      val = val.replaceAll(REPLACE_CHAR, GUEST_SEPARATOR);

    let data = {
      name: EMPTY_STRING,
      email: EMPTY_STRING,
    };

    if (val.includes('<')) {
      val = val.split('<');
      data.name = val[0].trim();
      data.email = val[1].replace('>', EMPTY_STRING).trim();
    } else if (val.includes('@')) data.email = val.trim();

    return data;
  }

  /**
   * Met en forme les arguments pour les fonctions de la classe.
   * @private
   * @param {*[]} args
   * @return {Array}
   */
  _get_args(args) {
    let [event, $field] = args;

    if (event.val) {
      return [$field, event];
    }

    return args;
  }

  /**
   * Ajoute les focus et focusout sur un champ si ils n'existent pas.
   * @private
   * @param {external:jQuery} $field
   */
  _add_focus_if_not_exist($field) {
    if (!$._data($field[0], 'events')?.focus)
      $field.on('focus', (e) => {
        $(`[data-linked="${$(e.currentTarget).attr('id')}"]`).addClass(
          'forced-focus',
        );
      });

    if (!$._data($field[0], 'events')?.focusout)
      $field.on('focusout', (e) => {
        $(`[data-linked="${$(e.currentTarget).attr('id')}"]`).removeClass(
          'forced-focus',
        );
      });
    return this;
  }

  /**
   * Action qui sera éffectuer lorsque l'on cliquera sur le bouton qui déplie ou non les champs
   * @param {boolean} state
   * @package
   */
  _on_switch(state) {
    if (state) {
      //Affiche "Participants obligatoires"
      this._$fakeField.attr(
        'placeholder',
        rcmail.gettext('req_guest', 'mel_metapage'),
      );
      this._$optionnals.parent().css('display', EMPTY_STRING);
      this._$animators.parent().css('display', EMPTY_STRING);

      for (const iterator of this._$fakeField.parent().find('.mel-attendee')) {
        $(`#${$(iterator).attr('data-parent')}`).before($(iterator));
      }
    } else {
      //Affiche "Ajouter des participants"
      this._$fakeField.attr(
        'placeholder',
        rcmail.gettext('add_guests', 'mel_metapage'),
      );
      this._$optionnals.parent().css('display', 'none');
      this._$animators.parent().css('display', 'none');

      const fields = [this._$optionnals, this._$animators];

      for (const $field of fields) {
        for (const iterator of $field.parent().find('.mel-attendee')) {
          this._$fakeField.before($(iterator));
        }
      }
    }
  }

  /**
   * Met à jour les disponibilitées des participants
   * @async
   * @return {Promise<void>}
   */
  async update_free_busy() {
    await GuestsPart.UpdateFreeBusy(this._datePart);
  }

  includes(email) {
    return MelEnumerable.from($('div.mel-attendee')).any(
      (x) => $(x).attr('data-email') === email,
    );
  }

  /**
   * Met à jours les données liés aux participants lorsqu'un champ a été modifié
   * @param {string} val
   * @param {external:jQuery} $field
   * @package
   * @returns {boolean}
   */
  _onUpdate(val, $field) {
    var $attendee_field;
    var guest;
    var role;
    var attendees;

    console.log('update', val);

    {
      //On vérifie si il y a des virgules entre parenthèses puis on les gères.
      const regex = REG_BETWEEN_PARENTHESIS;
      const match = val.match(regex);

      if (!!match && match.length > 0) {
        for (const iterator of match) {
          val = val.replaceAll(
            iterator,
            iterator.replace(GUEST_SEPARATOR, REPLACE_CHAR),
          );
        }
      }
    }

    if (val.includes(GUEST_SEPARATOR)) {
      const event = cal.selected_event;
      val = val.split(GUEST_SEPARATOR);
      let has_invalid_email = false;
      let invalids = [];

      //Itère sur chaque participant, ils sont sous la forme nom<email>
      for (const iterator of MelEnumerable.from(val)
        .where((x) => x.trim() !== EMPTY_STRING)
        .select(this._slice_user_datas.bind(this))) {
        if (iterator.email === EMPTY_STRING) {
          if (iterator.name === EMPTY_STRING) continue;

          has_invalid_email = true;
          invalids.push(iterator);
          continue;
        }

        if (iterator.email === GuestsPart.GetMe().email) continue;

        if ($(`div.mel-attendee[data-email="${iterator.email}"`).length === 0) {
          //On créer un participant, on lui met son rôle
          $attendee_field =
            $attendee_field ||
            $(`.mel-show-attendee[data-linked="${$field.attr('id')}"]`);
          guest = new Guest(iterator.name, iterator.email);

          if (
            (guest.name || false) &&
            guest.name.includes('=') &&
            guest.name.includes(':')
          ) {
            if (guest.name.includes('role=')) {
              role = guest.name.split('role=')[1].split(':')[0];
              guest = new Guest(guest.name.split(':')[1], guest.email);
              guest.aer = true;
            }
          }

          if (!guest.aer) role = Guest._GuestRole($field.attr('id'), this);
          //Met à jours les participants dans le plugin "Calendar" pour qu'ils soient sauvegardés
          attendees = cal.edit_update_current_event_attendee(
            guest.toAttendee(role),
          );
          //Gère si il y a un organisateur
          GuestsPart.SetAttendeesListOrganizer(
            attendees,
            guest.toAttendee(role),
          );
          //Ajoute au champs
          $field.before(
            guest
              .toHtml(event)
              .attr('data-parent', $field.attr('id'))
              .attr('data-hiddenrole', role),
          );
          //On vide les variables
          $attendee_field = null;
          guest = null;
          role = null;
          attendees = null;
        } else {
          rcmail.display_message(
            rcmail
              .gettext('existing_guest', 'mel_metapage')
              .replaceAll('%0', iterator.name || iterator.email),
            'error',
          );
        }
      }

      if (has_invalid_email) {
        rcmail.display_message(
          rcmail.gettext('invalid_guests', 'mel_metapage'),
          'warning',
        );
        console.warn('/!\\[onUpdate]', invalids);
      }

      if (!$(SELECTOR_CHECKBOX_NOTIFY).hasClass(CLASS_MANUALLY_CHANGED))
        $(SELECTOR_CHECKBOX_NOTIFY).prop('checked', true);

      $field.val(EMPTY_STRING);
      $field.focus();

      this.update_free_busy();

      return true;
    }

    return false;
  }

  /**
   * Met à jour les données lorsque l'on appuyer sur "entrer"
   * @param  {...any} args
   */
  onKeyUp(...args) {
    const [e, $field] = this._get_args(args);

    if (e.keyCode === 13) {
      this.onUpdate($(e.currentTarget).val(), $field);
    }
  }

  /**
   * Met à jours les données liés aux participants lorsqu'un champ a été modifié
   * @param {string} val
   * @param {external:jQuery} $field
   * @override
   */
  onUpdate(val, $field) {
    if (!this._onUpdate(val ?? '', $field))
      this._onUpdate(`${val}${GUEST_SEPARATOR}`, $field);
  }

  /**
   * Met à jours les données liés aux participants lorsqu'un champ a été modifié
   * @param  {...any} args
   * @override
   */
  onInput(...args) {
    const [e, $field] = this._get_args(args);
    this._onUpdate(
      $(e.currentTarget).val(),
      ($field?.click ? $field : null) ?? this._$fakeField,
    );
  }

  /**
   * Action qui sera appelé lorsque l'un des champs changera de valeur
   * @param  {...any} args
   * @override
   */
  onChange(...args) {
    const [e, $field] = this._get_args(args);
    this.onUpdate(
      $(e.currentTarget).val(),
      ($field?.click ? $field : null) ?? this._$fakeField,
    );
  }

  /**
   * Appeler lorsque l'on change l'état de la checkbox de notification des participants
   * @param {Event} e
   */
  onNotificationChanged(e) {
    e = $(e.currentTarget);
    let $querry = $(SELECTOR_CHECKBOX_NOTIFY);
    //Lorsque cette checkbox à "manually-changed", le changement de cette checkbox ne pourra plus se faire automatiquement
    if (!$querry.hasClass(CLASS_MANUALLY_CHANGED)) {
      $querry.addClass(CLASS_MANUALLY_CHANGED);
    }

    //Désactiver les autres checkboxes
    $('#edit-attendees-invite').prop('checked', e.prop('checked'));
    $('input.edit-attendee-reply').prop('checked', e.prop('checked'));

    $querry = null;
    e = null;
  }

  /**
   * Appeler Lorsque l'on clique sur le bouton qui permet d'ajouter les déstinataires d'un mail dans les participants
   * @param {Event} e
   */
  onButtonMailClicked(e) {
    const data = rcmail.env['event_prop.mails'];

    if (data.cc) this._$fakeField.val(`${data.cc},`).change();

    if (data.from) this._$fakeField.val(`${data.from},`).change();

    if (data.to) this._$fakeField.val(`${data.to},`).change();

    return e;
  }

  /**
   * Gère les participants en supprimant ou en ajoutant l'organisateur.
   *
   * Cela permet d'avoir l'organisateur dans la dialogue de disponibilitée.
   * @param {Attendee[]} list
   * @param {Attendee} current_guest
   * @static
   */
  static SetAttendeesListOrganizer(list, current_guest) {
    const add = true;
    if (list.length === 1) {
      if (!MelEnumerable.from(list).any((x) => x.role === 'ORGANIZER')) {
        cal.edit_update_current_event_attendee(current_guest, !add);
        cal.edit_update_current_event_attendee(
          this.GetMe().toAttendee('ORGANIZER'),
          add,
        );
        cal.edit_update_current_event_attendee(current_guest, add);
      } else cal.edit_clear_attendees();
    }
  }

  /**
   * Ajout ou met à jours les créneaux de disponibilités des participants
   * @param {TimePartManager} timePart Pour récupérer la date et l'heure de début et de fin de l'évènement
   * @return {Promise<void>}
   * @static
   * @async
   */
  static async UpdateFreeBusy(timePart) {
    if (GuestsPart.can === false) return;

    if (GuestsPart.stop) GuestsPart.stop = false;

    const CLASS_FULL_WIDTH = 'full-power';
    const start = timePart.date_start;
    const end = timePart.date_end;
    const attendees = MelEnumerable.from($('.mel-attendee'))
      .select((x) => Guest.From($(x), GuestsPart.INSTANCE))
      .aggregate([this.GetMe().toAttendee()])
      .toArray();

    if (attendees.length > 1 && !GuestsPart.INSTANCE.cant_modify) {
      let $main_div = $('#emel-free-busy')
        .addClass(CLASS_FULL_WIDTH)
        .html(
          $(
            '<div class="absolute-center"><span class="spinner-border"><span class="sr-only">Loading...</span></span></div>',
          ),
        );
      let promise = new Mel_Promise(
        async () =>
          await new FreeBusyGuests().load_freebusy_data({
            start,
            end,
            attendees,
          }),
      );

      while (promise.isPending()) {
        await Mel_Promise.Sleep(10);

        if (GuestsPart.stop) {
          $('#emel-free-busy').removeClass(CLASS_FULL_WIDTH).html('');
          GuestsPart.stop = false;
          console.info('Stopped !');
          return;
        }
      }

      const slots = await promise;
      promise = null;
      let $find_next = MelHtml.start
        .button({
          class: 'slot',
          type: 'button',
          onclick: () => $('#edit-attendee-schedule').click(),
        })
        .css('height', '100%')
        // eslint-disable-next-line quotes
        .text("Trouver d'autres disponibilités")
        .end()
        .generate();

      if (slots.length > 0) {
        $('#emel-free-busy').find('.spinner-border').addClass('text-success');
        let $div = $('<div>').addClass('row');

        for (const slot of slots) {
          slot
            .generate(timePart)
            .generate()
            .appendTo(
              $('<div>')
                .addClass('col-6 col-md-3')
                .css('padding', '5px')
                .appendTo($div),
            );
        }

        $find_next.appendTo(
          $('<div>')
            .addClass('col-6 col-md-3')
            .css('padding', '5px')
            .appendTo($div),
        );

        $main_div.html($div);
      } else
        $main_div.html(
          $find_next.appendTo(
            $('<div>').addClass('col-6 col-md-3').css('padding', '5px'),
          ),
        );

      $('<div>')
        .addClass('dispo-freebusy-text')
        .text('Premières disponibilité commune')
        .css('margin-bottom', '5px')
        .prependTo($main_div);
    } else
      (GuestsPart.stop = true),
        $('#emel-free-busy').removeClass(CLASS_FULL_WIDTH).html(EMPTY_STRING);
  }

  /**
   * Récupère les informations de l'utilisateur courant, parmis ses calendriers.
   * @return {Guest}
   * @static
   */
  static GetMe() {
    const cal = rcmail.env.calendars[$('#edit-calendar').val()];

    return new Guest(cal?.owner_name || EMPTY_STRING, cal.owner_email);
  }

  /**
   * Met à jours les disponibilités des participants
   * @param {external:moment} start Date de début de l'évènement
   * @param {external:moment} end Date de fin de l'évènement
   * @param {boolean} allDay Si l'évènement dure la journée entière ou non
   * @return {Promise<void>}
   */
  static async UpdateDispos(start, end, allDay = false) {
    //Si une mise à jours est déjà en cours, on attend qu'elle se termine
    if (this.UpdateDispos.promises) {
      //Si une mise à jours est différente de la précédente, on attend l'ancienne puis on fait la nouvelle
      if (
        this.UpdateDispos.promises.start.format() !== start.format() ||
        this.UpdateDispos.promises.end.format() !== end.format() ||
        this.UpdateDispos.promises.allDay !== allDay
      )
        await this.UpdateDispos.promises.promises;
      else return;
    }

    let promises = [];
    for (const iterator of $('.mel-attendee')) {
      promises.push(Guest.UpdateDispo($(iterator), start, end, allDay));
    }

    promises = Promise.allSettled(promises);

    this.UpdateDispos.promises = { promises, start, end, allDay };
    await this.UpdateDispos.promises.promises;

    this.UpdateDispos.promises = null;
  }
}

/**
 * @typedef DispoPromise
 * @property {external:moment} start
 * @property {external:moment} end
 * @property {Promise} promises
 */

/**
 * Contient les promesses de la modification de date en cours.
 *
 * Cela permet de ne pas faire de requêtes inutiles.
 * @type {?DispoPromise}
 * @static
 * @package
 */
GuestsPart.UpdateDispos.promises = undefined;

/**
 * Si l'on peut mettre à jour les créneaux ou non.
 * @see {@link GuestsPart.UpdateFreeBusy}
 * @type {boolean}
 * @static
 */
GuestsPart.can = true;
/**
 * Si l'on doit arrêter la mise à jours des créneaux ou non.
 * @see {@link GuestsPart.UpdateFreeBusy}
 * @type {boolean}
 * @static
 */
GuestsPart.stop = false;
/**
 * Instance de l'évènement en cours
 * @static
 * @readonly
 */
GuestsPart.event = null;
Object.defineProperty(GuestsPart, 'event', {
  get() {
    return cal.selected_event;
  },
});

/**
 * @typedef {string} Role
 */

/**
 * @enum {Role}
 * @static
 * @readonly
 */
GuestsPart.ROLES = {
  required: 'REQ-PARTICIPANT',
  optional: ROLE_ATTENDEE_OPTIONNAL,
  chair: 'CHAIR',
  resource: 'RESOURCE',
};
