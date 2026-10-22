import { HTMLBnumButton } from '../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { VisioManager } from '../../../mel_metapage/js/lib/calendar/event/parts/location_part.js';
import {
  BnumMessage,
  eMessageType,
} from '../../../mel_metapage/js/lib/classes/bnum_message.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { VisioRooms } from './program/visio_rooms.js';
import { VisioByDinumLocation } from './program/VisioByDinumLocation.js';
import { VisioDinumLocationAction } from './program/VisioDinumLocationAction.js';
import { is_visio_url, VisioWebconfLink } from './program/VisioWebconfLink.js';

/** Nom du plugin, domaine des traductions. */
const PLUGIN = 'visio';

/** Attribut portant l'url de la salle sur le bouton « Rejoindre ». */
const JOIN_URL_ATTRIBUTE = 'data-visio-url';

/** Protocoles autorisés à l'ouverture d'une salle. */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/** Styles inline du bloc « Rejoindre la visio » de la vue d'évènement. */
const JOIN_STYLES = Object.freeze({
  row: 'margin-top:15px',
  col: 'overflow:hidden; display:flex; text-overflow:ellipsis',
  icon: 'display:inline-block; vertical-align:top; margin-top:5px',
  button: 'display:inline-block',
});

/**
 * Identifiants des champs du gabarit de prise de rendez-vous
 * (skins/mel_elastic/templates/visio_appointment.html).
 */
const APPOINTMENT = Object.freeze({
  /** Type de lieu enregistré par la prise de rendez-vous. */
  TYPE: 'visio',
  CHECKBOX: '#visio',
  FIELDS: '#visio_fields',
  TEXT: '#visio_text',
  ROOM: '#visio-room',
});

/**
 * Échappe une chaîne pour l'insérer dans du HTML (contenu ou attribut).
 * `rcmail.quote_html` n'échappe ni `&` ni `'`, d'où cette version locale.
 *
 * @param {*} value - Valeur à échapper
 * @returns {string} Valeur échappée
 */
function escape_html(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Indique si une url peut être ouverte : absolue et en http(s).
 *
 * @param {?string} url - Url à vérifier
 * @returns {boolean}
 */
function is_allowed_url(url) {
  try {
    return ALLOWED_PROTOCOLS.includes(new URL(url).protocol);
  } catch {
    // Url relative ou malformée : refusée.
    return false;
  }
}

/**
 * Point d'entrée du plugin visio : branche la plateforme de visio sur
 * l'agenda (type de localisation, affichage d'un évènement, liens webconf)
 * et sur la prise de rendez-vous.
 * @extends {MelObject}
 */
export class VisioByDinum extends MelObject {
  constructor() {
    super();
    this.#_registerListeners();
    this.#_registerJoinClick();

    if (this.#_shouldOfferDinumVisio())
      VisioManager.PrependVisioType(VisioByDinumLocation);
  }

  /**
   * Abonne le plugin aux évènements de mel_metapage et du calendrier.
   *
   * Les handlers sont liés à l'instance : le moteur d'évènements de
   * Roundcube les appelle avec `this === window`.
   * @private
   */
  #_registerListeners() {
    this.listen('webconflink.create', this.#_onWebconfLinkCreate.bind(this))
      .listen('event.show.location', this.#_onEventShowLocation.bind(this))
      .listen(
        'event.location.generate',
        this.#_onEventLocationGenerate.bind(this),
      )
      .listen(
        'calendar.appointment.toggle_fields',
        this.#_onAppointmentToggleFields.bind(this),
      )
      .listen(
        'calendar.appointment.save_place',
        this.#_onAppointmentSavePlace.bind(this),
      )
      .listen(
        'calendar.appointment.load_place',
        this.#_onAppointmentLoadPlace.bind(this),
      );
  }

  /**
   * Ouvre la salle lors d'un clic sur un bouton « Rejoindre la visio ».
   * Un seul écouteur délégué remplace un `onclick` inline par bouton.
   * @private
   */
  #_registerJoinClick() {
    document.addEventListener('click', (e) => {
      const button = e.target.closest?.(`[${JOIN_URL_ATTRIBUTE}]`);

      if (button) this.#_openRoom(button.getAttribute(JOIN_URL_ATTRIBUTE));
    });
  }

  /**
   * Crée un lien webconf visio pour un évènement dont la localisation
   * désigne une salle de la plateforme.
   *
   * @param {{calendar_event?: {location?: string}}} args - Données de l'évènement `webconflink.create`
   * @returns {VisioWebconfLink|undefined} Lien créé, ou `undefined` pour laisser le traitement par défaut
   * @private
   */
  #_onWebconfLinkCreate(args) {
    const event_location = args.calendar_event?.location;

    if (!VisioWebconfLink || !is_visio_url(event_location)) return undefined;

    return new VisioWebconfLink(event_location);
  }

  /**
   * Génère le HTML d'une localisation visio dans la vue d'un évènement :
   * bouton « Rejoindre », puis accès téléphonique s'il existe.
   *
   * @param {{html: string, location: string, audioFunction: Function}} args - Données de l'évènement `event.show.location`
   * @returns {Object|undefined} `args` complété, ou `undefined` si la localisation n'est pas une visio
   * @private
   */
  #_onEventShowLocation(args) {
    const { location: event_location, audioFunction } = args;

    if (!VisioWebconfLink || !is_visio_url(event_location)) return undefined;

    const link = new VisioWebconfLink(event_location);
    args.html += this.#_renderJoinButton(link);

    if (link.havePhoneData()) {
      args.html += audioFunction(
        escape_html(link.phone.number),
        escape_html(link.phone.pin),
        escape_html(
          this.getLocalization('join_visio_by_phone', { plugin: PLUGIN }),
        ),
        'video_chat',
      );
    }

    return args;
  }

  /**
   * Construit le bouton « Rejoindre la visio » d'une salle. Toutes les
   * valeurs issues de la localisation (saisie par l'organisateur) sont
   * échappées.
   *
   * @param {VisioWebconfLink} link - Lien de la salle
   * @returns {string} HTML du bouton
   * @private
   */
  #_renderJoinButton(link) {
    const variables = { name: link.roomName };
    const label = this.getLocalization('join_visio', {
      plugin: PLUGIN,
      variables,
    });
    const aria_label = this.getLocalization('join_visio_new_window', {
      plugin: PLUGIN,
      variables,
    });
    const tag = HTMLBnumButton.TAG;

    return `
      <div id="location-mel-edited-calendar" class="row" style="${JOIN_STYLES.row}">
        <div class="col-12" style="${JOIN_STYLES.col}">
          <span style="${JOIN_STYLES.icon}" class="icon-mel-pin-location mel-cal-icon"></span>
          <${tag} style="${JOIN_STYLES.button}" ${JOIN_URL_ATTRIBUTE}="${escape_html(link.url)}" aria-label="${escape_html(aria_label)}" data-icon="open_in_new">${escape_html(label)}</${tag}>
        </div>
      </div>`;
  }

  /**
   * Ajoute l'action « visio » aux localisations générées d'un évènement.
   *
   * L'appelant ne prend en compte `generated` que s'il s'agit d'un nouvel
   * objet : il est donc copié plutôt que modifié sur place.
   *
   * @param {{generated: Object, current: string}} data - Données de l'évènement `event.location.generate`
   * @returns {Object|undefined} Données avec un nouveau `generated`, ou `undefined` si la localisation n'est pas une visio
   * @private
   */
  #_onEventLocationGenerate(data) {
    const { generated, current } = data;

    if (!VisioDinumLocationAction.is_dinum_visio(current)) return undefined;

    return {
      ...data,
      generated: {
        ...generated,
        visio: new VisioDinumLocationAction(current),
      },
    };
  }

  /**
   * Réagit à l'activation d'un champ de la prise de rendez-vous.
   *
   * @param {{field: string}} args - Données de l'évènement `calendar.appointment.toggle_fields`
   * @returns {Object} `args` inchangé
   * @private
   */
  #_onAppointmentToggleFields(args) {
    if (args.field === APPOINTMENT.TYPE) this.#_onAppointmentVisioToggled();

    return args;
  }

  /**
   * Ajoute le lieu « visio » aux lieux enregistrés de la prise de rendez-vous.
   *
   * @param {{id: string, form: JQuery, place: Array<Object>}} args - Données de l'évènement `calendar.appointment.save_place`
   * @returns {Object} `args`, `place` complété
   * @private
   */
  #_onAppointmentSavePlace(args) {
    const { id, form, place } = args;

    if (id === APPOINTMENT.TYPE) {
      place.push({
        type: APPOINTMENT.TYPE,
        value: form.find(APPOINTMENT.ROOM).val(),
        text: form.find(APPOINTMENT.TEXT).text(),
      });
    }

    return args;
  }

  /**
   * Restaure le lieu « visio » d'une prise de rendez-vous existante.
   *
   * @param {{element: {type: string, value: string}, form: JQuery}} args - Données de l'évènement `calendar.appointment.load_place`
   * @returns {Object} `args` inchangé
   * @private
   */
  #_onAppointmentLoadPlace(args) {
    const { element, form } = args;

    if (element.type === APPOINTMENT.TYPE) {
      form.find(APPOINTMENT.CHECKBOX).prop('checked', true);
      form.find(APPOINTMENT.FIELDS).show();
      form.find(APPOINTMENT.ROOM).val(element.value);
    }

    return args;
  }

  /**
   * Crée une salle de visio lorsque l'option « Visio » de la prise de
   * rendez-vous est activée et qu'aucune salle n'est encore associée.
   *
   * @returns {Promise<void>}
   * @private
   */
  async #_onAppointmentVisioToggled() {
    const form = this.get_env('appointment_form');
    const checkbox = form.find(APPOINTMENT.CHECKBOX);
    const input = form.find(APPOINTMENT.ROOM);

    if (!checkbox.prop('checked') || input.val()) return;

    // Évite une sauvegarde ou une fermeture pendant la création de la salle.
    const controls = form
      .closest('.ui-dialog')
      .find('.ui-dialog-buttonpane button')
      .add(checkbox);
    const loader = BnumMessage.DisplayLoadingMessage();

    controls.prop('disabled', true);

    try {
      const room = await new VisioRooms().tryCreateRoom();

      if (room) input.val(room.url);
      else
        BnumMessage.DisplayMessage(
          this.getLocalization('erreur_connexion_visio', { plugin: PLUGIN }),
          eMessageType.Error,
        );
    } finally {
      controls.prop('disabled', false);
      BnumMessage.ClearMessage(loader);
    }
  }

  /**
   * Ouvre une salle dans un nouvel onglet, si son url utilise un protocole
   * autorisé (bloque notamment `javascript:`).
   *
   * @param {?string} url - Url de la salle
   * @private
   */
  #_openRoom(url) {
    if (!is_allowed_url(url)) return;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Le type de visio « dinum » n'est proposé que dans l'agenda ou dans la
   * dialog de création ouverte depuis le bouton « Créer ».
   *
   * @returns {boolean}
   * @private
   */
  #_shouldOfferDinumVisio() {
    return this.#_isCalendar() || this.#_isFromCreateButton();
  }

  /**
   * @returns {boolean} Si la tâche courante est l'agenda
   * @private
   */
  #_isCalendar() {
    return this.get_env('task') === 'calendar';
  }

  /**
   * @returns {boolean} Si la page courante est la dialog du bouton « Créer »
   * @private
   */
  #_isFromCreateButton() {
    return (
      this.get_env('task') === 'mel_metapage' &&
      this.get_env('action') === 'dialog-ui'
    );
  }
}

new VisioByDinum();
