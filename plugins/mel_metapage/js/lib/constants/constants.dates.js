/**
 * Contient les constantes lié aux dates
 * @module Constants/Dates
 */

/**
 * Format de date pour l'heure
 * @constant
 * @type {string}
 * @default 'HH:mm'
 */
export const DATE_HOUR_FORMAT = 'HH:mm';
/**
 * Format de la date
 * @constant
 * @type {string}
 * @default 'DD/MM/YYYY'
 */
export const DATE_FORMAT = 'DD/MM/YYYY';
/**
 * Format de la date et de l'heure
 * @constant
 * @type {string}
 * @default 'DD/MM/YYYY HH:mm'
 */
export const DATE_TIME_FORMAT = `${DATE_FORMAT} ${DATE_HOUR_FORMAT}`;