/**
 * Résout l'action de localisation "audio" d'un événement, si celui-ci
 * comporte un numéro ou un moyen d'appel audio.
 *
 * @param {import('../../../../../../mel_metapage/js/lib/calendar/event_location.js').EventLocation} eventLocation
 * Localisation complète de l'événement.
 * @returns {?import("../locations.js").LocationReturn} Icône, action et
 * description associées à l'audio, ou `null` si l'événement n'a pas d'audio.
 */
export function locationAudio(eventLocation) {
  if (!eventLocation.has_audio()) return null;

  return {
    icon: 'phone_in_talk',
    action: eventLocation.audio.side_action.bind(eventLocation.audio),
    description: eventLocation.audio.desc,
  };
}
