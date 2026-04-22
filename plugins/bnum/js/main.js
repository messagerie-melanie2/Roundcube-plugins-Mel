import { MelObject } from '../../mel_metapage/js/lib/mel_object.js';
import { Commands } from './commands.js';

class Main extends MelObject {
  constructor() {
    super();
    new Commands();
  }
}

new Main();
