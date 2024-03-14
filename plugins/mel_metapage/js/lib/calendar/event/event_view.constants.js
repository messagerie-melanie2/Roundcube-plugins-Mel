/**
 * @module EventView/Constants
 */

export const FIRST_ARGUMENT = '%0';
export const ID_SELECTOR = '#';
export const CLASS_SELECTOR = '.';
export const WARNING_PANEL_SELECTOR = `${CLASS_SELECTOR}fix-panel`;
export const RECURRING_WARNING_SELECTOR = `${ID_SELECTOR}edit-recurring-warning`;
export const LOCAL_CHANGE_WARNING_SELECTOR = `${ID_SELECTOR}edit-localchanges-warning`;
export const INTERNAL_LOCAL_CHANGE_WARNING_SELECTOR = `${ID_SELECTOR}edit-internallocalchanges-warning`;
export const MAIN_FORM_SELECTOR = `${ID_SELECTOR}mel-event-form`;
export const LOADER_SELECTOR = `${ID_SELECTOR}mel-form-absolute-center-loading-event`;
export const MAIN_DIV_SELECTOR = `${ID_SELECTOR}eventedit`;
export const ATTENDEE_SELECTOR = `${CLASS_SELECTOR}mel-attendee[data-email="${FIRST_ARGUMENT}"]`
export const ATTENDEE_CONTAINER_SELECTOR = `${CLASS_SELECTOR}mel-show-attendee-container`;
export const CUSTOM_DIALOG_CLASS = 'mel-custom-event-dialog';
export const WARNING_PANEL_CLICKED_CLASS = 'clicked-from-button';
export const GUEST_DRAGG_CLASS = 'mel-guest-drag-started';
export const LISTENER_SAVE_EVENT = 'calendar.save_event';
