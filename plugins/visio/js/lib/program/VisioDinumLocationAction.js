import { ActionLocation } from '../../../../mel_metapage/js/lib/calendar/event_location.js';
import { MelObject } from '../../../../mel_metapage/js/lib/mel_object.js';
import { is_visio_url, VisioWebconfLink } from './VisioWebconfLink.js';

/**
 * Localisation d'évènement « visio » affichée dans la vue d'un évènement :
 * fournit l'icône, le libellé et l'action (ouverture de la salle dans un
 * nouvel onglet).
 * @extends {ActionLocation}
 */
export class VisioDinumLocationAction extends ActionLocation {
  /**
   * Ouvre la salle dans un nouvel onglet.
   * @returns {VisioDinumLocationAction} Chaînage
   */
  side_action() {
    const url = this.location.includes('http')
      ? this.location
      : `https://${this.location}`;

    window.open(url, '_blank', 'noopener,noreferrer');
    return this;
  }

  /**
   * @returns {string} Icône Material associée à l'action
   * @protected
   */
  _get_icon() {
    return 'open_in_new';
  }

  /**
   * Libellé court si plusieurs localisations sont affichées, sinon libellé
   * suivi du nom de la salle.
   *
   * @param {{length?: number}} options - `length` : nombre de localisations affichées
   * @returns {string}
   * @protected
   */
  _get_description({ length = 0 }) {
    const localizer = MelObject.Empty();

    return length > 1
      ? localizer.getLocalization('event-dinum', { plugin: 'visio' })
      : localizer.getLocalization('visio_label', {
          plugin: 'visio',
          variables: { name: new VisioWebconfLink(this.location).roomName },
        });
  }

  /**
   * Indique si une localisation désigne une salle de la plateforme de visio.
   *
   * @param {string} text - Localisation à tester
   * @returns {boolean}
   * @see is_visio_url
   */
  static is_dinum_visio(text) {
    return is_visio_url(text);
  }
}
