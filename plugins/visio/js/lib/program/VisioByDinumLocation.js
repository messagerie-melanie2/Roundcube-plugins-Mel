import { HTMLBnumButton } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { EventView } from '../../../../mel_metapage/js/lib/calendar/event/event_view.js';
import { AVisio } from '../../../../mel_metapage/js/lib/calendar/event/parts/location_part.js';
import {
  BnumMessage,
  eMessageType,
} from '../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { VisioRooms } from './visio_rooms.js';
import {
  format_visio_location,
  is_visio_url,
  VisioWebconfLink,
} from './VisioWebconfLink.js';

/**
 * Active le cache statique de salle entre deux ouvertures de la dialog
 * d'évènement, pour éviter de recréer une salle à chaque fois.
 * @type {boolean}
 */
const ENABLE_SECURE = true;

/**
 * Partie de localisation d'un évènement représentant une visioconférence
 * créée via l'API de la plateforme de visio ({@link VisioRooms}).
 *
 * La création de la salle est asynchrone : le bouton « Enregistrer » de la
 * dialog d'évènement est désactivé le temps de la création pour empêcher
 * l'enregistrement d'un évènement sans salle.
 * @extends {AVisio}
 */
export class VisioByDinumLocation extends AVisio {
  /**
   * Dernière salle connue, partagée entre les instances pour être réutilisée
   * sans rappeler l'API si la dialog est rouverte.
   * @type {?{name: string, location: string}}
   */
  static #_visioData = null;

  /** @type {?HTMLElement} Bouton affichant le nom de la salle */
  #_button = null;

  /** @type {string} Nom de la salle créée par cette instance */
  #_roomName = EMPTY_STRING;

  /** @type {?Promise<void>} Création de salle en cours */
  #_pendingCreation = null;

  /**
   * @param {string} event_location - Localisation existante de l'évènement (vide pour un nouvel évènement)
   * @param {number} index - Index de la partie de localisation
   */
  constructor(event_location, index) {
    super(event_location, index);

    if (event_location) {
      VisioByDinumLocation.#_remember({
        name: new VisioWebconfLink(event_location).roomName,
        location: event_location,
      });
    }
  }

  /**
   * Salle en cache, ou `null` si aucune salle n'est connue ou si le cache
   * est désactivé ({@link ENABLE_SECURE}).
   * @type {?{name: string, location: string}}
   * @private
   */
  static get #_cache() {
    return ENABLE_SECURE ? VisioByDinumLocation.#_visioData : null;
  }

  /**
   * Met une salle en cache, si le cache est activé.
   * @param {?{name: string, location: string}} data - Salle à retenir
   * @private
   */
  static #_remember(data) {
    if (ENABLE_SECURE) VisioByDinumLocation.#_visioData = data;
  }

  /**
   * Libellé du bouton pour un nom de salle donné.
   * @param {string} name - Nom de la salle
   * @returns {string}
   * @private
   */
  static #_buttonText(name) {
    return name
      ? MelObject.Empty().getLocalization('room_label', {
          plugin: VisioByDinumLocation.PluginName(),
          variables: { name },
        })
      : EMPTY_STRING;
  }

  /**
   * Construit le DOM de la partie de localisation, l'insère dans `$parent`,
   * puis résout la salle : réutilisation du cache si disponible, sinon
   * création d'une nouvelle salle.
   *
   * @param {JQuery} $parent - Conteneur dans lequel insérer la partie de localisation
   * @returns {VisioByDinumLocation} Chaînage
   */
  generate($parent) {
    this.#_button = this.#_createButton();
    $parent.append(this.#_createContainer(this.#_button));

    const cached = VisioByDinumLocation.#_cache;

    if (cached) {
      this.location = cached.location;
      this.#_notifyChange();
    } else {
      this.#_setSaveButtonEnabled(false);
      this.#_pendingCreation = this.#_createRoom();
    }

    return this;
  }

  /**
   * Une salle est valide dès que sa localisation est connue.
   * @returns {boolean}
   */
  is_valid() {
    return !!this.location;
  }

  /**
   * Prévient l'utilisateur qu'aucune salle n'a pu être créée.
   */
  invalid_action() {
    BnumMessage.DisplayMessage(
      MelObject.Empty().getLocalization('erreur_connexion_visio', {
        plugin: VisioByDinumLocation.PluginName(),
      }),
      eMessageType.Error,
    );
  }

  /**
   * Attend la fin de la création de salle en cours, s'il y en a une.
   * @returns {Promise<void>}
   */
  async wait() {
    await this.#_pendingCreation;
  }

  /**
   * Réinitialise le cache de salle et l'état interne de l'instance.
   */
  destroy() {
    super.destroy();

    VisioByDinumLocation.#_visioData = null;
    this.#_pendingCreation = null;
  }

  /**
   * Construit le bouton (désactivé) affichant le nom de la salle, en état
   * « chargement » tant qu'aucune salle n'est connue.
   * @returns {HTMLElement}
   * @private
   */
  #_createButton() {
    const cached = VisioByDinumLocation.#_cache;
    const button = HTMLBnumButton.Create({
      text: VisioByDinumLocation.#_buttonText(cached?.name || this.#_roomName),
      loading: !(cached?.location || this.location),
      iconMargin: 0,
    });
    button.setAttribute('disabled', 'disabled');

    return button;
  }

  /**
   * Enveloppe le bouton dans le conteneur attendu par le gestionnaire de
   * localisations.
   * @param {HTMLElement} button - Bouton de la salle
   * @returns {HTMLDivElement}
   * @private
   */
  #_createContainer(button) {
    const center = document.createElement('center');
    center.appendChild(button);

    const container = document.createElement('div');
    container.classList.add('visio-mode');
    container.setAttribute('data-locationmode', this.option_value());
    container.appendChild(center);

    return container;
  }

  /**
   * Crée une nouvelle salle puis réactive le bouton « Enregistrer », que la
   * création ait réussi ou non.
   * @returns {Promise<void>}
   * @private
   */
  async #_createRoom() {
    const loader = BnumMessage.DisplayLoadingMessage();

    try {
      const room = await new VisioRooms().tryCreateRoom();

      if (room) this.#_applyRoom(room);
      else this.invalid_action();
    } finally {
      this.#_button.stopLoading();
      this.#_setSaveButtonEnabled(true);
      BnumMessage.ClearMessage(loader);
    }
  }

  /**
   * Associe une salle créée à cette partie de localisation.
   * @param {import('./visio_rooms.js').VisioRoom} room - Salle créée
   * @private
   */
  #_applyRoom(room) {
    this.#_roomName = room.name;
    this.location = format_visio_location(room);

    VisioByDinumLocation.#_remember({
      name: room.name,
      location: this.location,
    });

    this.#_button.innerText = VisioByDinumLocation.#_buttonText(room.name);
    this.#_notifyChange();
  }

  /**
   * Notifie le gestionnaire de localisations que la localisation a changé.
   * @private
   */
  #_notifyChange() {
    queueMicrotask(() => this.onchange.call());
  }

  /**
   * Active ou désactive le bouton « Enregistrer » de la dialog d'évènement.
   *
   * Encapsule la différence entre la dialog jQuery UI et la dialog « custom »
   * ({@link EventView#is_jquery_dialog}), pour que le reste de la classe ne
   * manipule qu'un état booléen.
   * @param {boolean} enabled - `true` pour réactiver le bouton, `false` pour le désactiver
   * @private
   */
  #_setSaveButtonEnabled(enabled) {
    const view = EventView.INSTANCE;
    const save_button = view.is_jquery_dialog()
      ? view.get_dialog().parent().find('.ui-dialog-buttonset .mainaction')
      : view.get_dialog().footer.buttons.save;

    if (enabled) save_button.removeAttr('disabled').removeClass('disabled');
    else save_button.attr('disabled', 'disabled').addClass('disabled');
  }

  /**
   * Valeur de l'option de localisation correspondant à ce type de visio.
   * @returns {string}
   */
  static OptionValue() {
    return 'dinum';
  }

  /**
   * Plugin fournissant ce type de visio (et ses traductions).
   * @returns {string}
   */
  static PluginName() {
    return 'visio';
  }

  /**
   * Indique si une localisation correspond à ce type de visio.
   * @param {string} event_location - Localisation de l'évènement
   * @returns {boolean}
   */
  static Has(event_location) {
    return is_visio_url(event_location);
  }
}
