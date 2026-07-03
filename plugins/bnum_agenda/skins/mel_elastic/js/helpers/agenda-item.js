import { HTMLBnumCardItemAgenda } from '../../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import ABaseMelObject from '../../../../../mel_metapage/js/lib/base_mel_object.js';
import { BnumLog } from '../../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { MelEnumerable } from '../../../../../mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { MelMetapage } from '../../../../../mel_metapage/js/lib/helpers/mel_metapage.js';
import { handleEventClick } from '../../../../../mel_portal/modules/my_day/js/module_my_day.internal/callbacks.js';
import { getLocationAction } from './locations.js';

function _updateRichText(event) {
  return MelMetapage.Instance.Functions.updateRichText(event.title);
}

function _getUserEmail() {
  return ABaseMelObject.Empty().get_env('mel_metapage_user_emails')?.[0];
}

function _getUserAttendee(event) {
  const email = _getUserEmail();

  if (!email) return null;

  return MelEnumerable.from(event.attendees)
    .where((x) => x.email === email)
    .firstOrDefault(null);
}

function _getTitleFormated(event) {
  let title = _updateRichText(event);

  if (event.free_busy === 'free') title = `(libre)${title}`;

  if (event.attendees !== undefined && event.attendees.length > 0) {
    const item = _getUserAttendee(event);
    if (item !== null) {
      try {
        switch (item.status) {
          case 'NEEDS-ACTION':
            title += ' (En attente)';
            break;

          case 'ACCEPTED':
            title += ' (Accepté)';
            break;

          case 'TENTATIVE':
            title += ' (Peut-être)';
            break;

          case 'CANCELLED':
            title += ' (Annulé)';
            break;

          default:
            break;
        }
      } catch (_) {
        return title;
      }
    }
  }

  return title;
}

function _addSecondaryModes(event) {
  var modes = [];

  if (event.attendees !== undefined && event.attendees.length > 0) {
    const item = _getUserAttendee(event);
    if (item !== null) {
      try {
        switch (item.status) {
          case 'NEEDS-ACTION':
          case 'ACCEPTED':
          case 'TENTATIVE':
          case 'CANCELLED':
            modes.push(item.status);
            break;

          default:
            break;
        }
      } catch (error) {
        BnumLog.warning('_addSecondaryModes', error);
      }
    }
  }

  return modes;
}

export function createAgendaItemFromEvent(event) {
  const startDate = moment(event.start).toDate();
  const endDate = moment(event.end).toDate();
  const baseDate = startDate;

  const node = HTMLBnumCardItemAgenda.Create(baseDate, startDate, endDate, {
    allDay: event.allDay,
    title: _getTitleFormated(event),
    isPrivate: event.sensitivity !== 'public',
    mode: event.free_busy,
  });

  const modes = _addSecondaryModes(event);

  if (modes.length > 0) node.addOtherModes(...modes);

  const location = getLocationAction(event, node);

  if (location.description && location.description !== EMPTY_STRING)
    node.updateLocation(location.description);

  if (location.action) node.appendChild(location.action);

  node.addEventListener(
    'click',
    handleEventClick(
      event.calendar,
      moment(event.start).startOf().toDate().getTime() / 1000.0,
      event,
    ),
  );

  return node;
}
