/**
 * Si on ajoute les anciennes classes du bnum pour les variations
 * @default true
 * @type {boolean}
 * @constant
 */
export const OLD_BNUM_MODE = true;
/**
 * Si on ajoute les classes mel-button ou non
 * @default true
 * @type {boolean}
 * @constant
 */
export const ENABLE_CLASS_BUTTON = true;
/**
 * Classe par défaut
 * @type {string}
 * @constant
 */
export const CLASS_BUTTON = OLD_BNUM_MODE ? 'mel-button' : 'bnum-button';
/**
 * Si on active les classes qui enlève les comportements par défault de l'ancienne version des thèmes
 * @default true
 * @type {boolean}
 * @constant
 */
export const ENABLE_EXTRA_CLASS_BUTTON = OLD_BNUM_MODE;
/**
 * Extra class par défaut
 * @default ['no-margin-button', 'no-button-margin']
 * @type {string[]}
 * @constant
 */
export const EXTRA_CLASSES = ['no-margin-button', 'no-button-margin'];
/**
 * Margin par défaut
 * @default 'var(--custom-button-icon-margin)'
 * @type {string}
 * @constant
 */
export const CSS_DEFAULT_MARGIN = 'var(--custom-button-icon-margin)';
/**
 * Elément qui affichera le loading
 * @default 'loading-receiver'
 * @type {string}
 * @constant
 */
export const CLASS_LOADING_RECEIVER = 'loading-receiver';
