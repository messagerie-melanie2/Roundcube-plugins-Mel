import { MelEnumerable } from '../../../../../mel_metapage/js/lib/classes/enum.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { BnumEvent } from '../../../../../mel_metapage/js/lib/mel_events.js';
import { Mel_Promise } from '../../../../../mel_metapage/js/lib/mel_promise.js';

export { JitsiAdaptor };

class JitsiAdaptor {
  constructor(jitsi) {
    this._jitsi = jitsi;
    this._password = null;

    this.on_video_mute_status_changed = new BnumEvent();
    this.on_audio_mute_status_changed = new BnumEvent();
    this.on_film_strip_display_changed = new BnumEvent();
    this.on_mouse_move = new BnumEvent();
    this.on_chat_updated = new BnumEvent();
    this.on_chat_updated = new BnumEvent();
    this.on_tile_view_updated = new BnumEvent();
    this.on_ready_to_close = new BnumEvent();
    this.on_password_required = new BnumEvent();
    this.on_video_conference_joined = new BnumEvent();
    this.on_raise_hand_updated = new BnumEvent();
    this.on_share_screen_status_changed = new BnumEvent();

    this._init_listeners();
  }

  has_password() {
    return !!(this._password || false);
  }

  async get_user_id() {
    await Mel_Promise.wait(
      () => !!this._jitsi._myUserID && this._jitsi._myUserID !== EMPTY_STRING,
    );

    return this._jitsi._myUserID;
  }

  change_avatar(url) {
    this._jitsi.executeCommand('avatarUrl', url);
  }

  send_message(text) {
    this._jitsi.executeCommand('sendChatMessage', text, EMPTY_STRING, true);
  }

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

  async is_moderator() {
    return (await this.get_role()) === 'moderator';
  }

  async set_password(password) {
    if (await this.is_moderator()) {
      this._jitsi.executeCommand('password', password);

      if (password === EMPTY_STRING) password = null;

      this._password = password;
    }
  }

  async get_rooms_info() {
    return await this._jitsi.getRoomsInfo();
  }

  async is_video_muted() {
    return await this._jitsi.isVideoMuted();
  }

  async is_audio_muted() {
    return await this._jitsi.isAudioMuted();
  }

  toggle_video() {
    this._jitsi.executeCommand('toggleVideo');
  }

  toggle_micro() {
    this._jitsi.executeCommand('toggleAudio');
  }

  share_screen() {
    this._jitsi.executeCommand('toggleShareScreen');
  }

  toggle_film_strip() {
    this._jitsi.executeCommand('toggleTileView');
  }

  toggle_hand() {
    this._jitsi.executeCommand('toggleRaiseHand');
  }

  toggle_chat() {
    this._jitsi.executeCommand('toggleChat');
  }

  open_virtual_background() {
    this._jitsi.executeCommand('toggleVirtualBackgroundDialog');
  }

  initiate_private_chat(id) {
    this._jitsi.executeCommand('initiatePrivateChat', id);
  }

  async is_participants_pane_open() {
    return await this._jitsi.isParticipantsPaneOpen();
  }

  async toggle_participants_pane() {
    const state = await this.is_participants_pane_open();

    this.set_participants_pane_state(!state);

    return { old_state: state, new_state: !state };
  }

  set_participants_pane_state(state) {
    this._jitsi.executeCommand('toggleParticipantsPane', state);
  }

  async get_available_devices() {
    return await this._jitsi.getAvailableDevices();
  }

  async get_current_devices() {
    await this._jitsi.getCurrentDevices();
  }

  async get_micro_and_audio_devices() {
    var [devices, current_devices] = await Promise.allSettled([
      this.get_available_devices(),
      this.get_current_devices(),
    ]);

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
   */
  async get_room_infos() {
    return this._jitsi.getParticipantsInfo();
  }

  async get_video_devices() {
    var [devices, current_devices] = await Promise.allSettled([
      this.get_available_devices(),
      this.get_current_devices(),
    ]);

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

  show_notification(
    content,
    { uid = undefined, type = 'info', timeout = 'short' },
  ) {
    this._jitsi.executeCommand('showNotification', {
      title: content,
      content,
      uid,
      type,
      timeout,
    });
  }

  resize_film_strip(new_size) {
    this._jitsi.executeCommand('resizeFilmStrip', {
      width: new_size,
    });
  }

  hangup() {
    this._jitsi.executeCommand('hangup');
  }

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
      );
  }

  _add_listener(name, prop) {
    this._jitsi.addEventListener(name, this[prop].call.bind(this[prop]));
    return this;
  }
}
