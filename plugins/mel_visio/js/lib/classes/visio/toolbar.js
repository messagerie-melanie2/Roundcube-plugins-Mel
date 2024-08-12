import { Visio } from '../../visio.js';

export { ToolbarFunctions };

class ToolbarFunctions {
  constructor() {
    throw new Error('Cannot be initialized !');
  }

  /**
   *
   * @param {Visio} visio
   */
  static Hangup(visio) {
    visio.jitsii.hangup();
    visio.toolbar.destroy();
  }

  /**
   *
   * @param {Visio} visio
   */
  static Chat(visio) {
    visio.jitsii.toggle_chat();
  }

  /**
   *
   * @param {Visio} visio
   */
  static Mic(visio) {
    visio.jitsii.toggle_micro();
  }

  static Mic_0(visio) {}

  /**
   *
   * @param {Visio} visio
   */
  static Cam(visio) {
    visio.jitsii.toggle_video();
  }

  /**
   *
   * @param {Visio} visio
   */
  static Handup(visio) {
    visio.jitsii.toggle_hand();
  }

  /**
   *
   * @param {Visio} visio
   */
  static Share_screen(visio) {
    visio.jitsii.share_screen();
  }

  /**
   *
   * @param {Visio} visio
   */
  static Moz(visio) {
    visio.jitsii.toggle_film_strip();
  }

  /**
   *
   * @param {Visio} visio
   */
  static More(visio) {
    visio.popover.toggle();
    //visio.toolbar.get_button('more').popover('toggle');
  }

  /**
   *
   * @param {Visio} visio
   */
  static Action_Url(visio) {
    let config = {
      _key: visio.data.room,
    };

    if (visio.data.wsp) config._wsp = visio.data.wsp;

    const url = mel_metapage.Functions.public_url('webconf', config);
    mel_metapage.Functions.copy(url);
    visio.popover.hide();
  }

  /**
   *
   * @param {Visio} visio
   */
  static async Action_Phone(visio) {
    const data = visio.get_call_data();
    const copy_value = `Numéro : ${data.number} - PIN : ${data.pin}`;
    mel_metapage.Functions.copy(copy_value);
    visio.popover.hide();
  }
}
