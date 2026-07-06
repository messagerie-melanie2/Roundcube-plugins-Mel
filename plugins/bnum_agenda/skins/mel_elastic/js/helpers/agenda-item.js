import { HTMLBnumCardItemAgenda } from '../../../../../../skins/mel_elastic/design-system/ds-module-bnum.js';
import ABaseMelObject from '../../../../../mel_metapage/js/lib/base_mel_object.js';
import { BnumLog } from '../../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { MelEnumerable } from '../../../../../mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { MelMetapage } from '../../../../../mel_metapage/js/lib/helpers/mel_metapage.js';
import { handleEventClick } from '../../../../../mel_portal/modules/my_day/js/module_my_day.internal/callbacks.js';
import { getLocationAction } from './locations.js';

/**
 * Applique la mise en forme "rich text" au titre de l'événement.
 *
 * @param {object} event Événement du calendrier.
 * @returns {string} Titre de l'événement mis en forme.
 */
function _updateRichText(event) {
  return MelMetapage.Instance.Functions.updateRichText(event.title);
}

/**
 * Récupère l'adresse e-mail de l'utilisateur courant depuis
 * l'environnement Roundcube.
 *
 * @returns {?string} L'adresse e-mail de l'utilisateur, ou `null`/`undefined`
 * si elle n'est pas définie.
 */
function _getUserEmail() {
  return ABaseMelObject.Empty().get_env('mel_metapage_user_emails')?.[0];
}

/**
 * Recherche, parmi les participants de l'événement, celui correspondant
 * à l'utilisateur courant.
 *
 * @param {object} event Événement du calendrier.
 * @returns {?object} Le participant correspondant à l'utilisateur courant,
 * ou `null` si l'adresse e-mail est inconnue ou si aucun participant
 * ne correspond.
 */
function _getUserAttendee(event) {
  const email = _getUserEmail();

  if (!email) return null;

  return MelEnumerable.from(event.attendees)
    .where((x) => x.email === email)
    .firstOrDefault(null);
}

/**
 * Construit le titre affiché de l'événement, en y ajoutant :
 * - la mention "(libre)" si l'événement est en disponibilité libre ;
 * - le statut de participation de l'utilisateur courant, le cas échéant
 * (en attente, accepté, peut-être, annulé).
 *
 * @param {object} event Événement du calendrier.
 * @returns {string} Titre formaté de l'événement.
 */
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

/**
 * Détermine les modes secondaires à afficher sur l'élément d'agenda,
 * en fonction du statut de participation de l'utilisateur courant.
 *
 * @param {object} event Événement du calendrier.
 * @returns {string[]} Liste des modes secondaires à afficher (peut être vide).
 */
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

/**
 * Crée un élément d'agenda (`HTMLBnumCardItemAgenda`) à partir d'un
 * événement de calendrier.
 *
 * Construit le nœud avec ses dates, son titre formaté, ses modes
 * secondaires (statut de participation) et son éventuelle action de
 * localisation (visio, audio, etc.), puis y attache le gestionnaire
 * de clic permettant d'ouvrir l'événement.
 *
 * @param {object} event Événement du calendrier à représenter.
 * @returns {HTMLBnumCardItemAgenda} Élément d'agenda prêt à être inséré
 * dans le DOM.
 */
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
