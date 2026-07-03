/**
 *
 * @param {import('../../../../../../mel_metapage/js/lib/calendar/event_location.js').EventLocation} eventLocation
 * @return {?import("../locations.js").LocationReturn}
 */
export function locationAudio(eventLocation) {
  if (!eventLocation.has_audio()) return null;

  return {
    icon: 'phone_in_talk',
    action: eventLocation.audio.side_action.bind(eventLocation.audio),
    description: eventLocation.audio.desc,
  };
}
