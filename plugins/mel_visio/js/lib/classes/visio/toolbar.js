import { FramesManager } from '../../../../../mel_metapage/js/lib/classes/frame_manager.js';
import {
  MelDialog,
  RcmailDialogButton,
} from '../../../../../mel_metapage/js/lib/classes/modal.js';
import { Toolbar } from '../../../../../mel_metapage/js/lib/classes/toolbar.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { isNullOrUndefined } from '../../../../../mel_metapage/js/lib/mel.js';
import { MelObject } from '../../../../../mel_metapage/js/lib/mel_object.js';
import { Mel_Promise } from '../../../../../mel_metapage/js/lib/mel_promise.js';
import { VisioHelper } from '../../../helper.js';
import { MelAudioManager, MelAudioTester } from './audioManager.js';
import { ToolbarPopup } from './toolbar_popup.js';
import { MelVideoManager } from './videoManager.js';

export { ToolbarFunctions, VisioToolbar };

/**
 * Contient les classes lié à la toolbar de la visio
 * @module Visio/Toolbar
 * @local ToolbarFunctions
 * @local VisioToolbar
 *
 */

/**
 * @class
 * @classdesc Contient les différentes fonctions des différents boutons de la toolbar
 * @hideconstructor
 */
class ToolbarFunctions {
  constructor() {
    throw new Error('Cannot be initialized !');
  }

  /**
   * Arrête la visioconférence
   * @param {Visio} visio
   * @static
   */
  static Hangup(visio) {
    if (top.$('#visio-back-button bnum-icon').text() === 'fullscreen')
      top.$('#visio-back-button bnum-icon').click();

    MelObject.Empty()
      .rcmail(true)
      .remove_handler_ex('frames.attach.url', 'visio');
    MelObject.Empty()
      .rcmail(true)
      .remove_handler_ex('frames.attach.url.before', 'visio');
    MelObject.Empty().rcmail(true).remove_handler_ex('switch_frame', 'visio');
    // FramesManager.Instance.detach('url');
    // FramesManager.Instance.detach('before_url');
    // FramesManager.Instance.detach('switch_frame');

    if (this._audioManager) this._audioManager.dispose();
    if (this._videoManager) this._videoManager.dispose();

    if (this._popup) this._popup.destroy();

    visio.jitsii.hangup();
    visio.toolbar.destroy();

    top
      .$('#visio-back-button bnum-icon')
      .text('undo')
      .parent()
      .attr('title', 'Quitter la visio')
      .off('click')
      .on('click', () => {
        if (FramesManager.Instance.get_window()._history._history.length)
          FramesManager.Instance.get_window()._history.back();
        else FramesManager.Instance.switch_frame('bureau', {});
      });

    (top ?? parent ?? window).$('html').removeClass('fullscreen-visio');

    FramesManager.Instance.attach('switch_frame', (task, changeframe) => {
      if (changeframe) {
        top.$('#visio-back-button').remove();
        FramesManager.Instance.detach('switch_frame');

        if (FramesManager.Instance.get_window().has_frame('webconf'))
          FramesManager.Instance.get_window().remove_frame('webconf');

        //FramesManager.Instance.start_mode('stop_visio');
        VisioHelper.Instance.stopVisio();

        FramesManager.Instance.close_except_selected();
      }
    });
  }

  /**
   * Affiche ou ferme le tchat
   * @param {Visio} visio
   * @static
   */
  static Chat(visio) {
    visio.jitsii.toggle_chat();
  }

  /**
   *Change d'état le micro
   * @param {Visio} visio
   * @static
   */
  static Mic(visio) {
    visio.jitsii.toggle_micro();
  }

  /**
   * Affiche la popup de visualisation et de séléction des audios
   * @param {Visio} visio
   * @return {Promise<void>}
   * @async
   * @static
   */
  static async Mic_0(visio) {
    if (!this._popup) {
      this._popup = new ToolbarPopup(visio.toolbar.toolbar()).hide();
    }

    if (this._popup.is_show() && this._popup.has_tag('mic')) {
      this._popup.hide();
    } else {
      this._audioManager = this._audioManager || new MelAudioManager();
      this.UpdatePopupDevices(
        await visio.jitsii.get_micro_and_audio_devices(),
        this.Mic_0_Click.bind(this, visio),
      );
      this._popup.set_tag('mic');
      this._popup.show();
    }
  }

  /**
   * Action au click d'un bouton de la popup des devices
   * @param {Visio} visio
   * @param {string} id
   * @param {string} type
   * @param {string} label
   * @return {Promise<void>}
   * @async
   * @static
   */
  static async Mic_0_Click(visio, id, type, label) {
    const initial = this._popup.$content
      .find('.mel-ui-button.disabled')
      .data('deviceid');
    let waitState = null;
    this._popup.$content
      .find('.mel-ui-button')
      .addClass('loading')
      .attr('disabled');

    switch (type) {
      case 'audioinput':
        visio.jitsii.set_micro_device(label, id);
        waitState = await Mel_Promise.wait_async(async () => {
          const tmp = await visio.jitsii.get_current_devices();
          return tmp['audioInput'].deviceId === id;
        });

        break;

      case 'audiooutput':
        visio.jitsii.set_audio_device(label, id);
        waitState = await Mel_Promise.wait_async(async () => {
          const tmp = await visio.jitsii.get_current_devices();
          return tmp['audioOutput'].deviceId === id;
        });
        break;

      case 'videoinput':
        visio.jitsii.set_video_device(label, id);
        waitState = await Mel_Promise.wait_async(async () => {
          const tmp = await visio.jitsii.get_current_devices();
          return tmp['videoInput'].deviceId === id;
        });
        break;

      default:
        break;
    }

    this._popup.$content
      .find('.mel-ui-button')
      .removeClass('disabled')
      .removeAttr('disabled')
      .removeClass('loading');

    if (!waitState?.resolved) {
      this._popup.$content
        .find(
          `.mel-ui-button[data-deviceid="${initial}"][data-devicekind="${type}"]`,
        )
        .addClass('disabled')
        .attr('disabled', 'disabled');
    } else {
      this._popup.$content
        .find(
          `.mel-ui-button[data-deviceid="${id}"][data-devicekind="${type}"]`,
        )
        .addClass('disabled')
        .attr('disabled', 'disabled');
    }
  }

  /**
   * Met à jour la liste des périphériques afficher sur la popup
   * @param {Array<DeviceEx>} devices Liste des devices envoyé par jitsi
   * @param {function} click Action à faire lorsque l'on clique sur un device
   * @returns {Promise<this>} Chaînage
   * @static
   * @async
   * @frommoduleparam Visio/Jitsi devices {@linkto DeviceEx}
   */
  static async UpdatePopupDevices(devices, click) {
    const _$ = top.$;
    let devices_by_kind = {};

    for (let index = 0; index < devices.length; ++index) {
      const element = devices[index];
      if (devices_by_kind[element.kind] === undefined)
        devices_by_kind[element.kind] = [];
      devices_by_kind[element.kind].push(element);
    }

    let $button = null;
    let type = '';
    let html = this._popup.$content.html(EMPTY_STRING);
    for (const key in devices_by_kind) {
      if (Object.hasOwnProperty.call(devices_by_kind, key)) {
        const array = devices_by_kind[key];
        html.append(
          `<span class=toolbar-title>${rcmail.gettext(key, 'mel_metapage')}</span><div class="btn-group-vertical" style=width:100% role="group" aria-label="groupe des ${key}">`,
        );
        for (let index = 0; index < array.length; ++index) {
          const element = array[index];
          const disabled = element.isCurrent === true ? 'disabled' : '';

          type = element.kind === 'videoinput' ? 'div' : 'button';

          $button = _$(
            `<${type} data-deviceid="${element.deviceId}" data-devicekind="${element.kind}" data-devicelabel="${element.label}" title="${element.label}" class="mel-ui-button btn btn-primary btn-block ${disabled}" ${disabled}></${type}>`,
          ).click((e) => {
            e = $(e.currentTarget);
            click(
              e.data('deviceid'),
              e.data('devicekind'),
              e.data('devicelabel'),
            );
          });

          if (type === 'button') $button.html(element.label);

          if (element.kind === 'audioinput') {
            //Visualiser les micros
            $button = (
              await this._audioManager.addElement(element, $button)
            ).$main.parent();
          } else if (element.kind === 'audiooutput') {
            //Tester l'audio
            var $button_div = $('<div></div>').css('position', 'relative');
            $button
              .on('mouseover', (event) => {
                let $e = $(event.currentTarget);
                let $parent = $e.parent();

                let $tmp = $('<button>Test</button>')
                  .data('devicelabel', $e.data('devicelabel'))
                  .addClass(
                    'mel-button btn btn-secondary no-button-margin mel-test-audio-button',
                  )
                  .click(async (testbuttonevent) => {
                    const data = $(testbuttonevent.currentTarget).data(
                      'devicelabel',
                    );

                    if (this.audio_tester.audios[data])
                      await this.audio_tester.audios[data].test({
                        kind: 'audiooutput',
                        label: data,
                      });
                    else {
                      this.audio_tester.addAudio(
                        data,
                        await new MelAudioTester(
                          this._audioManager.devices,
                        ).test({
                          kind: 'audiooutput',
                          label: data,
                        }),
                      );
                    }
                  })
                  .on('mouseleave', (levent) => {
                    if (!$(levent.relatedTarget).hasClass('mel-ui-button')) {
                      $(levent.currentTarget).remove();
                    }
                  });

                $parent.append($tmp);
              })
              .on('mouseleave', (event) => {
                console.log('event', event);
                if (!$(event.relatedTarget).hasClass('mel-test-audio-button')) {
                  $(event.currentTarget)
                    .parent()
                    .find('.mel-test-audio-button')
                    .remove();
                }
              })
              .appendTo($button_div);

            $button = $button_div;
            $button_div = null;
          } else {
            //Visualiser les caméras
            await this._videoManager.addVideo($button, element, false);
          }

          html.append($button);
        }

        if (true) html.append('<separate class="device"></separate>');
      }
    }

    html.find('separate').last().remove();

    if (
      this._popup.has_tag('video') &&
      this._videoManager &&
      this._videoManager.count() > 0
    ) {
      (
        await this._videoManager
          .oncreate((video, device) => {
            $('<label></label>')
              .addClass('video-visio-label')
              .html(device.label)
              .appendTo($(video).parent().css('position', 'relative'));
          })
          .create()
      ).updateSizePerfect('100%', 'unset');
    }

    return this;
  }

  /**
   * Affiche ou non la caméra
   * @param {Visio} visio
   * @static
   */
  static Camera(visio) {
    visio.jitsii.toggle_video();
  }

  /**
   * Affiche ou cache la popup de séléction d'une caméra
   * @param {Visio} visio
   * @return {Promise<void>}
   * @static
   * @async
   */
  static async Camera_0(visio) {
    if (!this._popup) {
      this._popup = new ToolbarPopup(visio.toolbar.toolbar()).hide();
    }

    if (this._popup.is_show() && this._popup.has_tag('video')) {
      this._popup.hide();
    } else {
      this._videoManager = this._videoManager || new MelVideoManager();
      this.UpdatePopupDevices(
        await visio.jitsii.get_video_devices(),
        this.Mic_0_Click.bind(this, visio),
      );
      this._popup.set_tag('video');
      this._popup.show();
    }
  }

  /**
   *Lève ou baisse la main
   * @param {Visio} visio
   * @static
   */
  static Handup(visio) {
    visio.jitsii.toggle_hand();
  }

  /**
   * Partage l'écran ou stop le partage.
   * @param {Visio} visio
   * @static
   */
  static Share_screen(visio) {
    visio.jitsii.share_screen();
  }

  /**
   * Active ou désactive la mosaïque
   * @param {Visio} visio
   * @static
   */
  static Moz(visio) {
    visio.jitsii.toggle_tile_view();
  }

  /**
   * Switch de frame sur le documents lié à l'espace de cette visio
   * @param {Visio} visio
   * @return {Promise<void>}
   * @static
   * @async
   */
  static Documents(visio) {
    const url = `/apps/files?dir=/dossiers-${visio.data.wsp}`;

    return FramesManager.Instance.switch_frame('stockage', {
      changepage: true,
      args: {
        _params: url,
      },
    });
  }

  /**
   * Affiche la poupu de plus d'options
   * @param {Visio} visio
   * @return {Promise<void>}
   * @static
   * @async
   */
  static async More(visio) {
    if (!visio.popover.onhide.has('focus')) {
      visio.popover.onhide.add('focus', () => {
        visio.toolbar.get_button('more').$item.focus();
      });
    }

    visio.popover.toggle();
  }

  /**
   * Copie l'url public de la visio
   * @param {Visio} visio
   * @static
   */
  static Action_Url(visio) {
    let config = {
      _key: visio.data.room,
    };

    if (visio.data.wsp) config._wsp = visio.data.wsp;

    const url = mel_metapage.Functions.public_url('webconf', config);
    MelObject.Empty().copy_to_clipboard(url);
    visio.popover.hide();
  }

  /**
   * Copie le numéro de téléphone et le code pin de la visio
   * @param {Visio} visio
   * @returns {Promise<void>}
   * @static
   * @async
   */
  static async Action_Phone(visio) {
    const data = await visio.get_call_data();
    const copy_value = `Numéro : ${data.number} - PIN : ${data.pin}`;
    MelObject.Empty().copy_to_clipboard(copy_value);
    visio.popover.hide();
  }

  /**
   * Affiche les participants
   * @param {Visio} visio
   * @returns {Promise<void>}
   * @static
   * @async
   */
  static async Action_Users(visio) {
    visio.jitsii.toggle_participants_pane();
    visio.popover.hide();
  }

  /**
   * Ouvre l'arrière plan virtuel
   * @param {Visio} visio
   * @returns {Promise<void>}
   * @static
   * @async
   */
  static async Action_Background(visio) {
    visio.jitsii.open_virtual_background();
    visio.popover.hide();
  }

  /**
   * Ouvre la poupup de mot de passe
   * @param {Visio} visio
   * @returns {Promise<void>}
   * @static
   * @async
   */
  static async Action_Security(visio) {
    visio.popover.hide();
    if (await visio.jitsii.is_moderator()) {
      //prettier-ignore
      const content = MelHtml.start
        .div({ id:'popup-security' })
        .input_checkbox({
          id: 'security-hav-password', onchange: this._Action_Security_OnCheckChanged.bind(this) }).attr(visio.jitsii.has_password() ? 'checked' : 'not-checked', true).removeClass('form-control').css('margin-right', '5px')
          .label({ for:'security-hav-password' })
            .text('Visio sécurisée ?')
          .end()
        .input_text_floating('Mot de passe', {
          inputs_attribs: { type: 'text', id: 'security-pass', value:visio.jitsii._password },
          div_attribs: { style:(visio.jitsii.has_password() ? EMPTY_STRING : 'display:none') }
          })
        .end();

      const save = RcmailDialogButton.ButtonSave({
        text: 'Changer de mot de passe',
        click: this._Action_Security_On_Save.bind(this, visio, () =>
          dialog.destroy(),
        ),
      });

      const cancel = RcmailDialogButton.ButtonCancel({
        text: 'Annuler',
        click: () => dialog.destroy(),
      });

      let dialog = MelDialog.Create('index', content, {
        title: 'Mot de passe de la visioconférence',
        buttons: [save, cancel],
        options: {
          height: 200,
          beforeClose: () => {
            visio.toolbar.get_button('more').$item.focus();
          },
        },
      });

      dialog.show();
    } else {
      visio.jitsii.show_notification(
        'Vous devez être modérateur pour changer le mot de passe !',
        {
          type: 'warning',
        },
      );
    }
  }

  /**
   * Est appelé lorsque le mot de passe de l'input a changé
   * @static
   */
  static _Action_Security_OnCheckChanged() {
    if ($('#security-hav-password')[0].checked)
      $('#security-pass').parent().show();
    else $('#security-pass').parent().hide();
  }

  /**
   * Est appelé lorsque l'on sauvegarde le mot de passe
   * @param {Visio} visio
   * @param {Function} callback
   * @returns {Promise<void>}
   * @static
   * @async
   */
  static async _Action_Security_On_Save(visio, callback) {
    const val = $('#security-hav-password')[0].checked
      ? $('#security-pass').val() || null
      : null;

    if ($('#security-hav-password')[0].checked && !val) {
      visio.jitsii.show_notification('Vous devez mettre un mot de passe !', {
        type: 'warning',
      });
      return;
    }

    if (await visio.jitsii.is_moderator()) {
      if (val !== visio.jitsii._password) {
        visio.jitsii.set_password(val);
        visio.jitsii.show_notification(
          val
            ? `Le mot de passe a été changé en ${val} !`
            : 'La visioconférence est désomait ouvert à tous !',
          {
            type: 'normal',
            timeout: 'long',
          },
        );
        if (val) top.mel_metapage.Functions.copy(val);
      } else {
        visio.jitsii.show_notification(
          'Vous devez mettre un mot de passe différent !',
          {
            type: 'warning',
          },
        );
        return;
      }
    } else {
      visio.jitsii.show_notification(
        'Vous devez être modérateur pour changer le mot de passe !',
        {
          type: 'warning',
        },
      );
    }

    callback();
  }
}

/**
 * @type {ToolbarPopup}
 * @static
 * @package
 */
ToolbarFunctions._popup = null;

/**
 * @class
 * @classdesc Toolbar de la visioconférence
 * @extends Toolbar
 */
class VisioToolbar extends Toolbar {
  /**
   *
   * @param {string} id Id de la toolbar
   */
  constructor(id) {
    super(id);
  }

  /**
   * Met à jour l'état de la toolbar
   * @param {boolean} state Etat de la toolbar
   * @param {string} id id du bouton
   * @param {?string} [sub_id=null] Id du bouton enfant
   * @returns {VisioToolbar} Chaînage
   */
  updateToolbarState(state, id, sub_id = null) {
    let button = this.get_button(id);

    if (!isNullOrUndefined(sub_id) && button.get) button = button.get(sub_id);

    return this.updateToolbarStateFromButton(state, button);
  }

  /**
   * Met à jours l'éat d'un bouton
   * @param {boolean} state Nouvel état
   * @param {ToolbarItem} button Boutton à modifier
   * @returns {VisioToolbar} Chaînage
   */
  updateToolbarStateFromButton(state, button) {
    switch (state) {
      case true:
        button.$item.addClass('state-active');
        break;

      case false:
        button.$item.removeClass('state-active');
        break;

      default:
        break;
    }

    return this;
  }
}
