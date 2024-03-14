/**
 * @module Constants/RegEx
 */

/**
 * RegEx qui permet de trouver les url dans un text
 * @constant
 * @type {RegExp}
 */
export const REG_URL = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
/**
 * RegEx qui permet de récupérer les textes entre parenthèses
 * @constant
 * @type {RegExp}
 */
export const REG_BETWEEN_PARENTHESIS = /\((.*?)\)/gi;