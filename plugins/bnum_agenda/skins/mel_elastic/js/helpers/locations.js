/**
 * Résultat de la résolution de la localisation d'un événement,
 * utilisé pour construire l'affichage (description) et l'éventuelle
 * action associée (ex. rejoindre une visio) dans l'agenda.
 *
 * @typedef LocationReturn
 * @property {string} icon Nom de l'icône associée à l'action.
 * @property {Function} action Fonction à exécuter lors du déclenchement de l'action.
 * @property {string} description Description textuelle de la localisation.
 */

import {
  ButtonVariation,
  HTMLBnumSecondaryButton,
} from '../../../../../../skins/mel_elastic/design-system/ds-module-bnum';
import { EventLocation } from '../../../../../mel_metapage/js/lib/calendar/event_location';
import {
  handleActionClick,
  handleActionMouseEnter,
  handleActionMouseLeave,
} from '../../../../../mel_portal/modules/my_day/js/module_my_day.internal/callbacks';
import { locationAudio } from './locations/audio_locations.js';
import { locationVisio } from './locations/visio-location.js';

/**
 * Liste ordonnée des résolveurs de localisation à essayer, du plus
 * spécifique au plus générique (visio, puis audio). Le premier résolveur
 * retournant un résultat non nul est utilisé.
 *
 * @type {Function[]}
 * @constant
 */
const LOCATIONS_ACTIONS = [locationVisio, locationAudio];

/**
 * Complète la description de la localisation avec une indication
 * de localisations multiples, si l'événement en comporte plusieurs.
 *
 * @param {LocationReturn} result Résultat de localisation en cours de construction.
 * @param {EventLocation} location Localisation complète de l'événement.
 * @returns {string} Description complétée de la localisation.
 */
function _getDescription(result, location) {
  if (location.locations.length > 1) {
    result.description += ' ...';
  }

  return result.description;
}

/**
 * Génère le bouton d'action associé à la localisation (ex. rejoindre
 * une visio ou un appel audio), avec ses gestionnaires de clic et de survol.
 *
 * @param {LocationReturn} result Résultat de localisation contenant l'icône et l'action.
 * @param {HTMLElement} node Élément d'agenda auquel l'action est associée
 * (utilisé pour les effets de survol).
 * @returns {HTMLBnumSecondaryButton} Bouton d'action prêt à être inséré dans le DOM.
 */
function _generateAction(result, node) {
  const action = HTMLBnumSecondaryButton.CreateOnlyIcon(result.icon, {
    variation: ButtonVariation.SECONDARY,
    rounded: true,
  });

  action.setAttribute('slot', 'action');
  action.addEventListeners({
    click: handleActionClick(result.action),
    mouseenter: handleActionMouseEnter(node),
    mouseleave: handleActionMouseLeave(node),
  });

  return action;
}

/**
 * Indique si le résultat de localisation comporte une action utilisable
 * (icône et fonction d'action toutes deux définies).
 *
 * @param {LocationReturn} result Résultat de localisation à vérifier.
 * @returns {boolean} `true` si une action peut être générée.
 */
function _haveAction(result) {
  return !!(result.icon && result.action);
}

/**
 * Résout la localisation d'un événement et construit, le cas échéant,
 * la description et l'action associées (visio, audio, ou localisation
 * simple par défaut).
 *
 * @param {object} event Événement du calendrier dont on souhaite résoudre la localisation.
 * @param {HTMLElement} node Élément d'agenda auquel l'action éventuelle sera associée.
 * @returns {{description: ?string, action: ?HTMLBnumSecondaryButton}} Description
 * textuelle et action de localisation, ou `{ description: null, action: null }`
 * si l'événement n'a pas de localisation.
 */
export function getLocationAction(event, node) {
  const location = new EventLocation(event);

  if (!location.has()) return { description: null, action: null };

  let result;
  for (const action of LOCATIONS_ACTIONS) {
    result = action(location);

    if (result) break;
  }

  if (!result)
    result = {
      description: location.locations[0].location,
    };

  const description = _getDescription(result, location);

  const action = _haveAction(result) ? _generateAction(result, node) : null;

  return {
    description,
    action,
  };
}
