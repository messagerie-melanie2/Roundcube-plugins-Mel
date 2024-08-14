import {
  MelDialog,
  RcmailDialogButton,
} from '../../../../../mel_metapage/js/lib/classes/modal.js';
import { Toolbar } from '../../../../../mel_metapage/js/lib/classes/toolbar.js';
import { EMPTY_STRING } from '../../../../../mel_metapage/js/lib/constants/constants.js';
import { MelHtml } from '../../../../../mel_metapage/js/lib/html/JsHtml/MelHtml.js';
import { isNullOrUndefined } from '../../../../../mel_metapage/js/lib/mel.js';
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
  static Camera(visio) {
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
  static async More(visio) {
    if (!visio.popover.onhide.has('focus')) {
      visio.popover.onhide.add('focus', () => {
        visio.toolbar.get_button('more').$item.focus();
      });
    }

    visio.popover.toggle();
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

  /**
   *
   * @param {Visio} visio
   */
  static async Action_Users(visio) {
    visio.jitsii.toggle_participants_pane();
    visio.popover.hide();
  }

  /**
   *
   * @param {Visio} visio
   */
  static async Action_Background(visio) {
    visio.jitsii.open_virtual_background();
    visio.popover.hide();
  }

  /**
   *
   * @param {Visio} visio
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

  static _Action_Security_OnCheckChanged() {
    if ($('#security-hav-password')[0].checked)
      $('#security-pass').parent().show();
    else $('#security-pass').parent().hide();
  }

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

export class VisioToolbar extends Toolbar {
  constructor(id) {
    super(id);
  }

  updateToolbarState(state, id, sub_id = null) {
    let button = this.get_button(id);

    if (!isNullOrUndefined(sub_id) && button.get) button = button.get(sub_id);

    return this.updateToolbarStateFromButton(state, button);
  }

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
