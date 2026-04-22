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
  }

  /**
   * trigger évènement roundcube once_per_day
   */
  #_oncePerDay() {
    this.trigger('once_per_day');
  }
}
