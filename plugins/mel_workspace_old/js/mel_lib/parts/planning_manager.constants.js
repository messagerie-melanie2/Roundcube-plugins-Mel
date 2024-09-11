/**
 * @module PlanningManager/Constants
 */
/////////////// CONFIG /////////////
/**
 * Valeur qui sera lié à la donnée qui sera en premier dans l'ordre des ressources.
 * @constant
 * @type {string}
 * @default 'A'
 */
export const CONFIG_FIRST_LETTER = 'A';
//////////////   ID /////////////////
/**
 * ID du loader de planning.
 * @constant
 * @type {string}
 * @default 'planningmelloader'
 */
export const ID_LOADER = 'planningmelloader';
/**
 * ID de l'arrière plan du loader.
 * @constant
 * @type {string}
 * @default 'planningblackloader'
 */
export const ID_BACKGROUND_LOADER = 'planningblackloader';
/**
 * ID de la ressource lié aux évènements de l'espace de travail dans fullcalendar
 * @constant
 * @type {string}
 * @default 'wsp'
 */
export const ID_RESOURCES_WSP = 'wsp';
//////////////  SELECTORS ////////////////
/**
 * Sélecteur de la div qui contient les boutons de navigations, la date et le planning
 * @constant
 * @type {string}
 * @default '#wsp-block-calendar'
 */
export const SELECTOR_BLOCK = '#wsp-block-calendar';
/**
 * Sélecteur du contenu du block qui contient le fullcalendar
 * @constant
 * @type {string}
 * @default '#wsp-block-calendar .block-body'
 */
export const SELECTOR_BLOCK_BODY = `${SELECTOR_BLOCK} .block-body`;
/**
 * Sélecteur des boutons de navigations du planning
 * @constant
 * @type {string}
 * @default '#wsp-block-calendar .block-header .btn-arrow'
 */
export const SELECTOR_BTN_NAVIGATORS = `${SELECTOR_BLOCK} .block-header .btn-arrow`;
/**
 * Sélecteur des boutons de l'entête du planning
 * @constant
 * @type {string}
 * @default '#wsp-block-calendar .block-header button'
 */
export const SELECTOR_HEADER_BTNS = `${SELECTOR_BLOCK} .block-header button`;
/**
 * Sélecteur du texte de la date en cours
 * @constant
 * @type {string}
 * @default '#wsp-block-calendar .swp-agenda-date'
 */
export const SELECTOR_PLANNING_CURRENT_DATE = `${SELECTOR_BLOCK} .swp-agenda-date`;
/**
 * Sélecteur de l'icone de l'agenda
 * @constant
 * @type {string}
 * @default '#wsp-block-calendar .wsp-agenda-icon'
 */
export const SELECTOR_PLANNING_ICON = `${SELECTOR_BLOCK} .wsp-agenda-icon`;
/**
 * Sélecteur du bouton de reset de le recherche
 * @constant
 * @type {string}
 * @default '#melplanningbtn'
 */
export const SELECTOR_SEARCH_RESET_BUTTON = '#melplanningbtn';
/**
 * Sélecteur de l'icone de recherche
 * @constant
 * @type {string}
 * @default '#melplanningiconsearch'
 */
export const SELECTOR_SEARCH_ICON = '#melplanningiconsearch';
/**
 * Sélecteur de l'input de recherche
 * @constant
 * @type {string}
 * @default '#planning-filter'
 */
export const SELECTOR_SEARCH_INPUT = '#planning-filter';
/**
 * Sélecteur du bouton "Aujourd'hui"
 * @constant
 * @type {string}
 * @default '#planning-today-btn'
 */
export const SELECTOR_TODAY_BUTTON = '#planning-today-btn';
/**
 * Sélecteur du bouton de sélecteur de date
 * @constant
 * @type {string}
 * @default '#ojdbtn'
 */
export const SELECTOR_CHOOSE_DATE_BUTTON = '#ojdbtn';
/**
 * Sélecteur de la date fullcalendar
 * @constant
 * @type {string}
 * @default '#wsp-block-calendar .fc-left h2'
 */
export const SELECTOR_FULLCALENDAR_DATE = `${SELECTOR_BLOCK} .fc-left h2`;
