import { BnumMessage } from '../../../../../mel_metapage/js/lib/classes/bnum_message.js';
import { Toolbar } from '../../../../../mel_metapage/js/lib/classes/toolbar.js';
import { Visio } from '../../visio.js';

export { ToolbarsItems, ToolbarFunctions, ToolbarIcon };

const ToolbarIcon = Toolbar.IconsType.material;
const ToolbarsItemsIcons = {
  chat: 'chat',
  hangup: 'call_end',
};

const ToolbarsItems = {
  chat: Toolbar.Item({
    icon: ToolbarsItemsIcons.chat,
    text: rcmail.gettext('chat', 'mel_metapage'),
  }),
  hangup: Toolbar.Item({
    icon: ToolbarsItemsIcons.hangup,
    text: rcmail.gettext('hangup', 'mel_metapage'),
  }),
};

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

  static Chat(visio) {}

  /**
   *
   * @param {Visio} visio
   */
  static async Mic(visio) {
    visio.jitsii.toggle_micro();
  }

  static async Mic_0(visio) {}
}
