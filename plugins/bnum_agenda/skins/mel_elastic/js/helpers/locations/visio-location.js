/**
 * Résout l'action de localisation "visio" d'un événement, si celui-ci
 * comporte une visioconférence.
 *
 * @param {import('../../../../../../mel_metapage/js/lib/calendar/event_location.js').EventLocation} eventLocation
 * Localisation complète de l'événement.
 * @returns {?import("../locations.js").LocationReturn} Icône, action et
 * description associées à la visio, ou `null` si l'événement n'a pas de visio.
 */
export function locationVisio(eventLocation) {
  if (!eventLocation.has_visio()) return null;

  return {
    icon: 'video_camera_front',
    action: eventLocation.visio.side_action.bind(eventLocation.visio),
    description: eventLocation.visio._get_description(
      eventLocation.locations.length,
    ),
  };
}
