/**
 *
 * @param {import('../../../../../../mel_metapage/js/lib/calendar/event_location.js').EventLocation} eventLocation
 * @return {?import("../locations.js").LocationReturn}
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
