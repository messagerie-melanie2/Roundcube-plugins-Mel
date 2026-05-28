import { BnumLog } from '../../mel_metapage/js/lib/classes/bnum_log.js';
import { AVATAR_TAG } from '../../mel_metapage/js/lib/html/JsHtml/CustomAttributes/avatar.js';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';
import { Commands } from './commands.js';

/**
 * Class regroupant les différents modules du bnum
 */
class Main extends MelObject {
  constructor() {
    super();
    this.#_checkIfAvatarExist();
    new Commands();
  }

  #_checkIfAvatarExist() {
    if (this.get_env('task') === 'bnum') {
      const oldLogLevel = BnumLog.log_level;
      BnumLog.set_log_level(BnumLog.LogLevels.trace);
      if (document.querySelector(AVATAR_TAG))
        BnumLog.info('Bnum/Main', `${AVATAR_TAG} trouvé !`);
      else
        BnumLog.warning(
          'Bnum/Main',
          `${AVATAR_TAG} non trouvé, est-ce intentionnel ?`,
        );
      BnumLog.set_log_level(oldLogLevel);
    }

    return this;
  }
}

new Main();
