import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';

export class Commands extends MelObject {
  constructor() {
    super();

    this.listen('plugin.local_once_per_day', () => {
      this.#_oncePerDay();
    });
  }

  #_oncePerDay() {
    this.trigger('once_per_day');
  }
}
