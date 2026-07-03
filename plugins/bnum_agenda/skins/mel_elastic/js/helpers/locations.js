/**
 * @typedef LocationReturn
 * @property {string} icon
 * @property {Function} action
 * @property {string} description
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

const LOCATIONS_ACTIONS = [locationVisio, locationAudio];

/**
 *
 * @param {LocationReturn} result
 * @param {EventLocation} location
 */
function _getDescription(result, location) {
  if (location.locations.length > 1) {
    result.description += ' ...';
  }

  return result.description;
}
/**
 * @param {LocationReturn} result
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
 * @param {LocationReturn} result
 */
function _haveAction(result) {
  return !!(result.icon && result.action);
}

/**
 *
 * @param {*} event
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
