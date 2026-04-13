import { MelObject } from '../../../plugins/mel_metapage/js/lib/mel_object.js';
import { ModuleLoader } from './loader.js';

export class MelElasticUI extends MelObject {
  #_modules;

  constructor() {
    super();
    this.#_main();
  }

  #_main() {
    this.#_modules = ModuleLoader.Instance.load();

    this.export('BNUM_UI');
  }

  get modules() {
    return this.#_modules;
  }

  static Start() {
    return new MelElasticUI();
  }
}
