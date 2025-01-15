import { EMPTY_STRING } from '../../../mel_metapage/js/lib/constants/constants.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';

/**
 * Données constantes de la visio
 * @module Visio/Constants
 */

// #region Selectors
/**
 * Selecteur du bouton entrer
 * @default '#webconf-enter'
 * @type {string}
 * @const
 */
export const SELECTOR_BUTTON_START = '#webconf-enter';
/**
 * Selecteur du bouton quitter
 * @default '#quit-modal'
 * @type {string}
 * @const
 */
export const SELECTOR_BUTTON_QUIT = '#quit-modal';
/**
 * Selecteur de la checkbox de la liaison des espaces à la visio
 * @default '#wsp-yes'
 * @type {string}
 * @const
 */
export const SELECTOR_CHECKBOX_CHANNEL = '#wsp-yes';
/**
 * Selecteur de la div de la visio
 * @default '.webconf-wsp'
 * @type {string}
 * @const
 */
export const SELECTOR_DIV_WSP = '.webconf-wsp';
/**
 * Selecteur de la div de tchat
 * @default '.webconf-ariane'
 * @type {string}
 * @const
 */
export const SELECTOR_DIV_CHANNEL = '.webconf-ariane';
/**
 * Selecteur de la checkbox du mot de passe
 * @default '#visio-pass'
 * @type {string}
 * @const
 */
export const SELECTOR_CHECKBOX_PASSWORD = '#visio-pass';
/**
 * Selecteur du formulaire du mot de passe
 * @default '#form-mel-visio-pass'
 * @type {string}
 * @const
 */
export const SELECTOR_FORM_PASSWORD = '#form-mel-visio-pass';
/**
 * Selecteur de l'input du mot de passe
 * @default '#webconf-room-pass'
 * @type {string}
 * @const
 */
export const SELECTOR_PASS_INPUT = '#webconf-room-pass';
/**
 * Selecteur de l'input de la clé de la room
 * @default '#webconf-room-name'
 * @type {string}
 * @const
 */
export const SELECTOR_KEY_INPUT = '#webconf-room-name';
// #endregion
// #region Autres variables
/**
 * Clé qui permet de définir une visio lié avec un channel privé
 * @default '/group'
 * @type {string}
 * @const
 * @deprecated
 */
export const private_key = '/group';
/**
 * Clé d'un channel de tchat public
 * @default 'channel'
 * @type {string}
 * @const
 * @deprecated
 */
export const public_room = 'channel';
/**
 * Clé d'un channel de tchat privé
 * @default 'group'
 * @type {string}
 * @const
 * @deprecated
 */
export const private_room = 'group';
/**
 * Taille lorsque la visio est minifiée
 * @default 340
 * @type {number}
 * @const
 */
export const right_item_size = 340;
/**
 * Classe à ajouter au html parent lorsque la visio a commencée
 * @default 'webconf-started'
 * @type {string}
 * @const
 */
export const class_to_add_to_top = 'webconf-started';
/**
 * Nombre de rectangles pour visualiser une entrée audio
 * @default 16
 * @type {number}
 * @const
 */
export const visualValueCount = 16;
/**
 * Url de l'audio pour tester les sorties audios
 * @type {string}
 * @const
 */
export const audiourltotest =
  MelObject.Url(EMPTY_STRING).split('?')[0] +
  'plugins/mel_metapage/skins/elastic/audio/test.mp3';
// #endregion
