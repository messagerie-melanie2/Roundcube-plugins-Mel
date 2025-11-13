import { MelObject } from '../../../mel_metapage/js/lib/mel_object.js';
import { AgendaCommands } from './program/commands.js';

export class BnumAgenda extends MelObject {
  constructor() {
    super();
    this.start();
  }

  start() {
    this.#_register_commands();
  }

  #_register_commands() {
    new AgendaCommands();
    return this;
  }
}

new BnumAgenda();
