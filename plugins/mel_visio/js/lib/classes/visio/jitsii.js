import { MelEnumerable } from '../../../../../mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events.js';
import { Mel_Promise } from '../../../../../mel_metapage/js/lib/mel_promise.js';

export { JitsiAdaptor, ESourceType, EUserRole };

/**
 * Contient les classes utiles à la communication avec Jitsi
 * @module Visio/Jitsi
 * @local JitsiAdaptor
 * @local MutedStatus
 * @local VideoMuteStatusChangedCallback
 * @local VisibilityStatus
 * @local VisibilityStatusChangedCallback
 * @local MouseEventStructure
 * @local EventMouse
 * @local ChatUpdated
 * @local ChatUpdatedCallback
 * @local EnabledStatus
 * @local TileViewChangedCallback
 * @local VideoConferenceJoined
 * @local VideoConferenceJoinedCallback
 * @local ESourceType
 * @local ScreenSharingDetails
 * @local ScreenSharingObject
 * @local ScreenSharingStatusChangedCallback
 * @local EUserRole
 * @local Participant
 * @local Room
 * @local ResponseRooms
 * @local Device
 * @local DeviceEx
 * @local DevicesObject
 * @local CurrentDevicesObject
 */

/**
 * @typedef Participant
 * @property {string} id
 * @property {string} jid
 * @property {EUserRole} role
 * @property {string} displayName
 */

/**
 * @typedef Room
 * @property {boolean} isMainRoom,
 * @property {string} id
 * @property {string} jid
 * @property {Participant[]} participants
 * @frommoduleproperty Visio/Jitsi participants {@linkto Participant}
 */

/**
 * @typedef ResponseRooms
 * @property {Room[]} rooms
 * @frommoduleproperty Visio/Jitsi rooms {@linkto Room}
 */

/**
 * @typedef DeviceEx
 * @property {string} deviceId
 * @property {string} groupId
 * @property {string} kind
 * @property {string} label
 * @property {boolean} isCurrent
 */

/**
 * @typedef Device
 * @property {string} deviceId
 * @property {string} groupId
 * @property {string} kind
 * @property {string} label
 */

/**
 * @typedef DevicesObject
 * @property {Device[]} audioInput
 * @property {Device[]} audioOutput
 * @property {Device[]} videoInput
 */

/**
 * @typedef CurrentDevicesObject
 * @property {Device} audioInput
 * @property {Device} audioOutput
 * @property {Device} videoInput
 */

/**
 * @typedef MutedStatus
 * @property {boolean} muted
 */

/**
 * @typedef VisibilityStatus
 * @property {boolean} visible
 */

/**
 * @typedef EnabledStatus
 * @property {boolean} enabled
 */

/**
 * @typedef MouseEventStructure
 * @property {number} clientX
 * @property {number} clientY
 * @property {number} movementX
 * @property {number} movementY
 * @property {number} offsetX
 * @property {number} offsetY
 * @property {number} pageX
 * @property {number} pageY
 * @property {number} x
 * @property {number} y
 * @property {number} screenX
 * @property {number} screenY
 */

/**
 * @typedef EventMouse
 * @property {MouseEventStructure} event
 */

/**
 * @typedef ChatUpdated
 * @property {boolean} isOpen Si le tchat est ouvert ou non
 * @property {number} unreadCount Si il y a des messages non-lu
 */

/**
 * @typedef VideoConferenceJoined
 * @property {string} roomName Nom de la salle
 * @property {string} id Id du participant
 * @property {string} displayName Nom du participant
 * @property {string} avatarURL Url de l'avatr du participant
 * @property {boolean} breakoutRoom Si la salle est une sous salle ou non
 * @property {boolean} visitor Si l'utilisateur est un visiteur ou non
 */

/**
 * @typedef RaiseHand
 * @property {string} id Id de l'utilisateur qui à lever/baisser la main
 * @property {number} handRaised 0 quand la main est baissé, timestamp sinon
 */

/**
 * @typedef ScreenSharingDetails
 * @property {ESourceType | undefined} sourceType
 */

/**
 * @typedef ScreenSharingObject
 * @property {boolean} on Si le partage d'écran est actif ou non
 * @property {ScreenSharingDetails} details Où le partage à lieu, si c'est connu
 */

/**
 * @callback MuteStatusChangedCallback
 * @param {MutedStatus} status Nouveau status
 * @return {void}
 */

/**
 * @callback VisibilityStatusChangedCallback
 * @param {VisibilityStatus} status Nouvelle visibilitée
 * @return {void}
 */

/**
 * @callback MouseMoveCallback
 * @param {EventMouse} obj Données de la souris
 * @return {void}
 */

/**
 * @callback ChatUpdatedCallback
 * @param {ChatUpdated} obj Données du tchat
 * @return {void}
 */

/**
 * @callback TileViewChangedCallback
 * @param {EnabledStatus} obj
 * @return {void}
 */

/**
 * @callback VideoConferenceJoinedCallback
 * @param {VideoConferenceJoined} obj
 * @return {void}
 */

/**
 * @callback RaiseHandUpdatedCallback
 * @param {RaiseHand} obj
 * @return {void}
 */

/**
 * @callback ScreenSharingStatusChangedCallback
 * @param {ScreenSharingObject} obj
 * @return {void}
 */

/**
 * @class
 * @classdesc Gère les actions et les listeners avec l'api de Jitsi
 */
class JitsiAdaptor {
  /**
   * Lie la visio a jitsi
   * @param {external:JitsiMeetExternalAPI} jitsi Jitsi Api
   */
  constructor(jitsi) {
    /**
     * Api
     * @type {external:JitsiMeetExternalAPI}
     * @package
     */
    this._jitsi = jitsi;
    /**
     * Mot de passe de la visio
     * @type {?string}
     * @package
     */
    this._password = null;

    this.on_video_conference_left = new BnumEvent();

    /**
     * Est appelé lorsque la caméra est activé/désactivé
     * @type {BnumEvent<MuteStatusChangedCallback>}
     * @event
     * @frommodule Visio/Jitsi {@linkto MuteStatusChangedCallback}
     */
    this.on_video_mute_status_changed = new BnumEvent();
    /**
     * Est appelé lorsque le micro est activé/désactivé
     * @type {BnumEvent<MuteStatusChangedCallback>}
     * @event
     * @frommodule Visio/Jitsi {@linkto MuteStatusChangedCallback}
     */
    this.on_audio_mute_status_changed = new BnumEvent();
    /**
     * Est appelé lorsque la liste des utilisateurs est affichée ou non
     * @type {BnumEvent<VisibilityStatusChangedCallback>}
     * @event
     * @frommodule Visio/Jitsi {@linkto VisibilityStatusChangedCallback}
     */
    this.on_film_strip_display_changed = new BnumEvent();
    /**
     * Est appelé lorsque la souris se déplace dans la frame de la visio
     * @type {BnumEvent<MouseMoveCallback>}
     * @event
     * @frommodule Visio/Jitsi {@linkto MouseMoveCallback}
     */
    this.on_mouse_move = new BnumEvent();
    /**
     * Est appelé lorsque le chat est ouvert/fermé et quand il y a des messages non-lu
     * @type {BnumEvent<ChatUpdatedCallback>}
     * @event
     * @frommodule Visio/Jitsi {@linkto ChatUpdatedCallback}
     */
    this.on_chat_updated = new BnumEvent();
    //this.on_chat_updated = new BnumEvent();
    /**
     * Est appelé lorsque la mosaïque est activée/désactivée
     * @type {BnumEvent<TileViewChangedCallback>}
     * @event
     * @frommodule Visio/Jitsi {@linkto TileViewChangedCallback}
     */
    this.on_tile_view_updated = new BnumEvent();
    /**
     * Est appelé lorsque la visio est complètement arretée
     * @type {BnumEvent<Function>}
     * @event
     */
    this.on_ready_to_close = new BnumEvent();
    /**
     * Est appelé lorsque la visio à besoin d'un mot de passe pour commencer
     * @type {BnumEvent<Function>}
     * @event
     */
    this.on_password_required = new BnumEvent();
    /**
     * Est appelé lorsqu'une personne rentre dans la visio
     * @type {BnumEvent<VideoConferenceJoinedCallback>}
     * @event
     * @frommodule Visio/Jitsi {@linkto VideoConferenceJoinedCallback}
     */
    this.on_video_conference_joined = new BnumEvent();
    /**
     * Est appelé lorsqu'une personne lève ou baisse la main
     * @type {BnumEvent<RaiseHandUpdatedCallback>}
     * @event
     * @frommodule Visio/Jitsi {@linkto RaiseHandUpdatedCallback}
     */
    this.on_raise_hand_updated = new BnumEvent();
    /**
     * Est appelé lorsque l'écran est partagé ou non
     * @type {BnumEvent<ScreenSharingStatusChangedCallback>}
     * @event
     * @frommodule Visio/Jitsi {@linkto ScreenSharingStatusChangedCallback}
     */
    this.on_share_screen_status_changed = new BnumEvent();

    this._init_listeners();
  }

  /**
   * Si un mot de passe a été défini
   * @returns {boolean}
   */
  has_password() {
    return !!(this._password || false);
  }

  /**
   * Récupère l'id de l'utilisateur en cours
   * @returns {Promise<string>}
   * @async
   */
  async get_user_id() {
    await Mel_Promise.wait(
      () => !!this._jitsi._myUserID && this._jitsi._myUserID !== EMPTY_STRING,
    );

    return this._jitsi._myUserID;
  }

  /**
   * Change l'url de l'avatar
   * @param {string} url Url de l'avatar ou données de l'image
   */
  change_avatar(url) {
    this._jitsi.executeCommand('avatarUrl', url);
  }

  /**
   * Envoi un message dans le tchat
   * @param {string} text Message à envoyer
   */
  send_message(text) {
    this._jitsi.executeCommand('sendChatMessage', text, EMPTY_STRING, true);
  }

  /**
   * Récupère le rôle de l'utilisateur
   * @returns {Promise<?EUserRole>}
   * @async
   * @frommodulereturn Visio/Jitsi {@linkto EUserRole}
   */
  async get_role() {
    var user;
    const [id, rooms] = (
      await Promise.allSettled([this.get_user_id(), this.get_rooms_info()])
    ).map((x) => x.value);

    for (const room of rooms.rooms) {
      for (const participant of room.participants) {
        if (participant.id === id) {
          user = participant;
          break;
        }
      }

      if (user) break;
    }

    return user?.role;
  }

  /**
   * Si l'utilisateur en cours est modérateur de la room ou non
   * @returns {Promise<boolean>}
   * @async
   */
  async is_moderator() {
    return (await this.get_role()) === EUserRole.moderator; //'moderator';
  }

  /**
   * Défini le nouveau mot de passe de la visio
   * @param {string} password Mot de passe
   * @async
   */
  async set_password(password) {
    if (await this.is_moderator()) {
      this._jitsi.executeCommand('password', password);

      if (password === EMPTY_STRING) password = null;

      this._password = password;
    }
  }

  /**
   * Récupère les informations des salles
   * @returns {Promise<ResponseRooms>}
   * @async
   * @frommodulereturn Visio/Jitsi {@linkto ResponseRooms}
   */
  async get_rooms_info() {
    return await this._jitsi.getRoomsInfo();
  }

  /**
   * Si la video est désactivée
   * @returns {Promise<boolean>}
   * @async
   */
  async is_video_muted() {
    return await this._jitsi.isVideoMuted();
  }

  /**
   * Si le micro est désactivé
   * @returns {Promise<boolean>}
   * @async
   */
  async is_audio_muted() {
    return await this._jitsi.isAudioMuted();
  }

  /**
   * Change d'état la caméra
   */
  toggle_video() {
    this._jitsi.executeCommand('toggleVideo');
  }

  /**
   * Change d'état le micro
   */
  toggle_micro() {
    this._jitsi.executeCommand('toggleAudio');
  }

  /**
   * Active ou désactive le partage d'écran
   */
  share_screen() {
    this._jitsi.executeCommand('toggleShareScreen');
  }

  /**
   * Active ou désactive la mosaïque
   * @deprecated Utilisez plutôt toggle_tile_view
   */
  toggle_film_strip() {
    this._jitsi.executeCommand('toggleTileView');
  }

  /**
   * Active ou désactive la mosaïque
   */
  toggle_tile_view() {
    this._jitsi.executeCommand('toggleTileView');
  }

  /**
   * Lève ou baisse la main
   */
  toggle_hand() {
    this._jitsi.executeCommand('toggleRaiseHand');
  }

  /**
   * Affiche ou ferme le tchat
   */
  toggle_chat() {
    this._jitsi.executeCommand('toggleChat');
  }

  /**
   * Ouvre le gestionnaire d'arrière plan
   */
  open_virtual_background() {
    this._jitsi.executeCommand('toggleVirtualBackgroundDialog');
  }

  /**
   * Commencer un tchat privé
   * @param {string} id Id du participant
   */
  initiate_private_chat(id) {
    this._jitsi.executeCommand('initiatePrivateChat', id);
  }

  /**
   * Check si la fenêtre des participants est ouverte ou non
   * @returns {Promise<boolean>}
   * @async
   */
  async is_participants_pane_open() {
    return await this._jitsi.isParticipantsPaneOpen();
  }

  /**
   * Affiche ou ferme la fenêtre des participants
   * @returns {Promise<{old_state:boolean, new_state:boolean}>} Ancien et nouvel état
   * @async
   */
  async toggle_participants_pane() {
    const state = await this.is_participants_pane_open();

    this.set_participants_pane_state(!state);

    return { old_state: state, new_state: !state };
  }

  /**
   * Affiche ou ferme la fenêtre des participants
   * @param {boolean} state true = ouvert, false = fermé
   */
  set_participants_pane_state(state) {
    this._jitsi.executeCommand('toggleParticipantsPane', state);
  }

  /**
   * Récupère les inputs et outputs disponibles
   * @returns {Promise<DevicesObject>}
   * @frommodulereturn Visio/Jitsi {@linkto DevicesObject}
   * @async
   */
  async get_available_devices() {
    return await this._jitsi.getAvailableDevices();
  }

  /**
   * Récupère les inputs et outputs séléctionnés
   * @returns {Promise<CurrentDevicesObject>}
   * @async
   * @frommodulereturn Visio/Jitsi {@linkto CurrentDevicesObject}
   */
  async get_current_devices() {
    return await this._jitsi.getCurrentDevices();
  }

  /**
   * Récupère les input et les output audio.
   * @returns {Promise<Array<DeviceEx>>}
   * @async
   * @frommodulereturn Visio/Jitsi {@linkto DeviceEx}
   */
  async get_micro_and_audio_devices() {
    var [devices, current_devices] = (
      await Promise.allSettled([
        this.get_available_devices(),
        this.get_current_devices(),
      ])
    ).map((x) => x.value);

    devices = MelEnumerable.from(devices.audioOutput)
      .union(devices.audioInput)
      .toArray();

    for (const key in current_devices) {
      if (
        key !== 'videoInput' &&
        Object.hasOwnProperty.call(current_devices, key)
      ) {
        const device = current_devices[key];

        for (const _key in devices) {
          if (Object.hasOwnProperty.call(devices, _key)) {
            const element = devices[_key];
            if (element.deviceId === device.deviceId)
              devices[_key].isCurrent = true;
            else devices[_key].isCurrent = false;
          }
        }
      }
    }

    return devices;
  }

  /**
   * Change le micro de la visio
   * @param {string} label Nom du périphérique
   * @param {string} id  id du périphérique
   */
  set_micro_device(label, id) {
    this._jitsi.setAudioInputDevice(label, id);
  }

  /**
   * Change la sortie audio de la visio
   * @param {string} label Nom du périphérique
   * @param {string} id  id du périphérique
   */
  set_audio_device(label, id) {
    this._jitsi.setAudioOutputDevice(label, id);
  }

  /**
   * Change la caméra de la visio
   * @param {string} label Nom du périphérique
   * @param {string} id  id du périphérique
   */
  set_video_device(label, id) {
    this._jitsi.setVideoInputDevice(label, id);
  }

  /**
   * Récupère les données de la visio
   * @returns {Promise<Participant>}
   * @async
   * @deprecated
   * @frommodulereturn Visio/Jitsi {@linkto Participant}
   */
  async get_room_infos() {
    return this._jitsi.getParticipantsInfo();
  }

  /**
   * Récupère les input videos.
   * @returns {Promise<Array<DeviceEx>>}
   * @async
   * @frommodulereturn Visio/Jitsi {@linkto DeviceEx}
   */
  async get_video_devices() {
    var [devices, current_devices] = (
      await Promise.allSettled([
        this.get_available_devices(),
        this.get_current_devices(),
      ])
    ).map((x) => x.value);

    devices = devices.videoInput;

    if (current_devices.videoInput !== undefined) {
      for (const key in devices) {
        if (Object.hasOwnProperty.call(devices, key)) {
          const element = devices[key];
          if (element.deviceId === current_devices.videoInput.deviceId)
            devices[key].isCurrent = true;
          else devices[key].isCurrent = false;
        }
      }
    }

    return devices;
  }

  /**
   * Affiche une notification Jitsi
   * @param {string} content Contenu du titre
   * @param {Object} [options={}]
   * @param {string | undefined} [options.uid=undefined] Id de la notification
   * @param {string} [options.type='info'] Type de notification
   * @param {string} [options.timeout='short'] Temps d'affichage de la notification
   * @see {@link https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe-commands#shownotification}
   *
   */
  show_notification(
    content,
    { uid = undefined, type = 'info', timeout = 'short' } = {},
  ) {
    this._jitsi.executeCommand('showNotification', {
      title: content,
      content,
      uid,
      type,
      timeout,
    });
  }

  /**
   * Redimensionne la liste des participants
   * @param {number} new_size  Nouvelle taille
   */
  resize_film_strip(new_size) {
    this._jitsi.executeCommand('resizeFilmStrip', {
      width: new_size,
    });
  }

  /**
   *  Récupère la frame qui contient Jitsi
   * @param {Object} [options={}]
   * @param {boolean} [options.jquery=true] Si on récupère un objet jQuery ou HTMLIframeElement
   * @returns {HTMLIFrameElement | external:jQuery}
   */
  get_frame({ jquery = true } = {}) {
    let frame = this._jitsi.getIFrame();
    return jquery ? $(frame) : frame;
  }

  /**
   * Arrête la visio
   */
  hangup() {
    this._jitsi.executeCommand('hangup');
  }

  /**
   * Initialise les listeners
   * @returns {JitsiAdaptor} Chaînage
   * @package
   */
  _init_listeners() {
    return this._add_listener(
      'videoMuteStatusChanged',
      'on_video_mute_status_changed',
    )
      ._add_listener('audioMuteStatusChanged', 'on_audio_mute_status_changed')
      ._add_listener('filmstripDisplayChanged', 'on_film_strip_display_changed')
      ._add_listener('chatUpdated', 'on_chat_updated')
      ._add_listener('tileViewChanged', 'on_tile_view_updated')
      ._add_listener('raiseHandUpdated', 'on_raise_hand_updated')
      ._add_listener(
        'screenSharingStatusChanged',
        'on_share_screen_status_changed',
      )
      ._add_listener('mouseMove', 'on_mouse_move')
      ._add_listener('readyToClose', 'on_ready_to_close')
      ._add_listener('videoConferenceLeft', 'on_video_conference_left');
  }

  /**
   * Ajoute un listener
   * @param {string} name Nom du listener
   * @param {string} prop Nom du bnum event qui sera appelé
   * @returns {JitsiAdaptor} Chaînage
   */
  _add_listener(name, prop) {
    this._jitsi.addEventListener(name, this[prop].call.bind(this[prop]));
    return this;
  }
}

/**
 * Type de source d'un partage d'écran
 * @enum {string}
 * @readonly
 */
const ESourceType = Object.freeze({
  /**
   * On partage une fenêtre
   * @type {string}
   * @default 'window'
   */
  window: 'window',
  /**
   * On partage un écran
   * @type {string}
   * @default 'screen'
   */
  screen: 'screen',
  /**
   * @type {string}
   * @default 'proxy'
   */
  proxy: 'proxy',
  /**
   * @type {string}
   * @default 'device'
   */
  device: 'device',
});

/**
 * Rôle possible d'un utilisateur
 * @enum {string}
 * @constant
 */
const EUserRole = Object.freeze({
  user: 'user',
  moderator: 'moderator',
});
