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
 * @type {string}
 * @default String.fromCharCode('8199')
 */
export const LOCATION_SEPARATOR = String.fromCharCode('8199');
export const LOCATION_VISIO_OPTION_VALUE = 'visio';
export const LOCATION_VISIO_INTERNAL_OPTION_VALUE = 'visio-internal';
export const LOCATION_VISIO_EXTERNAL_OPTION_VALUE = 'visio-external';
export const LOCATION_AUDIO_OPTION_VALUE = 'audio';
export const LOCATION_OPTION_VALUE = 'location';
export const SEPARATOR_LOCATION_VISIO_INTEGRATED_PHONE = ' (';
export const SEPARATOR_END_LOCATION_VISIO_INTEGRATED_PHONE = ')';
export const SEPARATOR_LOCATION_VISIO_INTEGRATED_PIN_PHONE = ' | ';
export const INTEGRATED_VISIO_MIN_SIZE = 10;
export const INTEGRATED_VISIO_MIN_NUMBER_COUNT = 3;
export const SEPARATOR_AUDIO_URL_LOCATION = ' : ';
export const SEPARATOR_AUDIO_PIN = ' | ';