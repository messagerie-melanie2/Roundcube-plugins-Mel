import { VisioManager } from '../../../mel_metapage/js/lib/calendar/event/parts/location_part.js';
import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { VisioByDinumLocation } from './program/VisioByDinumLocation.js';

export class VisioByDinum extends MelObject {
  constructor() {
    super();
    this.#_init();
  }

  #_init() {
    if (!this.#_can()) return;
    VisioManager.PrependVisioType(VisioByDinumLocation);
  }

  #_can() {
    return this.#_isCalendar() || this.#_isFromCreateButton();
  }

  #_isCalendar() {
    return this.get_env('task') === 'calendar';
  }
  #_isFromCreateButton() {
    return (
      this.get_env('task') === 'mel_metapage' &&
      this.get_env('action') === 'dialog-ui'
    );
  }
}

new VisioByDinum();
