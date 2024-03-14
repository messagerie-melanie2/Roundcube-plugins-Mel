/**
 * Contient les données constantes des différentes parties de la vue.
 * @module EventView/Parts/Constants
 */

import { ID_SELECTOR } from "../event_view.constants.js";

/**
 * Tag avant les catégories de l'agenda pour celles qui sont lié à un espace de travail.
 * @constant
 * @default 'ws#'
 * @type {string}
 */
export const TAG_WSP_CATEGORY = 'ws#';
/**
 * Participant optionnel dans un évènement
 * @constant
 * @default 'OPT-PARTICIPANT'
 * @type {string}
 */
export const ROLE_ATTENDEE_OPTIONNAL = 'OPT-PARTICIPANT';
/**
 * Nombre de créneaux horaires qui seront affichés
 * @constant
 * @type {number}
 * @default 3
 */
export const MAX_SLOT = 3;
/**
 * Charactère de remplacement.
 * 
 * Il remplace des charactères problématique lors d'une convertion.
 * @constant
 * @type {string}
 * @default '¤'
 */
export const REPLACE_CHAR = '¤';
/**
 * Sépare les participants dans une chaine de caractère.
 * @constant
 * @type {string}
 * @default ','
 */
export const GUEST_SEPARATOR = ',';
/**
 * @constant
 * @type {string}
 * @default 'manually-changed'
 */
export const CLASS_MANUALLY_CHANGED = 'manually-changed';
/**
 * @constant
 * @type {string}
 * @default 'edit-attendees-donotify'
 */
export const CHECK_BOX_NOTIFY = 'edit-attendees-donotify';
/**
 * @constant
 * @type {string}
 * @default '#edit-attendees-donotify'
 */
export const SELECTOR_CHECKBOX_NOTIFY = `${ID_SELECTOR}${CHECK_BOX_NOTIFY}`;
/**
 * @constant
 * @string
 */
export const LOCATION_SEPARATOR = String.fromCharCode('8199');