/**
 * @module EventView/Constants
 */

/**
 * @constant
 * @type {string}
 * @default '%0'
 */
export const FIRST_ARGUMENT = '%0';
/**
 * @constant
 * @type {string}
 * @default '#'
 */
export const ID_SELECTOR = '#';
/**
 * @constant
 * @type {string}
 * @default '.'
 */
export const CLASS_SELECTOR = '.';
/**
 * @constant
 * @type {string}
 * @default '#fix-panel'
 */
export const WARNING_PANEL_SELECTOR = `${CLASS_SELECTOR}fix-panel`;
/**
 * @constant
 * @type {string}
 * @default '#edit-recurring-warning'
 */
export const RECURRING_WARNING_SELECTOR = `${ID_SELECTOR}edit-recurring-warning`;
/**
 * @constant
 * @type {string}
 * @default '#edit-localchanges-warning'
 */
export const LOCAL_CHANGE_WARNING_SELECTOR = `${ID_SELECTOR}edit-localchanges-warning`;
/**
 * @constant
 * @type {string}
 * @default '#edit-internallocalchanges-warning'
 */
export const INTERNAL_LOCAL_CHANGE_WARNING_SELECTOR = `${ID_SELECTOR}edit-internallocalchanges-warning`;
/**
 * @constant
 * @type {string}
 * @default '#mel-event-form'
 */
export const MAIN_FORM_SELECTOR = `${ID_SELECTOR}mel-event-form`;
/**
 * @constant
 * @type {string}
 * @default '#mel-form-absolute-center-loading-event'
 */
export const LOADER_SELECTOR = `${ID_SELECTOR}mel-form-absolute-center-loading-event`;
/**
 * @constant
 * @type {string}
 * @default '#eventedit'
 */
export const MAIN_DIV_SELECTOR = `${ID_SELECTOR}eventedit`;
/**
 * @constant
 * @type {string}
 * @default '.mel-attendee[data-email="%0"]'
 */
export const ATTENDEE_SELECTOR = `${CLASS_SELECTOR}mel-attendee[data-email="${FIRST_ARGUMENT}"]`
/**
 * @constant
 * @type {string}
 * @default '.mel-show-attendee-container'
 */
export const ATTENDEE_CONTAINER_SELECTOR = `${CLASS_SELECTOR}mel-show-attendee-container`;
/**
 * @constant
 * @type {string}
 * @default 'mel-custom-event-dialog'
 */
export const CUSTOM_DIALOG_CLASS = 'mel-custom-event-dialog';
/**
 * @constant
 * @type {string}
 * @default 'clicked-from-button'
 */
export const WARNING_PANEL_CLICKED_CLASS = 'clicked-from-button';
/**
 * @constant
 * @type {string}
 * @default 'mel-guest-drag-started'
 */
export const GUEST_DRAGG_CLASS = 'mel-guest-drag-started';
/**
 * @constant
 * @type {string}
 * @default 'calendar.save_event'
 */
export const LISTENER_SAVE_EVENT = 'calendar.save_event';
