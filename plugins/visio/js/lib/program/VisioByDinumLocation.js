import { HTMLBnumButton } from '../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import { EventView } from '../../../../mel_metapage/js/lib/calendar/event/event_view.js';
import { AVisio } from '../../../../mel_metapage/js/lib/calendar/event/parts/location_part.js';
import { BnumMessage } from '../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { EMPTY_STRING } from '../../../../mel_metapage/js/lib/constants/constants.js';
import { VisioRooms } from './visio_rooms.js';
import { VisioWebconfLink } from './VisioWebconfLink.js';

/**
 * Active le cache statique de room entre deux ouvertures de la dialog
 * d'évènement, pour éviter de recréer une room Dinum à chaque fois.
 * @type {boolean}
 */
const ENABLE_SECURE = true;

/**
 * Partie de localisation d'un évènement représentant une visioconférence
 * créée via l'API Dinum (VisioRooms).
 *
 * La création de la room est asynchrone : le bouton "save" de la dialog
 * d'évènement est désactivé le temps de la création pour empêcher
 * l'enregistrement d'un évènement sans room valide.
 * @extends {AVisio}
 */
export class VisioByDinumLocation extends AVisio {
  /**
   * Dernière room créée, mise en cache au niveau de la classe tant que
   * {@link ENABLE_SECURE} est actif, pour la réutiliser sans rappeler l'API
   * si la dialog est rouverte.
   * @type {{name: string, location: string}|null}
   */
  static #_visioData = null;

  constructor(location, index) {
    super(location, index);
    if (location) {
      const link = new VisioWebconfLink(location);
      const cache = { name: link.roomName, location };
      VisioByDinumLocation.#_visioData = cache;
    }
  }

  /**
   * Construit le bouton (désactivé) affichant le nom de la room.
   *
   * Si {@link ENABLE_SECURE} est actif et qu'une room est déjà en cache, son
   * nom/emplacement est utilisé pour éviter un état "loading" superflu.
   * @returns {HTMLElement} Bouton en lecture seule prêt à être inséré dans le DOM
   * @private
   */
  #_createButton() {
    const { name: cachedName, location: cachedLocation } =
      VisioByDinumLocation.#_visioData || {};
    const location = ENABLE_SECURE
      ? cachedLocation || this.location
      : this.location;
    const name = ENABLE_SECURE ? cachedName || this._name : this._name;
    const btn = HTMLBnumButton.Create({
      text: name ? `Room : ${name}` : EMPTY_STRING,
      loading: !location,
      iconMargin: 0,
    });
    btn.setAttribute('disabled', 'disabled');

    return btn;
  }

  /**
   * Active ou désactive le bouton "save" de la dialog d'évènement.
   *
   * Encapsule la différence entre la dialog jQuery UI et la dialog "custom"
   * ({@link EventView#is_jquery_dialog}) pour que le reste de la classe n'ait
   * à connaître qu'un état booléen, pas la structure interne de la dialog.
   * @param {boolean} enabled `true` pour réactiver le bouton, `false` pour le désactiver
   * @private
   */
  #_setSaveButtonEnabled(enabled) {
    const dialog = EventView.INSTANCE.get_dialog();
    const saveButton = EventView.INSTANCE.is_jquery_dialog()
      ? dialog.parent().find('.ui-dialog-buttonset .mainaction')
      : dialog.footer.buttons.save;

    if (enabled) {
      saveButton.removeAttr('disabled').removeClass('disabled');
    } else {
      saveButton.attr('disabled', 'disabled').addClass('disabled');
    }
  }

  /**test
   * Crée une nouvelle room Dinum via {@link VisioRooms}, met à jour le
   * bouton et l'emplacement de l'évènement, puis réactive le bouton "save".
   * @async
   * @returns {Promise<void>}
   * @private
   */
  async #_createRoom() {
    const loading = BnumMessage.DisplayLoadingMessage();
    const rooms = new VisioRooms();
    const { datas } = await rooms.createRoom();
    const { content } = datas;
    const { url, name, telephony } = content;
    const { phone_number, pin_code } = telephony;

    this._name = name;
    this.location = `${url} (${phone_number} | #${pin_code})`;

    if (ENABLE_SECURE) {
      VisioByDinumLocation.#_visioData = { name, location: this.location };
    }

    this.btn.innerText = `Room : ${this._name}`;
    this.btn.stopLoading();
    this.#_setSaveButtonEnabled(true);

    BnumMessage.ClearMessage(loading);
    queueMicrotask(() => this.onchange.call());
  }

  /**
   * Construit le DOM de la partie de localisation, l'insère dans `$parent`,
   * puis résout l'emplacement de la room : réutilisation du cache si
   * disponible, sinon création d'une nouvelle room via {@link VisioRooms}.
   * @param {JQuery} $parent Conteneur dans lequel insérer la partie de localisation
   */
  generate($parent) {
    const btn = this.#_createButton();

    const center = document.createElement('center');
    center.appendChild(btn);
    this.btn = btn;

    const div = document.createElement('div');
    div.classList.add('visio-mode');
    div.setAttribute('data-locationmode', this.option_value());
    div.appendChild(center);

    $parent.append(div);
    this.btn = btn;

    const { location: cachedLocation } = VisioByDinumLocation.#_visioData || {};
    if (ENABLE_SECURE && cachedLocation) {
      this.location = cachedLocation;
      queueMicrotask(() => this.onchange.call());
      return;
    }

    this.#_setSaveButtonEnabled(false);
    this.promise = this.#_createRoom();
  }

  /**
   * Une room Dinum est toujours considérée comme valide une fois générée.
   * @returns {boolean}
   */
  is_valid() {
    return true;
  }

  /**
   * Attend la fin de la création de la room en cours, s'il y en a une.
   * @async
   * @returns {Promise<void>}
   */
  async wait() {
    await (this.promise || Promise.resolve());
  }

  /**
   * Réinitialise le cache de room et l'état interne de l'instance.
   */
  destroy() {
    super.destroy();

    VisioByDinumLocation.#_visioData = null;
    this.promise = null;
  }

  /**
   * Valeur de l'option de localisation correspondant à ce type de visio.
   * @returns {string}
   */
  static OptionValue() {
    return 'dinum';
  }

  /**
   * Plugin fournissant ce type de visio.
   * @returns {string}
   */
  static PluginName() {
    return 'visio';
  }

  static Has(location) {
    return VisioWebconfLink.IsVisioUrl(location);
  }
}
