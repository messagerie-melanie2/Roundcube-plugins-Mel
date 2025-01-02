import { FramesManager } from '../../mel_metapage/js/lib/classes/frame_manager.js';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';

export { MelContacts };

class MelContacts extends MelObject {
  constructor() {
    super();
  }

  main() {
    super.main();

    this.rcmail().addEventListener('switch_frame', (obj) => {
      const { task, args, wind } = obj;

      if (
        task === 'addressbook' &&
        !FramesManager.Instance.get_window({ id: wind })?.has_frame?.(
          'addressbook',
        ) &&
        !args
      ) {
        this.switch_frame(task, {
          args: {
            _action: 'plugin.annuaire',
            _source: 'amande',
          },
          wind,
        });

        return true;
      }
    });
  }

  static Start() {
    return new MelContacts();
  }
}

MelContacts.Start();
