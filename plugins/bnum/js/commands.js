import { BnumLog } from '../../mel_metapage/js/lib/classes/bnum_log.js';
import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';

/**
 * Class qui enregistre et lance différentes commandes/triggers
 */
export class Commands extends MelObject {
  constructor() {
    super();

    this.listen('plugin.local_once_per_day', () => {
      this.#_oncePerDay();
    });

    const isBnumTopContext = this.get_env('task') === 'bnum';
    const alreadyFired = !this.cookie_get('once_per_day')?.value;
    if (isBnumTopContext && alreadyFired) this.#_startArterLoginOncePerDay();
  }

  /**
   * trigger évènement roundcube once_per_day
   */
  #_oncePerDay() {
    this.trigger('once_per_day');
  }

  #_startArterLoginOncePerDay() {
    return this.rcmail()
      .http_post('plugin.bnum_after')
      .then(() => {
        this.#_startArterLoginOncePerDaySuccess(
          this.get_env('action_after.once_per_day_data'),
        );
        this.rcmail().env['action_after.once_per_day_data'] = null;
      });
  }

  /**
   *
   * @param {{valid: boolean, error: ?Record<string, any>}} data
   */
  #_startArterLoginOncePerDaySuccess(data) {
    if (typeof data === 'string') data = JSON.parse(data);

    if (data.valid !== true)
      BnumLog.error('PHP/plugin.bnum_after', 'Une erreur est survenue !', data);
  }
}
