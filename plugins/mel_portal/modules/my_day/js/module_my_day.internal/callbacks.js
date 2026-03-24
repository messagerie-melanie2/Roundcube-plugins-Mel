import { BnumLog } from '../../../../../mel_metapage/js/lib/classes/bnum_log.js';
import { awaitableTimeOut } from '../../../../../mel_metapage/js/lib/helpers/awaittimeout.js';
import { MelObject } from '../../../../../mel_metapage/js/lib/mel_object.js';

/**
 * @callback AgendaItemActionCallback
 * @return {void}
 */

/**
 * @template T
 * @callback BoundedActionCallback
 * @param {T} firstArg Premier argument envoyer par `bind`
 * @param {Event} e Evènement transmis par le listener
 * @return {void}
 */

/**
 * @typedef {import('../../../../../../skins/mel_elastic/design-system/ds-module-bnum.js').HTMLBnumSecondaryButton} HTMLBnumSecondaryButton
 */

/**
 * Utiliser dans `.bind` comme premier argument pour éviter de mettre `null`.
 * @constant
 * @todo Passer ça dans les constants
 */
const NO_THIS = null;
/**
 * Stop les propagations et le fonctionnement par défaut.
 * @param {Event} e Evènement à gérer.
 * @package
 */
function _prevent(e) {
  e.stopImmediatePropagation();
  e.stopPropagation();
  e.preventDefault();
}

/**
 * Action faite lorsque l'on clique sur l'action d'un évènement agenda sur l'accueil.
 * @param {AgendaItemActionCallback} callback Comportement de l'action (défini précédement)
 * @param {Event} e
 */
function _actionClick(callback, e) {
  _prevent(e);

  callback();
}

/**
 * Indique que l'on passe au survol sur l'action.
 * @param {HTMLBnumSecondaryButton} node
 * @param {Event} e
 */
function _actionMouseEnter(node, e) {
  _prevent(e);

  node.addOtherModes('hovered');
}

/**
 * Indique que l'on quite le survol sur l'action.
 * @param {HTMLBnumSecondaryButton} node
 * @param {Event} e
 */
function _actionMouseLeave(node, e) {
  _prevent(e);

  node.removeMode('hovered');
}

/**
 *
 * @param {*} source
 * @param {*} date
 * @param {*} event
 * @param {(args: Record<string, any>) => Record<string, any> | null } args_modifier
 * @returns
 */
async function _eventClick(source, date, event, args_modifier) {
  const FRAME = 'calendar';
  const helper = MelObject.Empty();

  let args = {
    source,
    date,
  };

  if (args_modifier) args = args_modifier(args);

  await helper.switch_frame(FRAME, { args });

  await awaitableTimeOut(async () => {
    try {
      helper
        .select_frame(FRAME)[0]
        .contentWindow.ui_cal.event_show_dialog(event);
    } catch (error) {
      await awaitableTimeOut(() => {
        try {
          helper
            .select_frame(FRAME)[0]
            .contentWindow.ui_cal.event_show_dialog(event);
        } catch (innerError) {
          BnumLog.error('_eventClick', "Impossible d'afficher l'évènement !", {
            error,
            innerError,
          });
        }
      }, 500);
    }
  }, 10);
}

/**
 * Permet de bind une fonction avec des paramètres optionel.  `ThisArg` est toujours `null`.
 * @param {Function} callback
 * @param  {...any} args
 * @returns {Function}
 */
function _bind(callback, ...args) {
  return callback.bind(NO_THIS, ...args);
}

/**
 * Renvoit l'action à faire lorsque l'on clique sur l'action d'un évènement agenda sur l'accueil.
 * @param {AgendaItemActionCallback} callback
 * @returns {BoundedActionCallback<AgendaItemActionCallback>}
 */
export function handleActionClick(callback) {
  return _bind(_actionClick, callback);
}

/**
 * Retourne la fonction qui indique que l'on passe au survol sur l'action.
 * @param {HTMLBnumSecondaryButton} node
 * @returns {BoundedActionCallback<HTMLBnumSecondaryButton>}
 */
export function handleActionMouseEnter(node) {
  return _bind(_actionMouseEnter, node);
}

/**
 * Retourne la fonction qui indique que l'on quite le survol sur l'action.
 * @param {HTMLBnumSecondaryButton} node
 * @returns {BoundedActionCallback<HTMLBnumSecondaryButton>}
 */
export function handleActionMouseLeave(node) {
  return _bind(_actionMouseLeave, node);
}

export function handleEventClick(source, date, event, args_modifier = null) {
  return _bind(_eventClick, source, date, event, args_modifier);
}
