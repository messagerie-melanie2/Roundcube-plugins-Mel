/**
 * @module Constants/RegEx
 */

/**
 * RegEx qui permet de trouver les url dans un text
 * @constant
 * @type {RegExp}
 * @default /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
 */
export const REG_URL =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
/**
 * RegEx qui permet de récupérer les textes entre parenthèses
 * @constant
 * @type {RegExp}
 * @default /\((.*?)\)/gi
 */
export const REG_BETWEEN_PARENTHESIS = /\((.*?)\)/gi;
/**
 * RegEx qui permet de récupérer un chiffre
 * @constant
 * @type {RegExp}
 * @default /\d/
 */
export const REG_NUMBER = /\d/;
/**
 * RegEx qui permet de récupérer les chiffres d'un texte
 * @constant
 * @type {RegExp}
 * @default /\d/g
 */
export const REG_NUMBERS = /\d/g;
/**
 * RegEx qui permet de vérifier si un texte possède uniquement des charactères alphanumériques.
 * @constant
 * @type {RegExp}
 * @default /^[0-9a-zA-Z]+$/
 */
export const REG_ALPHANUM = /^[0-9a-zA-Z]+$/;
export const ISO_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
