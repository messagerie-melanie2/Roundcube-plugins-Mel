///////////////////////////////////////////////////////////////////
// Agenda Modifiers
///////////////////////////////////////////////////////////////////
/* Liste des modifiers à appeler au démarrage du module Agenda. */

import { EventCopyModifer } from './modifiers/eventcopymodifier.js';

/**
 * Liste des modifiers à démarrer pour le module Agenda.
 * @type {Array<import('../amodifier.js').AAgendaModifier>}
 */
export const AGENDA_MODIFIERS = [EventCopyModifer];
